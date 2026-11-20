const shapes=[
  ['ball',/^(공|공놀이|축구공|테니스공)$|공놀이|볼놀이/],
  ['fish',/생선|물고기|참치|연어/],
  ['meat',/고기|닭가슴살|닭고기|육포/],
  ['bath',/목욕|샤워|욕조/],
  ['vacuum',/청소기|진공청소/],
  ['tube',/치약|연고/],
  ['bag',/비닐|봉지/],
];

export function itemShape(name) {
  const key=name.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  const match=shapes.find(([,pattern])=>pattern.test(key));
  if (match) return match[0];
  let hash=2166136261;
  for(const character of key) hash=Math.imul(hash^character.codePointAt(0),16777619);
  return 'gift-'+((hash>>>0)%3);
}
