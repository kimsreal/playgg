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
  for (let column=0;column<size;column++) {
    let write=size-1;
    for (let row=size-1;row>=0;row--) {
      const index=row*size+column;
      if (!matched.has(index)) result[write--*size+column]=board[index];
    }
    while (write>=0) result[write--*size+column]=randomPet();
  }
  return result;
}

export function createPetMatch({section,remaining,reserve,award}) {
  const get=id=>section.querySelector('#'+id);
  const grid=get('pet-match-board');
  const start=get('pet-match-start');
  const status=get('pet-match-status');
  const scoreLabel=get('pet-match-score');
  const clock=get('pet-match-time');
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
    start.disabled=busy || Boolean(deadline) || count===0;
  }

  function finish(message) {
    if (!deadline) return;
    deadline=0;
    clearInterval(timer);
    clock.textContent='0:00';
    selected=-1;
    status.textContent=message;
    render();
    showAvailability();
  }

  function tick() {
    if (!deadline) return;
    const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    clock.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    if (!seconds) finish('시간이 다 됐어요!');
  }

  function render() {
    grid.hidden=!board.length;
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

  async function move(a,b) {
    tick();
    if (!deadline || busy) return;
    const next=swap(board,a,b);
    let cleared=matches(next);
    selected=-1;
    if (!cleared.size) {
      status.textContent='같은 동물을 가로나 세로로 세 개 이상 맞춰 보세요.';
      render();
      return;
    }
    const first=cleared;
    let points=0;
    let settled=next;
    while (cleared.size) {
      points++;
      settled=collapse(settled,cleared);
      cleared=matches(settled);
    }
    const reshuffled=!hasMove(settled);
    const final=reshuffled ? newBoard() : settled;
    busy=true;
    try {
      await award(points);
      score+=points;
      board=final;
      if (deadline) {
        status.textContent='잎사귀 +'+points+(reshuffled ? ' · 새로 섞었어요' : '');
        for (const index of first) {
          if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
            tiles[index].animate([{scale:'.76',opacity:.55},{scale:'1',opacity:1}],{duration:230});
          }
        }
      }
    } catch {
      if (deadline) status.textContent='잎사귀를 저장하지 못했어요. 다시 맞춰 보세요.';
    } finally {
      busy=false;
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
    if (ignoreClick || busy || !deadline) return;
    const index=tileAt(event.target);
    if (index<0) return;
    if (selected>=0 && adjacent(selected,index)) void move(selected,index);
    else {
      selected=selected===index ? -1 : index;
      render();
    }
  });
  grid.addEventListener('pointerdown',event=>{
    if (!event.isPrimary || event.button!==0) return;
    ignoreClick=false;
    pointer={id:event.pointerId,tile:tileAt(event.target)};
  });
  grid.addEventListener('pointercancel',()=>{ pointer=null; });
  grid.addEventListener('pointerup',event=>{
    const from=pointer;
    pointer=null;
    if (!from || from.id!==event.pointerId) return;
    const to=tileAt(document.elementFromPoint(event.clientX,event.clientY));
    if (from.tile>=0 && to>=0 && adjacent(from.tile,to)) {
      ignoreClick=true;
      setTimeout(()=>{ ignoreClick=false; },0);
      void move(from.tile,to);
    }
  });

  start.addEventListener('click',async ()=>{
    if (busy || deadline || !remaining()) return;
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

  return {
    open:showAvailability,
    leave:()=>finish('이번 판을 마쳤어요.')
  };
}
