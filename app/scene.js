import {makeWalk,makeCloudSpace,makeNightSky} from './extra-themes.js';
import * as T from './vendor/three.module.min.js';
import { createAvatar } from './avatar.js?v=35';
import { createMeatTreat, createFishTreat } from './treats.js';
import {createItem} from './items.js';
import {coast,makeCoast} from './coast.js?v=93';
import { meadow } from './data.js';
import {buildOwnerModel} from './owner-model.js?v=43';
import {ownerColors as cleanColors} from './owner-colors.js';
export {loadOwnerModel} from './owner-model.js?v=43';

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
}

function makeSkyClouds(scene,positions=[[-5.6,4.35,-4.5],[3.95,4.2,-5.15],[-3.15,5.4,-7.8],[6.2,4.85,-6.9]]) {
  const cloud=material(0xfff8e8);
  const clouds=new T.Group();
  for (const [x,y,z] of positions) {
    for (let i=0;i<5;i++) {
      const size=.42+(2-Math.abs(2-i))*.12;
      mesh(clouds,new T.IcosahedronGeometry(size,1),cloud,x+i*.39,y+Math.sin(i*.8)*.19,z).scale.set(1.1,.55,.72);
    }
  }
  scene.add(clouds);
  return clouds;
}

function fallbackOwner(colors) {
  const root=new T.Group();
  const finish=(color,roughness=.5) => new T.MeshStandardMaterial({color,roughness});
  const hoodie=finish(colors.hoodie,.66);
  const ribbing=finish(colors.hoodie,.7);
  const seam=finish(colors.hoodie,.72);
  const cords=finish(colors.hoodie,.65);
  const trousers=finish(colors.pants,.72);
  const skin=finish(colors.skin,.58);
  const warmSkin=finish(0xd5917f,.66);
  const hair=finish(colors.hoodie,.64);
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
      const fringe=.055*side;
      const rim=1.94-.76*front-.20*part*front+fringe*front;
      const polar=row/24*rim;
      const ring=Math.sin(polar);
      const index=row*49+column;
      vertices.setXYZ(index,-Math.cos(azimuth)*ring*.337,Math.cos(polar)*.314+.017,Math.sin(azimuth)*ring*.282-.014);
    }
  }
  cap.computeVertexNormals();
  mesh(head,cap,hair,0,0,0);

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
  return {root,head,arms,legs};
}

function createOwner(scene,source,colors) {
  const owner=source ? buildOwnerModel(source,colors) : fallbackOwner(colors);
  const {root}=owner;
  root.scale.setScalar(.86);
  root.position.set(2.35,0,2.58);
  root.rotation.y=Math.atan2(-root.position.x,-root.position.z);
  scene.add(root);
  const shadow=mesh(scene,new T.CircleGeometry(.36,24),new T.MeshBasicMaterial({color:0x47613a,transparent:true,opacity:.16}),root.position.x,.009,root.position.z);
  shadow.rotation.x=-Math.PI/2;
  return {...owner,shadow};
}

