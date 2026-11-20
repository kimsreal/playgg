import { phrases, photoTitles } from './data.js';
import { readState, updateState, preparePhotos, extractColors, chooseDaily } from './photos.js';

const $=window.jQuery;
const byId=id => document.getElementById(id);
const launchDelay=new Promise(resolve => setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750));
const profileForm=byId('profile-form');
const avatarForm=byId('avatar-form');
const defaults={size:'medium',ears:'folded',tail:'long',fur:'#e8c198',pattern:'solid'};
const glyphs={dog:'🐶',cat:'🐱'};
const random=values => values[Math.floor(Math.random()*values.length)];
const dayKey=(date=new Date()) => [date.getFullYear(),date.getMonth()+1,date.getDate()].map(value => String(value).padStart(2,'0')).join('-');
const civilDate=key => Date.parse(key+'T00:00:00Z');
const tags=value => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
const scenes=import('./scene.js?v=4').catch(() => null);
let state, draft, palette=[], pendingPhotos=[];
let page, scene, sceneRevision=0, replyTimer, photoUrl, installPrompt, modeDates={};
let renderedDay, currentPhotosTask;

function showError(message) {
  $('#app-error').text(message).prop('hidden',!message);
}

async function mountScene(host,profile,preview) {
  const revision=++sceneRevision;
  scene?.dispose();
  scene=null;
  const fallback=host.querySelector('.fallback-pet');
  fallback.hidden=false;
  host.classList.remove('has-webgl');
  fallback.textContent=glyphs[profile.species];
  const module=await scenes;
  if (revision!==sceneRevision || !module) return;
  try {
    scene=module.createScene(host,profile,preview ? null : () => play('pet','💕'),{preview});
    fallback.hidden=true;
    host.classList.add('has-webgl');
    if (!preview) scene.play('greet');
  } catch {
    // The rest of the app still works on devices without WebGL.
  }
}

function show(pageId) {
  page=pageId;
  ++sceneRevision;
  scene?.dispose();
  scene=null;
  clearTimeout(replyTimer);
  $('#reply,#interaction').prop('hidden',true);
  showError('');
  $('main > section').prop('hidden',true);
  $('#'+pageId).prop('hidden',false);
  document.body.classList.toggle('meadow-open',pageId==='home');
  $('#setup .return-home').prop('hidden',!state?.profile);
  window.scrollTo(0,0);
  if (pageId==='home') {
    renderHome();
    void mountScene(byId('home-scene'),state.profile,false);
  }
  if (pageId==='photo') void showDaily();
  if (pageId==='settings') {
    $('#album-status').text(state.album.length ? '선택한 앨범 사진 '+state.album.length+'장' : '처음 등록한 사진을 사용하고 있어요.');
    $('#clear-album').prop('hidden',!state.album.length);
  }
}

function renderHome() {
  const {profile}=state;
  const today=dayKey();
  renderedDay=today;
  $('#greeting').text('안녕, '+profile.name+'!');
  const remaining=Math.round((civilDate(profile.dates.away)-civilDate(today))/86400000);
  let message='오늘도 여기서 함께 쉬어요.';
  if (profile.mode==='away') {
    message=remaining>0 ? '다시 만나기까지 D-'+remaining : remaining===0 ? '오늘은 다시 만나는 날이에요.' : '오늘도 함께 쉬어 가요.';
  }
  $('#mode-copy').text(message);
  const birthday=today.slice(5)===profile.birthday.slice(5);
  const memorial=profile.mode==='memory' && today.slice(5)===profile.dates.memory.slice(5);
  const notices=[];
  if (birthday) notices.push(profile.name+'의 생일이에요. 오늘도 따뜻한 마음을 전해요.');
  if (memorial) notices.push(profile.name+'와 함께한 시간을 조용히 떠올려 봐요.');
  $('#occasion').text(notices.join(' ')).prop('hidden',notices.length===0);
}

function openProfile() {
  profileForm.reset();
  const profile=draft || state?.profile;
  modeDates={...profile?.dates};
  $('#pet-photos').val('');
  $('#onboarding-photos').prop('hidden',Boolean(state?.profile));
  $('#setup-error').text('');
  if (profile) {
    for (const key of ['name','species','birthday','mode']) profileForm.elements[key].value=profile[key];
    profileForm.elements.likes.value=profile.likes.join(', ');
    profileForm.elements.dislikes.value=profile.dislikes.join(', ');
    profileForm.elements.event.value=modeDates[profile.mode] || '';
  }
  profileForm.dataset.mode=profileForm.elements.mode.value;
  refreshModeLabel();
  renderPhotoCount();
  show('setup');
}

function refreshModeLabel() {
  const mode=profileForm.elements.mode.value;
  $('#event-label').text(mode==='memory' ? '기일' : mode==='away' ? '다시 만날 날짜' : '기일 또는 다시 만날 날짜');
  profileForm.elements.event.max=mode==='memory' ? dayKey() : '';
}

