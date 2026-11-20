import * as T from './vendor/three.module.min.js';

const material = color => new T.MeshStandardMaterial({color, roughness:.42});
function piece(parent, geometry, shade, x, y, z, scale = [1,1,1]) {
  const mesh = new T.Mesh(geometry, shade);
  mesh.position.set(x,y,z);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}
const sphere = (parent, shade, x,y,z,scale) =>
  piece(parent,new T.SphereGeometry(1,22,14),shade,x,y,z,scale);

function glossyEye(head,dark,shine,x,y,z,shape) {
  const eye=sphere(head,dark,x,y,z,shape);
  sphere(eye,shine,-.27,.35,.86,[.24,.22,.2]);
  sphere(eye,shine,.25,-.2,.9,[.1,.095,.12]);
  return eye;
}

function createFeatheredOrScaled(profile, root, fur, pale, dark, shade) {
  const bird=profile.species==='parrot';
  const body=sphere(root,fur,0,bird?.68:.36,-.13,bird ? [.39,.56,.38] : [.4,.32,.67]);
  if (profile.pattern==='tuxedo') {
    sphere(root,pale,0,bird?.68:.34,bird?.18:.37,bird ? [.28,.38,.13] : [.29,.17,.19]);
  }
  if (profile.pattern==='spots') {
    for (const side of [-1,1]) {
      sphere(body,shade,side*.82,.24,.11,[.24,.33,.3]);
      sphere(body,shade,side*.58,.62,-.37,[.22,.25,.24]);
    }
  }

  const head=new T.Group();
  head.position.set(0,bird?1.2:.64,.37);
  root.add(head);
  sphere(head,fur,0,0,0,bird ? [.36,.35,.36] : [.43,.29,.39]);
  const beak=bird ? material(0xe9a654) : null;
  const eyes=[];
  for (const side of [-1,1]) {
    sphere(head,bird ? pale : shade,side*.236,.045,.237,[.102,.104,.078]);
    eyes.push(glossyEye(head,dark,pale,side*.244,.045,.301,[.052,.073,.032]));
  }
  const mouth=bird
    ? sphere(head,beak,0,-.075,.345,[.13,.12,.157])
    : sphere(head,pale,0,-.081,.283,[.28,.129,.235]);
  if (bird) {
    const plumeHeight=profile.ears==='upright' ? .21 : .1;
    for (let i=0;i<3;i++) {
      const feather=sphere(head,shade,(i-1)*.082,.29+i*.014,-.057,[.066,plumeHeight,.074]);
      feather.rotation.x=-.4-i*.22;
    }
  } else {
    for (let i=0;i<5;i++) {
      const ridgeHeight=profile.ears==='upright' ? .15 : .07;
      piece(root,new T.ConeGeometry(.064,ridgeHeight,4),shade,0,.69-(i*.024),.1-i*.15);
    }
    for (const side of [-1,1]) {
      sphere(head,dark,side*.12,-.03,.474,[.021,.019,.015]);
      for (let scale=0;scale<3;scale++) sphere(head,shade,side*(.253+scale*.043),-.05-scale*.026,.311-scale*.03,[.027,.016,.017]);
    }
  }
  const legs=[];
  for (const side of [-1,1]) {
    for (const front of [false,true]) {
      const joint=new T.Group();
      root.add(joint);
      legs.push(joint);
      if (bird && front) {
        joint.position.set(side*.33,.76,-.08);
        const wing=sphere(joint,shade,side*.07,-.068,-.088,[.134,.34,.233]);
        wing.rotation.x=.35;
        for (let plume=0;plume<3;plume++) {
          const feather=sphere(joint,plume===1 ? fur : shade,side*(.126+plume*.012),-.096-plume*.041,-.173-plume*.019,[.085,.071,.2]);
          feather.rotation.x=.42+plume*.08;
        }
        joint.rotation.z=-side*.12;
      } else {
        joint.position.set(side*(bird?.15:.31),bird?.32:.28,front?.31:-.37);
        sphere(joint,bird ? beak : shade,side*.045,-.08,0,[.098,.15,.105]);
        sphere(joint,bird ? beak : fur,side*.082,-.19,.085,[.105,.069,.146]);
        for (let toe=-1;toe<=1;toe++) {
          sphere(joint,bird ? beak : pale,side*.082+toe*.045,-.215,.184,[.029,.029,.064]);
        }
      }
    }
  }

  const tail=new T.Group();
  tail.position.set(0,bird?.48:.29,-.59);
  root.add(tail);
  const length={short:.25,long:.94,curled:.68}[profile.tail];
  const curl=profile.tail==='curled';
  if (bird) {
    for (let i=-1;i<=1;i++) {
      const feather=sphere(tail,i===0 ? shade : fur,i*.082,-length*.18,-length*.44,[.073,.065,length*.62]);
      feather.rotation.y=i*(curl ? .48 : .18);
      feather.rotation.x=-.3;
    }
  } else {
    const curve=new T.CatmullRomCurve3([
      new T.Vector3(0,0,0),new T.Vector3(.1,-.07,-length*.34),
      new T.Vector3(curl?.33:.13,-.12,-length*.74),new T.Vector3(curl?.44:.025,-.12,-length)
    ]);
    for (let i=0;i<9;i++) {
      const point=curve.getPoint(i/8);
      const width=.138-i*.013;
      sphere(tail,i%3===0 ? shade : fur,point.x,point.y,point.z,[width,width*.71,width*1.32]);
    }
  }
  const scale={small:.79,medium:1,large:1.2}[profile.size];
  root.scale.setScalar(scale);
  return {root,head,tail,legs,eyes,mouth,scale};
}

