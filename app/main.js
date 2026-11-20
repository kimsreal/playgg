import {itemShape} from './item-names.js';
import { phrases, photoTitles } from './data.js?v=18';
import { activeFriendId, listFriends, switchFriend, addFriend, updateFriend } from './friends.js';
import { readState, updateState, preparePhotos, chooseDaily } from './photos.js?v=5';

const $=window.jQuery;
const byId=id => document.getElementById(id);
const launchDelay=new Promise(resolve => setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750));
const profileForm=byId('profile-form');
const avatarForm=byId('avatar-form');
const defaults={size:'medium',ears:'folded',tail:'long',fur:'#e8c198',pattern:'solid'};
const speciesInfo={dog:['dog','강아지'],cat:['cat','고양이'],hamster:['rat','햄스터'],parrot:['bird','앵무새'],lizard:['lizard','도마뱀']};
const replyLabels={heart:'하트',bone:'간식',fish:'생선',sun:'햇살',moon:'달',volleyball:'공',sparkles:'반짝임','paw-print':'발자국',leaf:'나뭇잎',smile:'웃는 얼굴',star:'별'};

function makeIcon(name) {
  const namespace='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(namespace,'svg');
  svg.setAttribute('class','ui-icon');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  const use=document.createElementNS(namespace,'use');
  use.setAttribute('href','./app/icons.svg?v=20#'+name);
  svg.append(use);
  return svg;
}
const speciesColors={hamster:'#e3b275',parrot:'#8ebd6a',lizard:'#8cb78b'};
const random=values => values[Math.floor(Math.random()*values.length)];
const dayKey=(date=new Date()) => [date.getFullYear(),date.getMonth()+1,date.getDate()].map(value => String(value).padStart(2,'0')).join('-');
const civilDate=key => Date.parse(key+'T00:00:00Z');
const tags=value => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
const scenes=import('./scene.js?v=38').catch(() => null);
let state, draft, addingFriend=false;
let riding=false;
let page, scene, sceneRevision=0, replyTimer, photoUrl, installPrompt, modeDates={};
let renderedDay;

let perspective='third';
let ownerGender='default';
try {
  if (localStorage.getItem('annyeong-perspective')==='first') perspective='first';
  const savedGender=localStorage.getItem('annyeong-owner-gender');
  if (savedGender==='male' || savedGender==='female') ownerGender=savedGender;
} catch {
  // The current view can still be changed when browser storage is unavailable.
}

function applyPerspective() {
  byId('home').dataset.view=perspective;
  $('.view-picker button').each(function () {
    this.setAttribute('aria-pressed',String(this.dataset.view===perspective));
  });
  scene?.setPerspective(perspective);
}

$('.view-picker button').on('click',function () {
  perspective=this.dataset.view;
  applyPerspective();
  try {
    localStorage.setItem('annyeong-perspective',perspective);
  } catch {
    // The active scene has already switched.
  }
});

const genderSelect=byId('owner-gender');
genderSelect.value=ownerGender;
genderSelect.addEventListener('change',() => {
  ownerGender=genderSelect.value;
  try {
    localStorage.setItem('annyeong-owner-gender',ownerGender);
    $('#owner-gender-status').text('저장했어요.');
  } catch {
    $('#owner-gender-status').text('이번 접속에 적용했어요.');
  }
});

const homeScene=byId('home-scene');
let viewDrag, touchView, skipSceneClick=false;
let fallbackPanX=0, fallbackPanY=0, fallbackZoom=1;

function moveView(dx,dy) {
  if (scene && homeScene.classList.contains('has-webgl')) {
    scene.dragView(dx,dy);
  } else {
    fallbackPanX=Math.max(-85,Math.min(85,fallbackPanX+dx*.55));
    fallbackPanY=Math.max(-45,Math.min(45,fallbackPanY+dy*.42));
    homeScene.style.setProperty('--pan-x',fallbackPanX+'px');
    homeScene.style.setProperty('--pan-y',fallbackPanY+'px');
  }
}

function zoomView(factor) {
  if (scene && homeScene.classList.contains('has-webgl')) scene.zoomView(factor);
  else {
    fallbackZoom=Math.max(.72,Math.min(2.2,fallbackZoom*factor));
    homeScene.style.setProperty('--scene-zoom',fallbackZoom);
  }
}