function readProfileForm() {
  const fields=Object.fromEntries(new FormData(profileForm));
  return {
    ...defaults,...state?.profile,...draft,
    name:fields.name.trim(),species:fields.species,mode:fields.mode || '',
    birthday:fields.birthday,dates:fields.mode ? {...modeDates,[fields.mode]:fields.event} : {...modeDates},
    likes:tags(fields.likes),dislikes:tags(fields.dislikes)
  };
}

function saveOnboarding(step,profile) {
  if (state?.profile) return Promise.resolve();
  const onboarding={step,profile,photos:pendingPhotos,palette};
  const errorId=step==='avatar' ? 'avatar-error' : 'setup-error';
  return updateState(current => current?.profile ? current : {...current,onboarding}).catch(() => {
    $('#'+errorId).text('입력한 내용을 이 브라우저에 저장하지 못했어요.');
  });
}

function renderPhotoCount() {
  $('#photo-count').text(!state?.profile && pendingPhotos.length ? '선택한 사진 '+pendingPhotos.length+'장' : '');
}

$(profileForm).on('change','[name=mode]',event => {
  const previous=profileForm.dataset.mode;
  if (previous) modeDates[previous]=profileForm.elements.event.value;
  profileForm.dataset.mode=event.target.value;
  profileForm.elements.event.value=modeDates[event.target.value] || '';
  refreshModeLabel();
  if (!state?.profile) void saveOnboarding('setup',readProfileForm());
});
$(profileForm).on('input change','input:not([type=radio]):not([type=file]),select',() => {
  if (!state?.profile) void saveOnboarding('setup',readProfileForm());
});

$('#pet-photos').on('change', function () {
  const files=Array.from(this.files);
  this.value='';
  if (!files.length) return;
  this.disabled=true;
  const button=profileForm.querySelector('[type=submit]');
  button.disabled=true;
  $('#photo-count').text('사진을 준비하고 있어요…');
  const input=this;
  currentPhotosTask=preparePhotos(files).then(async ({photos,skipped}) => {
    pendingPhotos=[...new Map([...pendingPhotos,...photos].map(photo => [photo.id,photo])).values()];
    if (photos.length) palette=[];
    renderPhotoCount();
    $('#setup-error').text(skipped ? '일부 사진을 열 수 없어요. 필요하면 JPEG 또는 PNG 사진을 더 골라 주세요.' : '');
    await saveOnboarding('setup',readProfileForm());
  }).finally(() => {
    input.disabled=false;
    button.disabled=false;
  });
});

$(profileForm).on('submit',async event => {
  event.preventDefault();
  await currentPhotosTask;
  const fields=Object.fromEntries(new FormData(profileForm));
  if (!fields.name.trim()) {
    $('#setup-error').text('반려동물 이름을 입력해 주세요.');
    return;
  }
  if (!state?.profile && pendingPhotos.length<5) {
    $('#setup-error').text('서로 다른 사진을 5장 이상 골라 주세요.');
    return;
  }
  draft=readProfileForm();
  if (state?.profile) {
    try {
      state=await updateState(current => ({...current,profile:draft}));
      draft=null;
      show('home');
    } catch {
      $('#setup-error').text('정보를 저장하지 못했어요. 다시 시도해 주세요.');
    }
  } else {
    const submit=profileForm.querySelector('[type=submit]');
    try {
      submit.disabled=true;
      if (!palette.length) {
        palette=await extractColors(pendingPhotos);
        draft.fur=palette[0] || defaults.fur;
      }
      openAvatar();
      await saveOnboarding('avatar',draft);
    } catch {
      $('#setup-error').text('사진의 색을 읽지 못했어요. 다시 시도해 주세요.');
    } finally {
      submit.disabled=false;
    }
  }
});

function avatarProfile() {
  return {...draft,...Object.fromEntries(new FormData(avatarForm))};
}

function openAvatar() {
  $('#avatar-title').text(draft.name+'의 모습');
  $('#avatar-error').text('');
  for (const key of Object.keys(defaults)) avatarForm.elements[key].value=draft[key];
  const colors=$('#colors').empty();
  palette.forEach((color,index) => {
    $('<button>',{type:'button',class:'swatch','aria-label':'털색 후보 '+(index+1),'aria-pressed':String(draft.fur===color)})
      .css('background-color',color).on('click',() => {
        avatarForm.elements.fur.value=color;
        $(avatarForm).trigger('change');
      }).appendTo(colors);
  });
  show('avatar');
  void mountScene(byId('avatar-scene'),avatarProfile(),true);
}

