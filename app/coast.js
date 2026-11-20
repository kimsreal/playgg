import * as T from './vendor/three.module.min.js';

export const coast={radius:4.6,sky:0xffd4b4};

export function makeCoast(scene,theme) {
  const {radius}=theme;
  const material=color=>new T.MeshStandardMaterial({color,roughness:.88,flatShading:true});
  function add(geometry,shade,x,y,z,parent=scene) {
    const part=new T.Mesh(geometry,shade);
    part.position.set(x,y,z);
    parent.add(part);
    return part;
  }
  add(new T.CylinderGeometry(radius,radius*.98,.25,64),material(0xf3c88c),0,-.131,0);
  add(new T.CylinderGeometry(radius*.98,radius*.93,.36,64),material(0xd9a473),0,-.43,0);

  // Fade the edge of the water into the painted horizon behind the scene.
  const water=new T.ShaderMaterial({
    uniforms:{clock:{value:0}},
    vertexShader:`
      varying vec2 shore;
      void main() {
        shore=position.xy;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      uniform float clock;
      varying vec2 shore;
      void main() {
        float distanceFromCenter=length(shore);
        float ripples=.5+.5*sin(shore.y*9.0+sin(shore.x*1.75)*1.1-clock*1.8);
        float depth=smoothstep(4.45,10.0,distanceFromCenter);
        vec3 color=mix(vec3(.56,.81,.76),vec3(.39,.59,.72),depth);
        color+=ripples*.028;
        gl_FragColor=vec4(color,1.0-smoothstep(7.8,15.0,distanceFromCenter));
      }`,
    transparent:true,depthWrite:false
  });
  add(new T.CircleGeometry(16,96),water,0,-.46,0).rotation.x=-Math.PI/2;

  const foam=new T.MeshBasicMaterial({color:0xfff4dc,transparent:true,opacity:.63,depthWrite:false});
  const breakers=add(new T.RingGeometry(radius-.09,radius+.04,80),foam,0,.012,0);
  breakers.rotation.x=-Math.PI/2;
  const shallows=add(new T.RingGeometry(radius+.1,radius+.15,80),foam,0,-.39,0);
  shallows.rotation.x=-Math.PI/2;
  for (let i=0;i<35;i++) {
    const angle=i*2.39996;
    const distance=5.15+(i%9)*.57;
    const glint=add(new T.PlaneGeometry(.35+(i%5)*.22,.026),foam,Math.cos(angle)*distance,-.40,Math.sin(angle)*distance);
    glint.rotation.x=-Math.PI/2;
  }

  const bark=material(0xb17c57);
  const leaves=[material(0x6b9b78),material(0x8cb17e)];
  for (const [x,z,lean] of [[-2.85,-1.55,-.24],[2.48,-2.2,.21]]) {
    const trunk=add(new T.CylinderGeometry(.09,.16,1.85,8),bark,x,.9,z);
    trunk.rotation.z=lean;
    const crown=add(new T.IcosahedronGeometry(.19,1),leaves[0],x-Math.sin(lean)*.9,1.79,z);
    const frond=new T.Shape();
    frond.moveTo(0,0);
    frond.quadraticCurveTo(.58,.54,1.21,-.18);
    frond.quadraticCurveTo(.49,.12,0,0);
    const geometry=new T.ExtrudeGeometry(frond,{depth:.07,bevelEnabled:false,curveSegments:8});
    for (let i=0;i<7;i++) {
      const leaf=add(geometry,leaves[i%2],0,0,0,crown);
      leaf.rotation.y=i*Math.PI*2/7;
    }
  }

  const shellColors=[material(0xffead1),material(0xf1a997),material(0xd58e82)];
  for (let i=0;i<22;i++) {
    const angle=i*2.39996;
    const distance=2.95+.31*(i%4);
    const shell=add(new T.SphereGeometry(.12,9,5,0,Math.PI*2,0,Math.PI/2),shellColors[i%3],
      Math.cos(angle)*distance,.007,Math.sin(angle)*distance);
    shell.scale.set(1.18,.52,.83);
    shell.rotation.y=angle;
  }

  return time => {
    water.uniforms.clock.value=time;
    shallows.scale.setScalar(1+Math.sin(time*1.15)*.019);
    foam.opacity=.58+Math.sin(time*1.4)*.1;
  };
}
