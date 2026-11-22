import * as T from './vendor/three.module.min.js';

export const coast={radius:4.6,sky:0xffd4b4};

export function makeCoast(scene,theme,obstacles) {
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

  // The sand and water share a ground plane so both halves remain walkable.
  const water=new T.ShaderMaterial({
    uniforms:{clock:{value:0}},
    vertexShader:`
      varying vec2 ground;
      void main() {
        ground=vec2(position.x,-position.y);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      uniform float clock;
      varying vec2 ground;

      float grain(vec2 p) {
        return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
      }

      void main() {
        float x=ground.x;
        float shore=ground.y+.38*x-.32*sin(x*1.05)+1.2;
        float tide=.10*sin(clock*1.55+x*.8)+.045*sin(x*3.6-clock*.9);
        float depth=tide-shore;
        if (depth<-.15) discard;

        vec3 wetSand=vec3(.84,.66,.49);
        vec3 shallow=vec3(.53,.84,.79);
        vec3 deep=vec3(.27,.61,.74);
        vec3 color=mix(wetSand,shallow,smoothstep(-.11,.43,depth));
        color=mix(color,deep,smoothstep(.42,3.8,depth));

        float fleck=grain(floor(ground*90.0));
        color+=(fleck-.5)*.032;
        float drift=clock*1.45;
        float crest=sin(depth*10.0+sin(x*2.0+drift*.35)*1.3+
                        sin(x*4.6+depth*2.7)*.42-drift);
        float crossWave=sin(depth*15.0-x*2.2+sin(x*3.1+depth*2.1)*.8-drift*.64);
        float patches=smoothstep(-.36,.83,sin(x*1.55+depth*3.0)+.38*sin(x*5.2-depth));
        float ripples=smoothstep(.83,.985,crest)*patches*.24;
        ripples+=smoothstep(.94,.998,crossWave)*(1.0-patches)*.13;
        color=mix(color,vec3(.83,.96,.98),ripples*smoothstep(.4,1.3,depth));

        float surfWidth=.075+.054*(.5+.5*sin(x*4.3+clock*.9));
        float lip=1.0-smoothstep(.018,surfWidth,abs(depth-.031));
        float laceDepth=depth-.29+.093*sin(x*3.4+clock*.85)+.037*sin(x*8.2-clock);
        float lace=1.0-smoothstep(.018,.067,abs(laceDepth));
        float gaps=smoothstep(-.55,.73,sin(x*3.1+clock*.7)+.44*sin(x*7.4));
        float bubbles=smoothstep(.84,.98,fleck)*(1.0-smoothstep(.12,.58,abs(depth-.19)));
        float foam=lip*.89+lace*gaps*.54+bubbles*.27;
        color=mix(color,vec3(1.0,.985,.925),min(foam,1.0));

        gl_FragColor=vec4(color,smoothstep(-.15,-.07,depth));
      }`,
    transparent:true
  });
  // Draw the water above contact shadows and write its depth before they render.
  const waterSurface=add(new T.CircleGeometry(radius,64),water,0,.015,0);
  waterSurface.rotation.x=-Math.PI/2;
  waterSurface.renderOrder=-1;

  const sunShade=new T.MeshStandardMaterial({
    color:0xffd997,emissive:0xffb960,emissiveIntensity:.55,roughness:1
  });
  add(new T.SphereGeometry(.64,24,16),sunShade,2.45,2.05,-4.45);

  const bark=material(0xb17c57);
  const leaves=[material(0x6b9b78),material(0x8cb17e)];
  for (const [x,z,lean] of [[-3.25,1.67,-.24],[3.16,.06,.21]]) {
    obstacles.push([x,z,.2]);
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

  const mat=new T.Group();
  mat.position.set(-1.88,0,1.35);
  mat.rotation.y=.24;
  scene.add(mat);
  const linen=material(0xffefd6);
  const blue=material(0x4685c4);
  const width=1.6;
  const length=1.18;
  add(new T.BoxGeometry(width,.011,length),linen,0,0,0,mat);
  const stripe=new T.PlaneGeometry(.13,length);
  for (const x of [-.64,-.32,0,.32,.64]) {
    add(stripe,blue,x,.007,0,mat).rotation.x=-Math.PI/2;
  }
  const tassel=new T.BoxGeometry(.12,.008,.022);
  for (const side of [-1,1]) {
    for (let i=0;i<16;i++) {
      const thread=add(tassel,linen,side*(width/2+.035),0,-.54+i*.072,mat);
      thread.rotation.y=Math.sin(i*2.4)*.24;
    }
  }

  const coconut=new T.Group();
  coconut.position.set(.27,.007,-.14);
  mat.add(coconut);
  const huskProfile=[[0,0],[.14,0],[.21,.07],[.24,.17],[.22,.26],[.15,.33]];
  const husk=new T.LatheGeometry(huskProfile.map(([r,y])=>new T.Vector2(r,y)),12);
  add(husk,material(0x91a75c),0,0,0,coconut);
  add(new T.CylinderGeometry(.15,.15,.014,12),linen,0,.33,0,coconut);
  add(new T.CylinderGeometry(.058,.058,.004,12),material(0x805c3b),.034,.339,0,coconut);
  const straw=new T.TubeGeometry(new T.CatmullRomCurve3([
    new T.Vector3(.035,.331,0),
    new T.Vector3(.028,.48,0),
    new T.Vector3(.008,.53,0),
    new T.Vector3(-.085,.57,0)
  ]),12,.017,8);
  add(straw,material(0xe67979),0,0,0,coconut);

  const shellColors=[material(0xffead1),material(0xf1a997),material(0xd58e82)];
  for (let i=0;i<22;i++) {
    if (i===1 || i===9) continue; // Keep the two spots next to the mat clear.
    const angle=i*2.39996;
    const distance=2.95+.31*(i%4);
    const x=Math.cos(angle)*distance;
    const z=Math.sin(angle)*distance;
    if (z+.38*x-.32*Math.sin(x*1.05)+1.2<.32) continue;
    const shell=add(new T.SphereGeometry(.12,9,5,0,Math.PI*2,0,Math.PI/2),shellColors[i%3],x,.007,z);
    shell.scale.set(1.18,.52,.83);
    shell.rotation.y=angle;
  }

  return time => {
    water.uniforms.clock.value=time;
  };
}