homeScene.addEventListener('pointerdown',event => {
  if (event.pointerType==='touch' || !event.isPrimary || event.button!==0) return;
  skipSceneClick=false;
  viewDrag={id:event.pointerId,x:event.clientX,y:event.clientY,active:false};
});
homeScene.addEventListener('pointermove',event => {
  if (!viewDrag || viewDrag.id!==event.pointerId) return;
  const dx=event.clientX-viewDrag.x;
  const dy=event.clientY-viewDrag.y;
  if (!viewDrag.active) {
    if (Math.hypot(dx,dy)<2) return;
    viewDrag.active=true;
    skipSceneClick=true;
    homeScene.setPointerCapture(event.pointerId);
    homeScene.classList.add('is-looking');
  }
  viewDrag.x=event.clientX;
  viewDrag.y=event.clientY;
  moveView(dx,dy);
});
function endViewDrag(event) {
  if (viewDrag?.id!==event.pointerId) return;
  viewDrag=null;
  homeScene.classList.remove('is-looking');
}
for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  homeScene.addEventListener(type,endViewDrag);
}
homeScene.addEventListener('pointerleave',event => {
  if (!viewDrag?.active) endViewDrag(event);
});

const sceneTouches=event => Array.from(event.touches).filter(touch => homeScene.contains(touch.target));
const pinchDistance=([first,second]) => Math.hypot(first.clientX-second.clientX,first.clientY-second.clientY);
homeScene.addEventListener('touchstart',event => {
  const touches=sceneTouches(event);
  if (touches.length===1) {
    skipSceneClick=false;
    touchView={x:touches[0].clientX,y:touches[0].clientY,active:false};
  } else if (touches.length>=2) {
    skipSceneClick=true;
    touchView={distance:pinchDistance(touches)};
    if (event.cancelable) event.preventDefault();
  }
},{passive:false});
homeScene.addEventListener('touchmove',event => {
  const touches=sceneTouches(event);
  if (!touchView || !touches.length) return;
  if (touches.length>=2) {
    const distance=pinchDistance(touches);
    if (distance>0 && touchView.distance>0) zoomView(distance/touchView.distance);
    touchView={distance};
  } else {
    const {clientX:x,clientY:y}=touches[0];
    const dx=x-touchView.x;
    const dy=y-touchView.y;
    if (!touchView.active && Math.hypot(dx,dy)<2) return;
    touchView={x,y,active:true};
    moveView(dx,dy);
  }
  skipSceneClick=true;
  if (event.cancelable) event.preventDefault();
},{passive:false});
function endTouchView(event) {
  const touches=sceneTouches(event);
  if (touches.length===1) touchView={x:touches[0].clientX,y:touches[0].clientY,active:skipSceneClick};
  else if (touches.length===0) touchView=null;
}
homeScene.addEventListener('touchend',endTouchView);
homeScene.addEventListener('touchcancel',endTouchView);
homeScene.addEventListener('wheel',event => {
  if (!event.deltaY) return;
  event.preventDefault();
  const units=event.deltaMode===1 ? 16 : event.deltaMode===2 ? homeScene.clientHeight : 1;
  zoomView(Math.exp(-Math.max(-180,Math.min(180,event.deltaY*units))*.003));
},{passive:false});

homeScene.addEventListener('click',event => {
  if (!skipSceneClick || event.detail===0) return;
  skipSceneClick=false;
  event.preventDefault();
  event.stopPropagation();
},true);

homeScene.addEventListener('click',event => {
  if (homeScene.classList.contains('has-webgl') || event.target.closest('button')) return;
  const island=homeScene.querySelector('.meadow-island').getBoundingClientRect();
  const view=homeScene.getBoundingClientRect();
  const x=(event.clientX-island.left)/island.width;
  const y=(event.clientY-island.top)/island.height;
  if (Math.hypot((x-.5)*2,(y-.5)*2)>1) return;
  homeScene.style.setProperty('--owner-x',((event.clientX-view.left)/view.width*100)+'%');
  homeScene.style.setProperty('--owner-y',((event.clientY-view.top)/view.height*100)+'%');
  homeScene.style.setProperty('--view-x',((.5-x)*88)+'px');
  homeScene.style.setProperty('--view-y',((.5-y)*44)+'px');
});

