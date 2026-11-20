<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#f4f4e6">
  <meta name="description" content="반려동물과 함께 쉬어 가는 둘만의 초원">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" type="image/png" href="./app/icon-drawing-192.png">
  <link rel="apple-touch-icon" href="./app/icon-drawing-192.png">
  <link rel="stylesheet" href="./app/style.css?v=3">
  <title>안녕</title>
  <script defer src="./app/vendor/jquery.min.js"></script>
  <script type="module" src="./app/main.js?v=3"></script>
</head>
<body>
<div id="launch" class="launch" role="status" aria-label="안녕 시작 중">
  <img src="./app/icon-drawing-192.png" alt="" width="192" height="192" fetchpriority="high">
</div>
<div class="app" id="app" hidden>
  <header class="top"><a href="./" aria-label="안녕 홈">안녕<span aria-hidden="true"> ✿</span></a><button type="button" data-page="settings" class="settings" hidden>설정</button></header>
  <main>
    <section id="setup" hidden>
      <p class="kicker">처음 만나는 날</p>
      <h1>우리 공간을 만들어요</h1>
      <p>로그인 없이 사용할 수 있어요. 입력 중인 정보와 사진은 이 브라우저에만 저장돼요.</p>
      <form id="profile-form">
        <fieldset><legend>어떤 이야기를 담을까요?</legend>
          <label class="choice"><input type="radio" name="mode" value="memory" required> 무지개다리를 건넜어요</label>
          <label class="choice"><input type="radio" name="mode" value="away" required> 멀리 떨어져 있어요</label>
        </fieldset>
        <div class="fields">
          <label>이름<input name="name" maxlength="24" required></label>
          <label>종류<select name="species"><option value="dog">강아지</option><option value="cat">고양이</option></select></label>
          <label>생일<input type="date" name="birthday" required></label>
          <label><span id="event-label">기일 또는 다시 만날 날짜</span><input type="date" name="event" required></label>
        </div>
        <div class="fields">
          <label>좋아하는 것<input name="likes" maxlength="240" placeholder="공놀이, 닭가슴살"></label>
          <label>싫어하는 것<input name="dislikes" maxlength="240" placeholder="목욕, 청소기"></label>
        </div>
        <p class="small">여러 가지는 쉼표로 나눠 주세요.</p>
        <label id="onboarding-photos">반려동물 사진 5장 이상 <input type="file" accept="image/*" multiple id="pet-photos"></label>
        <p id="photo-count" class="small" aria-live="polite"></p>
        <p id="setup-error" role="alert"></p>
        <button class="primary" type="submit">아바타 꾸미기</button>
      </form>
    </section>
    <section id="avatar" hidden>
      <p class="kicker">아바타 꾸미기</p>
      <h1 id="avatar-title"></h1>
      <div class="scene preview" id="avatar-scene"><span class="fallback-pet" aria-hidden="true"></span></div>
      <form id="avatar-form">
        <div class="fields">
          <label>체형<select name="size"><option value="small">소형</option><option value="medium" selected>중형</option><option value="large">대형</option></select></label>
          <label>귀 모양<select name="ears"><option value="upright">선 귀</option><option value="folded">접힌 귀</option></select></label>
          <label>꼬리 모양<select name="tail"><option value="short">짧은 꼬리</option><option value="long">긴 꼬리</option><option value="curled">말린 꼬리</option></select></label>
          <label>무늬<select name="pattern"><option value="solid">단색</option><option value="spots">얼룩</option><option value="tuxedo">턱시도</option></select></label>
        </div>
        <label>털색 <input type="color" name="fur" value="#e8c198"></label>
        <p class="small">사진에서 찾은 털색 후보</p>
        <div id="colors" class="buttons"></div>
        <p id="avatar-error" role="alert"></p>
        <div class="buttons"><button type="button" id="avatar-back">뒤로</button><button class="primary" type="submit">초원으로 가기</button></div>
      </form>
    </section>
    <section id="home" hidden>
      <p class="kicker">우리 둘만의 초원</p>
      <h1 id="greeting"></h1>
      <p id="mode-copy"></p>
      <p id="occasion" class="occasion" role="status" hidden></p>
      <div class="scene" id="home-scene">
        <button type="button" class="fallback-pet" data-action="pet" aria-label="아바타 쓰다듬기"></button>
        <output id="reply" class="bubble" aria-live="polite" hidden></output>
      </div>
      <div class="buttons actions">
        <button type="button" data-action="pet">♡ 쓰다듬기</button>
        <button type="button" data-panel="treats">간식</button>
        <button type="button" data-action="ball">공놀이</button>
        <button type="button" data-panel="items">아이템</button>
        <button type="button" data-panel="talk">말 걸기</button>
      </div>
      <div id="interaction" hidden><h2 id="interaction-title"></h2><div id="interaction-options" class="buttons"></div></div>
    </section>
    <section id="photo" hidden>
      <p class="kicker">오늘의 사진</p>
      <h1 id="photo-title"></h1>
      <figure><img id="daily-image" alt=""></figure>
      <p class="small">오늘은 이 사진을 함께 봐요.</p>
    </section>
    <section id="settings" hidden>
      <p class="kicker">우리 공간</p>
      <h1>설정</h1>
      <div class="buttons"><button type="button" id="edit-profile">반려동물 정보와 모드 바꾸기</button><button type="button" id="edit-avatar">아바타 꾸미기</button></div>
      <h2>저장 공간</h2>
      <p>반려동물 정보와 사진은 이 브라우저에 저장돼요. 브라우저의 사이트 데이터를 지우면 저장한 내용도 사라져요.</p>
      <h2>오늘의 사진</h2>
      <p>사진 앱의 반려동물 앨범에서 보여 줄 사진을 골라 주세요. 선택한 사진이 없으면 처음 등록한 사진을 사용해요.</p>
      <label>앨범 사진 선택<input type="file" id="album-photos" accept="image/*" multiple></label>
      <p id="album-status" class="small" role="status"></p>
      <button type="button" id="clear-album">처음 등록한 사진 사용</button>
      <h2>홈 화면에 설치</h2>
      <p>iPhone은 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를, Android는 Chrome 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요.</p>
      <button type="button" id="install" hidden>안녕 설치</button>
    </section>
    <p id="app-error" role="alert" hidden></p>
  </main>
  <nav aria-label="주 메뉴" hidden><button type="button" data-page="home">초원</button><button type="button" data-page="photo">오늘의 사진</button><button type="button" data-page="settings">설정</button></nav>
</div>
</body>
</html>
