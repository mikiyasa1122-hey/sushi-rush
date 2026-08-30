import type { SushiId } from '../game/types';

const TOPPINGS: Record<Exclude<SushiId, 'ikura' | 'uni' | 'kappa' | 'tekka'>, { fill: string; accent: string; path: string }> = {
  maguro: { fill: '#d92f3d', accent: '#ff7780', path: 'M18 29 Q55 7 102 24 L96 47 Q55 35 23 52Z' },
  salmon: { fill: '#f56c3f', accent: '#ffd0a1', path: 'M16 30 Q56 7 104 25 L97 49 Q54 35 22 53Z' },
  ebi: { fill: '#ff927c', accent: '#fff1df', path: 'M20 33 Q52 5 96 26 Q109 34 100 44 Q61 35 28 55Z' },
  tamago: { fill: '#f4ca31', accent: '#ffe983', path: 'M15 28 Q58 12 105 28 L99 52 Q57 42 20 55Z' },
  ika: { fill: '#eef5ec', accent: '#b9dadd', path: 'M17 29 Q59 9 103 27 L98 51 Q55 39 21 54Z' },
  tako: { fill: '#c54d67', accent: '#fff1df', path: 'M20 31 Q60 8 101 27 L96 51 Q55 38 24 54Z' },
  hamachi: { fill: '#e4b86d', accent: '#fff0bd', path: 'M17 30 Q57 9 103 26 L96 49 Q55 37 21 54Z' },
  anago: { fill: '#9a4c2e', accent: '#e59654', path: 'M15 29 Q57 8 104 26 L98 51 Q55 38 20 55Z' },
};

export function SushiArt({ id, name, className = '' }: { id: SushiId; name: string; className?: string }) {
  if (id === 'ikura' || id === 'uni') return <Gunkan id={id} name={name} className={className} />;
  if (id === 'kappa' || id === 'tekka') return <Maki id={id} name={name} className={className} />;
  const top = TOPPINGS[id];
  return <svg className={`sushi-art ${className}`} role="img" aria-label={`${name}の寿司`} viewBox="0 0 120 80">
    <defs><filter id={`shadow-${id}`}><feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".3" /></filter></defs>
    <g filter={`url(#shadow-${id})`}><path d="M27 41 Q57 30 93 41 L89 65 Q58 76 30 63Z" fill="#fff7e5" stroke="#d8c7a9" strokeWidth="2" />
    <path d={top.path} fill={top.fill} stroke="#72271f" strokeWidth="2" />
    {id === 'salmon' && [31,46,61,76,91].map((x) => <path key={x} d={`M${x} 24l-8 22`} stroke={top.accent} strokeWidth="3" />)}
    {id === 'maguro' && <path d="M32 31Q58 19 88 29" fill="none" stroke={top.accent} strokeWidth="2" />}
    {id === 'ebi' && <><path d="M35 30l8 18M51 23l8 23M68 21l7 23M84 24l7 20" stroke={top.accent} strokeWidth="4" /><path d="M98 31l15-9-6 16 7 8-17-3" fill="#f06e58" /></>}
    {id === 'tamago' && <path d="M58 19v39" stroke="#1d1715" strokeWidth="10" />}
    {id === 'ika' && <path d="M31 30Q58 20 89 29M27 38Q58 29 94 36" fill="none" stroke={top.accent} strokeWidth="2" />}
    {id === 'tako' && [38,58,78].map((x) => <circle key={x} cx={x} cy="34" r="4" fill={top.accent} />)}
    {id === 'hamachi' && <path d="M25 40Q57 18 96 35" fill="none" stroke="#b77b45" strokeWidth="3" />}
    {id === 'anago' && <><path d="M28 28l5 22M45 22l5 24M63 20l5 25M81 22l5 23" stroke={top.accent} strokeWidth="2" /><path d="M24 35Q58 27 98 36" fill="none" stroke="#542919" strokeWidth="2" /></>}
    </g></svg>;
}

function Gunkan({ id, name, className }: { id: 'ikura' | 'uni'; name: string; className: string }) {
  const pieces = id === 'ikura' ? [[45,27],[60,23],[75,28],[52,36],[68,36],[83,34]] : [[44,27],[59,23],[74,27],[51,35],[67,34],[81,35]];
  return <svg className={`sushi-art ${className}`} role="img" aria-label={`${name}の寿司`} viewBox="0 0 120 80"><path d="M27 42Q59 31 92 42L88 65Q58 75 30 63Z" fill="#fff6e4" stroke="#d7c6a7" strokeWidth="2"/><path d="M24 28Q58 18 96 29L92 61Q57 70 27 60Z" fill="#18231e" stroke="#080d0b" strokeWidth="3"/><ellipse cx="60" cy="30" rx="36" ry="14" fill={id==='ikura'?'#f48328':'#ebb83c'} />{pieces.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={id==='ikura'?7:8} fill={id==='ikura'?'#ff7831':'#e7ae2d'} stroke={id==='ikura'?'#c83d20':'#c98c1f'} strokeWidth="2"/>)}</svg>;
}

function Maki({ id, name, className }: { id: 'kappa' | 'tekka'; name: string; className: string }) {
  return <svg className={`sushi-art ${className}`} role="img" aria-label={`${name}の寿司`} viewBox="0 0 120 80">{[35,60,85].map((x,i)=><g key={x} transform={`translate(${x} ${34+i%2*7})`}><circle r="22" fill="#17231d" stroke="#070c09" strokeWidth="3"/><circle r="15" fill="#fff4dc"/><circle r="8" fill={id==='kappa'?'#63a93f':'#c92f3e'}/>{id==='kappa'&&<path d="M-6-4L6 4M-6 4L6-4" stroke="#b8dd6d" strokeWidth="2"/>}</g>)}</svg>;
}
