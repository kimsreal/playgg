import * as T from './vendor/three.module.min.js';
import { createAvatar } from './avatar.js?v=29';
import { createMeatTreat, createFishTreat } from './treats.js';
import { meadow } from './data.js';

const material = color => new T.MeshStandardMaterial({color,flatShading:true});
function mesh(scene, geometry, shade, x,y,z) {
  const part = new T.Mesh(geometry,shade);
  part.position.set(x,y,z);
  scene.add(part);
  return part;
}
function scatter(scene, geometry, instances) {
  const batch = new T.InstancedMesh(geometry,material(0xffffff),instances.length);
  const transform = new T.Object3D();
  instances.forEach(({position,scale,color,rotation=0}, index) => {
    transform.position.set(...position);
    transform.scale.set(...scale);
    transform.rotation.set(0,rotation,0);
    transform.updateMatrix();
    batch.setMatrixAt(index,transform.matrix);
    batch.setColorAt(index,new T.Color(color));
  });
  scene.add(batch);
}
function makeIsland(scene,theme) {
  const {radius,grass,earth,trees,flowers}=theme;
  mesh(scene,new T.CylinderGeometry(radius,radius*.98,.22,48),material(grass),0,-.115,0);
  mesh(scene,new T.CylinderGeometry(radius*.98,radius*.89,.33,48),material(0x98a675),0,-.38,0);
  mesh(scene,new T.CylinderGeometry(radius*.89,radius*.71,.52,48),material(earth),0,-.805,0);
  const shade=new T.MeshBasicMaterial({color:0x476f50,transparent:true,opacity:.13});
  const bark=material(0xa98466);
  const foliage=[], grassBlades=[], stones=[], blooms=[], stems=[], pavers=[];
  const leafColors=[0x81ac6a,0xa3c47a,0x729d67];
  const grassColors=[0x83af65,0x9abe73,0xc4dba0,0xa7c77d];
  const petalColors=[0xf3aec7,0xffe6a0,0xfffbda,0xcab7eb];
  trees.forEach(([x,z],index) => {
    const treeShadow=mesh(scene,new T.CircleGeometry(.72,15),shade,x+.17,.008,z+.12);
    treeShadow.rotation.x=-Math.PI/2;
    treeShadow.scale.set(1.22,.75,1);
    mesh(scene,new T.CylinderGeometry(.11,.19,1.24,7),bark,x,.62,z);
    for (let i=0;i<6;i++) {
      const angle=i*2.4;
      const size=i===0 ? .69 : .44+(i%3)*.055;
      foliage.push({position:[x+Math.cos(angle)*.42,1.24+i*.105+(index%2)*.16,z+Math.sin(angle)*.39],
        scale:[size,size*1.05,size],color:leafColors[(i+index)%leafColors.length],rotation:angle});
    }
  });
  flowers.forEach(([x,z],i) => {
    for (let j=0;j<6;j++) {
      const px=x+Math.sin(j*2.4)*(.18+j*.034);
      const pz=z+Math.cos(j*2.4)*(.19+j*.027);
      const height=.15+(j%3)*.05;
      stems.push({position:[px,height/2,pz],scale:[.018,height,.018],color:0x739c65});
      blooms.push({position:[px,height,pz],scale:[.102,.056,.102],color:petalColors[(i+j)%petalColors.length]});
      blooms.push({position:[px,height+.04,pz],scale:[.039,.025,.039],color:0xeec96a});
    }
  });
  for (let i=0;i<145;i++) {
    const angle=i*2.39996;
    const distance=radius*.92*Math.sqrt((i+.5)/145);
    const x=Math.cos(angle)*distance, z=Math.sin(angle)*distance;
    if (Math.abs(x-.42*Math.sin(z))<.77) continue;
    const height=.115+(i%6)*.035;
    grassBlades.push({position:[x,height*.39,z],scale:[.045,height,.055],color:grassColors[i%grassColors.length],rotation:angle});
    if (i%8===0 && distance>2.3) {
      const size=.15+(i%5)*.025;
      stones.push({position:[x,.041,z],scale:[size,.08,size*.78],color:i%3 ? 0xb2bda2 : 0xc5c6b0,rotation:angle});
    }
  }
  for (let i=0;i<13;i++) {
    const z=-3.75+i*.62;
    const x=.42*Math.sin(z);
    pavers.push({position:[x,.004,z],scale:[.24+(i%3)*.036,.011,.17+(i%2)*.035],
      color:i%3 ? 0xdde0b1 : 0xe2d9ac,rotation:i*.7});
  }
  scatter(scene,new T.IcosahedronGeometry(1,1),foliage);
  scatter(scene,new T.ConeGeometry(1,1,3),grassBlades);
  scatter(scene,new T.IcosahedronGeometry(1,0),stones);
  scatter(scene,new T.IcosahedronGeometry(1,0),pavers);
  scatter(scene,new T.CylinderGeometry(1,1,1,4),stems);
  scatter(scene,new T.IcosahedronGeometry(1,0),blooms);
  const cloud=material(0xfff8e8);
  const clouds=new T.Group();
  for (const [x,y,z] of [[-5.6,4.35,-4.5],[3.95,4.2,-5.15],[-3.15,5.4,-7.8],[6.2,4.85,-6.9]]) {
    for (let i=0;i<5;i++) {
      const size=.42+(2-Math.abs(2-i))*.12;
      mesh(clouds,new T.IcosahedronGeometry(size,1),cloud,x+i*.39,y+Math.sin(i*.8)*.19,z).scale.set(1.1,.55,.72);
    }
  }
  scene.add(clouds);
  return clouds;
}