function showError(message) {
  $('#app-error').text(message).prop('hidden',!message);
}

const rideButton=byId('ride');
function updateRideButton() {
  rideButton.setAttribute('aria-pressed',String(riding));
}
rideButton.addEventListener('click',() => {
  if (!scene) return;
  riding=scene.setRiding(!riding);
  updateRideButton();
});

async function mountScene(host,profile,preview) {
  const revision=++sceneRevision;
  scene?.dispose();
  scene=null;
  const fallback=host.querySelector('.fallback-pet');
  fallback.hidden=false;
  host.classList.remove('has-webgl');
  fallback.replaceChildren(makeIcon(speciesInfo[profile.species][0]));
  const module=await scenes;
  if (revision!==sceneRevision || !module) return;
  const setGraphicsAvailable=available => {
    if (revision!==sceneRevision) return;
    fallback.hidden=available;
    host.classList.toggle('has-webgl',available);
    if (!preview) rideButton.hidden=!available;
  };
  try {
    scene=module.createScene(host,profile,preview ? null : () => play('pet','heart'),{
      preview,perspective,ownerGender,onGraphicsChange:setGraphicsAvailable
    });
    setGraphicsAvailable(true);
    if (!preview) scene.play('greet');
  } catch {
    // The rest of the app still works on devices without WebGL.
  }
}

function show(pageId) {
  page=pageId;
  riding=false;
  rideButton.hidden=true;
  updateRideButton();
  ++sceneRevision;
  scene?.dispose();
  scene=null;
  clearTimeout(replyTimer);
  $('#reply,#interaction').prop('hidden',true);
  showError('');
  $('main > section').prop('hidden',true);
  $('#'+pageId).prop('hidden',false);
  document.body.classList.toggle('meadow-open',pageId==='home');
  $('#setup-back').prop('hidden',!state?.profile);
  if (pageId==='friends') renderFriends();
  window.scrollTo(0,0);
  if (pageId==='home') {
    applyPerspective();
    void mountScene(byId('home-scene'),state.profile,false);
  }
  if (pageId==='photo') {
    $('#photo-status').text('');
    void showDaily();
  }
  if (pageId==='settings') {
    byId('settings-search').value='';
    filterSettings();
    renderDates();
    $('#album-status').text(state.album.length ? '선택한 앨범 사진 '+state.album.length+'장' : state.photos?.length ? '처음 등록한 사진을 사용하고 있어요.' : '추가한 사진이 없어요.');
    $('#clear-album').prop('hidden',!state.album.length);
  }
}

function filterSettings() {
  const words=byId('settings-search').value.trim().toLocaleLowerCase().split(/\s+/);
  const rows=[...document.querySelectorAll('.settings-list [data-setting]')];
  for (const row of rows) {
    row.hidden=!words.every(word => row.dataset.setting.toLocaleLowerCase().includes(word));
  }
  byId('settings-empty').hidden=rows.some(row => !row.hidden);
}

byId('settings-search').addEventListener('input',filterSettings);

function renderDates() {
  const {profile}=state;
  const today=dayKey();
  renderedDay=today;
  let message='';
  if (profile.mode==='away') {
    const remaining=Math.round((civilDate(profile.dates?.away)-civilDate(today))/86400000);
    message=remaining>0 ? '다시 만나기까지 D-'+remaining : remaining===0 ? '오늘은 다시 만나는 날이에요.' : '';
  }
  $('#mode-copy').text(message).prop('hidden',!message);
  const birthday=today.slice(5)===profile.birthday.slice(5);
  const memorial=profile.mode==='memory' && today.slice(5)===profile.dates?.memory?.slice(5);
  const notices=[];
  if (birthday) notices.push(profile.name+'의 생일이에요. 오늘도 따뜻한 마음을 전해요.');
  if (memorial) notices.push(profile.name+'와 함께한 시간을 조용히 떠올려 봐요.');
  $('#occasion').text(notices.join(' ')).prop('hidden',notices.length===0);
}

