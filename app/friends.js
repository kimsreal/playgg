export const activeFriendId = state => state.friendId || 'first';

export function friendSpace(space,legacyBackground) {
  const background=space?.background ?? legacyBackground;
  return {...space,background:background==='coast' ? 'coast' : 'meadow'};
}

export function migrateFriendSpaces(state,legacyBackground=state?.background) {
  if (!state?.profile) return state;
  const {background,...saved}=state;
  return {
    ...saved,
    coastUnlocked:state.coastUnlocked===true || legacyBackground==='coast',
    space:friendSpace(state.space,legacyBackground),
    friends:(state.friends || []).map(friend => ({...friend,space:friendSpace(friend.space,legacyBackground)}))
  };
}

function activeFriend(state) {
  return {
    id:activeFriendId(state),
    profile:state.profile,
    space:friendSpace(state.space,state.background),
    photos:state.photos || [],
    album:state.album || [],
    daily:state.daily || null
  };
}

export function listFriends(state) {
  return [activeFriend(state),...state.friends || []];
}

function selectFriend(state,friend,friends) {
  return {
    ...state,friendId:friend.id,profile:friend.profile,space:friendSpace(friend.space,state.background),photos:friend.photos,
    album:friend.album,daily:friend.daily,friends,onboarding:null
  };
}

export function switchFriend(state,id) {
  if (id===activeFriendId(state)) return state;
  const friends=listFriends(state);
  const friend=friends.find(candidate => candidate.id===id);
  return friend ? selectFriend(state,friend,friends.filter(candidate => candidate.id!==id)) : state;
}

export function addFriend(state,id,profile) {
  const friend={id,profile,space:friendSpace(),photos:[],album:[],daily:null};
  return selectFriend(state,friend,listFriends(state));
}

export function updateFriend(state,id,update) {
  if (id===activeFriendId(state)) return {...state,...update(activeFriend(state))};
  return {
    ...state,
    friends:(state.friends || []).map(friend => friend.id===id ? {...friend,...update(friend)} : friend)
  };
}
