const WIDTH=360;
const HEIGHT=340;
const LIMIT=62;
const RADII=[16,27,42,57];
const COLORS=['#e9c994','#ffd3b2','#dfa2bb','#ffe0e4'];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createFoodGame({canvas,aim,drop,reset,status,onClear}) {
  const ctx=canvas.getContext('2d');
  const pieces=[];
  let state='playing';
  let frame, previousTime, cooldown=0, overflow=0;

  function spawn(level,x,y,vx=0,vy=0) {
    const r=RADII[level];
    pieces.push({level,r,x:clamp(x,r,WIDTH-r),y:Math.min(y,HEIGHT-r),vx,vy,age:0});
  }

  function walls(piece) {
    if (piece.x<piece.r || piece.x>WIDTH-piece.r) {
      piece.x=clamp(piece.x,piece.r,WIDTH-piece.r);
      piece.vx*=-.21;
    }
    if (piece.y>HEIGHT-piece.r) {
      piece.y=HEIGHT-piece.r;
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
            if (level===RADII.length-1) {
              state='cleared';
              drop.disabled=true;
              reset.hidden=false;
              status.textContent='케이크를 완성했어요!';
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
    glow.addColorStop(1,COLORS[level]);
    ellipse(0,0,.985,.985,glow);
    if (level===0) {
      ellipse(0,0,.38,.68,'#514543',.4);
      ellipse(-.08,-.08,.09,.49,'#bc9d72',.4);
      ellipse(.11,.04,.06,.36,'#896e59',.4);
    } else if (level===1) {
      ellipse(.03,.02,.63,.38,'#c46e55',-.53);
      ellipse(0,-.08,.59,.34,'#f59a77',-.53);
      ellipse(-.16,-.25,.24,.055,'#ffc6a7',-.53);
    } else if (level===2) {
      ellipse(-.1,.07,.66,.31,'#884565',-.52);
      ellipse(.36,-.17,.28,.34,'#a65977',-.43);
      ellipse(.39,-.19,.22,.27,'#f6be62',-.43);
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
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle='#c6d8c6';
    ctx.setLineDash([6,5]);
    ctx.beginPath();
    ctx.moveTo(0,LIMIT);
    ctx.lineTo(WIDTH,LIMIT);
    ctx.stroke();
    ctx.setLineDash([]);
    const x=Number(aim.value);
    if (state==='playing') {
      ctx.strokeStyle='#7bab83';
      ctx.setLineDash([4,5]);
      ctx.beginPath();
      ctx.moveTo(x,31);
      ctx.lineTo(x,HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!cooldown) food({x,y:22,r:RADII[0],level:0});
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
    spawn(0,Number(aim.value),22);
    cooldown=.46;
    drop.disabled=true;
  }

  canvas.addEventListener('click',event => {
    const rect=canvas.getBoundingClientRect();
    aim.value=clamp((event.clientX-rect.left)/rect.width*WIDTH,16,WIDTH-16);
    dropFood();
  });
  drop.addEventListener('click',dropFood);
  function restart() {
    pieces.length=0;
    state='playing';
    cooldown=overflow=0;
    aim.value=WIDTH/2;
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