function openProfile() {
  profileForm.reset();
  const profile=draft || (addingFriend ? null : state?.profile);
  $('#setup-kicker').text(addingFriend || state?.profile ? '우리 공간' : '처음 만나는 날');
  $('#setup-title').text(addingFriend ? '새 친구를 소개해 주세요' : state?.profile ? '반려동물 정보' : '우리 공간을 만들어요');
  $('#setup-back').attr({
    'aria-label':addingFriend ? '친구 목록으로 돌아가기' : '설정으로 돌아가기',
    'data-page':addingFriend ? 'friends' : 'settings'
  });
  modeDates={...profile?.dates};
  $('#setup-error').text('');
  if (profile) {
    for (const key of ['name','species','birthday','mode']) profileForm.elements[key].value=profile[key];
    profileForm.elements.likes.value=profile.likes.join(', ');
    profileForm.elements.dislikes.value=profile.dislikes.join(', ');
    profileForm.elements.event.value=modeDates[profile.mode] || '';
  }
  for (const key of ['likes','dislikes']) {
    const input=profileForm.elements[key];
    input.dataset.original=state?.profile && !addingFriend ? input.value : '';
  }
  validateItemCounts();
  profileForm.dataset.mode=profileForm.elements.mode.value;
  refreshModeLabel();
  show('setup');
}

function refreshModeLabel() {
  const mode=profileForm.elements.mode.value;
  $('#event-label').text(mode==='memory' ? '기일' : mode==='away' ? '다시 만날 날짜' : '기일 또는 다시 만날 날짜');
  const eventField=profileForm.elements.event;
  const showDate=mode!=='play';
  byId('event-field').hidden=!showDate;
  eventField.disabled=!showDate;
  eventField.required=showDate;
  eventField.max=mode==='memory' ? dayKey() : '';
}

function validateItemCounts() {
  let valid=true;
  for (const key of ['likes','dislikes']) {
    const input=profileForm.elements[key];
    const exceeds=tags(input.value).length>3 && input.value!==input.dataset.original;
    input.setCustomValidity(exceeds ? '각 항목은 쉼표로 나눠 3개까지 입력해 주세요.' : '');
    valid&&=!exceeds;
  }
  return valid;
}

function readProfileForm() {
  const fields=Object.fromEntries(new FormData(profileForm));
  return {
    ...defaults,...(addingFriend ? null : state?.profile),...draft,
    name:fields.name.trim(),species:fields.species,mode:fields.mode || '',
    birthday:fields.birthday,dates:fields.event===undefined || !fields.mode ? {...modeDates} : {...modeDates,[fields.mode]:fields.event},
    likes:tags(fields.likes),dislikes:tags(fields.dislikes)
  };
}

function saveOnboarding(step,profile) {
  if (state?.profile) return Promise.resolve();
  const onboarding={step,profile};
  const errorId=step==='avatar' ? 'avatar-error' : 'setup-error';
  return updateState(current => current?.profile ? current : {...current,onboarding:{...current?.onboarding,...onboarding}}).catch(() => {
    $('#'+errorId).text('입력한 내용을 이 브라우저에 저장하지 못했어요.');
  });
}

$(profileForm).on('change','[name=mode]',event => {
  const previous=profileForm.dataset.mode;
  if (previous && !profileForm.elements.event.disabled) modeDates[previous]=profileForm.elements.event.value;
  profileForm.dataset.mode=event.target.value;
  profileForm.elements.event.value=modeDates[event.target.value] || '';
  refreshModeLabel();
  if (validateItemCounts() && !state?.profile) void saveOnboarding('setup',readProfileForm());
});
$(profileForm).on('input change','input:not([type=radio]):not([type=file]),select',() => {
  if (validateItemCounts() && !state?.profile) void saveOnboarding('setup',readProfileForm());
});

$(profileForm).on('submit',async event => {
  event.preventDefault();
  if (!validateItemCounts()) {
    profileForm.reportValidity();
    return;
  }
  const fields=Object.fromEntries(new FormData(profileForm));
  if (!fields.name.trim()) {
    $('#setup-error').text('반려동물 이름을 입력해 주세요.');
    return;
  }
  draft=readProfileForm();
  if (state?.profile && !addingFriend) {
    const id=activeFriendId(state);
    const profile=draft;
    try {
      state=await updateState(current => updateFriend(current,id,() => ({profile})));
      draft=null;
      show('home');
    } catch {
      $('#setup-error').text('정보를 저장하지 못했어요. 다시 시도해 주세요.');
    }
  } else {
    if (draft.fur===defaults.fur && speciesColors[draft.species]) draft.fur=speciesColors[draft.species];
    openAvatar();
    await saveOnboarding('avatar',draft);
  }
});

