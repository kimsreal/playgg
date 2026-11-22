import {themes,themeId,purchasedThemes} from './theme-catalog.js?v=91';
import {createFoodGame} from './food-game.js?v=77';
import {ownerColors as cleanOwnerColors} from './owner-colors.js';
import {itemShape} from './item-names.js';
import { phrases, photoTitles } from './data.js?v=18';
import { activeFriendId, friendSpace, listFriends, migrateFriendSpaces, switchFriend, addFriend, updateFriend } from './friends.js?v=80';
import {readState,updateState as writeLocalState,preparePhotos,chooseDaily} from './photos.js?v=39';
import {readAccount,changeAccount,saveAccount,accountSettings,mergeAccount} from './account.js?v=80';

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
  use.setAttribute('href','./app/icons.svg?v=22#'+name);
  svg.append(use);
  return svg;
}
const speciesColors={hamster:'#e3b275',parrot:'#8ebd6a',lizard:'#8cb78b'};
const random=values => values[Math.floor(Math.random()*values.length)];
const dayKey=(date=new Date()) => [date.getFullYear(),date.getMonth()+1,date.getDate()].map(value => String(value).padStart(2,'0')).join('-');
const civilDate=key => Date.parse(key+'T00:00:00Z');
const tags=value => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
const scenes=import('./scene.js?v=91').catch(() => null);
let state, draft, addingFriend=false;
let riding=false;
let page, scene, sceneRevision=0, replyTimer, photoUrl, installPrompt, modeDates={};
let renderedDay;

let perspective='third';
let ownerColors=cleanOwnerColors();
let account=null;
let accountReturnPage='welcome';
let accountMode='login';
let writes=Promise.resolve();

function applyPreferences(settings) {
  perspective=settings.perspective;
  ownerColors=cleanOwnerColors(settings.ownerColors);
  syncOwnerColorInputs();
}

function guestPreferences() {
  try {
    return {
      perspective:localStorage.getItem('annyeong-perspective')==='first' ? 'first' : 'third',
      ownerColors:cleanOwnerColors(JSON.parse(localStorage.getItem('annyeong-owner-colors')))
    };
  } catch {
    return {perspective:'third',ownerColors:cleanOwnerColors()};
  }
}

async function restoreGuest(guest) {
  if (!guest?.profile || guest.space) return guest;
  let legacy=guest.background;
  if (legacy===undefined) {
    try { legacy=localStorage.getItem('annyeong-background'); } catch {}
  }
  return writeLocalState(current => current?.space ? current : migrateFriendSpaces(current,current?.background ?? legacy));
}

function accountKey(session) {
  return 'account:'+session.user.id;
}

function updateState(update) {
  if (!account) return writeLocalState(update);
  const session=account;
  const key=accountKey(session);
  const pending=writes.then(async () => {
    const previous=await readState(key);
    const updated=update(previous);
    const settings=accountSettings(updated);
    if (JSON.stringify(settings)!==JSON.stringify(accountSettings(previous))) {
      const saved=await saveAccount(session,settings);
      session.revision=saved.revision;
    }
    return writeLocalState(() => updated,key);
  });
  writes=pending.catch(() => {});
  return pending;
}

async function enterAccount(session,guestSeed) {
  const key=accountKey(session);
  const restored=await writeLocalState(local => mergeAccount(session.settings,local || guestSeed),key);
  account=session;
  state=restored;
  applyPreferences(session.settings);
}

function applyPerspective() {
  byId('home').dataset.view=perspective;
  $('.view-picker button').each(function () {
    this.setAttribute('aria-pressed',String(this.dataset.view===perspective));
  });
  scene?.setPerspective(perspective);
}

$('.view-picker button').on('click',async function () {
  perspective=this.dataset.view;
  applyPerspective();
  const value=perspective;
  try {
    if (account) state=await updateState(current => ({...current,perspective:value}));
    else localStorage.setItem('annyeong-perspective',value);
  } catch {
    if (account && perspective===value) {
      perspective=state?.perspective || 'third';
      applyPerspective();
      showError('시점을 계정에 저장하지 못했어요. 다시 시도해 주세요.');
    }
  }
});

const ownerColorForm=byId('owner-color-form');
const ownerColorFields=ownerColorForm.querySelector('fieldset');

function syncOwnerColorInputs() {
  for (const [part,color] of Object.entries(ownerColors)) {
    ownerColorForm.elements.namedItem(part).value=color;
  }
  byId('owner-color-status').textContent='';
}