function createOwner(scene,gender) {
  const root=new T.Group();
  const finish=(color,roughness=.5) => new T.MeshStandardMaterial({color,roughness});
  const hoodie=finish(0x526879,.66);
  const ribbing=finish(0x475a68,.7);
  const seam=finish(0x3c4f5d,.72);
  const cords=finish(0x708999,.65);
  const trousers=finish(0x405564,.72);
  const skin=finish(0xeabea1,.58);
  const warmSkin=finish(0xd5917f,.66);
  const hair=finish(0x414c59,.41);
  const eyeBase=finish(0x637084,.47);
  const ink=finish(0x262732,.3);
  const reflection=finish(0x8895a6,.38);
  const lips=finish(0x9e655b,.72);
  const boots=finish(0x353e50,.35);
  const sole=finish(0x2e3745,.6);
  const ovalGeometry=new T.SphereGeometry(1,28,20);
  const oval=(parent,shade,x,y,z,sx,sy,sz) => {
    const part=mesh(parent,ovalGeometry,shade,x,y,z);
    part.scale.set(sx,sy,sz);
    return part;
  };
  const line=(parent,shade,points,radius) => {
    const curve=new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    return mesh(parent,new T.TubeGeometry(curve,18,radius,7,false),shade,0,0,0);
  };
  const head=new T.Group();
  head.position.y=1.39;
  root.add(head);
  oval(head,skin,0,-.027,0,.321,.317,.269);

  const cap=new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI-.001);
  const vertices=cap.attributes.position;
  for(let row=0;row<=24;row++){
    for(let column=0;column<=48;column++){
      const azimuth=column/48*Math.PI*2;
      const front=Math.max(0,Math.sin(azimuth));
      const side=Math.cos(azimuth);
      const part=Math.exp(-((side-.035)**2)/.007);
      const fringe=gender==='male' ? .14*side : .055*side;
      const rim=1.94-.76*front-.20*part*front+fringe*front;
      const polar=row/24*rim;
      const ring=Math.sin(polar);
      const index=row*49+column;
      vertices.setXYZ(index,-Math.cos(azimuth)*ring*.337,Math.cos(polar)*.314+.017,Math.sin(azimuth)*ring*.282-.014);
    }
  }
  cap.computeVertexNormals();
  mesh(head,cap,hair,0,0,0);
  if (gender==='female') {
    oval(head,hair,0,-.315,-.177,.298,.335,.112);
    const strands=hair.clone();
    strands.color.multiplyScalar(1.13);
    for (const side of [-1,1]) {
      oval(head,hair,side*.272,-.287,-.132,.103,.35,.123).rotation.z=side*.08;
      oval(head,hair,side*.279,-.500,-.137,.104,.19,.126).rotation.z=side*.16;
      line(head,strands,[[side*.303,-.132,-.08],[side*.335,-.323,-.081],[side*.336,-.505,-.083],[side*.304,-.61,-.086]],.008);
    }
  }

  for(const side of [-1,1]) {
    const ear=oval(head,skin,side*.318,-.085,-.003,.092,.089,.062);
    ear.rotation.z=side*-.27;
    oval(head,warmSkin,side*.346,-.083,.045,.045,.034,.012).rotation.z=side*-.27;
    const eye=oval(head,eyeBase,side*.128,-.074,.235,.049,.049,.027);
    oval(eye,ink,0,.04,.63,.78,.78,.49);
    oval(eye,reflection,-.27,.32,.96,.24,.24,.11);
    oval(head,warmSkin,side*.191,-.143,.201,.057,.023,.012).rotation.z=side*.11;
  }
  oval(head,skin,0,-.109,.25,.038,.043,.036);
  line(head,lips,[[-.037,-.182,.216],[0,-.189,.225],[.037,-.181,.216]],.006);

  oval(root,skin,0,1.16,0,.112,.131,.105);
  oval(root,hoodie,0,.82,-.015,.255,.322,.181);
  oval(root,hoodie,0,1.072,-.096,.236,.147,.153);
  const collar=mesh(root,new T.TorusGeometry(.154,.039,10,28),ribbing,0,1.082,.016);
  collar.rotation.x=Math.PI/2.38;
  oval(root,ribbing,0,.586,-.001,.233,.058,.175);
  oval(root,seam,0,.717,.157,.155,.084,.031);
  oval(root,hoodie,0,.719,.17,.141,.07,.027);
  for(const side of [-1,1]){
    line(root,cords,[[side*.084,1.066,.151],[side*.071,.953,.171],[side*.065,.896+side*.027,.182]],.01);
    oval(root,cords,side*.065,.896+side*.027,.184,.016,.025,.016);
  }

  const legs=[];
  const arms=[];
  for(const side of [-1,1]){
    const leg=new T.Group();
    leg.position.set(side*.118,.59,0);
    root.add(leg);
    legs.push(leg);
    oval(leg,trousers,0,-.222,.003,.125,.273,.121);
    oval(leg,sole,side*.011,-.534,.054,.133,.052,.177);
    oval(leg,boots,side*.011,-.463,.054,.132,.106,.177);
    line(leg,sole,[[-.061,-.431,.175],[0,-.421,.199],[.061,-.431,.175]],.007);

    const arm=new T.Group();
    arm.position.set(side*.214,1.002,-.005);
    arm.rotation.z=side*.13;
    root.add(arm);
    arms.push(arm);
    oval(arm,hoodie,side*.04,-.151,0,.098,.207,.097);
    oval(arm,ribbing,side*.056,-.308,.006,.103,.05,.101);
    oval(arm,skin,side*.061,-.367,.014,.073,.084,.072);
    oval(arm,skin,side*.013,-.351,.062,.034,.051,.036);
  }
  root.position.set(2.35,0,2.58);
  root.rotation.y=Math.atan2(-root.position.x,-root.position.z);
  scene.add(root);
  const shadow=mesh(scene,new T.CircleGeometry(.36,24),new T.MeshBasicMaterial({color:0x47613a,transparent:true,opacity:.16}),root.position.x,.009,root.position.z);
  shadow.rotation.x=-Math.PI/2;
  return {root,head,arms,legs,shadow};
}

