import {ownerColors} from './owner-colors.js';
import {friendSpace,listFriends} from './friends.js?v=79';

let csrf;

async function request(body) {
  const controller=new AbortController();
  const deadline=setTimeout(() => controller.abort(),body ? 12000 : 3500);
  try {
    const response=await fetch('./api/account.php',{
      method:body ? 'POST' : 'GET',
      credentials:'same-origin',
      cache:'no-store',
      signal:controller.signal,
      headers:body ? {'Content-Type':'application/json','X-Annyeong-CSRF':csrf} : undefined,
      body:body ? JSON.stringify(body) : undefined
    });
    const result=await response.json();
    if (!response.ok) throw new Error(result.error || 'unavailable');
    if (result.csrf) csrf=result.csrf;
    return result;
  } finally {
    clearTimeout(deadline);
  }
}

export const readAccount=() => request();

export async function changeAccount(action,fields={}) {
  await readAccount();
  return request({action,...fields});
}

export function saveAccount(account,settings) {
  return request({action:'save',userId:account.user.id,revision:account.revision,settings});
}

export function accountSettings(state) {
  const friends=state?.profile ? listFriends(state) : [];
  return {
    active:friends[0]?.id || null,
    friends:friends.map(({id,profile,space}) => ({id,profile,space:friendSpace(space,state?.background)})).sort((a,b) => a.id.localeCompare(b.id)),
    background:friendSpace(state?.space,state?.background).background,
    coastUnlocked:state?.coastUnlocked===true || state?.background==='coast' || friends.some(friend => friend.space?.background==='coast'),
    leaves:state?.leaves || 0,
    perspective:state?.perspective || 'third',
    ownerColors:ownerColors(state?.ownerColors)
  };
}

export function mergeAccount(settings,local) {
  const previous=local?.profile ? new Map(listFriends(local).map(friend => [friend.id,friend])) : new Map();
  const friends=settings.friends.map(({id,profile,space}) => ({
    id,profile,space:friendSpace(space,settings.background),
    photos:previous.get(id)?.photos || [],
    album:previous.get(id)?.album || [],
    daily:previous.get(id)?.daily || null
  }));
  const active=friends.find(friend => friend.id===settings.active);
  const preferences={
    coastUnlocked:settings.coastUnlocked===true || settings.background==='coast' || friends.some(friend => friend.space.background==='coast'),leaves:settings.leaves || 0,perspective:settings.perspective,ownerColors:ownerColors(settings.ownerColors),welcomed:true};
  if (!active) return {...preferences,onboarding:local?.onboarding || null};
  return {
    ...preferences,friendId:active.id,profile:active.profile,space:active.space,photos:active.photos,album:active.album,
    daily:active.daily,friends:friends.filter(friend => friend.id!==active.id)
  };
}