function avatarProfile() {
  return {...draft,...Object.fromEntries(new FormData(avatarForm))};
}

function openAvatar() {
  $('#avatar-back').attr('aria-label', state?.profile && !addingFriend ? '설정으로 돌아가기' : '반려동물 정보로 돌아가기');
  $('#avatar-title').text(draft.name+'의 모습');
  $('#avatar-error').text('');
  const earLabels={parrot:['머리 깃','세운 깃','접힌 깃'],lizard:['머리 능선','또렷한 능선','낮은 능선']};
  const [label,upright,folded]=earLabels[draft.species] || ['귀 모양','선 귀','접힌 귀'];
  $('#avatar-ear-label').text(label);
  $(avatarForm.elements.ears.options[0]).text(upright);
  $(avatarForm.elements.ears.options[1]).text(folded);
  $('#avatar-color-label').text(draft.species==='parrot' ? '깃털색' : draft.species==='lizard' ? '몸 색깔' : '털색');
  for (const key of Object.keys(defaults)) avatarForm.elements[key].value=draft[key];
  show('avatar');
  void mountScene(byId('avatar-scene'),avatarProfile(),true);
}

$(avatarForm).on('change',() => {
  const profile=avatarProfile();
  void mountScene(byId('avatar-scene'),profile,true);
  void saveOnboarding('avatar',profile);
});
$('#avatar-back').on('click',() => {
  draft=avatarProfile();
  if (state?.profile && !addingFriend) {
    draft=null;
    show('settings');
  } else {
    openProfile();
    void saveOnboarding('setup',draft);
  }
});

$(avatarForm).on('submit',async event => {
  event.preventDefault();
  const profile=avatarProfile();
  const id=state?.profile ? activeFriendId(state) : null;
  const newId=addingFriend ? crypto.randomUUID() : null;
  const submit=avatarForm.querySelector('[type=submit]');
  submit.disabled=true;
  try {
    state=await updateState(current => {
      if (newId) return addFriend(current,newId,profile);
      if (id) return updateFriend(current,id,() => ({profile}));
      return {...current,profile,photos:current?.photos || current?.onboarding?.photos || [],album:current?.album || [],onboarding:null};
    });
    draft=null;
    addingFriend=false;
    show('home');
  } catch {
    $('#avatar-error').text('기기에 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.');
  } finally {
    submit.disabled=false;
  }
});

function play(action,icon,object) {
  if (riding && scene) {
    riding=scene.setRiding(false);
    updateRideButton();
  }
  scene?.play(action,object);
  clearTimeout(replyTimer);
  const reply=$('#reply').empty().append(action==='treat' && object ? objectImage(object) : makeIcon(icon)).attr('aria-label',replyLabels[icon]).prop('hidden',false);
  if (!homeScene.classList.contains('has-webgl') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const effect=action==='disliked' ? 'translate(-125%,-50%) rotate(-12deg)' : 'translate(-50%,-75%)';
    byId('home-scene').querySelector('.fallback-pet').animate([
      {transform:'translate(-50%,-50%)'},{transform:effect},{transform:'translate(-50%,-50%)'}
    ],{duration:550});
  }
  replyTimer=setTimeout(() => reply.prop('hidden',true),2700);
}

function objectImage(kind) {
  const prefix=kind==='meat' || kind==='fish' ? 'treat-' : 'item-';
  return $('<img>',{class:'treat-icon',src:'./app/'+prefix+kind+'.png',alt:''});
}