$(avatarForm).on('change',() => {
  const profile=avatarProfile();
  $('#colors .swatch').each(function (index) {
    this.setAttribute('aria-pressed',String(palette[index]===profile.fur));
  });
  void mountScene(byId('avatar-scene'),profile,true);
  void saveOnboarding('avatar',profile);
});
$('#avatar-back').on('click',() => {
  draft=avatarProfile();
  if (state?.profile) {
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
  const submit=avatarForm.querySelector('[type=submit]');
  submit.disabled=true;
  try {
    state=await updateState(current => ({
      ...current,profile,photos:current?.photos || pendingPhotos,album:current?.album || [],palette,onboarding:null
    }));
    draft=null;
    pendingPhotos=[];
    show('home');
  } catch {
    $('#avatar-error').text('기기에 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.');
  } finally {
    submit.disabled=false;
  }
});

function play(action,icon,label=icon) {
  scene?.play(action);
  clearTimeout(replyTimer);
  const reply=$('#reply').text(icon).attr('aria-label',label).prop('hidden',false);
  if (!scene && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const effect=action==='disliked' ? 'translate(-65%,-50%) rotate(-12deg)' : 'translate(-50%,-75%)';
    byId('home-scene').querySelector('.fallback-pet').animate([
      {transform:'translate(-50%,-50%)'},{transform:effect},{transform:'translate(-50%,-50%)'}
    ],{duration:550});
  }
  replyTimer=setTimeout(() => reply.prop('hidden',true),2700);
}

function interaction(panel) {
  const container=$('#interaction-options').empty();
  const add=(label,action,reply) => {
    $('<button>',{type:'button',text:label}).on('click',() => {
      $('#interaction').prop('hidden',true);
      play(action,Array.isArray(reply) ? random(reply) : reply);
    }).appendTo(container);
  };
  if (panel==='talk') {
    $('#interaction-title').text(state.profile.name+'에게 말 걸기');
    phrases.forEach(([label,icons,action]) => add(label,action,icons));
  } else if (panel==='treats') {
    $('#interaction-title').text('간식 고르기');
    add('🍖 고기 간식','treat','🍖');
    add('🐟 생선 간식','treat','🐟');
  } else {
    $('#interaction-title').text('아이템 놓기');
    for (const like of state.profile.likes) add('♡ '+like,'liked','✨');
    for (const dislike of state.profile.dislikes) add('↪ '+dislike,'disliked','🙃');
    if (!container.children().length) $('<p>').text('설정에서 좋아하는 것과 싫어하는 것을 추가할 수 있어요.').appendTo(container);
  }
  $('#interaction').prop('hidden',false);
}

async function showDaily() {
  const day=dayKey();
  try {
    state=await updateState(current => chooseDaily(current,day,photoTitles));
    if (page!=='photo') return;
    renderedDay=day;
    const {daily,profile}=state;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl=URL.createObjectURL(daily.photo.blob);
    $('#photo-title').text(daily.title.replaceAll('{이름}',() => profile.name));
    $('#daily-image').attr({src:photoUrl,alt:profile.name+'의 오늘 사진'});
  } catch {
    if (page==='photo') showError('오늘의 사진을 불러오지 못했어요.');
  }
}

$('#album-photos').on('change',async function () {
  const files=Array.from(this.files);
  this.value='';
  if (!files.length) return;
  this.disabled=true;
  $('#clear-album').prop('disabled',true);
  $('#album-status').text('사진을 준비하고 있어요…');
  try {
    const {photos,skipped}=await preparePhotos(files);
    if (!photos.length) {
      $('#album-status').text('사진을 열 수 없어요. JPEG 또는 PNG 사진을 골라 주세요.');
      return;
    }
    state=await updateState(current => ({...current,album:photos}));
    $('#album-status').text('앨범 사진 '+photos.length+'장 저장했어요.'+(skipped ? ' 일부 사진은 열 수 없었어요.' : ''));
    $('#clear-album').prop('hidden',false);
  } catch {
    $('#album-status').text('사진을 기기에 저장하지 못했어요. 다시 시도해 주세요.');
  } finally {
    this.disabled=false;
    $('#clear-album').prop('disabled',false);
  }
});

$('#clear-album').on('click',async () => {
  try {
    state=await updateState(current => ({...current,album:[]}));
    $('#album-status').text('오늘의 카드는 그대로 두고 다음 카드부터 처음 등록한 사진을 사용해요.');
    $('#clear-album').prop('hidden',true);
  } catch {
    $('#album-status').text('설정을 저장하지 못했어요. 다시 시도해 주세요.');
  }
});

$(document).on('click','button[data-page]',function () {
  if (!state?.profile) return;
  draft=null;
  show(this.dataset.page);
});
$(document).on('click','button[data-panel]',function () { interaction(this.dataset.panel); });
$('#close-interaction').on('click',() => $('#interaction').prop('hidden',true));
$(document).on('click','button[data-action]',function () {
  play(this.dataset.action,this.dataset.action==='ball' ? '⚽' : '💕');
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
  if (page==='home') renderHome();
  if (page==='photo') void showDaily();
}
document.addEventListener('visibilitychange',checkDay);
setInterval(checkDay,60000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

try {
  state=await readState();
  if (state?.profile) {
    palette=state.palette || [];
    show('home');
  } else if (state?.onboarding) {
    const saved=state.onboarding;
    draft=saved.profile;
    palette=saved.palette;
    pendingPhotos=saved.photos;
    if (saved.step==='avatar') openAvatar();
    else openProfile();
  } else openProfile();
} catch {
  showError('이 기기의 저장 공간을 열 수 없어요. 일반 브라우저 창에서 다시 열어 주세요.');
} finally {
  await launchDelay;
  byId('launch').hidden=true;
  byId('app').hidden=false;
}
