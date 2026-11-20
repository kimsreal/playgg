<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="반려동물과 함께 쉬어 가는 둘만의 초원">
  <link rel="manifest" href="./manifest.webmanifest?v=6">
  <link rel="icon" type="image/png" href="./app/icon-drawing-192.png">
  <link rel="apple-touch-icon" href="./app/icon-drawing-192.png">
  <link rel="stylesheet" href="./app/style.css?v=49">
  <title>안녕</title>
  <script defer src="./app/vendor/jquery.min.js"></script>
  <script type="module" src="./app/main.js?v=43"></script>
</head>
<body>
<div id="launch" class="launch" role="status" aria-label="안녕 시작 중">
  <img src="./app/icon-drawing-192.png" alt="" width="192" height="192" fetchpriority="high">
</div>
<div class="app" id="app" hidden>
  <main>
    <section id="welcome" hidden>
      <div class="welcome-pets" aria-hidden="true">
        <span class="welcome-pet welcome-pet--dog"><img src="./app/welcome-pets/dog.webp" alt="" width="272" height="272"></span>
        <span class="welcome-pet welcome-pet--cat"><img src="./app/welcome-pets/cat.webp" alt="" width="272" height="272"></span>
        <span class="welcome-pet welcome-pet--hamster"><img src="./app/welcome-pets/hamster.webp" alt="" width="272" height="272"></span>
        <span class="welcome-pet welcome-pet--parrot"><img src="./app/welcome-pets/parrot.webp" alt="" width="272" height="272"></span>
        <span class="welcome-pet welcome-pet--lizard"><img src="./app/welcome-pets/lizard.webp" alt="" width="272" height="272"></span>
      </div>
      <h1>언제 어디서든 함께!</h1>
      <p class="welcome-copy">왠지 보고 싶은 날에도, 그냥 같이 놀고 싶은 날에도<br>반려동물과 둘만의 초원에서 편하게 시간을 보내요!</p>
      <div class="welcome-actions">
        <button type="button" class="primary" data-open-account>로그인 · 회원가입</button>
        <button type="button" id="start-welcome">시작하기</button>
        <p id="welcome-error" role="alert"></p>
      </div>
    </section>
    <section id="setup" hidden>
      <button type="button" id="setup-back" class="page-back scene-icon" data-page="settings" aria-label="설정으로 돌아가기" hidden><span aria-hidden="true">‹</span></button>
      <p class="kicker" id="setup-kicker">처음 만나는 날</p>
      <h1 id="setup-title" tabindex="-1">우리 공간을 만들어요</h1>
      <p id="profile-storage-copy">로그인 없이 사용할 수 있어요. 입력한 정보는 이 브라우저에만 저장돼요.</p>
      <button type="button" class="account-link" data-open-account>로그인 · 회원가입</button>
      <form id="profile-form">
        <fieldset><legend>어떤 이야기를 담을까요?</legend>
          <label class="choice"><input type="radio" name="mode" value="memory" required> 무지개다리를 건넜어요</label>
          <label class="choice"><input type="radio" name="mode" value="away" required> 멀리 떨어져 있어요</label>
          <label class="choice"><input type="radio" name="mode" value="play" required> 그냥 같이 놀래요</label>
        </fieldset>
        <div class="fields">
          <label>이름<input name="name" maxlength="24" required></label>
          <label>종류<select name="species"><option value="dog">강아지</option><option value="cat">고양이</option><option value="hamster">햄스터</option><option value="parrot">앵무새</option><option value="lizard">도마뱀</option></select></label>
          <label>생일<input type="date" name="birthday" required></label>
          <label id="event-field"><span id="event-label">기일 또는 다시 만날 날짜</span><input type="date" name="event" required></label>
        </div>
        <div class="fields">
          <label>좋아하는 것<input name="likes" maxlength="240" placeholder="공놀이, 닭가슴살"></label>
          <label>싫어하는 것<input name="dislikes" maxlength="240" placeholder="목욕, 청소기"></label>
        </div>
        <p class="small">쉼표로 나눠 좋아하는 것과 싫어하는 것을 각각 3개까지 적어 주세요.</p>
        <p id="setup-error" role="alert"></p>
        <button class="primary" type="submit">저장</button>
      </form>
    </section>
    <section id="avatar" hidden>
      <button type="button" id="avatar-back" class="page-back scene-icon" aria-label="뒤로가기"><span aria-hidden="true">‹</span></button>
      <p class="kicker">아바타 꾸미기</p>
      <h1 id="avatar-title"></h1>
      <div class="scene preview" id="avatar-scene"><span class="fallback-pet" aria-hidden="true"></span></div>
      <form id="avatar-form">
        <div class="fields">
          <label>체형<select name="size"><option value="small">소형</option><option value="medium" selected>중형</option><option value="large">대형</option></select></label>
          <label><span id="avatar-ear-label">귀 모양</span><select name="ears"><option value="upright">선 귀</option><option value="folded">접힌 귀</option></select></label>
          <label>꼬리 모양<select name="tail"><option value="short">짧은 꼬리</option><option value="long">긴 꼬리</option><option value="curled">말린 꼬리</option></select></label>
          <label>무늬<select name="pattern"><option value="solid">단색</option><option value="spots">얼룩</option><option value="tuxedo">턱시도</option></select></label>
        </div>
        <label><span id="avatar-color-label">털색</span> <input type="color" name="fur" value="#e8c198"></label>
        <p id="avatar-error" role="alert"></p>
        <div class="buttons"><button class="primary" type="submit">초원으로 가기</button></div>
      </form>
    </section>
    <section id="home" aria-label="초원" hidden>
      <div class="scene" id="home-scene">
        <div class="meadow-fallback" aria-hidden="true">
          <div class="meadow-clouds"></div>
          <div class="meadow-island">
            <span class="tree tree-a"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#tree-deciduous"></use></svg></span><span class="tree tree-b"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#tree-deciduous"></use></svg></span>
            <span class="flowers flowers-a"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#flower-2"></use></svg></span><span class="flowers flowers-b"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#flower-2"></use></svg></span>
          </div>
        </div>
        <span class="fallback-owner" aria-hidden="true"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#user-round"></use></svg></span>
        <button type="button" class="fallback-pet" data-action="pet" aria-label="아바타 쓰다듬기"></button>
        <output id="reply" class="bubble" aria-live="polite" hidden></output>
      </div>
      <div class="scene-shortcuts" role="group" aria-label="초원 메뉴">
        <button type="button" class="scene-icon" data-page="photo" aria-label="오늘의 사진" title="오늘의 사진"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#image"></use></svg></button>
        <button type="button" class="scene-icon" data-page="settings" aria-label="설정" title="설정"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#settings"></use></svg></button>
      </div>
      <div class="view-picker" role="group" aria-label="초원 시점">
        <button type="button" data-view="third" aria-pressed="true">3인칭</button>
        <button type="button" data-view="first" aria-pressed="false">1인칭</button>
      </div>
      <div class="scene-controls">
        <div id="interaction" hidden>
          <div class="interaction-heading"><h2 id="interaction-title"></h2><button type="button" id="close-interaction" class="scene-icon" aria-label="선택 닫기"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#x"></use></svg></button></div>
          <div id="interaction-options" class="buttons"></div>
        </div>
        <div class="scene-actions" role="group" aria-label="함께 놀기">
          <button type="button" data-action="pet"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#heart"></use></svg>쓰다듬기</button>
          <button type="button" data-panel="treats"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#bone"></use></svg>간식</button>
          <button type="button" data-action="ball"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#volleyball"></use></svg>공놀이</button>
          <button type="button" data-panel="items"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#sparkles"></use></svg>아이템</button>
          <button type="button" data-panel="talk"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#message-circle"></use></svg>말 걸기</button>
          <button type="button" id="ride" aria-pressed="false" hidden><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#paw-print"></use></svg>합체</button>
        </div>
      </div>
    </section>
    <section id="friends" hidden>
      <button type="button" class="page-back scene-icon" data-page="settings" aria-label="설정으로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>다른 친구랑 놀기</h1>
      <ul id="friend-list" class="friend-list"></ul>
      <button type="button" class="primary" id="add-friend">반려동물 추가</button>
    </section>
    <section id="photo" hidden>
      <button type="button" class="page-back scene-icon" data-page="home" aria-label="초원으로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>오늘의 사진</h1>
      <div id="photo-card" hidden>
        <figure class="polaroid" id="daily-frame">
          <span class="polaroid-tape" aria-hidden="true"></span>
          <div class="polaroid-window"><img id="daily-image" alt=""></div>
          <figcaption id="photo-title"></figcaption>
        </figure>
      </div>
      <div id="photo-empty" hidden>
        <h2>아직 사진이 없어요</h2>
        <p>사진 앱의 반려동물 앨범에서 여러 장을 한 번에 고르면, 하루에 한 장씩 보여줘요. 선택한 사진은 이 브라우저에만 저장돼요.</p>
      </div>
      <button type="button" class="primary" data-photo-picker>갤러리에서 사진 고르기</button>
      <p id="photo-status" class="small" role="status"></p>
    </section>
    <section id="settings" hidden>
      <header class="settings-header">
        <button type="button" class="page-back scene-icon" data-page="home" aria-label="초원으로 돌아가기"><span aria-hidden="true">‹</span></button>
        <h1>설정</h1>
      </header>
      <label class="settings-search">
        <svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#search"></use></svg>
        <input type="search" id="settings-search" aria-label="설정 검색" placeholder="설정 검색" autocomplete="off">
      </label>
      <p id="mode-copy" class="small" hidden></p>
      <p id="occasion" class="occasion" role="status" hidden></p>
      <ul class="settings-list">
        <li data-setting="계정 로그인 회원가입 로그아웃"><button type="button" class="settings-row" data-open-account><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#user-round"></use></svg><span>계정</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></button></li>
        <li data-setting="반려동물 정보와 모드 바꾸기 이름 생일 기일 다시 만나기"><button type="button" class="settings-row" id="edit-profile"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#user-round"></use></svg><span>반려동물 정보와 모드 바꾸기</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></button></li>
        <li data-setting="아바타 꾸미기 색 몸 귀 꼬리 무늬"><button type="button" class="settings-row" id="edit-avatar"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#sparkles"></use></svg><span>아바타 꾸미기</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></button></li>
        <li data-setting="주인 아바타 후드티 바지 피부색">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#user-round"></use></svg><span>주인 아바타</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></summary>
            <form class="settings-detail" id="owner-color-form">
              <fieldset aria-label="주인 아바타 색상">
                <label>후드티 <input type="color" name="hoodie" value="#ede8e3"></label>
                <label>바지 <input type="color" name="pants" value="#999492"></label>
                <label>피부색 <input type="color" name="skin" value="#f6d6c6"></label>
                <button type="submit" class="primary">저장</button>
              </fieldset>
              <p class="small" id="owner-color-status" role="status"></p>
            </form>
          </details>
        </li>
        <li data-setting="다른 친구랑 놀기 반려동물 추가 선택 전환"><button type="button" class="settings-row" data-page="friends"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#paw-print"></use></svg><span>다른 친구랑 놀기</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></button></li>
        <li data-setting="오늘의 사진 갤러리 앨범 선택 해제">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#image"></use></svg><span>오늘의 사진</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></summary>
            <div class="settings-detail">
              <p>사진 앱의 반려동물 앨범에서 보여 줄 사진을 골라 주세요. 추가한 사진은 이 브라우저에만 저장돼요.</p>
              <button type="button" data-photo-picker>갤러리에서 사진 고르기</button>
              <p id="album-status" class="small" role="status"></p>
              <button type="button" id="clear-album">앨범 사진 선택 해제</button>
            </div>
          </details>
        </li>
        <li data-setting="저장 공간 브라우저 기기 데이터">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#hard-drive"></use></svg><span>저장 공간</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></summary>
            <div class="settings-detail">
              <p>로그인하면 반려동물 정보와 화면 설정이 계정에 저장돼요. 게스트 정보와 사진은 이 브라우저에 저장돼요.</p>
            </div>
          </details>
        </li>
        <li data-setting="홈 화면에 설치 앱 아이폰 안드로이드">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#smartphone"></use></svg><span>홈 화면에 설치</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=20#chevron-right"></use></svg></summary>
            <div class="settings-detail">
              <p>iPhone은 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를, Android는 Chrome 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요.</p>
              <button type="button" id="install" hidden>안녕 설치</button>
            </div>
          </details>
        </li>
      </ul>
      <p id="settings-empty" class="small" role="status" hidden>검색 결과가 없어요.</p>
    </section>
    <section id="account" hidden>
      <header class="settings-header">
        <button type="button" id="account-back" class="page-back scene-icon" aria-label="뒤로가기"><span aria-hidden="true">‹</span></button>
        <h1>계정</h1>
      </header>
      <div id="account-signed-in" hidden>
        <h2 id="account-name"></h2>
        <p id="account-email" class="small"></p>
        <button type="button" id="account-logout">로그아웃</button>
      </div>
      <div id="account-signed-out">
        <div class="buttons" role="group" aria-label="계정 메뉴">
          <button type="button" data-auth-mode="login" aria-pressed="true">로그인</button>
          <button type="button" data-auth-mode="register" aria-pressed="false">회원가입</button>
        </div>
        <form id="account-form">
          <label>이메일<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
          <label id="account-name-field" hidden>이름<input name="name" autocomplete="name" maxlength="100"></label>
          <label>암호<input name="password" type="password" autocomplete="current-password" maxlength="72" required></label>
          <p id="password-help" class="small" hidden>암호는 8자 이상 입력해 주세요.</p>
          <p id="account-import-note" class="small" hidden>회원가입하면 이 브라우저에서 사용하던 반려동물 설정을 새 계정에 복사해요. 사진은 이 브라우저에만 저장돼요.</p>
          <button type="submit" class="primary" id="account-submit">로그인</button>
        </form>
      </div>
      <p id="account-error" role="alert"></p>
    </section>
    <input type="file" id="album-photos" accept="image/*" multiple hidden>
    <p id="app-error" role="alert" hidden></p>
  </main>
</div>
</body>
</html>
