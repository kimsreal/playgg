<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="반려동물과 함께 쉬어 가는 둘만의 초원">
  <link rel="manifest" href="./manifest.webmanifest?v=7">
  <link rel="icon" type="image/png" sizes="32x32" href="./app/icon-heart-32.png">
  <link rel="apple-touch-icon" href="./app/icon-drawing-192.png">
  <link rel="stylesheet" href="./app/style.css?v=89">
  <title>안녕</title>
  <script defer src="./app/vendor/jquery.min.js"></script>
  <script type="module" src="./app/main.js?v=89"></script>
</head>
<body>
<audio id="meadow-music" src="./app/meadow-music.m4a" preload="none" loop></audio>
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
      <div class="welcome-content">
        <h1>언제 어디서든 함께!</h1>
        <p class="welcome-copy">왠지 보고 싶은 날에도, 그냥 같이 놀고 싶은 날에도<br>반려동물과 둘만의 초원에서 편하게 시간을 보내요!</p>
        <div class="welcome-actions">
          <button type="button" class="primary" data-open-account>로그인 · 회원가입</button>
          <button type="button" id="start-welcome">시작하기</button>
          <p id="welcome-error" role="alert"></p>
        </div>
      </div>
    </section>
    <section id="setup" hidden>
      <button type="button" id="setup-back" class="page-back scene-icon" data-page="settings" aria-label="설정으로 돌아가기" hidden><span aria-hidden="true">‹</span></button>
      <form id="profile-form" novalidate>
        <p class="kicker" id="setup-kicker">처음 만나는 날</p>
        <h1 id="setup-title" tabindex="-1">어떤 이야기를 담을까요?</h1>
        <p id="profile-storage-copy">로그인 없이 사용할 수 있어요. 입력한 정보는 이 브라우저에만 저장돼요.</p>
        <button type="button" class="account-link" data-open-account>로그인 · 회원가입</button>
        <fieldset id="profile-story" data-profile-step>
          <legend>어떤 이야기를 담을까요?</legend>
          <label class="choice"><input type="radio" name="mode" value="memory" required> 무지개다리를 건넜어요</label>
          <label class="choice"><input type="radio" name="mode" value="away" required> 멀리 떨어져 있어요</label>
          <label class="choice"><input type="radio" name="mode" value="play" required> 그냥 같이 놀래요</label>
        </fieldset>
        <div class="fields profile-field" data-profile-step>
          <label>이름<input name="name" maxlength="24" required></label>
        </div>
        <div class="fields profile-field" data-profile-step>
          <label>종류<select name="species"><option value="dog">강아지</option><option value="cat">고양이</option><option value="hamster">햄스터</option><option value="parrot">앵무새</option><option value="lizard">도마뱀</option></select></label>
        </div>
        <div class="fields" data-profile-step>
          <label>생일<input type="date" name="birthday" required></label>
          <label id="event-field"><span id="event-label">기일 또는 다시 만날 날짜</span><input type="date" name="event" required></label>
        </div>
        <div data-profile-step>
          <div class="fields">
            <label>좋아하는 것<input name="likes" maxlength="240" placeholder="공놀이, 닭가슴살"></label>
            <label>싫어하는 것<input name="dislikes" maxlength="240" placeholder="목욕, 청소기"></label>
          </div>
          <p class="small">쉼표로 나눠 좋아하는 것과 싫어하는 것을 각각 3개까지 적어 주세요.</p>
        </div>
        <p id="setup-error" role="alert"></p>
        <div class="buttons">
          <button type="button" id="profile-previous" hidden>이전</button>
          <button class="primary" id="profile-next" type="submit">저장</button>
        </div>
      </form>
      <p class="small" id="profile-progress" hidden></p>
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
        <div class="coast-sky" aria-hidden="true"><span class="coast-sunset"></span><span class="coast-cloud"></span><span class="coast-cloud"></span><span class="coast-cloud"></span></div>
        <div class="meadow-fallback" aria-hidden="true">
          <div class="meadow-clouds"></div>
          <div class="meadow-island">
            <span class="tree tree-a"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#tree-deciduous"></use></svg></span><span class="tree tree-b"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#tree-deciduous"></use></svg></span>
            <span class="flowers flowers-a"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#flower-2"></use></svg></span><span class="flowers flowers-b"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#flower-2"></use></svg></span>
          </div>
        </div>
        <span class="fallback-owner" aria-hidden="true"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#user-round"></use></svg></span>
        <button type="button" class="fallback-pet" data-action="pet" aria-label="아바타 쓰다듬기"></button>
        <span id="fallback-ball" aria-hidden="true" hidden></span>
        <div id="fallback-ball-hearts" aria-hidden="true" hidden>
          <svg class="ui-icon" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#heart"></use></svg>
          <svg class="ui-icon" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#heart"></use></svg>
        </div>
        <svg id="fallback-cake" aria-hidden="true" viewBox="0 0 40 36" hidden>
          <path d="M4 14h32v15c0 7-32 7-32 0Z" fill="#e685a1"/>
          <path d="M4 22c8 4 24 4 32 0v4c-8 4-24 4-32 0Z" fill="#ffe098"/>
          <ellipse cx="20" cy="14" rx="16" ry="6" fill="#fff5dc"/>
          <circle cx="20" cy="8" r="5" fill="#dc587b"/>
        </svg>
        <span id="letter-envelope" aria-hidden="true" hidden><svg class="ui-icon" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#mail"></use></svg></span>
        <output id="reply" class="bubble" aria-live="polite" hidden></output>
      </div>
      <img class="home-wordmark" src="./app/annyeong-wordmark.webp" alt="안녕" width="452" height="145" draggable="false">
      <output id="home-leaf-balance" aria-label="보유 잎사귀">
        <svg class="balance-leaf" aria-hidden="true" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="balance-leaf-body" x1="0%" y1="0%" x2="85%" y2="95%">
              <stop offset="0" stop-color="#d7f49c"/>
              <stop offset=".55" stop-color="#8cc560"/>
              <stop offset="1" stop-color="#427c44"/>
            </linearGradient>
          </defs>
          <path d="M28 3C21 7 12 3 6 11C1 18 5 26 12 26C23 27 30 17 28 3Z" fill="url(#balance-leaf-body)"/>
          <path d="M7 22C7 14 15 9 24 8C20 12 12 12 7 22Z" fill="#e9ffc8" opacity=".65"/>
          <path d="M4 29C10 20 16 18 24 11M12 20l-1-5m7 1 4 1" fill="none" stroke="#3f7843" stroke-width="1.45" stroke-linecap="round"/>
        </svg>
        <span id="home-leaf-count">0</span>
      </output>
      <div class="scene-shortcuts" role="group" aria-label="초원 메뉴">
        <button type="button" class="scene-icon" data-page="letters" aria-label="반려동물에게 편지쓰기" title="반려동물에게 편지쓰기"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#mail"></use></svg></button>
        <button type="button" class="scene-icon" data-page="photo" aria-label="오늘의 사진" title="오늘의 사진"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#image"></use></svg></button>
        <button type="button" class="scene-icon" data-page="settings" aria-label="설정" title="설정"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#settings"></use></svg></button>
        <button type="button" class="scene-icon" id="food-open" data-page="food-intro" aria-label="먹이 합치기" title="먹이 합치기">
          <img src="./app/food-intro-cake.webp" alt="" width="38" height="38" draggable="false">
        </button>
      </div>
      <div class="view-picker" role="group" aria-label="초원 시점">
        <button type="button" data-view="third" aria-pressed="true">3인칭</button>
        <button type="button" data-view="first" aria-pressed="false">1인칭</button>
      </div>
      <div class="scene-controls">
        <button type="button" class="primary" id="catch-ball" hidden>받기</button>
        <div id="interaction" hidden>
          <div class="interaction-heading"><h2 id="interaction-title"></h2><button type="button" id="close-interaction" class="scene-icon" aria-label="선택 닫기"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#x"></use></svg></button></div>
          <div id="interaction-options" class="buttons"></div>
        </div>
        <div class="scene-actions" role="group" aria-label="함께 놀기">
          <button type="button" data-action="pet" aria-label="쓰다듬기" title="쓰다듬기"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M2 7h5c2.4 0 3.7 1.2 5.7 1.7l7.9 2.6c1.5.5 1.4 2.2.1 2.5l-4.4-1.4 4 2.3c1.3.8.3 2.6-1.1 1.8l-4.2-2 2.9 2.5c1.1 1 .1 2.6-1.2 1.6l-4.5-3.4-1.8-.2 1.1 3.2c.5 1.6-1.2 2.4-2 1.1l-3.4-5.1L2 13Z"/></svg></button>
          <button type="button" data-panel="treats" aria-label="간식" title="간식"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#bone"></use></svg></button>
          <button type="button" data-action="ball" aria-label="공놀이" title="공놀이"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#volleyball"></use></svg></button>
          <button type="button" data-panel="items" aria-label="아이템" title="아이템"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 2.5c1.2 6 3.5 8.3 9.5 9.5-6 1.2-8.3 3.5-9.5 9.5C10.8 15.5 8.5 13.2 2.5 12c6-1.2 8.3-3.5 9.5-9.5Z"/></svg></button>
          <button type="button" data-panel="talk" aria-label="말 걸기" title="말 걸기"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#message-circle"></use></svg></button>
          <button type="button" id="ride" aria-pressed="false" hidden aria-label="합체" title="합체"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="10" cy="4.5" r="2"/><path d="m9.5 7-1 4.8 3.4 1.1-.4 3m-1.1-7.8 2.8 2.1H16M3 10l2.7 3.4 2.8-.4m4.5 0H15l1.6-3.9L19 11l2.5.7v2.4l-3.4 1.1-1 5.3h-2m0-4.3H8l-1.3 4.3H4.5l.7-5.6 1-1.3"/></svg></button>
        </div>
      </div>
    </section>
    <section id="food-intro" aria-label="먹이 합치기 안내" hidden>
      <button type="button" class="page-back scene-icon" data-page="home" aria-label="공간으로 돌아가기"><span aria-hidden="true">‹</span></button>
      <div class="food-intro-content">
        <img class="food-intro-cake" src="./app/food-intro-cake.webp" alt="" width="320" height="320">
        <p>같은 먹이를 합쳐 케이크를 만들어봐요!<br>잎사귀 10개를 받을 수 있어요.</p>
        <button type="button" class="primary" data-page="leaf-game">시작하기</button>
      </div>
    </section>
    <section id="leaf-game" hidden>
      <button type="button" class="page-back scene-icon" data-page="food-intro" aria-label="먹이 합치기 안내로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>먹이 합치기</h1>
      <p class="small" id="food-upcoming"></p>
      <div class="food-stage">
        <canvas id="food-board" width="300" height="300" tabindex="0" aria-label="먹이 합치기 통. 좌우 방향키로 위치를 맞추고 스페이스 또는 엔터로 먹이를 놓으세요."></canvas>
        <div id="food-success" hidden>
          <strong role="status">성공!</strong>
          <div id="food-confetti" aria-hidden="true"></div>
        </div>
      </div>
      <p id="food-status" class="small" role="status"></p>
      <button type="button" class="primary" id="food-gift" hidden></button>
      <button type="button" id="food-retry" hidden>잎사귀 다시 받기</button>
      <button type="button" class="primary" id="food-reset" hidden>한 판 더 하기</button>
    </section>
    <section id="letters" hidden>
      <button type="button" class="page-back scene-icon" data-page="home" aria-label="초원으로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>반려동물에게 편지쓰기</h1>
      <div class="letter-menu">
        <button type="button" data-page="letter-write">
          <svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="m4 16-1 5 5-1L20.3 7.7a2.8 2.8 0 0 0-4-4L4 16Zm10-10 4 4M4 16l4 4"/>
          </svg>
          <span>편지쓰기</span>
        </button>
        <button type="button" data-page="letter-history">
          <svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 10 3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7l-3-2M3 12l8 5.3a2 2 0 0 0 2 0l8-5.3M6 14V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10M9 7h6m-6 4h6"/>
          </svg>
          <span>내가 쓴 편지 보기</span>
        </button>
      </div>
    </section>
    <section id="letter-write" hidden>
      <button type="button" class="page-back scene-icon" data-page="letters" aria-label="편지 메뉴로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1 id="letter-title">편지쓰기</h1>
      <form id="letter-form">
        <label for="letter-body">편지 내용</label>
        <textarea id="letter-body" rows="8" maxlength="2000" required></textarea>
        <button type="submit" class="primary" disabled>편지 건네주기</button>
        <p id="letter-error" role="alert"></p>
      </form>
    </section>
    <section id="letter-history" hidden>
      <button type="button" class="page-back scene-icon" data-page="letters" aria-label="편지 메뉴로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>내가 쓴 편지</h1>
      <p id="letter-history-status" class="small" role="status"></p>
      <ol id="letter-list"></ol>
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
    <section id="theme-shop" hidden>
      <button type="button" class="page-back scene-icon" data-page="settings" aria-label="설정으로 돌아가기"><span aria-hidden="true">‹</span></button>
      <h1>테마 상점</h1>
      <p class="small" id="theme-shop-balance"></p>
      <ul class="theme-grid" id="theme-grid"></ul>
      <template id="theme-card-template">
        <li class="theme-card">
          <div class="theme-preview">
            <img width="390" height="390" loading="lazy" alt="">
            <span class="theme-lock" role="img" aria-label="잠겨 있음">
              <svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg>
            </span>
          </div>
          <div class="theme-card-meta">
            <h2></h2>
            <p class="small"></p>
            <button type="button" class="primary"></button>
          </div>
        </li>
      </template>
      <p class="small" id="theme-shop-status" role="status" hidden></p>
    </section>
    <section id="settings" hidden>
      <header class="settings-header">
        <button type="button" class="page-back scene-icon" data-page="home" aria-label="초원으로 돌아가기"><span aria-hidden="true">‹</span></button>
        <h1>설정</h1>
      </header>
      <label class="settings-search">
        <svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#search"></use></svg>
        <input type="search" id="settings-search" aria-label="설정 검색" placeholder="설정 검색" autocomplete="off">
      </label>
      <p id="mode-copy" class="small" hidden></p>
      <p id="occasion" class="occasion" role="status" hidden></p>
      <ul class="settings-list">
        <li data-setting="배경 공간 초원 바다 노을 테마">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#image"></use></svg><span>배경</span><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></summary>
            <div class="settings-detail">
              <label for="background-choice">공간 테마</label>
              <select id="background-choice">
                <option value="meadow">초원</option>
              </select>
              <button type="button" class="theme-shop-link" data-page="theme-shop">다른 테마 보러가기</button>
              <p class="small" id="background-status" role="status" hidden></p>
            </div>
          </details>
        </li>
        <li data-setting="배경음악 음악 소리 사운드">
          <button type="button" class="settings-row" id="music-toggle" role="switch" aria-checked="false" aria-label="배경음악">
            <svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V6l12-3v12M9 9l12-3"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="15" rx="3" ry="2"/></svg>
            <span>배경음악</span><span class="music-switch" aria-hidden="true"></span>
          </button>
          <p id="music-status" class="small" role="status" hidden></p>
        </li>
        <li data-setting="계정 로그인 회원가입 로그아웃"><button type="button" class="settings-row" data-open-account><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#user-round"></use></svg><span>계정</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></button></li>
        <li data-setting="반려동물 정보와 모드 바꾸기 이름 생일 기일 다시 만나기"><button type="button" class="settings-row" id="edit-profile"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#info"></use></svg><span>반려동물 정보와 모드 바꾸기</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></button></li>
        <li data-setting="아바타 꾸미기 색 몸 귀 꼬리 무늬"><button type="button" class="settings-row" id="edit-avatar"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#cat"></use></svg><span id="pet-avatar-label">반려동물 아바타</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></button></li>
        <li data-setting="주인 아바타 후드티 바지 피부색">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#person-standing"></use></svg><span>주인 아바타</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></summary>
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
        <li data-setting="다른 친구랑 놀기 반려동물 추가 선택 전환"><button type="button" class="settings-row" data-page="friends"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#paw-print"></use></svg><span>다른 친구랑 놀기</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></button></li>
        <li data-setting="오늘의 사진 갤러리 앨범 선택 해제">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#image"></use></svg><span>오늘의 사진</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></summary>
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
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#hard-drive"></use></svg><span>저장 공간</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></summary>
            <div class="settings-detail">
              <p>로그인하면 반려동물 정보와 화면 설정이 계정에 저장돼요. 게스트 정보, 사진, 편지는 이 브라우저에 저장돼요.</p>
            </div>
          </details>
        </li>
        <li data-setting="홈 화면에 설치 앱 아이폰 안드로이드">
          <details>
            <summary class="settings-row"><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#smartphone"></use></svg><span>홈 화면에 설치</span><svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="./app/icons.svg?v=22#chevron-right"></use></svg></summary>
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
