<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(int $status, string $code): void
{
    respond($status, ['error' => $code]);
}

function connectDatabase(): PDO
{
    $file = __DIR__ . '/../config/cf-playground.php';
    if (!is_readable($file)) {
        fail(503, 'not_configured');
    }
    $config = require $file;
    return new PDO(
        'mysql:host=' . $config['host'] . ';port=' . ($config['port'] ?? 3306) .
        ';dbname=' . $config['database'] . ';charset=utf8mb4',
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
}

function account(PDO $db, string $id): ?array
{
    $query = $db->prepare(
        'SELECT u.id, u.email, u.name, s.settings, s.revision
         FROM playground_users u JOIN playground_user_settings s ON s.user_id = u.id
         WHERE u.id = ?'
    );
    $query->execute([$id]);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }
    return [
        'user' => ['id' => (string) $row['id'], 'email' => $row['email'], 'name' => $row['name']],
        'settings' => json_decode($row['settings'], false, 16, JSON_THROW_ON_ERROR),
        'revision' => (int) $row['revision'],
    ];
}

function throttle(PDO $db, string $email): void
{
    $slot = intdiv(time(), 900) * 900;
    $rules = ['ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') => 100, 'email:' . $email => 10];
    foreach ($rules as $identifier => $limit) {
        $bucket = hash('sha256', $identifier);
        $express = $db->prepare(
            'INSERT INTO playground_auth_attempts (bucket, window_start, attempts) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE attempts = LEAST(attempts + 1, 65535)'
        );
        $express->execute([$bucket, $slot]);
        $read = $db->prepare('SELECT attempts FROM playground_auth_attempts WHERE bucket = ? AND window_start = ?');
        $read->execute([$bucket, $slot]);
        if ((int) $read->fetchColumn() > $limit) {
            header('Retry-After: ' . max(1, $slot + 900 - time()));
            fail(429, 'rate_limited');
        }
    }
    if (random_int(1, 50) === 1) {
        $cleanup = $db->prepare('DELETE FROM playground_auth_attempts WHERE window_start < ?');
        $cleanup->execute([$slot - 86400]);
    }
}

function startAccount(string $id): void
{
    session_regenerate_id(true);
    $_SESSION = ['uid' => $id, 'csrf' => bin2hex(random_bytes(32))];
}

function textField($value, int $limit, bool $required = true): string
{
    if (!is_string($value) || strlen($value) > $limit || preg_match('/[\x00-\x1F\x7F]/', $value)) {
        fail(422, 'invalid_settings');
    }
    if ($required && trim($value) === '') {
        fail(422, 'invalid_settings');
    }
    return $value;
}

function choice($value, array $options): string
{
    if (!in_array($value, $options, true)) {
        fail(422, 'invalid_settings');
    }
    return $value;
}

function cleanProfile(array $profile): array
{
    $clean = ['name' => textField($profile['name'] ?? null, 100)];
    foreach ([
        'species' => ['dog', 'cat', 'hamster', 'parrot', 'lizard'],
        'mode' => ['memory', 'away', 'play'],
        'size' => ['small', 'medium', 'large'],
        'ears' => ['upright', 'folded'],
        'tail' => ['short', 'long', 'curled'],
        'pattern' => ['solid', 'spots', 'tuxedo'],
    ] as $key => $options) {
        $clean[$key] = choice($profile[$key] ?? null, $options);
    }
    $fur = $profile['fur'] ?? '';
    if (!is_string($fur) || !preg_match('/\A#[0-9a-f]{6}\z/i', $fur)) {
        fail(422, 'invalid_settings');
    }
    $birthday = $profile['birthday'] ?? '';
    if (!is_string($birthday) || !preg_match('/\A\d{4}-\d{2}-\d{2}\z/', $birthday)) {
        fail(422, 'invalid_settings');
    }
    $clean['fur'] = $fur;
    $clean['birthday'] = $birthday;
    $clean['dates'] = (object) [];
    $dates = $profile['dates'] ?? [];
    if (!is_array($dates)) {
        fail(422, 'invalid_settings');
    }
    foreach (['memory', 'away'] as $mode) {
        if (isset($dates[$mode]) && $dates[$mode] !== '') {
            if (!is_string($dates[$mode]) || !preg_match('/\A\d{4}-\d{2}-\d{2}\z/', $dates[$mode])) {
                fail(422, 'invalid_settings');
            }
            $clean['dates']->$mode = $dates[$mode];
        }
    }
    foreach (['likes', 'dislikes'] as $key) {
        $tags = $profile[$key] ?? null;
        if (!is_array($tags) || count($tags) > 120) {
            fail(422, 'invalid_settings');
        }
        $clean[$key] = [];
        foreach ($tags as $tag) {
            $clean[$key][] = textField($tag, 1000);
        }
    }
    return $clean;
}

