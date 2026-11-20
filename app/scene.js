import * as T from './vendor/three.module.min.js';
import { createAvatar } from './avatar.js';
import { meadow } from './data.js';

const material = color => new T.MeshStandardMaterial({color,flatShading:true});
function mesh(scene, geometry, shade, x,y,z) {
  const part = new T.Mesh(geometry,shade);
  part.position.set(x,y,z);
  scene.add(part);
  return part;
}
function makeIsland(scene,theme) {
  mesh(scene,new T.CylinderGeometry(theme.radius,theme.radius*.99,.21,42),material(theme.grass),0,-.11,0);
  mesh(scene,new T.CylinderGeometry(theme.radius*.99,theme.radius*.77,.77,42),material(theme.earth),0,-.58,0);
  const bark = material(0xa98466);
  const leaves = material(0x719d68);
  theme.trees.forEach(([x,z],i) => {
    mesh(scene,new T.CylinderGeometry(.12,.19,1,7),bark,x,.5,z);
    mesh(scene,new T.IcosahedronGeometry(.76+i*.06,1),leaves,x,1.31,z).scale.y=1.19;
  });
  const petals = [material(0xf4c3cb),material(0xffefaf),material(0xfffaf0)];
  theme.flowers.forEach(([x,z],i) => {
    for (let j=0;j<4;j++) {
      const dx=Math.sin(j*2)*.25, dz=Math.cos(j*2)*.24;
      mesh(scene,new T.CylinderGeometry(.018,.025,.21,5),leaves,x+dx,.11,z+dz);
      mesh(scene,new T.IcosahedronGeometry(.105,0),petals[(i+j)%3],x+dx,.25,z+dz);
    }
  });
  const cloud = material(0xfffdf1);
  for (let i=0;i<7;i++) {
    const side=i<4 ? -1 : 1;
    mesh(scene,new T.IcosahedronGeometry(.66,1),cloud,side*4.6+(i%4)*.46,3.65+Math.sin(i)*.25,-4.9).scale.set(1,.48,.58);
  }
}

