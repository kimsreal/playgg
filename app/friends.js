export const activeFriendId = state => state.friendId || 'first';

function activeFriend(state) {
  return {
    id:activeFriendId(state),
    profile:state.profile,
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
    ...state,friendId:friend.id,profile:friend.profile,photos:friend.photos,
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
  const friend={id,profile,photos:[],album:[],daily:null};
  return selectFriend(state,friend,listFriends(state));
}

export function updateFriend(state,id,update) {
  if (id===activeFriendId(state)) return {...state,...update(activeFriend(state))};
  return {
    ...state,
    friends:(state.friends || []).map(friend => friend.id===id ? {...friend,...update(friend)} : friend)
  };
}
