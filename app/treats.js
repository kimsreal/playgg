import * as T from './vendor/three.module.min.js';

const glaze=color => new T.MeshStandardMaterial({color,roughness:.34});
function oval(group,material,x,y,z,width,height,depth) {
  const item=new T.Mesh(new T.SphereGeometry(1,24,16),material);
  item.position.set(x,y,z);
  item.scale.set(width,height,depth);
  group.add(item);
  return item;
}
function fin(group, material, points) {
  const outline=new T.Shape();
  points.forEach(([x,y],index) => index ? outline.lineTo(x,y) : outline.moveTo(x,y));
  outline.closePath();
  const shape=new T.ExtrudeGeometry(outline,{depth:.035,bevelEnabled:true,bevelThickness:.023,bevelSize:.026,bevelSegments:3});
  shape.translate(0,0,-.0175);
  group.add(new T.Mesh(shape,material));
}

export function createMeatTreat() {
  const group=new T.Group();
  const bone=glaze(0xffead0);
  const roast=glaze(0xc56932);
  const browned=glaze(0xab502b);
  const streak=glaze(0xdc8a47);
  oval(group,bone,.22,-.055,0,.27,.055,.055).rotation.z=-.19;
  for (const y of [-.13,-.045]) oval(group,bone,.43,y,0,.088,.061,.073);
  oval(group,roast,-.117,.032,0,.306,.215,.17).rotation.z=.21;
  oval(group,browned,.105,-.009,0,.149,.143,.135).rotation.z=.2;
  for (let i=0;i<3;i++) {
    oval(group,streak,-.277+i*.068,.095+i*.022,.134+i*.012,.033,.018,.019).rotation.z=-.6;
  }
  return group;
}

export function createFishTreat() {
  const group=new T.Group();
  const scales=glaze(0x579fb0);
  const flipper=glaze(0x427f98);
  const belly=glaze(0xbbe3dc);
  const ink=glaze(0x243b49);
  const shine=glaze(0xf8fbef);
  fin(group,flipper,[[.23,0],[.44,.16],[.48,.14],[.445,0],[.48,-.14],[.44,-.16]]);
  fin(group,flipper,[[-.18,.123],[.01,.245],[.104,.155],[.19,.076]]);
  oval(group,scales,-.04,0,0,.348,.179,.134);
  oval(group,belly,-.092,-.08,.051,.259,.102,.093);
  const sideFin=oval(group,flipper,.012,-.016,.121,.123,.047,.034);
  sideFin.rotation.z=-.41;
  oval(group,shine,-.238,.036,.108,.057,.057,.033);
  oval(group,ink,-.251,.04,.137,.029,.033,.017);
  oval(group,shine,-.261,.052,.15,.01,.01,.007);
  for (let i=0;i<3;i++) {
    oval(group,belly,-.055+i*.075,.07+i*.005,.118-i*.008,.019,.009,.013).rotation.z=-.25;
  }
  return group;
}
