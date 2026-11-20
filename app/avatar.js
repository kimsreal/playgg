import * as T from './vendor/three.module.min.js';

const material = color => new T.MeshStandardMaterial({color, flatShading:true});
function piece(parent, geometry, shade, x, y, z, scale = [1,1,1]) {
  const mesh = new T.Mesh(geometry, shade);
  mesh.position.set(x,y,z);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}
const sphere = (parent, shade, x,y,z,scale) =>
  piece(parent,new T.SphereGeometry(1,12,8),shade,x,y,z,scale);

export function createAvatar(profile) {
  const root = new T.Group();
  const fur = material(profile.fur);
  const pale = material(0xffeed6);
  const dark = material(0x3c2c25);
  const pink = material(0xf08f91);
  const shade = material(new T.Color(profile.fur).multiplyScalar(.73));
  const cat = profile.species === 'cat';
  const body = sphere(root,fur,0,.64,-.12,[.51,.49,.72]);
  if (profile.pattern === 'tuxedo') sphere(root,pale,0,.66,.43,[.34,.37,.23]);
  if (profile.pattern === 'spots') {
    sphere(body,shade,.72,.13,.18,[.34,.48,.43]);
    sphere(body,shade,-.72,.23,-.25,[.35,.46,.34]);
  }
  const head = new T.Group();
  head.position.set(0,1.12,.49);
  root.add(head);
  sphere(head,fur,0,0,0,[.56,.48,.46]);
  const eyes = [];
  for (const side of [-1,1]) {
    const ear = profile.ears === 'folded'
      ? sphere(head,shade,side*.45,.27,.02,[.18,.3,.14])
      : piece(head,new T.ConeGeometry(.2,cat?.46:.38,5),shade,side*.33,.38,-.015);
    ear.rotation.z = -side*.27;
    if (cat && profile.ears === 'upright') {
      piece(head,new T.ConeGeometry(.105,.27,4),pink,side*.34,.38,.105).rotation.z = -side*.27;
    }
    eyes.push(sphere(head,dark,side*.22,.045,.409,[.058,.073,.04]));
    sphere(head,dark,side*.22+.015,.064,.443,[.018,.018,.012]).material = pale;
    if (cat) {
      for (const offset of [-1,1]) {
        const whisker = piece(head,new T.BoxGeometry(.24,.014,.014),shade,side*.42,-.09+offset*.045,.37);
        whisker.rotation.z = side*offset*.16;
      }
    }
  }
  sphere(head,pale,0,-.13,.358,[.25,.17,.17]);
  sphere(head,dark,0,-.08,.506,[cat?.064:.099,.061,.049]);
  const mouth = sphere(head,pink,0,-.205,.49,[.07,.045,.032]);
  const legs = [];
  for (const x of [-.32,.32]) {
    for (const z of [-.45,.31]) {
      const leg = new T.Group();
      leg.position.set(x,.48,z);
      root.add(leg);
      sphere(leg,fur,0,-.19,0,[.144,.25,.15]);
      sphere(leg,profile.pattern === 'tuxedo' ? pale : fur,0,-.36,.06,[.15,.12,.19]);
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
  const curve = new T.CatmullRomCurve3(points[profile.tail].map(value => new T.Vector3(...value)));
  piece(tail,new T.TubeGeometry(curve,12,cat?.072:.11,7,false),fur,0,0,0);
  const scale = {small:.79,medium:1,large:1.2}[profile.size];
  root.scale.setScalar(scale);
  return {root,head,tail,legs,eyes,mouth,scale};
}
