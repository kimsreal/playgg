const size=7;
const pets=[
  ['dog','강아지'],['cat','고양이'],['hamster','햄스터'],
  ['parrot','앵무새'],['lizard','도마뱀']
];
const randomPet=()=>Math.floor(Math.random()*pets.length);

function matches(board) {
  const matched=new Set();
  for (const direction of [1,size]) {
    const stepLimit=direction===1 ? i=>i%size : i=>Math.floor(i/size);
    for (let i=0;i<board.length;i++) {
      if (stepLimit(i)>size-3) continue;
      if (board[i]===board[i+direction] && board[i]===board[i+direction*2]) {
        for (let j=0;j<3;j++) matched.add(i+j*direction);
      }
    }
  }
  return matched;
}

function swap(board,a,b) {
  const copy=board.slice();
  [copy[a],copy[b]]=[copy[b],copy[a]];
  return copy;
}

function hasMove(board) {
  return board.some((_,i)=>
    (i%size<size-1 && matches(swap(board,i,i+1)).size) ||
    (i<board.length-size && matches(swap(board,i,i+size)).size));
}

function newBoard() {
  let board;
  do {
    board=[];
    for (let i=0;i<size*size;i++) {
      let pet;
      do { pet=randomPet(); }
      while ((i%size>=2 && board[i-1]===pet && board[i-2]===pet) ||
        (i>=size*2 && board[i-size]===pet && board[i-size*2]===pet));
      board.push(pet);
    }
  } while (!hasMove(board));
  return board;
}

function collapse(board,matched) {
  const result=board.slice();
  const falls=[];
  for (let column=0;column<size;column++) {
    let write=size-1;
    for (let row=size-1;row>=0;row--) {
      const index=row*size+column;
      if (matched.has(index)) continue;
      const destination=write*size+column;
      result[destination]=board[index];
      if (write!==row) falls.push([destination,write-row]);
      write--;
    }
    const newRows=write+1;
    while (write>=0) {
      const destination=write--*size+column;
      result[destination]=randomPet();
      falls.push([destination,newRows]);
    }
  }
  return {board:result,falls};
}

