import * as T from './vendor/three.module.min.js';
import {makeRockBase} from './island-rock.js?v=100';

const standard=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.85,...options});
function place(parent,geometry,material,x,y,z) {
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
}

export function makeWalk(scene,radius,obstacles) {
  place(scene,new T.CylinderGeometry(radius,radius,.10,64),standard(0x9cbd90),0,-.055,0);
  scene.add(makeRockBase(radius,[0xb69c83,0xa68b77,0x907567,0x796459],-.105));
  const edging=standard(0xe7d5ba);
  const paved=[standard(0xd4ab93),standard(0xe1b8a0),standard(0xc89b87)];
  const paving=new T.BoxGeometry(.53,.045,.30);
  for (let row=0;row<25;row++) {
    const z=-3.84+row*.32;
    const middle=.7*Math.sin(z*.57);
    place(scene,new T.BoxGeometry(2.05,.017,.32),edging,middle,.003,z);
    for (let i=0;i<3;i++) place(scene,paving,paved[(row+i*2)%3],middle+(i-1)*.57,.019,z);
  }
  const iron=standard(0x4d6378);
  const warm=standard(0xffd689,{emissive:0xffbe52,emissiveIntensity:.55});
  const wood=standard(0xb27459);
  for (const [x,z] of [[-2.65,-1.30],[2.30,1.65]]) {
    obstacles.push([x,z,.17]);
    place(scene,new T.CylinderGeometry(.064,.13,.24,10),iron,x,.12,z);
    place(scene,new T.CylinderGeometry(.035,.055,1.85,10),iron,x,1,z);
    place(scene,new T.BoxGeometry(.26,.31,.26),warm,x,1.95,z);
    place(scene,new T.ConeGeometry(.24,.18,4),iron,x,2.19,z).rotation.y=Math.PI/4;
    place(scene,new T.BoxGeometry(.33,.05,.33),iron,x,1.79,z);
  }
  for (const [x,z,yaw] of [[2,-1.45,-.36],[-2.2,1.3,.37]]) {
    const bench=new T.Group();
    bench.position.set(x,0,z);
    bench.rotation.y=yaw;
    scene.add(bench);
    for (const offset of [-.47,-.24,0,.24,.47]) {
      obstacles.push([x+Math.cos(yaw)*offset,z-Math.sin(yaw)*offset,.26]);
    }
    for (const side of [-1,1]) {
      place(bench,new T.BoxGeometry(.07,.39,.37),iron,side*.49,.18,0);
      place(bench,new T.BoxGeometry(.05,.54,.06),iron,side*.49,.53,-.19);
    }
    for (let i=0;i<3;i++) {
      place(bench,new T.BoxGeometry(1.19,.053,.105),wood,0,.38,i*.115-.11);
      place(bench,new T.BoxGeometry(1.19,.095,.055),wood,0,.51+i*.11,-.20);
    }
  }
  const shrub=new T.IcosahedronGeometry(.38,1);
  const green=standard(0x6e9c78);
  for (let i=0;i<13;i++) {
    const angle=i*2.39996;
    const r=3.61+(i%3)*.19;
    const x=Math.cos(angle)*r, z=Math.sin(angle)*r;
    if (Math.abs(x-.7*Math.sin(z*.57))>1.55) {
      place(scene,shrub,green,x,.13,z).scale.set(1.15,.77,.93);
      obstacles.push([x,z,.34]);
    }
  }
}

export function makeCloudSpace(scene,radius) {
  const vapor=standard(0xf1f1ff);
  const blue=standard(0xd4dcff);
  const white=standard(0xffffff);
  const puff=new T.SphereGeometry(1,20,12);
  place(scene,new T.CylinderGeometry(radius*.94,radius*.94,.19,64),vapor,0,-.10,0);
  const baseTop=-.195;
  const cloudBase=makeRockBase(radius*.94,[0xe4eaff,0xcbd9f3,0xb1c4e8,0x99abd6],baseTop);
  cloudBase.scale.y=1.42;
  cloudBase.position.y=baseTop*(1-cloudBase.scale.y);
  scene.add(cloudBase);
  for (let i=0;i<18;i++) {
    const a=i*Math.PI/9;
    const edge=radius*(.76+(i%4)*.021);
    const blob=place(scene,puff,i%3 ? vapor : blue,Math.cos(a)*edge,-.28,Math.sin(a)*edge);
    blob.scale.set(.84+(i%3)*.15,.52+(i%2)*.18,.90);
  }
  const wisps=new T.Group();
  scene.add(wisps);
  for (const [x,y,z] of [[-6,2.5,-4.6],[4.9,3.1,-6],[-3.4,4.2,-7],[6.1,-.8,1]]) {
    for (let i=0;i<4;i++) {
      place(wisps,puff,white,x+i*.46,y+Math.sin(i)*.17,z).scale.set(.63,.28+(i%2)*.08,.46);
    }
  }
  return time=>{ wisps.position.x=Math.sin(time*.13)*.5; };
}

export function makeNightSky(scene) {
  const geometry=new T.BufferGeometry();
  const points=[];
  for (let i=0;i<150;i++) {
    const angle=i*2.39996;
    const distance=11+(i%13)*.62;
    points.push(Math.cos(angle)*distance,2.4+(i%31)*.43,Math.sin(angle)*distance);
  }
  for (let i=0;i<34;i++) {
    const angle=i*2.39996;
    const r=5.6+(i%4)*.42;
    points.push(Math.cos(angle)*r,2.5+(i%13)*.32,Math.sin(angle)*r);
  }
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  scene.add(new T.Points(geometry,new T.PointsMaterial({color:0xe6e6ff,size:2.8,sizeAttenuation:false})));
  place(scene,new T.SphereGeometry(.82,28,16),new T.MeshBasicMaterial({color:0xfff2c8}),-3.35,2.83,-4.25);
  const streak=new T.Group();
  scene.add(streak);
  const light=new T.MeshBasicMaterial({color:0xffedc1});
  place(streak,new T.SphereGeometry(.065,12,8),light,0,0,0);
  const tail=place(streak,new T.ConeGeometry(.065,1.34,8),light,-.66,0,0);
  tail.rotation.z=Math.PI/2;
  streak.rotation.z=-.43;
  return time=>{
    const phase=time%8;
    streak.visible=time>0 && phase<1.65;
    streak.position.set(-3.35+phase*4.45,3.83-phase*1.46,-4.3);
  };
}