export function createAvatar(profile) {
  const root = new T.Group();
  const fur = material(profile.fur);
  const pale = material(0xffeed6);
  const dark = material(0x3c2c25);
  const pink = material(0xf08f91);
  const shade = material(new T.Color(profile.fur).multiplyScalar(.73));
  if (profile.species==='parrot' || profile.species==='lizard') {
    return createFeatheredOrScaled(profile,root,fur,pale,dark,shade);
  }
  const cat = profile.species === 'cat';
  const hamster=profile.species==='hamster';
  const body = sphere(root,fur,0,.64,-.12,hamster ? [.59,.56,.55] : [.51,.49,.72]);
  if (profile.pattern === 'tuxedo') sphere(root,pale,0,.66,.43,[.34,.37,.23]);
  if (profile.pattern === 'spots') {
    sphere(body,shade,.72,.13,.18,[.34,.48,.43]);
    sphere(body,shade,-.72,.23,-.25,[.35,.46,.34]);
  }
  const head = new T.Group();
  head.position.set(0,1.12,.49);
  root.add(head);
  sphere(head,fur,0,0,0,hamster ? [.56,.49,.47] : [.56,.48,.46]);
  const eyes = [];
  for (const side of [-1,1]) {
    const ear = hamster ? sphere(head,pink,side*.35,profile.ears==='folded'?.31:.42,.02,[.15,.15,.09]) : profile.ears === 'folded'
      ? sphere(head,shade,side*.45,.27,.02,[.18,.3,.14])
      : piece(head,new T.ConeGeometry(.2,cat?.46:.38,5),shade,side*.33,.38,-.015);
    ear.rotation.z = -side*.27;
    if (cat && profile.ears === 'upright') {
      piece(head,new T.ConeGeometry(.105,.27,4),pink,side*.34,.38,.105).rotation.z = -side*.27;
    }
    eyes.push(glossyEye(head,dark,pale,side*.22,.045,.409,[.058,.073,.04]));
    const eyebrow=sphere(head,shade,side*.224,.163,.394,[.068,.021,.021]);
    eyebrow.rotation.z=side*.15;
    if (hamster) sphere(head,pale,side*.265,-.145,.34,[.237,.185,.17]);
    if (cat) {
      for (const offset of [-1,1]) {
        const whisker = sphere(head,pale,side*.42,-.09+offset*.045,.37,[.13,.009,.009]);
        whisker.rotation.z = side*offset*.16;
      }
    }
  }
  sphere(head,pale,0,-.13,.358,[.25,.17,.17]);
  sphere(head,dark,0,-.08,.506,[cat || hamster ? .064 : .099,.061,.049]);
  sphere(head,pale,-.021,-.061,.544,[.021,.009,.006]);
  for (const side of [-1,1]) {
    for (let dot=0;dot<3;dot++) sphere(head,shade,side*(.123+dot*.031),-.12-dot*.018,.498-dot*.012,[.013,.012,.01]);
  }
  const mouth = sphere(head,pink,0,-.205,.49,[.07,.045,.032]);
  const legs = [];
  for (const x of [-.32,.32]) {
    for (const z of [-.45,.31]) {
      const leg = new T.Group();
      leg.position.set(x,.48,z);
      root.add(leg);
      sphere(leg,fur,0,-.19,0,[.144,.25,.15]);
      const pawColor=profile.pattern === 'tuxedo' ? pale : fur;
      sphere(leg,pawColor,0,-.36,.06,[.15,.12,.19]);
      for (let toe=-1;toe<=1;toe++) {
        sphere(leg,pawColor,toe*.072,-.374,.197,[.05,.056,.068]);
      }
      legs.push(leg);
    }
  }
  const tail = new T.Group();
  tail.position.set(0,.64,-.67);
  root.add(tail);
  const points = {
    short: [[0,0,0],[0,.18,-.22],[0,.32,-.26]],
    long: [[0,0,0],[.08,.28,-.36],[.05,.54,-.6],[.02,.69,-.81]],
    curled: [[0,0,0],[.08,.32,-.22],[.05,.59,-.34],[.02,.67,-.17],[0,.55,-.06]]
  };
  const curve = new T.CatmullRomCurve3(points[profile.tail].map(value => new T.Vector3(...value).multiplyScalar(hamster ? .38 : 1)));
  piece(tail,new T.TubeGeometry(curve,12,hamster ? .066 : cat ? .072 : .11,7,false),fur,0,0,0);
  const scale = {small:.79,medium:1,large:1.2}[profile.size];
  root.scale.setScalar(scale);
  return {root,head,tail,legs,eyes,mouth,scale};
}