export function createScene(host,profile,onPet,{preview=false,background='meadow',perspective='third',ownerModel,ownerColors,onGraphicsChange,onBallReady}={}) {
  const environment=preview ? 'meadow' : background;
  const night=environment==='stars';
  const theme=environment==='coast' ? coast : night ? {...meadow,grass:0x789676,earth:0x77728e} : meadow;
  const touchScreen=matchMedia('(pointer: coarse)').matches;
  const renderer = new T.WebGLRenderer({antialias:!touchScreen,alpha:!preview});
  renderer.setPixelRatio(Math.min(devicePixelRatio,touchScreen ? 1.35 : 1.7));
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
  scene.add(new T.HemisphereLight(night ? 0xb4cbff : 0xfffcf5,night ? 0x8c85ad : 0xc5c6ac,night ? 1.65 : 2.2));
  const sunlight = new T.DirectionalLight(night ? 0xabbdfb : 0xffefd5,night ? .85 : 2);
  sunlight.position.set(-4,8,5);
  scene.add(sunlight);
  let animateEnvironment;
  let clouds;
  if (!preview) {
    if (environment==='coast') {
      animateEnvironment=makeCoast(scene,theme);
      clouds=makeSkyClouds(scene,[[-6.5,.9,-3.1],[4.25,.75,-4.8],[-2.75,.15,-7.1]]);
    } else if (environment==='walk') makeWalk(scene,theme.radius);
    else if (environment==='clouds') animateEnvironment=makeCloudSpace(scene,theme.radius);
    else {
      makeIsland(scene,theme);
      if (night) animateEnvironment=makeNightSky(scene);
      else clouds=makeSkyClouds(scene);
    }
  }
  const owner=preview ? null : createOwner(scene,ownerModel,cleanColors(ownerColors));
  const eyeTarget=new T.Vector3();
  const updateEyeCamera=() => {
    const position=owner.root.position;
    const heading=owner.root.rotation.y;
    eye.position.set(position.x,position.y+1.46*owner.root.scale.y,position.z);
    eyeTarget.set(position.x+Math.sin(heading)*3,eye.position.y+Math.tan(eyePitch)*3,position.z+Math.cos(heading)*3);
    eye.lookAt(eyeTarget);
  };
  let graphicsAvailable=true;
  const setPerspective=view => {
    if (!owner) return;
    const first=view==='first';
    owner.root.visible=!first;
    owner.shadow.visible=!first;
    camera=first ? eye : overview;
    if (first) updateEyeCamera();
    if (graphicsAvailable && size()) renderer.render(scene,camera);
  };
  const shadow=mesh(scene,new T.CircleGeometry(.74,24),new T.MeshBasicMaterial({color:0x47613a,transparent:true,opacity:.17}),0,.009,0);
  shadow.rotation.x=-Math.PI/2;
  const pet = createAvatar(profile);
  pet.root.name='pet';
  const hamster=profile.species==='hamster';
  scene.add(pet.root);
  const ballRadius=.22;
  const toy=mesh(scene,new T.SphereGeometry(ballRadius,32,24),new T.MeshStandardMaterial({color:0xf08ab4,roughness:.38}),0,0,0);
  toy.visible=false;
  const envelope=new T.Group();
  const paper=new T.MeshStandardMaterial({color:0xffedcb,roughness:.82});
  const seam=new T.MeshStandardMaterial({color:0xbb815c,roughness:.85});
  mesh(envelope,new T.BoxGeometry(.58,.38,.055),paper,0,0,0);
  for (const side of [-1,1]) {
    const fold=mesh(envelope,new T.BoxGeometry(.35,.014,.012),seam,side*.146,.071,.028);
    fold.rotation.z=side*.44;
  }
  mesh(envelope,new T.SphereGeometry(.055,12,8),material(0xe18094),0,0,.034).scale.z=.25;
  envelope.visible=false;
  if (owner) scene.add(envelope);
  else envelope.traverse(part => {
    part.geometry?.dispose();
    part.material?.dispose();
  });
  const letterOrigin=new T.Vector3();
  const letterTarget=new T.Vector3();
  const cake=new T.Group();
  mesh(cake,new T.CylinderGeometry(.26,.26,.23,32),material(0xe58ba4),0,-.025,0);
  mesh(cake,new T.CylinderGeometry(.264,.264,.047,32),material(0xffdc9d),0,-.06,0);
  mesh(cake,new T.CylinderGeometry(.265,.265,.055,32),material(0xfff0d6),0,.09,0);
  mesh(cake,new T.SphereGeometry(.062,16,12),material(0xda557b),0,.17,0);
  const treats={meat:createMeatTreat(),fish:createFishTreat(),cake};
  const items=new Map();
  let placedItem;
  for (const treat of Object.values(treats)) {
    treat.visible=false;
    if (treat!==cake) treat.rotation.x=-Math.PI/2;
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
  let riding=false;
  let approaching=false;
  let seatBlend=0;
  const seat=new T.Vector3();
  const walkVector=new T.Vector3();
  const seatHeight={dog:1.06,cat:1.06,hamster:.66,parrot:1.13,lizard:.64}[profile.species];

  function setRiding(next) {
    if (!owner || riding===next) return riding;
    riding=next;
    idleTime=0;
    const petPosition=pet.root.position;
    if (riding) {
      action=null;
      approaching=seatBlend===0;
      ownerTarget.set(petPosition.x,0,petPosition.z);
    } else {
      approaching=false;
      if (seatBlend>0) {
        const heading=pet.root.rotation.y;
        ownerTarget.set(petPosition.x+Math.cos(heading)*.92,0,petPosition.z-Math.sin(heading)*.92);
        ownerTarget.clampLength(0,theme.radius-.26);
      } else {
        ownerTarget.set(owner.root.position.x,0,owner.root.position.z);
      }
    }
    return riding;
  }
  let viewportWidth,viewportHeight;
  const size = () => {
    const {clientWidth:w,clientHeight:h}=host;
    if (!w || !h) return false;
    if (w===viewportWidth && h===viewportHeight) return true;
    viewportWidth=w;
    viewportHeight=h;
    renderer.setSize(w,h,false);
    const extent=preview ? 1.28 : Math.max(3.7,5.15*h/w);
    overview.left=-extent*w/h; overview.right=extent*w/h;
    overview.top=extent; overview.bottom=-extent;
    overview.near=.1; overview.far=60;
    overview.updateProjectionMatrix();
    eye.aspect=w/h;
    const portraitFov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(23))/eye.aspect));
    eye.fov=T.MathUtils.clamp(portraitFov,54,83);
    eye.updateProjectionMatrix();
    return true;
  };
  const observer=new ResizeObserver(size);
  observer.observe(host);
  size();
  const initial=new T.Vector3();
  const target=new T.Vector3();
  const escape=new T.Vector3();
  const treatPosition=new T.Vector3();
  const itemDirection=new T.Vector3();
  const ballOrigin=new T.Vector3();
  const ballLanding=new T.Vector3();
  const ballPickup=new T.Vector3();
  const ballReturn=new T.Vector3();
  const ballGrip=new T.Vector3();
  const petStep=new T.Vector3();
  const pettingPoint=new T.Vector3();
  const wanderTarget=new T.Vector3();
  const previousLegAngles=pet.legs.map(() => 0);
  function makeHearts() {
    const shape=new T.Shape();
    shape.moveTo(0,-.23);
    shape.bezierCurveTo(-.51,.09,-.23,.4,0,.19);
    shape.bezierCurveTo(.23,.4,.51,.09,0,-.23);
    const group=new T.Group();
    const geometry=new T.ShapeGeometry(shape);
    const shade=new T.MeshBasicMaterial({color:0xe47891,side:T.DoubleSide});
    for (let i=0;i<5;i++) mesh(group,geometry,shade,(i-2)*.29,0,0);
    scene.add(group);
    group.visible=false;
    return group;
  }
  const heart=owner ? makeHearts() : null;
  const ownerHeart=owner ? makeHearts() : null;
  function floatHearts(group,position,height,p,move) {
    group.visible=true;
    group.position.copy(position);
    group.position.y+=height+(move ? p*.8 : 0);
    group.quaternion.copy(camera.quaternion);
    group.children.forEach((part,i) => {
      part.position.y=move ? Math.sin(i*2+p*3)*.18 : 0;
      part.scale.setScalar(.62+(i%3)*.17);
    });
  }
  const clamp=T.MathUtils.clamp;
  const animate = now => {
    const t=(now-start)/1000;
    const elapsed=T.MathUtils.clamp((now-previousTime)/1000,0,.05);
    previousTime=now;
    const alive=Boolean(action);
    if (alive && action.kind!=='pet-approach') action.elapsed=Math.min(action.duration,action.elapsed+elapsed);
    if (!alive) idleTime+=elapsed;
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
    animateEnvironment?.(move ? t : 0);
    toy.visible=false;
    envelope.visible=false;
    if (placedItem) placedItem.visible=false;
    for (const treat of Object.values(treats)) treat.visible=false;
    if (heart) heart.visible=ownerHeart.visible=false;
    pet.root.scale.setScalar(pet.scale);
    pet.root.position.y=0;
    pet.head.rotation.set(0,0,0);
    pet.tail.rotation.y=move ? Math.sin(t*5)*.25 : 0;
    for (const leg of pet.legs) leg.rotation.x=0;
    for (const eye of pet.eyes) eye.scale.y=.073;
    pet.mouth.visible=true;
    pet.smile.visible=false;
    if (!preview) {
      const position=pet.root.position;
      const previousX=position.x;
      const previousZ=position.z;
      let stride=.33;
      if (riding && !approaching && seatBlend>.9) {
        petStep.set(ownerTarget.x-position.x,0,ownerTarget.z-position.z);
        if (move) petStep.clampLength(0,elapsed*2.05);
        position.add(petStep);
        stride=.42;
      } else if (!riding && !alive && move) {
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
        if (move && ['greet','treat','liked'].includes(kind)) {
          const arrival=kind==='treat' && action.object==='cake' ? .48 : .65;
          position.lerpVectors(initial,target,clamp(p/arrival,0,1));
          stride=.46;
        }
        if (kind==='ball' && move) {
          const returning=p>=.58;
          const progress=returning ? clamp((p-.58)/.42,0,1) : clamp((p-.12)/.37,0,1);
          position.lerpVectors(returning ? ballPickup : initial,returning ? ballReturn : ballPickup,progress);
          stride=.54;
        }
        if (kind==='liked' || kind==='disliked') {
          placedItem.position.set(target.x,0,target.z);
          placedItem.visible=true;
        }
        if (kind==='letter') {
          const arrival=clamp(p/.39,0,1);
          const reading=p>=.39 && p<.58;
          const cheering=p>=.58;
          const hop=clamp((p-.58)/.42,0,1);
          envelope.visible=!cheering;
          if (envelope.visible) {
            envelope.position.lerpVectors(letterOrigin,letterTarget,move ? arrival : 1);
            if (move) envelope.position.y+=Math.sin(arrival*Math.PI)*.85;
            envelope.rotation.set(-.16,camera.rotation.y,move ? Math.sin(arrival*Math.PI)*.28 : 0);
          }
          if (reading) pet.head.rotation.x=.29;
          if (cheering) {
            pet.smile.visible=true;
            if (profile.species!=='parrot' && profile.species!=='lizard') pet.mouth.visible=false;
            pet.tail.rotation.y=move ? Math.sin(t*20)*.9 : .36;
            if (move) pet.root.position.y=Math.abs(Math.sin(hop*Math.PI*3))*(hamster ? .33 : .52);
          }
        }
        if (kind==='treat') {
          const model=treats[action.object];
          model.position.copy(treatPosition);
          const celebrating=model===cake && p>=.75;
          model.visible=p<(model===cake ? .75 : .88);
          if (model===cake) cake.scale.setScalar(move ? 1-T.MathUtils.smoothstep(p,.56,.75)*.9 : 1);
          if (p>(model===cake ? .49 : .65) && !celebrating) pet.head.rotation.x=.35+(move ? Math.sin(t*15)*.14 : 0);
          if (celebrating) {
            const cheer=(p-.75)/.25;
            pet.smile.visible=true;
            if (profile.species!=='parrot' && profile.species!=='lizard') pet.mouth.visible=false;
            pet.tail.rotation.y=move ? Math.sin(t*20)*.85 : .36;
            if (move) pet.root.position.y=Math.abs(Math.sin(cheer*Math.PI*2))*.35;
            floatHearts(heart,position,pet.head.position.y*pet.scale+.62,cheer,move);
          }
        }
        const pettingContact=kind==='pet' && p>=.22 && p<=.9;
        if (pettingContact && heart) floatHearts(heart,position,pet.head.position.y*pet.scale+.62,(p-.22)/.68,move);
        if (pettingContact || kind==='wag' || kind==='liked') {
          pet.tail.rotation.y=move ? Math.sin(t*18)*.85 : .3;
          pet.root.position.y=move && !pettingContact ? Math.abs(Math.sin(p*Math.PI*2))*(hamster ? .06 : .22) : 0;
          if (pettingContact) pet.head.rotation.x=move ? Math.sin(p*Math.PI*6)*.06 : 0;
        }
        if (kind==='liked' && p>=.35) {
          pet.smile.visible=true;
          if (profile.species!=='parrot' && profile.species!=='lizard') pet.mouth.visible=false;
        }
        if (kind==='disliked') {
          pet.head.rotation.y=move ? .62*(1-clamp(p/.36,0,1)) : .62;
          if (move) {
            const progress=T.MathUtils.smoothstep(p,.08,.79);
            position.x=T.MathUtils.lerp(initial.x,escape.x,progress);
            position.z=T.MathUtils.lerp(initial.z,escape.z,progress);
            stride=.59;
          }
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
      const walking=dx*dx+dz*dz>1e-8;
      const gaze=action?.kind==='treat' ? treatPosition
        : action?.kind==='ball' ? (p<.58 ? ballLanding : owner.root.position)
        : ['ball-ready','ball-catch'].includes(action?.kind) ? owner.root.position : null;
      if (walking || (gaze && (move || action.kind.startsWith('ball')))) {
        const heading=walking ? Math.atan2(dx,dz) : Math.atan2(gaze.x-position.x,gaze.z-position.z);
        const turn=heading-pet.root.rotation.y;
        pet.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(move ? 1-Math.exp(-elapsed*11) : 1);
        const step=hamster ? stride*.68 : stride;
        if (walking) pet.legs.forEach((leg,i) => {leg.rotation.x=walk*(i===0||i===3 ? step : -step);});
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
      const petPosition=pet.root.position;
      if (riding && approaching) {
        walkVector.set(petPosition.x-position.x,0,petPosition.z-position.z);
        const distance=walkVector.length();
        if (distance<.65 || !move) approaching=false;
        else {
          owner.root.rotation.y=Math.atan2(walkVector.x,walkVector.z);
          position.add(walkVector.setLength(Math.min(elapsed*2.45,distance-.58)));
        }
      }
      const seatRate=move ? elapsed*3.2 : 1;
      seatBlend=T.MathUtils.clamp(seatBlend+(riding && !approaching ? seatRate : -seatRate),0,1);
      const seated=T.MathUtils.smoothstep(seatBlend,0,1);
      if (riding && !approaching) {
        const angle=pet.root.rotation.y;
        const offset=profile.species==='parrot' ? .2 : .15;
        seat.set(petPosition.x-Math.sin(angle)*offset,
          petPosition.y+seatHeight*pet.root.scale.y-.55*owner.root.scale.y,
          petPosition.z-Math.cos(angle)*offset);
        position.lerp(seat,seatBlend===1 || !move ? 1 : 1-Math.exp(-elapsed*13));
        if (camera!==eye && seatBlend>.7) owner.root.rotation.y=angle;
      } else if (!riding) {
        const distance=position.distanceTo(ownerTarget);
        if (distance>.008) position.lerp(ownerTarget,move ? Math.min(1,elapsed*2.45/distance) : 1);
      }
      const walking=approaching || (!riding && position.distanceTo(ownerTarget)>.008);
      const stride=walking && move ? Math.sin(t*13)*.37 : 0;
      owner.legs[0].rotation.x=T.MathUtils.lerp(stride,-1.17,seated);
      owner.legs[1].rotation.x=T.MathUtils.lerp(-stride,-1.17,seated);
      owner.legs[0].rotation.z=-.45*seated;
      owner.legs[1].rotation.z=.45*seated;
      owner.shadow.position.set(position.x,.009,position.z);
      owner.shadow.material.opacity=.16*(1-seated);
      const petting=action?.kind==='pet';
      const reaching=alive && ['treat','liked','letter'].includes(action.kind);
      if (action?.kind==='pet-approach' || petting) {
        const facing=action.kind==='pet-approach' && walking ? ownerTarget : pettingPoint;
        const turn=Math.atan2(facing.x-position.x,facing.z-position.z)-owner.root.rotation.y;
        owner.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(move ? 1-Math.exp(-elapsed*15) : 1);
      }
      const stroke=petting ? Math.min(clamp(p/.22,0,1),clamp((1-p)/.15,0,1)) : 0;
      const shoulderHeight=owner.arms[0].position.y*owner.root.scale.y+position.y;
      const pettingArm=-Math.atan2(.42,shoulderHeight-pettingPoint.y);

      const throwing=action?.kind==='ball' && p<.23;
      const catching=action?.kind==='ball-catch' && p<.55;
      const arm=petting ? stroke*(pettingArm+(move ? Math.sin(p*Math.PI*8)*.12 : 0))
        : throwing ? -1.85*Math.sin(p/.23*Math.PI) : catching ? -.95
        : reaching ? -.92*(move ? Math.sin(p*Math.PI) : 1) : -stride*.7;
      owner.arms[0].rotation.x=T.MathUtils.lerp(arm,-.62,seated);
      owner.arms[1].rotation.x=T.MathUtils.lerp(walking ? stride*.7 : move ? Math.sin(t*2)*.055 : 0,-.62,seated);
      owner.head.rotation.x=petting ? .2*stroke : reaching ? .13 : 0;
      if (camera===eye) updateEyeCamera();
    }
    if (action?.kind.startsWith('ball')) {
      pet.mouth.getWorldPosition(ballGrip);
      ballGrip.x+=Math.sin(pet.root.rotation.y)*.14;
      ballGrip.z+=Math.cos(pet.root.rotation.y)*.14;
      toy.visible=true;
      if (action.kind==='ball' && p<.58) {
        const flight=clamp(p/.27,0,1);
        toy.position.lerpVectors(ballOrigin,ballLanding,flight);
        if (move) toy.position.y+=Math.sin(flight*Math.PI)*1.25;
        toy.position.lerp(ballGrip,clamp((p-.49)/.09,0,1));
      } else if (action.kind==='ball-catch') {
        owner.arms[0].localToWorld(ballOrigin.set(0,-.37,0));
        toy.position.lerpVectors(ballGrip,ballOrigin,move ? clamp(p/.3,0,1) : 1);
        toy.visible=p<.48;
        if (p>=.3) {
          const bloom=(p-.3)/.7;
          const petHeight=pet.head.position.y*pet.scale+.55;
          floatHearts(heart,pet.root.position,petHeight,bloom,move);
          floatHearts(ownerHeart,owner.root.position,camera===eye ? .85 : 1.68,bloom,move);
          if (camera===eye) ownerHeart.position.addScaledVector(camera.getWorldDirection(walkVector),1.8);
        }
      } else toy.position.copy(ballGrip);
    }
    shadow.position.x=pet.root.position.x;
    shadow.position.z=pet.root.position.z;
    if (action?.kind==='pet-approach' && seatBlend===0 && owner.root.position.distanceToSquared(ownerTarget)<.001) {
      action.kind='pet';
    }
    if (alive && p===1 && action.kind==='ball') {
      action.kind='ball-ready';
      onBallReady?.();
    } else if (alive && p===1 && action.kind!=='ball-ready') action=null;
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  };
  const canvas=renderer.domElement;
  const onLost=event => {
    event.preventDefault();
    graphicsAvailable=false;
    cancelAnimationFrame(frame);
    canvas.hidden=true;
    onGraphicsChange?.(false);
  };
  const onRestored=() => {
    graphicsAvailable=true;
    viewportWidth=viewportHeight=undefined;
    canvas.hidden=false;
    previousTime=performance.now();
    size();
    onGraphicsChange?.(true);
    frame=requestAnimationFrame(animate);
  };
  canvas.addEventListener('webglcontextlost',onLost);
  canvas.addEventListener('webglcontextrestored',onRestored);
  setPerspective(perspective);
  frame=requestAnimationFrame(animate);
  const tap = event => {
    const rect=renderer.domElement.getBoundingClientRect();
    camera.updateMatrixWorld();
    ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
    if (!riding && ray.intersectObject(pet.root,true).length) {
      onPet();
      return;
    }
    if (!owner || action?.kind.startsWith('ball')) return;
    const position=riding ? pet.root.position : owner.root.position;
    if (!ray.ray.intersectPlane(ground,hit) || hit.length()>theme.radius) {
      if (camera===eye) {
        ownerTarget.set(position.x,0,position.z);
        owner.root.rotation.y=Math.atan2(ray.ray.direction.x,ray.ray.direction.z);
      }
      return;
    }
    hit.clampLength(0,theme.radius-.25);
    hit.y=0;
    if (hit.distanceToSquared(position)<.0001) return;
    owner.root.rotation.y=Math.atan2(hit.x-position.x,hit.z-position.z);
    ownerTarget.copy(hit);
    if (['pet','pet-approach'].includes(action?.kind)) action=null;
  };
  if (onPet) renderer.domElement.addEventListener('click',tap);
  return {
    setPerspective,
    setRiding,
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
    zoomView(factor) {
      if (!owner || !Number.isFinite(factor) || factor<=0) return;
      camera.zoom=clamp(camera.zoom*factor,.72,2.2);
      camera.updateProjectionMatrix();
    },
    catchBall() {
      if (action?.kind!=='ball-ready') return;
      action={kind:'ball-catch',elapsed:0,duration:1.65};
    },
    play(kind,object='meat') {
      if (kind==='pet' && owner) {
        if (['pet-approach','pet'].includes(action?.kind)) return;
        pettingPoint.copy(pet.head.position);
        pettingPoint.y+=hamster ? .23 : .24;
        pet.root.localToWorld(pettingPoint);
        itemDirection.subVectors(owner.root.position,pettingPoint).setY(0);
        if (itemDirection.lengthSq()<.01) itemDirection.set(1,0,0);
        const space=hamster || profile.species==='lizard' ? .57 : .72;
        ownerTarget.copy(pettingPoint).setY(0).addScaledVector(itemDirection.normalize(),space);
        ownerTarget.clampLength(0,theme.radius-.25);
        kind='pet-approach';
      }
      if (kind==='ball' && owner) {
        const ownerPosition=owner.root.position;
        ownerTarget.copy(ownerPosition);
        ownerTarget.y=0;
        ballLanding.set(-ownerPosition.x,0,-ownerPosition.z);
        if (ballLanding.lengthSq()<2.25) ballLanding.set(2.45,0,-1.35);
        ballLanding.clampLength(0,theme.radius-1);
        owner.root.rotation.y=Math.atan2(ballLanding.x-ownerPosition.x,ballLanding.z-ownerPosition.z);
        owner.arms[0].localToWorld(ballOrigin.set(0,-.28,.32));
        ballLanding.y=ballRadius;
        ballPickup.set(pet.root.position.x-ballLanding.x,0,pet.root.position.z-ballLanding.z);
        if (ballPickup.lengthSq()<.01) ballPickup.set(-ballLanding.x,0,-ballLanding.z);
        const reach=(pet.head.position.z+pet.mouth.position.z*pet.head.scale.z)*pet.scale;
        ballPickup.setLength(reach).add(ballLanding);
        ballPickup.y=0;
        ballReturn.set(ballPickup.x-ownerPosition.x,0,ballPickup.z-ownerPosition.z);
        if (ballReturn.lengthSq()<.01) ballReturn.set(-ownerPosition.x,0,-ownerPosition.z);
        if (ballReturn.lengthSq()<.01) ballReturn.set(0,0,1);
        ballReturn.setLength(reach+.74).add(ownerTarget).clampLength(0,theme.radius-.25);
      }
      if (kind==='liked' || kind==='disliked') {
        if (placedItem) placedItem.visible=false;
        if (!items.has(object)) {
          const model=createItem(object);
          model.visible=false;
          model.rotation.y=-.24;
          items.set(object,model);
          scene.add(model);
        }
        placedItem=items.get(object);
      }
      if (kind==='letter') {
        if (!owner) return;
        owner.arms[0].getWorldPosition(letterOrigin);
        letterOrigin.y-=.15;
        pet.head.getWorldPosition(letterTarget);
        const heading=pet.root.rotation.y;
        letterTarget.x+=Math.sin(heading)*.36;
        letterTarget.z+=Math.cos(heading)*.36;
        letterTarget.y+=.18;
      }
      action={kind,object,elapsed:0,duration:kind==='letter' ? 3.7 : kind==='ball' ? 3.5 : kind==='treat' ? (object==='cake' ? 4.35 : 2.75) : 2.05};
      idleTime=0;
      initial.set(pet.root.position.x,0,pet.root.position.z);
      const locations={greet:[0,0,1.95],treat:[.85,0,1.4],liked:[-1,0,1.65]};
      target.set(...(locations[kind] || [0,0,0]));
      if (kind==='treat') {
        const reach=(pet.head.position.z+pet.mouth.position.z*pet.head.scale.z)*pet.scale+.24;
        if (reduced.matches) {
          const heading=pet.root.rotation.y;
          itemDirection.set(Math.sin(heading),0,Math.cos(heading));
          treatPosition.copy(initial).addScaledVector(itemDirection,reach);
        } else {
          treatPosition.copy(target);
          itemDirection.subVectors(treatPosition,initial);
          if (itemDirection.length()<reach+.25) {
            // Leave a short approach even if the pet is already near the feeding spot.
            itemDirection.copy(initial).negate();
            if (itemDirection.lengthSq()<.01) itemDirection.set(0,0,1);
            treatPosition.copy(initial).addScaledVector(itemDirection.normalize(),reach+.45);
          }
          itemDirection.subVectors(treatPosition,initial).normalize();
          target.copy(treatPosition).addScaledVector(itemDirection,-reach);
        }
        treatPosition.y=.18;
      }
      if (kind==='disliked') {
        const heading=pet.root.rotation.y;
        itemDirection.set(Math.sin(heading),0,Math.cos(heading));
        if (initial.lengthSq()>3.24) itemDirection.copy(initial).normalize();
        target.copy(initial).addScaledVector(itemDirection,.64).clampLength(0,theme.radius-.05);
        escape.copy(initial).addScaledVector(itemDirection,-2.1).clampLength(0,theme.radius-.25);
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('webglcontextlost',onLost);
      canvas.removeEventListener('webglcontextrestored',onRestored);
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
