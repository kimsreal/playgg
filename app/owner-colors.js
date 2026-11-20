export const ownerDefaults={hoodie:'#ede8e3',pants:'#999492',skin:'#f6d6c6'};

export function ownerColors(value) {
  return Object.fromEntries(Object.entries(ownerDefaults).map(([part,fallback]) => {
    const color=value?.[part];
    return [part,typeof color==='string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback];
  }));
}
