export const themes={
  meadow:{name:'초원',price:0},
  coast:{name:'노을 바다',price:50,preview:'coast-preview.webp?v=89',alt:'구름이 떠 있는 노을 아래 모래사장과 파도가 만나는 해변'},
  walk:{name:'동네 산책길',price:50,preview:'walk-preview.webp?v=81',alt:'가로등과 벤치가 있는 벽돌 산책로'},
  clouds:{name:'구름 위',price:50,alt:'하늘 위에 떠 있는 폭신한 구름'},
  stars:{name:'별빛 초원',price:50,alt:'별과 달이 빛나는 밤의 초원'}
};

export function themeId(value) {
  return Object.hasOwn(themes,value) ? value : 'meadow';
}

export function purchasedThemes(state) {
  const saved=Array.isArray(state?.unlockedThemes) ? state.unlockedThemes : [];
  const owned=state?.coastUnlocked===true || state?.background==='coast' ? [...saved,'coast'] : saved;
  return Object.keys(themes).filter(id=>themes[id].price>0 && owned.includes(id));
}