function interaction(panel) {
  const container=$('#interaction-options').empty().toggleClass('treat-options',panel!=='talk').toggleClass('item-options',panel==='items');
  const add=(label,action,reply,kind) => {
    const button=$('<button>',{type:'button',title:label});
    if (kind) button.attr('aria-label',label).append(objectImage(kind));
    if (panel!=='treats') $('<span>',{text:label}).appendTo(button);
    button.on('click',() => {
      $('#interaction').prop('hidden',true);
      play(action,Array.isArray(reply) ? random(reply) : reply,kind);
    }).appendTo(container);
  };
  if (panel==='talk') {
    $('#interaction-title').text(state.profile.name+'에게 말 걸기');
    phrases.forEach(([label,icons,action]) => add(label,action,icons));
  } else if (panel==='treats') {
    $('#interaction-title').text('간식 고르기');
    add('고기 간식','treat','bone','meat');
    add('생선 간식','treat','fish','fish');
  } else {
    $('#interaction-title').text('아이템 놓기');
    for (const like of state.profile.likes) add(like,'liked','smile',itemShape(like));
    for (const dislike of state.profile.dislikes) add(dislike,'disliked','paw-print',itemShape(dislike));
    if (!container.children().length) $('<p>').text('설정에서 좋아하는 것과 싫어하는 것을 추가할 수 있어요.').appendTo(container);
  }
  $('#interaction').prop('hidden',false);
}

function decorateDailyPhoto(frame,day,photoId) {
  const patterns=['gingham','sage-dot','blue-dot','stripe','grid'];
  let seed=2166136261;
  for (const character of day+':'+photoId) {
    seed=Math.imul(seed^character.charCodeAt(0),16777619);
  }
  const choice=seed>>>0;
  frame.dataset.tape=patterns[choice%patterns.length];
  frame.style.setProperty('--tape-x',(28+(choice>>>11)%45)+'%');
  frame.style.setProperty('--tape-angle',((choice>>>20)%25-12)+'deg');
}

async function showDaily() {
  const id=activeFriendId(state);
  const day=dayKey();
  try {
    state=await updateState(current => updateFriend(current,id,friend => ({
      daily:chooseDaily(friend,day,photoTitles).daily
    })));
    if (page!=='photo' || activeFriendId(state)!==id) return;
    renderedDay=day;
    const {daily,profile}=state;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl=null;
    const hasPhoto=Boolean(daily?.photo);
    $('#photo-card').prop('hidden',!hasPhoto);
    $('#photo-empty').prop('hidden',hasPhoto);
    if (!hasPhoto) {
      $('#daily-image').removeAttr('src').attr('alt','');
      return;
    }
    decorateDailyPhoto(byId('daily-frame'),daily.day,daily.photo.id);
    photoUrl=URL.createObjectURL(daily.photo.blob);
    $('#photo-title').text(daily.title.replaceAll('{이름}',() => profile.name));
    $('#daily-image').attr({src:photoUrl,alt:profile.name+'의 오늘 사진'});
  } catch {
    if (page==='photo') showError('오늘의 사진을 불러오지 못했어요.');
  }
}

$('[data-photo-picker]').on('click',() => byId('album-photos').click());

$('#album-photos').on('change',async function () {
  const files=Array.from(this.files);
  this.value='';
  if (!files.length) return;
  const from=page;
  const id=activeFriendId(state);
  const status=from==='photo' ? $('#photo-status') : $('#album-status');
  const stillHere=() => page===from && activeFriendId(state)===id;
  const controls=$('[data-photo-picker],#clear-album').prop('disabled',true);
  status.text('고른 사진을 준비하고 있어요…');
  try {
    const {photos,skipped}=await preparePhotos(files);
    if (!photos.length) {
      if (stillHere()) status.text('사진을 열 수 없어요. JPEG 또는 PNG 사진을 골라 주세요.');
      return;
    }
    state=await updateState(current => updateFriend(current,id,friend => ({
      album:[...new Map([...friend.album,...photos].map(photo => [photo.id,photo])).values()]
    })));
    if (!stillHere()) return;
    status.text('앨범 사진 '+state.album.length+'장이 저장되어 있어요.'+(skipped ? ' 일부 사진은 열 수 없었어요.' : ''));
    $('#clear-album').prop('hidden',false);
    if (from==='photo') await showDaily();
  } catch {
    if (stillHere()) status.text('사진을 기기에 저장하지 못했어요. 다시 시도해 주세요.');
  } finally {
    controls.prop('disabled',false);
  }
});

