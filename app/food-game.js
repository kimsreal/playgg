const LIMIT=62;
const FOODS=[
  ['해바라기씨',12,'#e9c994'],
  ['블루베리',16,'#b3b6e5'],
  ['당근',22,'#ffd0a1'],
  ['닭가슴살',29,'#f0bfaa'],
  ['고구마',37,'#dfa2bb'],
  ['단호박',46,'#f1ca83'],
  ['연어',56,'#f5babc'],
  ['케이크',68,'#ffe0e4']
];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createFoodGame({canvas,aim,drop,reset,status,upcoming,onClear}) {
  const ctx=canvas.getContext('2d');
  const {width,height}=canvas;
  const pieces=[];
  let state='playing';
  let frame, previousTime, cooldown=0, overflow=0;
  let queued=0;
  let bag=[2,1,0,0,1,1,0];

  function nextFood() {
    if (!bag.length) {
      bag=[0,0,0,1,1,1,2,2];
      for (let i=bag.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [bag[i],bag[j]]=[bag[j],bag[i]];
      }
    }
    queued=bag.pop();
    upcoming.textContent='놓을 먹이 · '+FOODS[queued][0];
  }
  upcoming.textContent='놓을 먹이 · '+FOODS[queued][0];

  function spawn(level,x,y,vx=0,vy=0) {
    const r=FOODS[level][1];
    pieces.push({level,r,x:clamp(x,r,width-r),y:Math.min(y,height-r),vx,vy,age:0});
  }

  function walls(piece) {
    if (piece.x<piece.r || piece.x>width-piece.r) {
      piece.x=clamp(piece.x,piece.r,width-piece.r);
      piece.vx*=-.21;
    }
    if (piece.y>height-piece.r) {
      piece.y=height-piece.r;
      piece.vy=Math.min(0,-piece.vy*.16);
      piece.vx*=.89;
    }
  }

  function tick(dt) {
    cooldown=Math.max(0,cooldown-dt);
    for (const piece of pieces) {
      piece.age+=dt;
      piece.vy+=840*dt;
      piece.vx*=.994;
      piece.x+=piece.vx*dt;
      piece.y+=piece.vy*dt;
      walls(piece);
    }
    for (let pass=0;pass<3;pass++) {
      let merged=false;
      for (let i=0;i<pieces.length && !merged;i++) {
        const a=pieces[i];
        for (let j=i+1;j<pieces.length;j++) {
          const b=pieces[j];
          const dx=b.x-a.x, dy=b.y-a.y;
          const distance=Math.hypot(dx,dy);
          const overlap=a.r+b.r-distance;
          if (overlap<=0) continue;
          if (a.level===b.level) {
            const level=a.level+1;
            pieces.splice(j,1);
            pieces.splice(i,1);
            spawn(level,(a.x+b.x)/2,(a.y+b.y)/2,(a.vx+b.vx)*.35,Math.min(0,(a.vy+b.vy)*.3));
            merged=true;
            if (level===FOODS.length-1) {
              state='cleared';
              drop.disabled=true;
              reset.hidden=true;
              onClear();
              return;
            }
            break;
          }
          const nx=distance ? dx/distance : 1;
          const ny=distance ? dy/distance : 0;
          const share=b.r*b.r/(a.r*a.r+b.r*b.r);
          a.x-=nx*overlap*share;
          a.y-=ny*overlap*share;
          b.x+=nx*overlap*(1-share);
          b.y+=ny*overlap*(1-share);
          const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
          if (speed<0) {
            a.vx+=speed*nx*share;
            a.vy+=speed*ny*share;
            b.vx-=speed*nx*(1-share);
            b.vy-=speed*ny*(1-share);
          }
          walls(a);
          walls(b);
        }
      }
    }
    const crowded=pieces.some(piece=>piece.age>.7 && piece.y-piece.r<LIMIT && Math.abs(piece.vy)<35);
    overflow=crowded ? overflow+dt : 0;
    if (overflow>1) {
      state='full';
      reset.hidden=false;
      status.textContent='통이 가득 찼어요. 한 판 더 할까요?';
    }
    drop.disabled=state!=='playing' || cooldown>0;
  }

  function ellipse(x,y,rx,ry,fill,turn=0) {
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,turn,0,2*Math.PI);
    ctx.fillStyle=fill;
    ctx.fill();
  }

  function food({x,y,r,level}) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(r,r);
    const glow=ctx.createRadialGradient(-.25,-.35,.08,0,0,1);
    glow.addColorStop(0,'#fff8eb');
    glow.addColorStop(1,FOODS[level][2]);
    ellipse(0,0,.985,.985,glow);
    if (level===0) {
      ellipse(0,0,.38,.68,'#514543',.4);
      ellipse(-.08,-.08,.09,.49,'#bc9d72',.4);
      ellipse(.11,.04,.06,.36,'#896e59',.4);
    } else if (level===1) {
      ellipse(0,.09,.54,.51,'#56528f');
      ellipse(-.05,-.06,.48,.43,'#737bbb');
      ellipse(-.23,-.25,.18,.09,'#a4b5e3',-.45);
      ellipse(.15,-.24,.15,.09,'#363a69',.3);
    } else if (level===2) {
      ctx.fillStyle='#db7233';
      ctx.beginPath();
      ctx.moveTo(-.56,.5);
      ctx.quadraticCurveTo(-.53,.09,.1,-.39);
      ctx.quadraticCurveTo(.42,-.56,.53,-.18);
      ctx.quadraticCurveTo(.39,.24,-.56,.5);
      ctx.fill();
      ellipse(.41,-.43,.11,.26,'#63965d',-.5);
      ellipse(.59,-.42,.1,.26,'#79a568',.54);
      ellipse(.02,.05,.11,.03,'#aa4c29',.7);
      ellipse(.24,-.11,.13,.035,'#aa4c29',.7);
    } else if (level===3) {
      function breast(y,color) {
        ctx.fillStyle=color;
        ctx.beginPath();
        ctx.moveTo(-.67,y+.24);
        ctx.bezierCurveTo(-.75,y-.05,-.46,y-.51,-.05,y-.54);
        ctx.bezierCurveTo(.45,y-.63,.64,y-.19,.65,y+.09);
        ctx.bezierCurveTo(.65,y+.24,.34,y+.22,.07,y+.36);
        ctx.bezierCurveTo(-.35,y+.54,-.57,y+.48,-.67,y+.24);
        ctx.fill();
      }
      breast(.08,'#a95941');
      const roasted=ctx.createLinearGradient(-.2,-.55,.35,.39);
      roasted.addColorStop(0,'#ffe4be');
      roasted.addColorStop(.55,'#eeb18b');
      roasted.addColorStop(1,'#d58a66');
      breast(0,roasted);
      ctx.lineCap='round';
      for (let i=0;i<4;i++) {
        const x=-.40+i*.20;
        ctx.strokeStyle=i===0 || i===3 ? '#fff0ce' : '#b96c50';
        ctx.lineWidth=i===0 || i===3 ? .027 : .043;
        ctx.beginPath();
        ctx.moveTo(x-.08,-.24-Math.sin(i)*.10);
        ctx.quadraticCurveTo(x+.17,-.07,x+.12,.20-i*.035);
        ctx.stroke();
      }
      ellipse(-.28,-.26,.18,.05,'#ffebc9',-.46);
    } else if (level===4) {
      ellipse(-.1,.07,.66,.31,'#884565',-.52);
      ellipse(.36,-.17,.28,.34,'#a65977',-.43);
      ellipse(.39,-.19,.22,.27,'#f6be62',-.43);
    } else if (level===5) {
      ellipse(0,.08,.65,.44,'#6e8c58');
      ellipse(-.2,.04,.36,.42,'#8aa560');
      ellipse(.24,.04,.34,.42,'#819553');
      ellipse(0,.01,.30,.48,'#a3ae69');
      ellipse(.05,-.44,.08,.12,'#576944',.35);
    } else if (level===6) {
      ellipse(0,.08,.69,.38,'#b75455',-.36);
      ellipse(0,0,.66,.34,'#f18478',-.36);
      ctx.strokeStyle='#ffd4bf';
      ctx.lineWidth=.045;
      for (let i=0;i<3;i++) {
        const x=-.31+i*.26;
        ctx.beginPath();
        ctx.moveTo(x-.08,-.13-i*.075);
        ctx.quadraticCurveTo(x+.11,-.03,x+.14,.16-i*.083);
        ctx.stroke();
      }
    } else {
      ellipse(0,.46,.66,.13,'#b37177');
      ctx.fillStyle='#e992a3';
      ctx.fillRect(-.62,-.12,1.24,.55);
      ctx.fillStyle='#ffdf9b';
      ctx.fillRect(-.62,.14,1.24,.13);
      ellipse(0,-.12,.62,.21,'#fff4d4');
      ellipse(0,-.37,.14,.17,'#df596f');
    }
    ctx.restore();
  }

  function paint() {
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle='#c6d8c6';
    ctx.setLineDash([6,5]);
    ctx.beginPath();
    ctx.moveTo(0,LIMIT);
    ctx.lineTo(width,LIMIT);
    ctx.stroke();
    ctx.setLineDash([]);
    const r=FOODS[queued][1];
    const x=clamp(Number(aim.value),r,width-r);
    if (state==='playing') {
      ctx.strokeStyle='#7bab83';
      ctx.setLineDash([4,5]);
      ctx.beginPath();
      ctx.moveTo(x,31);
      ctx.lineTo(x,height);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!cooldown) food({x,y:26,r,level:queued});
    }
    for (const piece of pieces) food(piece);
  }

  function animate(now) {
    const dt=previousTime===undefined ? 0 : Math.min((now-previousTime)/1000,1/30);
    previousTime=now;
    if (state==='playing') {
      for (let i=0;i<3 && state==='playing';i++) tick(dt/3);
    }
    paint();
    if (state==='playing') frame=requestAnimationFrame(animate);
    else frame=undefined;
  }

  function resume() {
    if (frame!==undefined) return;
    previousTime=undefined;
    frame=requestAnimationFrame(animate);
  }

  function dropFood() {
    if (state!=='playing' || cooldown>0) return;
    spawn(queued,Number(aim.value),26);
    nextFood();
    cooldown=.46;
    drop.disabled=true;
  }

  canvas.addEventListener('click',event => {
    const rect=canvas.getBoundingClientRect();
    aim.value=clamp((event.clientX-rect.left)/rect.width*width,FOODS[queued][1],width-FOODS[queued][1]);
    dropFood();
  });
  drop.addEventListener('click',dropFood);
  function restart() {
    pieces.length=0;
    state='playing';
    cooldown=overflow=0;
    aim.value=width/2;
    bag=[2,1,0,0,1,1,0];
    nextFood();
    drop.disabled=false;
    reset.hidden=true;
    status.textContent='';
  }
  reset.addEventListener('click',() => {
    restart();
    resume();
  });
  return {
    resume,restart,
    pause() {
      cancelAnimationFrame(frame);
      frame=undefined;
    }
  };
}
