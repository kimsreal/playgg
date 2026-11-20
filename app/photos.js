let connection;

function database() {
  if (!connection) {
    connection = new Promise((resolve,reject) => {
      const request=indexedDB.open('annyeong',1);
      request.onupgradeneeded=() => request.result.createObjectStore('app');
      request.onsuccess=() => resolve(request.result);
      request.onerror=() => reject(request.error);
      request.onblocked=() => reject(new Error('Database blocked'));
    });
  }
  return connection;
}

export async function readState() {
  const db=await database();
  return new Promise((resolve,reject) => {
    const request=db.transaction('app').objectStore('app').get('state');
    request.onsuccess=() => resolve(request.result);
    request.onerror=() => reject(request.error);
  });
}

export async function updateState(update) {
  const db=await database();
  return new Promise((resolve,reject) => {
    const transaction=db.transaction('app','readwrite');
    const store=transaction.objectStore('app');
    const read=store.get('state');
    let result;
    let error;
    read.onsuccess=() => {
      try {
        result=update(read.result);
        store.put(result,'state');
      } catch (problem) {
        error=problem;
        transaction.abort();
      }
    };
    transaction.oncomplete=() => resolve(result);
    transaction.onabort=() => reject(error || transaction.error);
  });
}

async function loadImage(file) {
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.src=url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function preparePhotos(files) {
  const photos=new Map();
  let skipped=0;
  for (const file of files) {
    try {
      const image=await loadImage(file);
      const scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext('2d');
      context.fillStyle='#fffdf5';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.81));
      if (!blob) throw new Error('Photo encoding failed');
      const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
      const id=Array.from(new Uint8Array(digest),byte => byte.toString(16).padStart(2,'0')).join('');
      photos.set(id,{id,blob});
    } catch {
      skipped++;
    }
  }
  return {photos:[...photos.values()],skipped};
}

const pick = values => values[Math.floor(Math.random()*values.length)];

export function chooseDaily(state,day,titles) {
  const source=state.album?.length ? state.album : state.photos || [];
  if (!source.length) return state.daily ? {...state,daily:null} : state;
  if (state.daily?.day===day && state.daily.photo) return state;
  const recent=state.daily?.recent || [];
  const available=source.filter(photo => !recent.includes(photo.id));
  const oldest=recent.find(id => source.some(photo => photo.id===id));
  const photo=available.length ? pick(available) : source.find(photo => photo.id===oldest) || pick(source);
  return {
    ...state,
    daily:{
      day,photo,title:pick(titles),
      recent:[...recent.filter(id => id!==photo.id),photo.id].slice(-Math.min(30,source.length))
    }
  };
}
