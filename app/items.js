import * as T from './vendor/three.module.min.js';
import {createMeatTreat,createFishTreat} from './treats.js';

function add(group,geometry,color,x,y,z,scale=[1,1,1]) {
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.39}));
  mesh.position.set(x,y,z);
  mesh.scale.set(...scale);
  group.add(mesh);
  return mesh;
}
function oval(group,color,x,y,z,sx,sy,sz) {
  return add(group,new T.SphereGeometry(1,20,12),color,x,y,z,[sx,sy,sz]);
}
function box(group,color,x,y,z,w,h,d) {
  return add(group,new T.BoxGeometry(w,h,d),color,x,y,z);
}
function hose(group,color,points,radius) {
  const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
  return add(group,new T.TubeGeometry(curve,16,radius,8,false),color,0,0,0);
}

export function createItem(kind) {
  if (kind==='meat' || kind==='fish') {
    const food=new T.Group();
    const shape=kind==='meat' ? createMeatTreat() : createFishTreat();
    shape.rotation.x=-Math.PI/2;
    shape.position.y=.18;
    food.add(shape);
    return food;
  }
  const group=new T.Group();
  if (kind==='ball') {
    oval(group,0xf39a70,0,.255,0,.25,.25,.25);
    const stripe=add(group,new T.TorusGeometry(.248,.017,8,28),0xffe7b5,0,.255,0);
    stripe.rotation.set(.55,.4,0);
    const second=stripe.clone();
    second.rotation.y+=Math.PI/2;
    group.add(second);
  } else if (kind==='bath') {
    oval(group,0x88cad7,0,.14,0,.43,.14,.24);
    oval(group,0xf6f6f0,0,.234,0,.405,.065,.229);
    oval(group,0xa2e0ee,0,.263,0,.333,.036,.163);
    hose(group,0x809cab,[[.317,.23,0],[.331,.43,0],[.246,.43,0],[.234,.359,0]],.034);
    for (const [x,y,z,r] of [[-.15,.32,.06,.057],[.02,.32,-.04,.049],[-.07,.371,.04,.033]]) {
      oval(group,0xe9faff,x,y,z,r,r,r);
    }
  } else if (kind==='vacuum') {
    oval(group,0x83aacd,-.17,.163,0,.22,.142,.17);
    for(const z of [-.141,.141]) oval(group,0x3e526a,-.21,.093,z,.092,.087,.028);
    oval(group,0xeff0fb,-.17,.265,.011,.073,.033,.065);
    hose(group,0x596f89,[[-.02,.22,0],[.105,.435,-.04],[.25,.42,.01],[.36,.12,.065]],.024);
    box(group,0x496683,.364,.061,.065,.16,.072,.28);
  } else if (kind==='tube') {
    const tube=oval(group,0xd5eff7,-.05,.129,0,.35,.123,.157);
    tube.rotation.z=.04;
    oval(group,0x539db7,-.05,.237,.01,.191,.022,.108);
    const lid=add(group,new T.CylinderGeometry(.108,.108,.15,18),0x587ba5,.312,.115,0);
    lid.rotation.z=Math.PI/2;
    box(group,0x9eccd7,-.338,.133,0,.105,.083,.227);
  } else if (kind==='bag') {
    oval(group,0xa6cedd,0,.228,0,.269,.229,.12);
    hose(group,0x659ebc,[[-.16,.329,0],[-.19,.58,0],[-.08,.623,0],[-.018,.363,0]],.024);
    hose(group,0x659ebc,[[.018,.363,0],[.09,.624,0],[.19,.58,0],[.16,.329,0]],.024);
    oval(group,0xc4e5ec,0,.235,.11,.15,.057,.017);
  } else {
    const [paper,ribbon]=[
      [0xc998b6,0xffebcc],[0x85bad1,0xfce9a9],[0x91b7a3,0xf9e5e0]
    ][Number(kind.at(-1))] || [0xc998b6,0xffebcc];
    box(group,paper,0,.157,0,.43,.314,.38);
    box(group,paper,0,.327,0,.465,.1,.415);
    box(group,ribbon,0,.192,.209,.068,.37,.012);
    box(group,ribbon,.233,.192,0,.012,.37,.063);
    box(group,ribbon,0,.38,0,.44,.012,.067);
    box(group,ribbon,0,.381,0,.067,.012,.398);
    for(const side of [-1,1]) {
      oval(group,ribbon,side*.083,.429,0,.095,.046,.041).rotation.z=side*.33;
    }
  }
  return group;
}