function cleanSettings($settings): array
{
    if (!is_array($settings) || !isset($settings['friends']) || !is_array($settings['friends']) || count($settings['friends']) > 128) {
        fail(422, 'invalid_settings');
    }
    $friends = [];
    $seen = [];
    $background = choice($settings['background'] ?? 'meadow', ['meadow', 'coast']);
    $coastUnlocked = ($settings['coastUnlocked'] ?? false) === true || $background === 'coast';
    foreach ($settings['friends'] as $friend) {
        if (!is_array($friend) || !isset($friend['profile']) || !is_array($friend['profile'])) {
            fail(422, 'invalid_settings');
        }
        $id = $friend['id'] ?? '';
        if (!is_string($id) || !preg_match('/\A(?:first|[0-9a-f-]{36})\z/i', $id) || isset($seen[$id])) {
            fail(422, 'invalid_settings');
        }
        $seen[$id] = true;
        $space = $friend['space'] ?? [];
        if (!is_array($space)) fail(422, 'invalid_settings');
        $theme = choice($space['background'] ?? $background, ['meadow', 'coast']);
        $coastUnlocked = $coastUnlocked || $theme === 'coast';
        $friends[] = ['id' => $id, 'profile' => cleanProfile($friend['profile']), 'space' => ['background' => $theme]];
    }
    $active = $settings['active'] ?? null;
    if (($friends && (!is_string($active) || !isset($seen[$active]))) || (!$friends && $active !== null)) {
        fail(422, 'invalid_settings');
    }
    $colors = [];
    $input = $settings['ownerColors'] ?? [];
    foreach (['hoodie' => '#ede8e3', 'pants' => '#999492', 'skin' => '#f6d6c6'] as $part => $fallback) {
        $color = is_array($input) ? ($input[$part] ?? null) : null;
        $colors[$part] = is_string($color) && preg_match('/\A#[0-9a-f]{6}\z/i', $color) ? strtolower($color) : $fallback;
    }
    return [
        'friends' => $friends,
        'active' => $active,
        'perspective' => choice($settings['perspective'] ?? 'third', ['first', 'third']),
        'ownerColors' => $colors,
        'background' => $background,
        'coastUnlocked' => $coastUnlocked,
        'leaves' => is_int($settings['leaves'] ?? null) ? max(0, min(999999, $settings['leaves'])) : 0,
    ];
}