export function createScene(host,profile,onPet,{preview=false,theme=meadow,perspective='third',ownerGender='default'}={}) {
  const renderer = new T.WebGLRenderer({antialias:true,alpha:!preview});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setClearColor(theme.sky,preview ? 1 : 0);
  renderer.domElement.setAttribute('aria-hidden','true');
  host.prepend(renderer.domElement);
  const scene = new T.Scene();
  const overview = new T.OrthographicCamera();
  const eye = new T.PerspectiveCamera(54,1,.055,60);
  let camera=overview;
  overview.position.set(preview ? 2 : 5.8,preview ? 2.3 : 7.8,preview ? 5 : 12);
  const overviewTarget=new T.Vector3(0,preview ? .76 : .45,0);
  overview.lookAt(overviewTarget);
  const orbit=new T.Spherical().setFromVector3(overview.position.clone().sub(overviewTarget));
  let eyePitch=Math.atan2(.49-1.46,3);
  scene.add(new T.HemisphereLight(0xfffcf5,0xc5c6ac,2.2));
  const sunlight = new T.DirectionalLight(0xffefd5,2);
  sunlight.position.set(-4,8,5);
  scene.add(sunlight);
  const clouds=preview ? null : makeIsland(scene,theme);
  const owner=preview ? null : createOwner(scene,ownerGender);
  const eyeTarget=new T.Vector3();
  const updateEyeCamera=() => {
    const position=owner.root.position;
    const heading=owner.root.rotation.y;
    eye.position.set(position.x,1.46,position.z);
    eyeTarget.set(position.x+Math.sin(heading)*3,eye.position.y+Math.tan(eyePitch)*3,position.z+Math.cos(heading)*3);
    eye.lookAt(eyeTarget);
  };
  const setPerspective=view => {
    if (!owner) return;
    const first=view==='first';
    owner.root.visible=!first;
    owner.shadow.visible=!first;
    camera=first ? eye : overview;
  };
  setPerspective(perspective);
  const shadow=mesh(scene,new T.CircleGeometry(.74,24),new T.MeshBasicMaterial({color:0x47613a,transparent:true,opacity:.17}),0,.009,0);
  shadow.rotation.x=-Math.PI/2;
  const pet = createAvatar(profile);
  const hamster=profile.species==='hamster';
  scene.add(pet.root);
  const toy = mesh(scene,new T.IcosahedronGeometry(.22,1),material(0xec997d),0,0,0);
  toy.visible=false;
  const treats={meat:createMeatTreat(),fish:createFishTreat()};
  for (const treat of Object.values(treats)) {
    treat.visible=false;
    treat.rotation.x=-Math.PI/2;
    treat.rotation.z=.27;
    scene.add(treat);
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ray = new T.Raycaster();
  let frame=0, action=null, idleTime=0;
  const start = performance.now();
  let previousTime=start;
  const ground=new T.Plane(new T.Vector3(0,1,0),0);
  const hit=new T.Vector3();
  const ownerTarget=owner?.root.position.clone();
  const marker=owner ? mesh(scene,new T.RingGeometry(.18,.23,32),
    new T.MeshBasicMaterial({color:0x62b9f1,transparent:true,opacity:.8,side:T.DoubleSide}),0,.025,0) : null;
  if (marker) {
    marker.rotation.x=-Math.PI/2;
    marker.visible=false;
  }
  const size = () => {
    const {clientWidth:w,clientHeight:h}=host;
    if (!w || !h) return;
    renderer.setSize(w,h,false);
    const extent=preview ? 1.28 : Math.max(3.7,5.15*h/w);
    overview.left=-extent*w/h; overview.right=extent*w/h;
    overview.top=extent; overview.bottom=-extent;
    overview.near=.1; overview.far=60;
    overview.updateProjectionMatrix();
    eye.aspect=w/h;
    eye.fov=w<h*.65 ? 65 : 54;
    eye.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(size);
  observer.observe(host);
  size();
  const initial=new T.Vector3();
  const target=new T.Vector3();
  const arrival=new T.Vector3(0,0,1.65);
  const ballGrip=new T.Vector3();
  const petStep=new T.Vector3();
  const wanderTarget=new T.Vector3();
  const previousLegAngles=pet.legs.map(() => 0);
  let heart;
  if (!preview) {
    const shape=new T.Shape();
    shape.moveTo(0,-.23);
    shape.bezierCurveTo(-.51,.09,-.23,.4,0,.19);
    shape.bezierCurveTo(.23,.4,.51,.09,0,-.23);
    heart=new T.Group();
    for (let i=0;i<5;i++) {
      mesh(heart,new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0xe47891,side:T.DoubleSide}),(i-2)*.29,0,0);
    }
    scene.add(heart);
    heart.visible=false;
  }
  const clamp=T.MathUtils.clamp;
  const animate = now => {
    const t=(now-start)/1000;
    const elapsed=T.MathUtils.clamp((now-previousTime)/1000,0,.05);
    previousTime=now;
    const alive=Boolean(action);
    if (alive) action.elapsed=Math.min(action.duration,action.elapsed+elapsed);
    else idleTime+=elapsed;
    const p=alive ? action.elapsed/action.duration : 0;
    const previousY=pet.root.position.y;
    const previousScale=pet.root.scale.y;
    const previousHeadX=pet.head.rotation.x;
    const previousHeadY=pet.head.rotation.y;
    const previousTail=pet.tail.rotation.y;
    pet.legs.forEach((leg,i) => {previousLegAngles[i]=leg.rotation.x;});
    const move=!reduced.matches;
    const walk=move ? Math.sin(t*(hamster ? 24 : 10)) : 0;
    if (clouds) clouds.position.x=move ? Math.sin(t*.095)*.42 : 0;
    toy.visible=false;
    for (const treat of Object.values(treats)) treat.visible=false;
    if (heart) heart.visible=false;
    pet.root.scale.setScalar(pet.scale);
    pet.root.position.y=0;
    pet.head.rotation.set(0,0,0);
    pet.tail.rotation.y=move ? Math.sin(t*5)*.25 : 0;
    for (const leg of pet.legs) leg.rotation.x=0;
    for (const eye of pet.eyes) eye.scale.y=.073;
    pet.mouth.visible=true;
    if (!preview) {
      const position=pet.root.position;
      const previousX=position.x;
      const previousZ=position.z;
      let stride=.33;
      if (!alive && move) {
        if (idleTime<.7 || Math.floor((idleTime-.7)/6)%2===1) {
          if (idleTime>=.7) pet.root.scale.y=pet.scale*.83;
        } else {
          const phase=(idleTime-.7)*.56;
          wanderTarget.set(Math.sin(phase)*1.75,0,Math.cos(phase)*1.35);
          petStep.set(wanderTarget.x-position.x,0,wanderTarget.z-position.z).clampLength(0,elapsed*1.32);
          position.add(petStep);
        }
      }
      if (alive) {
        const kind=action.kind;
        const moving=['ball','greet','treat','liked'].includes(kind);
        if (moving && move) {
          const returning=kind==='ball' && p>=.62;
          const progress=returning ? clamp((p-.62)/.34,0,1) : clamp(p/(kind==='ball' ? .54 : .65),0,1);
          position.lerpVectors(returning ? target : initial,returning ? arrival : target,progress);
          stride=.46;
        }
        if (['ball','liked','disliked'].includes(kind)) {
          toy.visible=true;
          const toyColors={ball:0xf1a79c,liked:0xe8bb64,disliked:0x9aaecd};
          toy.material.color.set(toyColors[kind]);
          if (kind==='ball' && move && p>=.54) {
            const angle=pet.root.rotation.y;
            ballGrip.set(position.x+Math.sin(angle)*.74,.83,position.z+Math.cos(angle)*.74);
            const pickup=clamp((p-.54)/.08,0,1);
            toy.position.set(target.x,.18,target.z).lerp(ballGrip,pickup);
            if (p>.96) toy.position.y=T.MathUtils.lerp(ballGrip.y,.18,(p-.96)/.04);
          } else {
            const f=kind==='ball' && move ? clamp(p/.28,0,1) : 1;
            toy.position.lerpVectors(arrival,target,f);
            toy.position.y=.18+Math.sin(f*Math.PI)*1.25;
          }
        }
        if (kind==='treat') {
          const model=treats[action.treat];
          model.position.copy(target);
          model.position.y=.18;
          model.visible=p<.88;
          if (p>.65) pet.head.rotation.x=.35+(move ? Math.sin(t*15)*.14 : 0);
        }
        if (kind==='pet' && heart) {
          heart.visible=true;
          heart.position.set(pet.root.position.x,1.76+(move ? p*.95 : 0),pet.root.position.z+.13);

          heart.children.forEach((part,i) => {part.position.y=Math.sin(i*2+p*3)*.18; part.scale.setScalar(.62+(i%3)*.17);});
        }
        if (kind==='pet' || kind==='wag' || kind==='liked') {
          pet.tail.rotation.y=move ? Math.sin(t*18)*.85 : .3;
          pet.root.position.y=move ? Math.abs(Math.sin(p*Math.PI*2))*(hamster ? .06 : .22) : 0;
        }
        if (kind==='disliked') {
          pet.head.rotation.y=.85;
          const retreatZ=initial.z-.34;
          const limit=Math.sqrt(Math.max(0,theme.radius**2-position.x**2));
          position.z=T.MathUtils.lerp(initial.z,Math.max(-limit,retreatZ),move ? Math.sin(p*Math.PI) : 0);
        }
        if (kind==='belly') {
          pet.legs[1].rotation.x=-.7+(move ? Math.sin(t*12)*.33 : 0);
          pet.legs[3].rotation.x=-.65;
        }
        if (kind==='perch' || kind==='sleep') {
          pet.root.scale.y=pet.scale*(kind==='sleep' ? .57 : .79);
          if (kind==='sleep') for (const eye of pet.eyes) eye.scale.y=.018;
        }
      }
      const dx=position.x-previousX;
      const dz=position.z-previousZ;
      if (dx*dx+dz*dz>1e-8 && action?.kind!=='disliked') {
        const heading=Math.atan2(dx,dz);
        const turn=heading-pet.root.rotation.y;
        pet.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-elapsed*11));
        const step=hamster ? stride*.68 : stride;
        pet.legs.forEach((leg,i) => {leg.rotation.x=walk*(i===0||i===3 ? step : -step);});
      }
      if (move) {
        const blend=1-Math.exp(-elapsed*15);
        pet.root.position.y=T.MathUtils.lerp(previousY,pet.root.position.y,blend);
        pet.root.scale.y=T.MathUtils.lerp(previousScale,pet.root.scale.y,blend);
        pet.head.rotation.x=T.MathUtils.lerp(previousHeadX,pet.head.rotation.x,blend);
        pet.head.rotation.y=T.MathUtils.lerp(previousHeadY,pet.head.rotation.y,blend);
        pet.tail.rotation.y=T.MathUtils.lerp(previousTail,pet.tail.rotation.y,blend);
        pet.legs.forEach((leg,i) => {leg.rotation.x=T.MathUtils.lerp(previousLegAngles[i],leg.rotation.x,blend);});
      }
    }
    if (owner) {
      const position=owner.root.position;
      const distance=position.distanceTo(ownerTarget);
      const walking=distance>.008;
      if (walking) position.lerp(ownerTarget,move ? Math.min(1,elapsed*2.45/distance) : 1);
      else if (marker.visible) marker.visible=false;
      const stride=walking && move ? Math.sin(t*13)*.37 : 0;
      owner.legs[0].rotation.x=stride;
      owner.legs[1].rotation.x=-stride;
      owner.shadow.position.set(position.x,.009,position.z);
      const reaching=alive && ['pet','treat','liked','ball'].includes(action.kind);
      owner.arms[0].rotation.x=reaching ? -.92*(move ? Math.sin(p*Math.PI) : 1) : -stride*.7;
      owner.arms[1].rotation.x=walking ? stride*.7 : move ? Math.sin(t*2)*.055 : 0;
      owner.head.rotation.x=reaching ? .13 : 0;
      if (camera===eye) updateEyeCamera();
    }
    if (heart?.visible) heart.quaternion.copy(camera.quaternion);
    shadow.position.x=pet.root.position.x;
    shadow.position.z=pet.root.position.z;
    if (alive && p===1) action=null;
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  const tap = event => {
    const rect=renderer.domElement.getBoundingClientRect();
    camera.updateMatrixWorld();
    ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
    if (ray.intersectObject(pet.root,true).length) {
      onPet();
      return;
    }
    if (!owner) return;
    const position=owner.root.position;
    if (!ray.ray.intersectPlane(ground,hit) || hit.length()>theme.radius) {
      if (camera===eye) {
        ownerTarget.copy(position);
        marker.visible=false;
        owner.root.rotation.y=Math.atan2(ray.ray.direction.x,ray.ray.direction.z);
      }
      return;
    }
    hit.clampLength(0,theme.radius-.25);
    hit.y=0;
    if (hit.distanceToSquared(position)<.0001) return;
    owner.root.rotation.y=Math.atan2(hit.x-position.x,hit.z-position.z);
    ownerTarget.copy(hit);
    marker.position.set(ownerTarget.x,.025,ownerTarget.z);
    marker.visible=true;
  };
  if (onPet) renderer.domElement.addEventListener('click',tap);
  return {
    setPerspective,
    dragView(dx,dy) {
      if (!owner) return;
      const sensitivity=.007;
      if (camera===eye) {
        owner.root.rotation.y-=dx*sensitivity;
        eyePitch=clamp(eyePitch+dy*sensitivity,-1.15,.72);
        updateEyeCamera();
      } else {
        orbit.theta-=dx*sensitivity;
        orbit.phi=clamp(orbit.phi-dy*sensitivity,.52,1.31);
        overview.position.setFromSpherical(orbit).add(overviewTarget);
        overview.lookAt(overviewTarget);
      }
    },
    play(kind,treat='meat') {
      action={kind,treat,elapsed:0,duration:kind==='ball' ? 3.1 : kind==='treat' ? 2.75 : 2.05};
      idleTime=0;
      initial.set(pet.root.position.x,0,pet.root.position.z);
      const locations={ball:[2.65,0,-1.2],greet:[0,0,1.95],treat:[.85,0,1.4],liked:[-1,0,1.65],disliked:[initial.x+.55,0,initial.z+.7]};
      target.set(...(locations[kind] || [0,0,0]));
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      const materials=new Set();
      scene.traverse(part => {
        if (part.geometry) part.geometry.dispose();
        if (part.material) materials.add(part.material);
      });
      for (const shade of materials) shade.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
