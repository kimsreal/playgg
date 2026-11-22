import * as T from './vendor/three.module.min.js';

export function makeRockBase(radius,tones,top=-.061) {
  const segments=64;
  const layers=[
    [1,top,0,0,0],
    [.96,-.34,.035,.025,0],
    [.82,-1.00,.082,.12,-.02],
    [.62,-1.49,.095,.19,-.12],
    [.34,-1.96,.085,.36,-.13],
    [.075,-2.38,.035,.45,-.18]
  ];
  const rings=layers.map(([scale,y,roughness,x,z],layer) =>
    Array.from({length:segments},(_,i) => {
      const angle=i*Math.PI*2/segments;
      const ridge=Math.sin(angle*7)+.46*Math.sin(angle*13+1.4)+.3*Math.cos(angle*19);
      const outline=radius*(scale+roughness*ridge);
      const height=y+roughness*(1.45*Math.sin(angle*5+layer*.64)+.77*Math.cos(angle*9));
      return [x+outline*Math.cos(angle),height,z+outline*Math.sin(angle)];
    }));
  const positions=[];
  const colors=[];
  const stoneTones=tones.map(tone => new T.Color(tone));
  const tint=new T.Color();
  function face(a,b,c,layer,index) {
    positions.push(...a,...b,...c);
    const depth=Math.min(layer,stoneTones.length-1);
    tint.copy(stoneTones[depth]).multiplyScalar(1+.073*Math.sin(index*2.39)+.045*Math.cos(index*.66));
    for (let vertex=0;vertex<3;vertex++) colors.push(tint.r,tint.g,tint.b);
  }
  for (let layer=0;layer<rings.length-1;layer++) {
    const top=rings[layer];
    const bottom=rings[layer+1];
    for (let i=0;i<segments;i++) {
      const next=(i+1)%segments;
      face(top[i],top[next],bottom[i],layer,i);
      face(top[next],bottom[next],bottom[i],layer,i+13);
    }
  }
  const bottom=rings[rings.length-1];
  for (let i=0;i<segments;i++) {
    face(bottom[i],bottom[(i+1)%segments],[.45,-2.46,-.18],5,i);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.96}));
}
