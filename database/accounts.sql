CREATE TABLE IF NOT EXISTS playground_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) CHARACTER SET ascii NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY playground_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playground_user_settings (
    user_id BIGINT UNSIGNED NOT NULL,
    settings LONGTEXT NOT NULL,
    revision INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id),
    CONSTRAINT playground_settings_user FOREIGN KEY (user_id)
        REFERENCES playground_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playground_auth_attempts (
    bucket CHAR(64) CHARACTER SET ascii NOT NULL,
    window_start INT UNSIGNED NOT NULL,
    attempts SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (bucket, window_start),
    KEY playground_attempts_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
