import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

let model;
export function loadOwnerModel() {
  if (!model) {
    model=new GLTFLoader().loadAsync(new URL('./models/hood_character_detailed.glb',import.meta.url).href)
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
  const ground=-.04;
  const scale=1.72/(3.78-ground);
  const upright=new T.Matrix4().makeRotationX(-Math.PI/2).premultiply(new T.Matrix4().makeScale(scale,scale,scale));
  upright.setPosition(0,-ground*scale,0);
  function joint(x,y) {
    const group=new T.Group();
    group.position.set(x*scale,(y-ground)*scale,0);
    root.add(group);
    return group;
  }
  const head=joint(0,2.15);
  const sides=[-1,1];
  const arms=sides.map(side => joint(side*.43,1.88));
  const legs=sides.map(side => joint(side*.285,1.12));
  source.updateMatrixWorld(true);
  source.traverse(part => {
    if (!part.isMesh) return;
    const name=part.name;
    const side=name.endsWith('-1') ? 0 : 1;
    const isHead=/^(sculpted_hood|hood_face|face|eye|blush)/.test(name);
    const isArm=/^(puffy_sleeve|sleeve_rounding|wrist_cuff|tiny_hand)/.test(name);
    const isLeg=/^(shorts_leg|rounded_leg)/.test(name);
    const parent=isHead ? head : isArm ? arms[side] : isLeg ? legs[side] : root;
    const geometry=part.geometry.clone().applyMatrix4(part.matrixWorld).applyMatrix4(upright);
    geometry.translate(-parent.position.x,-parent.position.y,-parent.position.z);
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();
    const swatch=name.startsWith('shorts') ? colors.pants
      : /^(face$|tiny_hand|rounded_leg|blush)/.test(name) ? colors.skin
      : name.startsWith('eye') ? null : colors.hoodie;
    const shade=new T.MeshStandardMaterial({roughness:.64,vertexColors:!swatch});
    if (swatch) {
      shade.color.set(swatch);
      if (name.startsWith('blush')) shade.color.lerp(new T.Color('#e67d85'),.4);
      if (/^(bottom_hem|wrist_cuff|hood_face|front_neck)/.test(name)) shade.color.multiplyScalar(.89);
    }
    parent.add(new T.Mesh(geometry,shade));
  });
  return {root,head,arms,legs};
}