ownerColorForm.addEventListener('submit',async event => {
  event.preventDefault();
  const colors=cleanOwnerColors(Object.fromEntries(new FormData(ownerColorForm)));
  const session=account;
  const status=byId('owner-color-status');
  ownerColorFields.disabled=true;
  try {
    if (session) {
      const updated=await updateState(current => ({...current,ownerColors:colors}));
      if (account!==session) return;
      state=updated;
    } else {
      localStorage.setItem('annyeong-owner-colors',JSON.stringify(colors));
    }
    ownerColors=colors;
    status.textContent='저장했어요.';
  } catch {
    if (account===session) {
      if (!session) ownerColors=colors;
      status.textContent=session ? '계정에 저장하지 못했어요. 다시 시도해 주세요.' : '이번 접속에 적용했어요.';
    }
  } finally {
    ownerColorFields.disabled=false;
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

const catchBallButton=byId('catch-ball');
const fallbackBall=byId('fallback-ball');
const fallbackBallHearts=byId('fallback-ball-hearts');
let ballAnimation, fetchRun, ballTimer, fallbackFetch=false;

function clearBall() {
  ballAnimation?.cancel();
  fetchRun?.cancel();
  clearTimeout(ballTimer);
  catchBallButton.hidden=fallbackBall.hidden=fallbackBallHearts.hidden=true;
  fallbackFetch=false;
}

function showCatchBall() {
  if (page==='home') catchBallButton.hidden=false;
}

function throwFallbackBall() {
  fallbackFetch=true;
  fallbackBall.hidden=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold={transform:'translate(-24px,-14px)'};
  ballAnimation=fallbackBall.animate(reduce ? [hold,hold] : [
    {transform:'translate(62px,34px)'},
    {transform:'translate(10px,-110px)',offset:.13},
    {transform:'translate(-85px,-22px)',offset:.27},
    {transform:'translate(-85px,-22px)',offset:.53},
    hold
  ],{duration:reduce ? 300 : 2400,fill:'forwards'});
  if (!reduce) fetchRun=homeScene.querySelector('.fallback-pet').animate([
    {transform:'translate(-50%,-50%)'},
    {transform:'translate(-50%,-50%)',offset:.2},
    {transform:'translate(calc(-50% - 85px),calc(-50% - 8px))',offset:.53},
    {transform:'translate(-50%,-50%)'}
  ],{duration:2400});
  ballAnimation.onfinish=showCatchBall;
}

catchBallButton.addEventListener('click',() => {
  catchBallButton.hidden=true;
  if (!fallbackFetch) {
    scene?.catchBall();
    return;
  }
  ballAnimation?.cancel();
  fallbackBall.hidden=true;
  fallbackBallHearts.hidden=false;
  ballTimer=setTimeout(() => { fallbackBallHearts.hidden=true; },1500);
});

const rideButton=byId('ride');
function updateRideButton() {
  rideButton.setAttribute('aria-pressed',String(riding));
}
rideButton.addEventListener('click',() => {
  if (!scene) return;
  clearBall();
  riding=scene.setRiding(!riding);
  updateRideButton();
});

async function mountScene(host,profile,preview,delivery=null) {
  const {background}=friendSpace(state?.space);
  const revision=++sceneRevision;
  scene?.dispose();
  scene=null;
  const fallback=host.querySelector('.fallback-pet');
  fallback.hidden=false;
  host.classList.remove('has-webgl');
  fallback.replaceChildren(makeIcon(speciesInfo[profile.species][0]));
  const module=await scenes;
  if (revision!==sceneRevision) return;
  if (!module) {
    if (delivery) deliverGift(delivery);
    return;
  }
  const ownerModel=preview ? null : await module.loadOwnerModel();
  if (revision!==sceneRevision) return;
  const setGraphicsAvailable=available => {
    if (revision!==sceneRevision) return;
    fallback.hidden=available;
    host.classList.toggle('has-webgl',available);
    if (!preview) rideButton.hidden=!available;
  };
  try {
    scene=module.createScene(host,profile,preview ? null : () => play('pet','heart'),{
      preview,perspective,background,ownerModel,ownerColors,onGraphicsChange:setGraphicsAvailable,onBallReady:showCatchBall
    });
    setGraphicsAvailable(true);
    if (!preview && !delivery) scene.play('greet');
  } catch {
    // The rest of the app still works on devices without WebGL.
  }
  if (delivery) deliverGift(delivery);
}

const foodReward=10;
const backgroundChoice=byId('background-choice');
const backgroundStatus=byId('background-status');
const themeShopStatus=byId('theme-shop-status');
const foodReset=byId('food-reset');
const foodRetry=byId('food-retry');
const foodStatus=byId('food-status');
const foodGift=byId('food-gift');
const foodSuccess=byId('food-success');
const foodConfetti=byId('food-confetti');

function celebrateCake() {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const colors=['#ff9cb5','#ffcf63','#8bc9ed','#a8dc92','#c7a6f0'];
    foodConfetti.replaceChildren(...Array.from({length:26},(_,index) => {
      const spark=document.createElement('span');
      const angle=index*Math.PI*2/26;
      const distance=55+(index%5)*13;
      spark.style.setProperty('--x',Math.cos(angle)*distance+'px');
      spark.style.setProperty('--y',Math.sin(angle)*distance+'px');
      spark.style.setProperty('--confetti-color',colors[index%colors.length]);
      spark.style.animationDelay=(index%4)*40+'ms';
      return spark;
    }));
  }
  foodSuccess.hidden=false;
}

function restartFoodGame() {
  rewardPending=false;
  foodRetry.hidden=foodGift.hidden=foodSuccess.hidden=true;
  foodConfetti.replaceChildren();
  foodGame.restart();
}
let rewardPending=false;

let economyBusy=false;

const themeCards=Object.entries(themes).filter(([,theme]) => theme.price>0).map(([id,theme]) => {
  const card=byId('theme-card-template').content.firstElementChild.cloneNode(true);
  const preview=card.querySelector('img');
  preview.src='./app/'+(theme.preview || id+'-preview.webp');
  preview.alt=theme.alt;
  card.querySelector('h2').textContent=theme.name;
  const buy=card.querySelector('button');
  buy.addEventListener('click',() => void changeBackground(id,true));
  byId('theme-grid').append(card);
  const option=new Option(theme.name,id);
  backgroundChoice.add(option);
  return {id,theme,card,buy,option,lock:card.querySelector('.theme-lock'),price:card.querySelector('p')};
});

function renderBalance() {
  const balance=state?.leaves || 0;
  const owned=purchasedThemes(state);
  byId('home-leaf-count').textContent=String(balance);
  byId('theme-shop-balance').textContent='보유 잎사귀 '+balance+'개';
  for (const {id,theme,card,buy,option,lock,price} of themeCards) {
    const unlocked=owned.includes(id);
    card.dataset.locked=String(!unlocked);
    lock.hidden=unlocked;
    price.textContent=unlocked ? '보유 중' : '잎사귀 '+theme.price+'개';
    option.hidden=option.disabled=!unlocked;
    buy.hidden=unlocked;
    buy.disabled=economyBusy || balance<theme.price;
    buy.textContent=balance<theme.price ? '잎사귀가 부족해요' : theme.name+' 구매';
  }
}

async function changeBackground(selected,buy=false) {
  if (economyBusy || themeId(selected)!==selected) return;
  const theme=themes[selected];
  const session=account;
  const friendId=activeFriendId(state);
  economyBusy=true;
  backgroundChoice.disabled=true;
  const status=buy ? themeShopStatus : backgroundStatus;
  status.hidden=true;
  renderBalance();
  try {
    const updated=await updateState(current => {
      const owned=purchasedThemes(current);
      const unlocked=theme.price===0 || owned.includes(selected);
      const price=buy && !unlocked ? theme.price : 0;
      if ((current?.leaves || 0)<price || (!unlocked && !buy)) throw new Error('locked');
      const withSpace=updateFriend(current,friendId,friend => ({
        space:{...friend.space,background:selected}
      }));
      return {...withSpace,unlockedThemes:price ? [...owned,selected] : owned,leaves:(current?.leaves || 0)-price};
    });
    if (account!==session) return;
    state=updated;
    if (buy) {
      status.textContent=theme.name+' 구매를 완료했어요.';
      status.hidden=false;
    }
    if (page==='home' && byId('home').dataset.background!==friendSpace(state.space).background) show('home');
  } catch {
    if (account===session) {
      status.textContent='배경을 저장하지 못했어요. 다시 시도해 주세요.';
      status.hidden=false;
    }
  } finally {
    economyBusy=false;
    backgroundChoice.disabled=false;
    backgroundChoice.value=friendSpace(state?.space).background;
    renderBalance();
  }
}

backgroundChoice.addEventListener('change',() => void changeBackground(backgroundChoice.value));

const foodGame=createFoodGame({
  canvas:byId('food-board'),
  reset:foodReset,
  status:foodStatus,
  upcoming:byId('food-upcoming'),
  onClear() {
    rewardPending=true;
    celebrateCake();
    void awardFoodGame();
  }
});

async function awardFoodGame() {
  if (!rewardPending || economyBusy) return;
  const session=account;
  foodReset.disabled=true;
  foodRetry.hidden=true;
  economyBusy=true;
  foodStatus.textContent='케이크를 완성했어요. 잎사귀를 담는 중이에요.';
  try {
    const updated=await updateState(current => ({
      ...current,leaves:Math.min(999999,(current?.leaves || 0)+foodReward)
    }));
    if (account!==session) return;
    rewardPending=false;
    state=updated;
    foodStatus.textContent='잎사귀 '+foodReward+'개를 받았어요.';
    foodGift.hidden=false;
    if (page==='leaf-game') foodGift.focus();
  } catch {
    if (account===session) {
      foodStatus.textContent='잎사귀를 저장하지 못했어요. 다시 받아 주세요.';
      foodRetry.hidden=false;
    }
  } finally {
    economyBusy=false;
    foodReset.disabled=rewardPending;
    renderBalance();
  }
}

foodRetry.addEventListener('click',() => void awardFoodGame());
foodGift.addEventListener('click',() => {
  restartFoodGame();
  show('home','cake');
});

const music=byId('meadow-music');
const musicToggle=byId('music-toggle');
const musicStatus=byId('music-status');
const musicKey='annyeong-background-music';
let musicEnabled=false, musicAttempt, musicNeedsGesture=false;
try { musicEnabled=localStorage.getItem(musicKey)==='on'; } catch {}
musicToggle.setAttribute('aria-checked',String(musicEnabled));

function startMusic() {
  if (!musicEnabled || !music.paused || musicAttempt) return;
  musicNeedsGesture=false;
  const attempt=music.play();
  musicAttempt=attempt;
  attempt.then(() => {
    if (musicAttempt===attempt) musicStatus.hidden=true;
  },error => {
    if (musicAttempt!==attempt || !musicEnabled) return;
    musicNeedsGesture=error.name==='NotAllowedError';
    if (!musicNeedsGesture && error.name!=='AbortError') {
      musicStatus.textContent='배경음악을 불러오지 못했어요. 껐다가 다시 켜 주세요.';
      musicStatus.hidden=false;
    }
  }).finally(() => {
    if (musicAttempt===attempt) musicAttempt=null;
  });
}

musicToggle.addEventListener('click',() => {
  musicEnabled=!musicEnabled;
  musicToggle.setAttribute('aria-checked',String(musicEnabled));
  musicStatus.hidden=true;
  try { localStorage.setItem(musicKey,musicEnabled ? 'on' : 'off'); } catch {}
  if (musicEnabled) {
    if (music.error) music.load();
    startMusic();
  } else {
    musicAttempt=null;
    musicNeedsGesture=false;
    music.pause();
  }
});

document.addEventListener('click',() => {
  if (musicNeedsGesture) startMusic();
});

const navigationSession=String(Date.now());
let navigationPath=[];
let navigationIndex=0;
let pendingNavigation=null;
let restoringNavigation=false;

function recordNavigation(pageId,delivery=null) {
  if (restoringNavigation) return true;
  if (pendingNavigation) return false;
  const step=pageId==='setup' && !state?.profile ? profileStep : null;
  const matches=entry => entry?.page===pageId && entry.step===step;
  if (matches(navigationPath[navigationIndex])) return true;

  let previous=navigationIndex-1;
  while (previous>=0 && !matches(navigationPath[previous])) previous--;
  if (previous>=0) {
    pendingNavigation={index:previous,delivery};
    history.go(previous-navigationIndex);
    return false;
  }

  if (navigationIndex>0 && pageId==='home' && page==='avatar' && navigationPath[0]?.page==='welcome') {
    pendingNavigation={index:0,next:'home',delivery};
    history.go(-navigationIndex);
    return false;
  }

  const replace=!navigationPath.length || (page==='account' && (pageId==='home' || pageId==='setup'));
  if (!replace) navigationIndex++;
  navigationPath=navigationPath.slice(0,navigationIndex);
  navigationPath.push({page:pageId,step});
  const entry={annyeong:navigationSession,index:navigationIndex};
  if (replace) history.replaceState(entry,'');
  else history.pushState(entry,'');
  return true;
}

window.addEventListener('popstate',event => {
  const entry=event.state;
  if (entry?.annyeong!==navigationSession) return;
  const target=navigationPath[entry.index];
  if (!target) return;
  const transition=pendingNavigation?.index===entry.index ? pendingNavigation : null;
  pendingNavigation=null;
  navigationIndex=entry.index;
  if (transition?.next) {
    show(transition.next,transition.delivery);
    return;
  }
  const delivery=transition?.delivery;
  restoringNavigation=true;
  try {
    if (target.page==='setup' && page==='setup' && target.step!==null) {
      goToProfileStep(target.step);
    } else if (target.page==='setup' && page==='avatar') {
      backFromAvatar(target.step ?? profilePanels.length-1);
    } else if (target.page==='setup' && page!=='account') {
      addingFriend=page==='friends';
      openProfile(target.step);
    } else if (target.page==='avatar') {
      draft ||= page==='setup' ? readProfileForm() : state?.profile;
      if (draft) openAvatar();
    } else {
      if (!state?.profile && target.page!=='welcome' && target.page!=='account' && target.page!=='setup') {
        show('welcome');
        return;
      }
      if (target.page==='account') accountReturnPage=page;
      if (target.page==='home' || target.page==='settings' || target.page==='friends') {
        draft=null;
        addingFriend=false;
      }
      show(target.page,delivery);
    }
  } finally {
    restoringNavigation=false;
  }
});

function show(pageId,delivery=null) {
  if (!recordNavigation(pageId,delivery)) return;
  if (pageId!=='leaf-game') foodGame.pause();
  clearBall();
  page=pageId;
  riding=false;
  rideButton.hidden=true;
  updateRideButton();
  ++sceneRevision;
  scene?.dispose();
  scene=null;
  clearTimeout(replyTimer);
  $('#reply,#interaction,#letter-envelope').prop('hidden',true);
  byId('fallback-cake').setAttribute('hidden','');
  for (const animation of byId('fallback-cake').getAnimations()) animation.cancel();
  for (const animation of byId('letter-envelope').getAnimations()) animation.cancel();
  showError('');
  $('main > section').prop('hidden',true);
  $('#'+pageId).prop('hidden',false);
  document.body.classList.toggle('meadow-open',pageId==='home');
  $('#setup-back').prop('hidden',!state?.profile);
  if (pageId==='friends') renderFriends();
  window.scrollTo(0,0);
  if (pageId==='home') {
    startMusic();
    renderBalance();
    const {background}=friendSpace(state.space);
    byId('home').dataset.background=background;
    byId('home').setAttribute('aria-label',themes[background].name);
    applyPerspective();
    void mountScene(byId('home-scene'),state.profile,false,delivery);
  }
  if (pageId==='photo') {
    $('#photo-status').text('');
    void showDaily();
  }
  if (pageId==='letter-write') {
    byId('letter-title').textContent=state.profile.name+'에게 보내는 편지';
    byId('letter-error').textContent='';
  }
  if (pageId==='letters') {
    byId('letter-form').reset();
    byId('letter-form').querySelector('button').disabled=true;
  }
  if (pageId==='letter-history') void renderLetters();
  if (pageId==='leaf-game') {
    foodGift.textContent=state.profile.name+'에게 주러가기';
    foodGame.resume();
  }
  if (pageId==='account') renderAccount();
  if (pageId==='theme-shop') {
    themeShopStatus.hidden=true;
    renderBalance();
  }
  if (pageId==='settings') {
    renderBalance();
    backgroundChoice.value=friendSpace(state?.space).background;
    backgroundStatus.hidden=true;
    byId('pet-avatar-label').textContent=state.profile.name+' 아바타';
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
    const label=row.querySelector('#pet-avatar-label')?.textContent || '';
    const searchable=(row.dataset.setting+' '+label).toLocaleLowerCase();
    row.hidden=!words.every(word => searchable.includes(word));
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

const profilePanels=[...profileForm.querySelectorAll('[data-profile-step]')];
const profileTitles=['어떤 이야기를 담을까요?','이름을 알려 주세요','어떤 반려동물인가요?','기억하고 싶은 날짜','좋아하는 것과 싫어하는 것'];
let profileStep=0;

function renderProfileStep(focus=false) {
  const wizard=!state?.profile;
  profilePanels.forEach((panel,index) => { panel.hidden=wizard && profileStep!==index; });
  const progress=byId('profile-progress');
  progress.hidden=!wizard;
  progress.textContent=(profileStep+1)+' / '+profilePanels.length;
  byId('profile-previous').hidden=!wizard || profileStep===0;
  byId('profile-next').textContent=wizard && profileStep<profilePanels.length-1 ? '다음' : '저장';
  if (wizard) byId('setup-title').textContent=profileTitles[profileStep];
  byId('setup').classList.toggle('profile-wizard',wizard);
  $('#setup-kicker,#profile-storage-copy,#setup [data-open-account],#profile-story legend').prop('hidden',wizard);
  const story=byId('profile-story');
  if (wizard) story.setAttribute('aria-labelledby','setup-title');
  else story.removeAttribute('aria-labelledby');
  if (focus) {
    byId('setup-title').focus();
    window.scrollTo(0,0);
  }
}

function goToProfileStep(step) {
  profileStep=step;
  if (!recordNavigation('setup')) return;
  byId('setup-error').textContent='';
  renderProfileStep(true);
  void saveOnboarding('setup',readProfileForm());
}

byId('profile-previous').addEventListener('click',() => goToProfileStep(profileStep-1));

function openProfile(step=0) {
  profileStep=Number.isInteger(step) && step>=0 && step<profilePanels.length ? step : 0;
  profileForm.reset();
  $('#profile-storage-copy').text(account
    ? '반려동물 정보는 계정에 저장돼요. 사진은 이 브라우저에만 저장돼요.'
    : '로그인 없이 사용할 수 있어요. 입력한 정보는 이 브라우저에만 저장돼요.');
  $('#setup [data-open-account]').text(account ? '계정' : '로그인 · 회원가입');
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
  renderProfileStep();
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
  const onboarding={step,profile,...(step==='setup' ? {profileStep} : {})};
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
profileForm.elements.name.addEventListener('input',event => event.target.setCustomValidity(''));
$(profileForm).on('input change','input:not([type=radio]):not([type=file]),select',() => {
  if (validateItemCounts() && !state?.profile) void saveOnboarding('setup',readProfileForm());
});

$(profileForm).on('submit',async event => {
  event.preventDefault();
  validateItemCounts();
  const name=profileForm.elements.name;
  name.setCustomValidity(name.value.trim() || !name.value ? '' : '반려동물 이름을 입력해 주세요.');
  const wizard=!state?.profile;
  const finalStep=profilePanels.length-1;
  if (wizard && profileStep<finalStep) {
    const controls=profilePanels[profileStep].querySelectorAll('input,select');
    if ([...controls].every(control => control.reportValidity())) goToProfileStep(profileStep+1);
    return;
  }
  if (wizard) {
    const firstInvalid=profilePanels.findIndex(panel =>
      [...panel.querySelectorAll('input,select')].some(control => !control.validity.valid));
    if (firstInvalid>=0) goToProfileStep(firstInvalid);
  }
  if (!profileForm.reportValidity()) return;
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
function backFromAvatar(step=profilePanels.length-1) {
  draft=avatarProfile();
  if (state?.profile && !addingFriend) {
    draft=null;
    show('settings');
  } else {
    openProfile(step);
    void saveOnboarding('setup',draft);
  }
}
$('#avatar-back').on('click',() => backFromAvatar());

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
      return {...current,profile,space:friendSpace(),photos:current?.photos || current?.onboarding?.photos || [],album:current?.album || [],onboarding:null};
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
  clearBall();
  if (riding && scene) {
    riding=scene.setRiding(false);
    updateRideButton();
  }
  clearTimeout(replyTimer);
  if (action==='ball') {
    byId('reply').hidden=true;
    if (scene && homeScene.classList.contains('has-webgl')) scene.play('ball');
    else throwFallbackBall();
    return;
  }
  if (action==='pet') {
    byId('reply').hidden=true;
    if (scene && homeScene.classList.contains('has-webgl')) {
      scene.play('pet');
      return;
    }
    homeScene.style.setProperty('--owner-x','58%');
    homeScene.style.setProperty('--owner-y','57%');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      replyTimer=setTimeout(() => showPlayReply(action,icon,object),650);
      return;
    }
  }
  scene?.play(action,object);
  showPlayReply(action,icon,object);
}

function showPlayReply(action,icon,object) {
  const reply=$('#reply').empty().append(action==='treat' && object ? objectImage(object) : makeIcon(icon)).attr('aria-label',replyLabels[icon]).prop('hidden',false);
  if (!homeScene.classList.contains('has-webgl') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const effect=action==='disliked' ? 'translate(-125%,-50%) rotate(-12deg)' : 'translate(-50%,-75%)';
    byId('home-scene').querySelector('.fallback-pet').animate([
      {transform:'translate(-50%,-50%)'},{transform:effect},{transform:'translate(-50%,-50%)'}
    ],{duration:550});
  }
  replyTimer=setTimeout(() => reply.prop('hidden',true),2700);
}

const letterForm=byId('letter-form');
const letterBody=byId('letter-body');
const letterSubmit=letterForm.querySelector('button');
const letterReplies=['편지 써줘서 고마워!', '많이많이 사랑해!', '나도 네 생각을 했어!', '마음이 포근해졌어!', '내 마음도 여기 담아 둘게!'];
const letterDate=new Intl.DateTimeFormat('ko-KR',{dateStyle:'long'});

function letterKey() {
  return 'letters:'+(account ? accountKey(account) : 'guest')+':'+activeFriendId(state);
}

letterBody.addEventListener('input',() => {
  letterSubmit.disabled=!letterBody.value.trim();
});

letterForm.addEventListener('submit',async event => {
  event.preventDefault();
  const text=letterBody.value.trim();
  if (letterBody.readOnly || letterSubmit.disabled || !text || text.length>2000) return;
  const key=letterKey();
  const revision=sceneRevision;
  letterSubmit.disabled=true;
  letterBody.readOnly=true;
  byId('letter-error').textContent='';
  try {
    const letter={text,date:Date.now(),reply:random(letterReplies)};
    await writeLocalState(previous => [letter,...(previous || [])],key);
    if (page==='letter-write' && sceneRevision===revision && letterKey()===key) {
      letterForm.reset();
      show('home','letter');
    }
  } catch {
    if (sceneRevision===revision) byId('letter-error').textContent='편지를 저장하지 못했어요. 다시 시도해 주세요.';
  } finally {
    letterBody.readOnly=false;
    letterSubmit.disabled=!letterBody.value.trim();
  }
});

async function renderLetters() {
  const key=letterKey();
  const revision=sceneRevision;
  const list=byId('letter-list');
  const status=byId('letter-history-status');
  list.replaceChildren();
  status.textContent='편지를 불러오는 중이에요.';
  try {
    const letters=await readState(key) || [];
    if (sceneRevision!==revision) return;
    status.textContent=letters.length ? '' : '아직 건넨 편지가 없어요.';
    for (const letter of letters) {
      const card=document.createElement('li');
      const date=document.createElement('time');
      date.dateTime=new Date(letter.date).toISOString();
      date.textContent=letterDate.format(letter.date);
      const text=document.createElement('p');
      text.className='letter-text';
      text.textContent=letter.text;
      const reply=document.createElement('p');
      reply.className='letter-reply';
      reply.textContent=letter.reply;
      card.append(date,text,reply);
      list.append(card);
    }
  } catch {
    if (sceneRevision===revision) status.textContent='편지를 불러오지 못했어요.';
  }
}

function deliverGift(kind) {
  if (kind==='letter') {
    deliverLetter();
    return;
  }
  if (scene) {
    scene.play('treat','cake');
    return;
  }
  const cake=byId('fallback-cake');
  cake.removeAttribute('hidden');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) homeScene.querySelector('.fallback-pet').animate([
    {transform:'translate(-50%,-50%)'},
    {transform:'translate(-39%,-42%) rotate(8deg)'},
    {transform:'translate(-50%,-50%)'}
  ],{duration:320,iterations:3});
  const eating=cake.animate(reduced ? [{opacity:1},{opacity:1}] : [
    {transform:'scale(1)'},{transform:'scale(1)',offset:.62},{transform:'scale(.1)',opacity:0}
  ],{duration:1000});
  eating.onfinish=() => {
    cake.setAttribute('hidden','');
    showPlayReply('pet','heart');
  };
}

function deliverLetter() {
  if (scene) {
    scene.play('letter');
    return;
  }
  const envelope=byId('letter-envelope');
  envelope.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flight=envelope.animate(reduced ? [{opacity:1},{opacity:1}] : [
    {transform:'translate(95px,55px) rotate(-15deg)'},
    {transform:'translate(45px,-45px) rotate(10deg)',offset:.45},
    {transform:'translate(0,0) rotate(-7deg)'}
  ],{duration:1250,easing:'ease-out'});
  flight.onfinish=() => {
    envelope.hidden=true;
    if (!reduced) homeScene.querySelector('.fallback-pet').animate([
      {transform:'translate(-50%,-50%)'},{transform:'translate(-50%,-90%)'},{transform:'translate(-50%,-50%)'}
    ],{duration:400,iterations:3});
  };
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
  play(this.dataset.action,'heart');
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

const accountForm=byId('account-form');

function setAccountMode(mode) {
  accountMode=mode;
  const registering=mode==='register';
  $('#account-name-field,#password-help,#account-import-note').prop('hidden',!registering);
  accountForm.elements.name.disabled=!registering;
  accountForm.elements.name.required=registering;
  const password=accountForm.elements.password;
  password.autocomplete=registering ? 'new-password' : 'current-password';
  password.minLength=registering ? 8 : 1;
  $('#account-submit').text(registering ? '회원가입' : '로그인');
  $('[data-auth-mode]').each(function () {
    this.setAttribute('aria-pressed',String(this.dataset.authMode===mode));
  });
  $('#account-error').text('');
}

function renderAccount() {
  $('#account-signed-in').prop('hidden',!account);
  $('#account-signed-out').prop('hidden',Boolean(account));
  $('#account-name').text(account?.user.name || '');
  $('#account-email').text(account?.user.email || '');
  accountForm.reset();
  setAccountMode('login');
}

function accountError(error) {
  const messages={
    not_configured:'운영 서버에 DB 연결 설정이 준비되면 이용할 수 있어요.',
    unavailable:'계정 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
    email_used:'이미 가입된 이메일이에요. 로그인해 주세요.',
    incorrect_login:'이메일 또는 암호를 다시 확인해 주세요.',
    invalid_credentials:'이메일을 확인하고 암호는 72바이트 이하로 입력해 주세요.',
    invalid_name:'이름을 확인해 주세요.',
    invalid_password:'암호를 8자 이상 입력해 주세요.',
    invalid_settings:'반려동물 설정을 복사하지 못했어요. 정보를 확인해 주세요.',
    rate_limited:'시도가 너무 많아요. 잠시 후 다시 시도해 주세요.',
    already_signed_in:'다른 탭에서 이미 로그인했어요. 새로고침해 주세요.',
    csrf:'계정 상태가 바뀌었어요. 다시 시도해 주세요.'
  };
  $('#account-error').text(messages[error.message] || messages.unavailable);
}

function enterSpace() {
  restartFoodGame();
  addingFriend=false;
  const saved=state?.onboarding;
  draft=saved?.profile || null;
  if (state?.profile) {
    show('home');
    return;
  }
  const step=saved?.step==='avatar' ? profilePanels.length-1 : saved?.profileStep;
  openProfile(step);
  byId('setup-title').focus();
}

$(document).on('click','[data-open-account]',() => {
  if (page==='welcome' && account) {
    enterSpace();
    return;
  }
  accountReturnPage=page;
  show('account');
});
$('#account-back').on('click',() => show(accountReturnPage));
$('[data-auth-mode]').on('click',function () {
  accountForm.elements.password.value='';
  setAccountMode(this.dataset.authMode);
});

async function runAccountAction(operation) {
  const controls=$('#account button, #account input').not(':disabled').prop('disabled',true);
  $('#account-error').text('');
  try {
    await writes;
    await operation();
  } catch (error) {
    accountError(error);
  } finally {
    controls.prop('disabled',false);
  }
}

accountForm.addEventListener('submit',event => {
  event.preventDefault();
  const fields=Object.fromEntries(new FormData(accountForm));
  const action=accountMode;
  void runAccountAction(async () => {
    const guestSeed=action==='register' ? state : undefined;
    if (action==='register') fields.settings=accountSettings({...state,perspective,ownerColors});
    try {
      const session=await changeAccount(action,fields);
      await enterAccount(session,guestSeed);
      enterSpace();
    } finally {
      accountForm.elements.password.value='';
    }
  });
});
$('#account-logout').on('click',function () {
  void runAccountAction(async () => {
    await changeAccount('logout');
    account=null;
    restartFoodGame();
    state=await restoreGuest(await readState());
    applyPreferences(guestPreferences());
    show('welcome');
  });
});

byId('start-welcome').addEventListener('click',enterSpace);

try {
  const [guest,session]=await Promise.all([readState(),readAccount().catch(() => null)]);
  state=await restoreGuest(guest);
  applyPreferences(guestPreferences());
  if (session?.user) await enterAccount(session);
  show('welcome');
} catch {
  showError('이 기기의 저장 공간을 열 수 없어요. 일반 브라우저 창에서 다시 열어 주세요.');
} finally {
  await launchDelay;
  byId('launch').hidden=true;
  byId('app').hidden=false;
}