export function createScene(host,profile,onPet,{preview=false,theme=meadow}={}) {
  const renderer = new T.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setClearColor(theme.sky);
  renderer.domElement.setAttribute('aria-hidden','true');
  host.prepend(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera();
  camera.position.set(preview ? 2 : 5.8,preview ? 2.3 : 7.8,preview ? 5 : 12);
  camera.lookAt(0,preview ? .76 : .25,0);
  scene.add(new T.HemisphereLight(0xfffcf5,0xc5c6ac,2.2));
  const sunlight = new T.DirectionalLight(0xffefd5,2);
  sunlight.position.set(-4,8,5);
  scene.add(sunlight);
  if (!preview) makeIsland(scene,theme);
  const shadow=mesh(scene,new T.CircleGeometry(.74,24),new T.MeshBasicMaterial({color:0x47613a,transparent:true,opacity:.17}),0,.009,0);
  shadow.rotation.x=-Math.PI/2;
  const pet = createAvatar(profile);
  scene.add(pet.root);
  const toy = mesh(scene,new T.IcosahedronGeometry(.22,1),material(0xec997d),0,0,0);
  toy.visible=false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ray = new T.Raycaster();
  let frame=0, action=null, until=0;
  const start = performance.now();
  const size = () => {
    const {clientWidth:w,clientHeight:h}=host;
    if (!w || !h) return;
    renderer.setSize(w,h,false);
    const extent=preview ? 1.28 : Math.max(3.7,5.4*h/w);
    camera.left=-extent*w/h; camera.right=extent*w/h;
    camera.top=extent; camera.bottom=-extent;
    camera.near=.1; camera.far=60;
    camera.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(size);
  observer.observe(host);
  size();
  const initial=new T.Vector3();
  const target=new T.Vector3();
  const arrival=new T.Vector3(0,0,1.65);
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
    const alive=now<until;
    const p=alive ? clamp((now-action.started)/(until-action.started),0,1) : 0;
    const move=!reduced.matches;
    const walk=move ? Math.sin(t*10) : 0;
    toy.visible=false;
    if (heart) heart.visible=false;
    pet.root.scale.setScalar(pet.scale);
    pet.root.position.y=0;
    pet.head.rotation.set(0,0,0);
    pet.tail.rotation.y=move ? Math.sin(t*5)*.25 : 0;
    for (const leg of pet.legs) leg.rotation.x=0;
    for (const eye of pet.eyes) eye.scale.y=.073;
    pet.mouth.visible=true;
    if (!preview) {
      if (!alive && move && Math.floor(t/7)%2===0) {
        pet.root.position.x=Math.sin(t*.56)*1.75;
        pet.root.position.z=Math.cos(t*.56)*1.35;
        pet.root.rotation.y=Math.atan2(Math.cos(t*.56)*1.75,-Math.sin(t*.56)*1.35);
        pet.legs.forEach((leg,i) => {leg.rotation.x=walk*(i===0||i===3 ? .33 : -.33);});
      } else if (!alive && move) {
        pet.root.scale.y=pet.scale*.83;
      }
      if (alive) {
        const kind=action.kind;
        const moving=['ball','greet','treat','liked'].includes(kind);
        if (moving && move) {
          const returning=kind==='ball' && p>.54;
          const progress=returning ? clamp((p-.54)/.34,0,1) : clamp(p/(kind==='ball'?.54:.65),0,1);
          pet.root.position.lerpVectors(returning ? target : initial, returning ? arrival : target,progress);
          const end=returning ? arrival : target;
          const from=returning ? target : initial;
          pet.root.rotation.y=Math.atan2(end.x-from.x,end.z-from.z);
          pet.legs.forEach((leg,i) => {leg.rotation.x=progress<1 ? walk*(i===0||i===3 ? .46 : -.46) : 0;});
          if (progress===1) pet.root.rotation.y=.18;
        }
        if (['ball','treat','liked','disliked'].includes(kind)) {
          toy.visible=true;
          const toyColors={ball:0xf1a79c,treat:0xaa654b,liked:0xe8bb64,disliked:0x9aaecd};
          toy.material.color.set(toyColors[kind]);
          if (kind==='ball' && move && p>.54) {
            const angle=pet.root.rotation.y;
            toy.position.set(pet.root.position.x+Math.sin(angle)*.93,.95,pet.root.position.z+Math.cos(angle)*.93);
          } else {
            const f=kind==='ball' && move ? clamp(p/.28,0,1) : 1;
            toy.position.lerpVectors(arrival,target,f);
            toy.position.y=.18+Math.sin(f*Math.PI)*1.25;
          }
          if (kind==='treat' && p>.65) {
            pet.head.rotation.x=.35+(move ? Math.sin(t*15)*.14 : 0);
            toy.visible=p<.88;
          }
        }
        if (kind==='pet' && heart) {
          heart.visible=true;
          heart.position.set(pet.root.position.x,1.76+(move ? p*.95 : 0),pet.root.position.z+.13);
          heart.quaternion.copy(camera.quaternion);
          heart.children.forEach((part,i) => {part.position.y=Math.sin(i*2+p*3)*.18; part.scale.setScalar(.62+(i%3)*.17);});
        }
        if (kind==='pet' || kind==='wag' || kind==='liked') {
          pet.tail.rotation.y=move ? Math.sin(t*18)*.85 : .3;
          pet.root.position.y=move ? Math.abs(Math.sin(p*9))*.22 : 0;
        }
        if (kind==='disliked') {
          pet.head.rotation.y=.85;
          pet.root.position.copy(initial);
          pet.root.position.z=initial.z-(move ? Math.sin(p*Math.PI)*.34 : 0);
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
    }
    shadow.position.x=pet.root.position.x;
    shadow.position.z=pet.root.position.z;
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  const tap = event => {
    const rect=renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
    if (ray.intersectObject(pet.root,true).length) onPet();
  };
  if (onPet) renderer.domElement.addEventListener('click',tap);
  return {
    play(kind) {
      const now=performance.now();
      action={kind,started:now};
      until=now+(kind==='ball' ? 3100 : kind==='treat' ? 2750 : 2050);
      initial.copy(pet.root.position);
      initial.y=0;
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