$('#clear-album').on('click',async () => {
  try {
    const id=activeFriendId(state);
    state=await updateState(current => updateFriend(current,id,() => ({album:[]})));
    if (page!=='settings' || activeFriendId(state)!==id) return;
    $('#album-status').text(state.photos?.length ? '다음 카드부터 처음 등록한 사진을 사용해요.' : '앨범 사진 선택을 해제했어요.');
    $('#clear-album').prop('hidden',true);
  } catch {
    $('#album-status').text('설정을 저장하지 못했어요. 다시 시도해 주세요.');
  }
});

function renderFriends() {
  const list=$('#friend-list').empty();
  const active=activeFriendId(state);
  for (const {id,profile} of listFriends(state)) {
    const [icon,kind]=speciesInfo[profile.species];
    const entry=$('<li>').appendTo(list);
    const button=$('<button>',{type:'button'}).appendTo(entry);
    if (id===active) button.attr('aria-current','true');
    $('<span>',{class:'friend-glyph','aria-hidden':'true'}).append(makeIcon(icon)).appendTo(button);
    $('<span>',{class:'friend-name',text:profile.name}).appendTo(button);
    $('<span>',{class:'small',text:id===active ? kind+' · 함께 있는 친구' : kind}).appendTo(button);
    button.on('click',async () => {
      $('#friend-list button,#add-friend').prop('disabled',true);
      try {
        if (id!==activeFriendId(state)) state=await updateState(current => switchFriend(current,id));
        show('home');
      } catch {
        showError('친구를 불러오지 못했어요. 다시 시도해 주세요.');
      } finally {
        $('#friend-list button,#add-friend').prop('disabled',false);
      }
    });
  }
}

$('#add-friend').on('click',() => {
  addingFriend=true;
  draft=null;
  openProfile();
});

$(document).on('click','button[data-page]',function () {
  if (!state?.profile) return;
  draft=null;
  addingFriend=false;
  show(this.dataset.page);
});
$(document).on('click','button[data-panel]',function () { interaction(this.dataset.panel); });
$('#close-interaction').on('click',() => $('#interaction').prop('hidden',true));
$(document).on('click','button[data-action]',function () {
  play(this.dataset.action,this.dataset.action==='ball' ? 'volleyball' : 'heart');
});
$('#edit-profile').on('click',openProfile);
$('#edit-avatar').on('click',() => {
  draft={...state.profile};
  openAvatar();
});
window.addEventListener('beforeinstallprompt',event => {
  event.preventDefault();
  installPrompt=event;
  $('#install').prop('hidden',false);
});
$('#install').on('click',async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt=null;
  $('#install').prop('hidden',true);
});
function checkDay() {
  if (document.hidden || dayKey()===renderedDay) return;
  if (page==='settings') renderDates();
  if (page==='photo') void showDaily();
}
document.addEventListener('visibilitychange',checkDay);
setInterval(checkDay,60000);
if ('serviceWorker' in navigator) {
  const registration=navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(() => null);
  document.addEventListener('visibilitychange',() => {
    if (!document.hidden) void registration.then(worker => worker?.update()).catch(() => {});
  });
}
window.addEventListener('pageshow',event => {
  if (event.persisted && page==='home') applyPerspective();
});

byId('start-welcome').addEventListener('click',async event => {
  const button=event.currentTarget;
  button.disabled=true;
  $('#welcome-error').text('');
  try {
    state=await updateState(current => ({...current,welcomed:true}));
    openProfile();
    byId('setup-title').focus();
  } catch {
    $('#welcome-error').text('이 브라우저에 시작 상태를 저장하지 못했어요. 다시 시도해 주세요.');
  } finally {
    button.disabled=false;
  }
});

try {
  state=await readState();
  if (state?.profile) {
    show('home');
  } else if (state?.onboarding) {
    const saved=state.onboarding;
    draft=saved.profile;
    if (saved.step==='avatar') openAvatar();
    else openProfile();
  } else if (state?.welcomed) openProfile();
  else show('welcome');
} catch {
  showError('이 기기의 저장 공간을 열 수 없어요. 일반 브라우저 창에서 다시 열어 주세요.');
} finally {
  await launchDelay;
  byId('launch').hidden=true;
  byId('app').hidden=false;
}