export function createPetMatch({section,remaining,reserve,award,pending,claim,onClaim}) {
  const get=id=>section.querySelector('#'+id);
  const grid=get('pet-match-board');
  const start=get('pet-match-start');
  const status=get('pet-match-status');
  const scoreLabel=get('pet-match-score');
  const clock=get('pet-match-time');
  const collect=get('pet-match-claim');
  let resultTimer,phase='ready';
  let board=[],selected=-1,score=0,deadline=0,timer,busy=false;
  let pointer=null,ignoreClick=false;
  const tiles=Array.from({length:size*size},(_,i)=>{
    const button=document.createElement('button');
    button.type='button';
    button.dataset.tile=i;
    button.append(document.createElement('img'));
    button.firstChild.alt='';
    button.firstChild.draggable=false;
    grid.append(button);
    return button;
  });

  function showAvailability() {
    const count=remaining();
    get('pet-match-remaining').textContent='오늘 '+count+'판 남았어요';
    start.disabled=busy || Boolean(deadline) || count===0 || Boolean(pending());
  }

  function setPhase(next) {
    phase=next;
    section.dataset.phase=next;
    get('pet-match-ready').hidden=next!=='ready';
    section.querySelector('.pet-match-stats').hidden=next!=='playing';
    get('pet-match-over').hidden=next!=='over';
    get('pet-match-result').hidden=next!=='result';
    render();
  }

  function showResult(focus=false) {
    clearTimeout(resultTimer);
    get('pet-match-total').textContent=pending()+'개 획득!';
    collect.disabled=busy;
    setPhase('result');
    if (focus && !section.hidden) collect.focus();
  }

  function finish(expired) {
    if (!deadline) return;
    deadline=0;
    clearInterval(timer);
    clock.textContent='0:00';
    selected=-1;
    clearDrag();
    if (!expired) {
      setPhase('ready');
      return;
    }
    setPhase('over');
    resultTimer=setTimeout(()=>showResult(true),reducedMotion.matches ? 0 : 950);
  }

  function tick() {
    if (!deadline) return;
    const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    clock.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    if (!seconds) finish(true);
  }

  function render() {
    grid.hidden=!board.length || phase!=='playing';
    tiles.forEach((tile,i)=>{
      const pet=pets[board[i]];
      if (!pet) return;
      const [id,name]=pet;
      const image=tile.firstChild;
      const src='./app/welcome-pets/'+id+'.webp';
      if (image.getAttribute('src')!==src) image.src=src;
      tile.dataset.pet=id;
      tile.setAttribute('aria-label',name+' '+(Math.floor(i/size)+1)+'행 '+(i%size+1)+'열');
      tile.setAttribute('aria-pressed',String(i===selected));
      tile.disabled=!deadline;
    });
    scoreLabel.textContent=score;
  }

  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const sprite=i=>tiles[i].firstChild;
  const shifted=(x,y)=>`translate(${x}px,${y}px)`;

  function animate(element,frames,duration) {
    if (reducedMotion.matches || section.hidden) return Promise.resolve();
    return element.animate(frames,{duration,easing:'ease-out'}).finished.catch(()=>{});
  }

  async function slide(a,b,progress=0,reverse=false) {
    const x=tiles[b].offsetLeft-tiles[a].offsetLeft;
    const y=tiles[b].offsetTop-tiles[a].offsetTop;
    const end=reverse ? 0 : 1;
    tiles[a].dataset.moving='true';
    tiles[b].dataset.moving='true';
    try {
      await Promise.all([[a,1],[b,-1]].map(([index,direction])=>animate(sprite(index),[
        {transform:shifted(x*progress*direction,y*progress*direction)},
        {transform:shifted(x*end*direction,y*end*direction)}
      ],reverse ? 145 : 155)));
    } finally {
      delete tiles[a].dataset.moving;
      delete tiles[b].dataset.moving;
    }
  }

  async function breakTiles(cleared) {
    if (reducedMotion.matches || section.hidden) return;
    await Promise.all([...cleared].map(async index=>{
      const burst=document.createElement('span');
      burst.className='pet-match-burst';
      burst.setAttribute('aria-hidden','true');
      tiles[index].append(burst);
      try {
        await Promise.all([
          animate(sprite(index),[
            {transform:'scale(1)',opacity:1},
            {transform:'scale(1.18) rotate(-8deg)',opacity:1,offset:.32},
            {transform:'scale(.26) rotate(12deg)',opacity:0}
          ],240),
          animate(burst,[{scale:'.25',opacity:0},{scale:'1',opacity:1,offset:.38},{scale:'1.45',opacity:0}],240)
        ]);
      } finally {
        burst.remove();
      }
    }));
  }

  async function move(a,b,progress=0) {
    tick();
    if (!deadline || busy) return;
    const original=board;
    const next=swap(board,a,b);
    const waves=[];
    let settled=next;
    let cleared=matches(next);
    while (cleared.size) {
      const drop=collapse(settled,cleared);
      waves.push({cleared,...drop});
      settled=drop.board;
      cleared=matches(settled);
    }
    const reshuffled=waves.length>0 && !hasMove(settled);
    const final=reshuffled ? newBoard() : settled;
    busy=true;
    selected=-1;
    render();
    try {
      await slide(a,b,progress);
      if (!waves.length) {
        await slide(a,b,1,true);
        if (deadline) status.textContent='같은 동물을 가로나 세로로 세 개 이상 맞춰 보세요.';
        return;
      }
      board=next;
      render();
      await award(waves.length);
      score+=waves.length;
      if (deadline) {
        status.textContent='잎사귀 +'+waves.length+(reshuffled ? ' · 새로 섞었어요' : '');
        for (const wave of waves) {
          if (!deadline) break;
          await breakTiles(wave.cleared);
          board=wave.board;
          render();
          const pitch=tiles[size].offsetTop-tiles[0].offsetTop;
          await Promise.all(wave.falls.map(([index,rows])=>animate(sprite(index),[
            {transform:shifted(0,-rows*pitch),opacity:.65},
            {transform:shifted(0,0),opacity:1}
          ],245)));
        }
      }
      board=final;
    } catch {
      board=original;
      if (deadline) status.textContent='잎사귀를 저장하지 못했어요. 다시 맞춰 보세요.';
    } finally {
      busy=false;
      if (phase==='result' || (phase==='ready' && !section.hidden && pending())) showResult();
      render();
      showAvailability();
    }
  }

  const adjacent=(a,b)=>Math.abs(a%size-b%size)+Math.abs(Math.floor(a/size)-Math.floor(b/size))===1;
  function tileAt(element) {
    const tile=element?.closest('[data-tile]');
    return tile && grid.contains(tile) ? Number(tile.dataset.tile) : -1;
  }
  grid.addEventListener('click',event=>{
    if ((ignoreClick && event.detail!==0) || busy || !deadline) return;
    const index=tileAt(event.target);
    if (index<0) return;
    if (selected>=0 && adjacent(selected,index)) void move(selected,index);
    else {
      selected=selected===index ? -1 : index;
      render();
    }
  });
  function clearDrag() {
    if (!pointer) return;
    sprite(pointer.tile).style.transform='';
    if (pointer.target>=0) sprite(pointer.target).style.transform='';
    delete tiles[pointer.tile].dataset.dragging;
    pointer=null;
  }

  grid.addEventListener('pointerdown',event=>{
    if (!deadline || busy || !event.isPrimary || event.button!==0) return;
    const tile=tileAt(event.target);
    if (tile<0) return;
    ignoreClick=false;
    pointer={id:event.pointerId,tile,x:event.clientX,y:event.clientY,target:-1,progress:0};
    tiles[tile].setPointerCapture(event.pointerId);
  });
  grid.addEventListener('pointermove',event=>{
    if (pointer?.id!==event.pointerId || !deadline) return;
    const dx=event.clientX-pointer.x;
    const dy=event.clientY-pointer.y;
    const horizontal=Math.abs(dx)>=Math.abs(dy);
    const delta=horizontal ? dx : dy;
    const target=pointer.tile+Math.sign(delta)*(horizontal ? 1 : size);
    if (pointer.target>=0) sprite(pointer.target).style.transform='';
    pointer.target=target>=0 && target<tiles.length && adjacent(pointer.tile,target) ? target : -1;
    pointer.distance=Math.abs(delta);
    const pitch=(horizontal ? tiles[1].offsetLeft-tiles[0].offsetLeft : tiles[size].offsetTop-tiles[0].offsetTop);
    pointer.progress=pointer.target<0 ? 0 : Math.min(.9,pointer.distance/pitch);
    if (!reducedMotion.matches) {
      tiles[pointer.tile].dataset.dragging='true';
      const offset=Math.sign(delta)*pitch*pointer.progress;
      sprite(pointer.tile).style.transform=shifted(horizontal ? offset : 0,horizontal ? 0 : offset);
      if (pointer.target>=0) sprite(pointer.target).style.transform=shifted(horizontal ? -offset : 0,horizontal ? 0 : -offset);
    }
  });
  grid.addEventListener('lostpointercapture',event=>{ if (pointer?.id===event.pointerId) clearDrag(); });
  grid.addEventListener('pointercancel',event=>{ if (pointer?.id===event.pointerId) clearDrag(); });
  grid.addEventListener('pointerup',event=>{
    if (pointer?.id!==event.pointerId) return;
    const {tile,target,progress,distance}=pointer;
    clearDrag();
    ignoreClick=distance>7;
    if (target>=0 && progress>=.24) void move(tile,target,progress);
  });

  start.addEventListener('click',async ()=>{
    if (busy || phase!=='ready' || !remaining() || pending()) return;
    busy=true;
    showAvailability();
    try {
      await reserve();
      if (section.hidden) return;
      board=newBoard();
      selected=-1;
      score=0;
      deadline=Date.now()+60000;
      status.textContent='';
      setPhase('playing');
      tick();
      timer=setInterval(tick,150);
    } catch {
      status.textContent='게임을 시작하지 못했어요. 남은 횟수를 확인하고 다시 시도해 주세요.';
    } finally {
      busy=false;
      render();
      showAvailability();
    }
  });

  collect.addEventListener('click',async ()=>{
    if (busy || phase!=='result') return;
    busy=true;
    collect.disabled=true;
    get('pet-match-claim-error').textContent='';
    try {
      const earned=await claim();
      board=[];
      score=0;
      setPhase('ready');
      if (!section.hidden) onClaim(earned);
    } catch {
      get('pet-match-claim-error').textContent='잎사귀를 저장하지 못했어요. 다시 눌러 주세요.';
    } finally {
      busy=false;
      collect.disabled=false;
      showAvailability();
    }
  });

  return {
    open() {
      if (phase==='ready' && pending() && !busy) showResult();
      showAvailability();
    },
    leave() {
      clearTimeout(resultTimer);
      finish(false);
      get('pet-match-claim-error').textContent='';
      setPhase('ready');
    }
  };
}