try {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('annyeong_session');
    session_set_cookie_params(['path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    $_SESSION['csrf'] = $_SESSION['csrf'] ?? bin2hex(random_bytes(32));
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        $id = $_SESSION['uid'] ?? null;
        $current = $id ? account(connectDatabase(), $id) : null;
        if (!$current) {
            unset($_SESSION['uid']);
        }
        respond(200, ['csrf' => $_SESSION['csrf']] + ($current ?? ['user' => null]));
    }
    if ($method !== 'POST') {
        header('Allow: GET, POST');
        fail(405, 'method');
    }
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_ANNYEONG_CSRF'] ?? '')) {
        fail(403, 'csrf');
    }
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        fail(415, 'content_type');
    }
    $raw = file_get_contents('php://input', false, null, 0, 262145);
    if ($raw === false || strlen($raw) > 262144) {
        fail(413, 'too_large');
    }
    $body = json_decode($raw, true, 16);
    if (!is_array($body)) {
        fail(400, 'invalid_request');
    }
    $action = $body['action'] ?? '';
    if ($action === 'logout') {
        unset($_SESSION['uid']);
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        respond(200, ['csrf' => $_SESSION['csrf'], 'user' => null]);
    }
    if ($action === 'save') {
        if (empty($_SESSION['uid'])) {
            fail(401, 'sign_in_required');
        }
        if (($body['userId'] ?? null) !== $_SESSION['uid']) {
            fail(409, 'account_changed');
        }
        $revision = $body['revision'] ?? null;
        if (!is_int($revision) || $revision < 0) {
            fail(422, 'invalid_settings');
        }
        $settings = cleanSettings($body['settings'] ?? null);
        $db = connectDatabase();
        $update = $db->prepare(
            'UPDATE playground_user_settings SET settings = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?'
        );
        $update->execute([json_encode($settings, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), $_SESSION['uid'], $revision]);
        if ($update->rowCount() !== 1) {
            fail(409, 'settings_conflict');
        }
        respond(200, ['revision' => $revision + 1]);
    }
    if ($action !== 'register' && $action !== 'login') {
        fail(400, 'invalid_request');
    }
    if (!empty($_SESSION['uid'])) {
        fail(409, 'already_signed_in');
    }
    $email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
    $password = $body['password'] ?? null;
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        !is_string($password) || strlen($password) < 1 || strlen($password) > 72 || strpos($password, "\0") !== false) {
        fail(422, 'invalid_credentials');
    }
    $db = connectDatabase();
    throttle($db, $email);
    if ($action === 'register') {
        $name = is_string($body['name'] ?? null) ? trim($body['name']) : '';
        if ($name === '' || strlen($name) > 100 || preg_match('/[\x00-\x1F\x7F]/', $name)) {
            fail(422, 'invalid_name');
        }
        if (preg_match_all('/./us', $password) < 8) {
            fail(422, 'invalid_password');
        }
        $settings = cleanSettings($body['settings'] ?? ['friends' => [], 'active' => null]);
        $db->beginTransaction();
        try {
            $insert = $db->prepare('INSERT INTO playground_users (email, name, password_hash) VALUES (?, ?, ?)');
            $insert->execute([$email, $name, password_hash($password, PASSWORD_BCRYPT)]);
            $id = $db->lastInsertId();
            $insertSettings = $db->prepare('INSERT INTO playground_user_settings (user_id, settings) VALUES (?, ?)');
            $insertSettings->execute([$id, json_encode($settings, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)]);
            $db->commit();
        } catch (Throwable $error) {
            $db->rollBack();
            if ($error instanceof PDOException && (int) ($error->errorInfo[1] ?? 0) === 1062) {
                fail(409, 'email_used');
            }
            throw $error;
        }
    } else {
        $query = $db->prepare('SELECT id, password_hash FROM playground_users WHERE email = ?');
        $query->execute([$email]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        $hash = $row['password_hash'] ?? '$2y$10$FhdsknMS2VXdPaUKYSwZUeK4vkd.jJJxmOgaOcol1qLuYHOEw4iyG';
        if (!password_verify($password, $hash) || !$row) {
            fail(401, 'incorrect_login');
        }
        $id = (string) $row['id'];
    }
    startAccount((string) $id);
    respond($action === 'register' ? 201 : 200, ['csrf' => $_SESSION['csrf']] + account($db, (string) $id));
} catch (Throwable $error) {
    error_log('Annyeong account endpoint: ' . get_class($error) . ' code ' . $error->getCode());
    fail(503, 'unavailable');
}
