import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

let model;
export function loadOwnerModel() {
  if (!model) {
    model=new GLTFLoader().loadAsync(new URL('./models/hood_character.glb',import.meta.url).href)
      .then(({scene}) => scene)
      .catch(() => {
        model=null;
        return null;
      });
  }
  return model;
}

export function buildOwnerModel(source,colors) {
  const root=new T.Group();
  const scale=1.72/4.22;
  const upright=new T.Matrix4().makeRotationX(-Math.PI/2).premultiply(new T.Matrix4().makeScale(scale,scale,scale));
  function joint(x,y) {
    const group=new T.Group();
    group.position.set(x*scale,y*scale,0);
    root.add(group);
    return group;
  }
  const head=joint(0,2.55);
  const sides=[-1,1];
  const arms=sides.map(side => joint(side*.61,2.28));
  const legs=sides.map(side => joint(side*.29,1.32));
  source.updateMatrixWorld(true);
  source.traverse(part => {
    if (!part.isMesh) return;
    const name=part.name;
    const side=name.endsWith('-1') ? 0 : 1;
    const isHead=/^(head_hood|hood_chin|face|eye|blush)/.test(name);
    const isArm=/^(sleeve|cuff|hand)/.test(name);
    const isLeg=/^(shorts|leg)/.test(name);
    const parent=isHead ? head : isArm ? arms[side] : isLeg ? legs[side] : root;
    const geometry=part.geometry.clone().applyMatrix4(part.matrixWorld).applyMatrix4(upright);
    geometry.translate(-parent.position.x,-parent.position.y,-parent.position.z);
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();
    const swatch=name.startsWith('shorts') ? colors.pants
      : /^(face$|hand|leg|blush|face_shadow)/.test(name) ? colors.skin
      : name.startsWith('eye') ? null : colors.hoodie;
    const shade=new T.MeshStandardMaterial({roughness:.64,vertexColors:!swatch});
    if (swatch) {
      shade.color.set(swatch);
      if (name.startsWith('blush')) shade.color.lerp(new T.Color('#e67d85'),.4);
      if (name==='face_shadow') shade.color.multiplyScalar(.32);
      if (/^(hem|cuff|hood_chin)/.test(name)) shade.color.multiplyScalar(.89);
    }
    parent.add(new T.Mesh(geometry,shade));
  });
  return {root,head,arms,legs};
}
