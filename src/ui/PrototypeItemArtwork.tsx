import { useId } from 'react';

import type { ItemKind } from '../cases/chuzhoe-alibi/items';

export function PrototypeItemArtwork({ kind, detail = false }: { kind: ItemKind; detail?: boolean }) {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 640 360" className={'item-artwork item-artwork-' + kind} role="img" aria-label={kind === 'wrench' ? 'Крупный план металлического ключа' : kind === 'button' ? 'Крупный план тёмной пуговицы' : 'Пальто с повреждённым креплением'}>
    <defs>
      <linearGradient id={id + 'ground'} x2="1" y2="1"><stop stopColor="#556052"/><stop offset="1" stopColor="#293c32"/></linearGradient>
      <linearGradient id={id + 'metal'} x2="0.2" y2="1"><stop stopColor="#c6c8b8"/><stop offset=".38" stopColor="#8c9a91"/><stop offset=".6" stopColor="#a5afa1"/><stop offset="1" stopColor="#596e61"/></linearGradient>
      <radialGradient id={id + 'button'} cx=".35" cy=".25"><stop stopColor="#918766"/><stop offset=".5" stopColor="#514e39"/><stop offset="1" stopColor="#292f25"/></radialGradient>
      <linearGradient id={id + 'cloth'} x2="1" y2=".4"><stop stopColor="#586153"/><stop offset=".4" stopColor="#303f35"/><stop offset="1" stopColor="#1e3028"/></linearGradient>
      <pattern id={id + 'weave'} width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0L5 5M5 0L0 5" stroke="#d7cba3" opacity=".1" strokeWidth=".5"/></pattern>
      <filter id={id + 'shadow'}><feDropShadow dx="7" dy="12" stdDeviation="10" floodColor="#091b15" floodOpacity=".5"/></filter>
    </defs>
    <rect width="640" height="360" rx="3" fill={'url(#' + id + 'ground)'}/>
    <path d="M0 90L640 10M0 265L640 180M0 341L640 277" stroke="#7b8268" opacity=".1" strokeWidth="2"/>
    {kind === 'button' && <g transform={detail ? 'translate(-115 -95) scale(1.35)' : undefined}>
      <ellipse cx="334" cy="265" rx="106" ry="22" fill="#12271b" opacity=".45"/>
      <circle cx="320" cy="173" r="105" fill={'url(#' + id + 'button)'} stroke="#a39872" strokeWidth="4" filter={'url(#' + id + 'shadow)'}/>
      <circle cx="320" cy="173" r="89" fill="none" stroke="#b0a37d" strokeWidth="1.4" opacity=".7"/>
      <circle cx="320" cy="173" r="80" fill="none" stroke="#1e2920" strokeWidth="2"/>
      {[[303, 155], [337, 155], [303, 189], [337, 189]].map(([x, y]) => <g key={x + ':' + y}><circle cx={x + 1} cy={y + 1} r="6.8" fill="#91866a"/><circle cx={x} cy={y} r="5.4" fill="#1b281f"/></g>)}
      <path d="M302 156Q318 204 337 190L363 213Q380 230 395 214M303 188L337 155Q358 152 368 139" fill="none" stroke="#b9aa87" strokeWidth="2.4"/>
      <path d="M365 213L385 224M363 215L374 236M367 211L388 208" stroke="#c1b08c" strokeWidth="1.2"/>
      <path d="M405 144l12 3M237 190l8-2M330 71l5 5" stroke="#d6c496" opacity=".6"/>
    </g>}
    {kind === 'wrench' && <g transform={detail ? 'translate(-115 -75) scale(1.3)' : 'rotate(-13 320 180)'}>
      <path d="M84 153L113 111 151 102 177 130 162 154 135 147 126 164 146 181 171 170 190 190 466 190 483 168 519 167 551 197 541 229 506 241 481 222 186 221 165 244 119 239 87 204Z" fill={'url(#' + id + 'metal)'} stroke="#b8c0ae" strokeWidth="2" filter={'url(#' + id + 'shadow)'}/>
      <path d="M199 200H455" stroke="#415b4c" strokeWidth="8" strokeLinecap="round"/>
      <path d="M201 199H455" stroke="#c2cab8" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M100 156L115 119 149 110M123 232L162 235 181 215" stroke="#d2d5c5" strokeWidth="2" fill="none" opacity=".6"/>
      <g fill="#654b39" opacity=".85"><ellipse cx="167" cy="190" rx="21" ry="10"/><circle cx="152" cy="206" r="5"/><circle cx="183" cy="169" r="4"/><circle cx="207" cy="184" r="2.6"/><circle cx="218" cy="213" r="2"/></g>
      <g stroke="#516450" strokeWidth=".9" opacity=".75" fill="none"><path d="M340 182q20-9 38 0M344 186q18-10 34 0M346 190q15-9 29 0M348 194q13-8 24 0M350 198q10-7 18 0"/></g>
      <path d="M496 185l26 0 13 18-6 16-23 7-15-12z" fill="#3b5243" stroke="#c0c8b5" strokeWidth="2"/>
    </g>}
    {kind === 'coat' && <g transform={detail ? 'translate(-440 -90) scale(2.25)' : 'translate(145 -10) scale(.72)'}>
      <path d="M160 44L223 22 249 35 275 22 340 44 395 198 349 220 322 150 343 476 156 476 175 150 148 220 105 198Z" fill={'url(#' + id + 'cloth)'} stroke="#a59c7b" strokeWidth="2" filter={'url(#' + id + 'shadow)'}/>
      <path d="M160 44L223 22 249 35 275 22 340 44 395 198 349 220 322 150 343 476 156 476 175 150 148 220 105 198Z" fill={'url(#' + id + 'weave)'}/>
      <path d="M222 24L250 135 194 91 209 70M276 24L250 135 310 91 294 70M250 135V476" fill="none" stroke="#8c9378" strokeWidth="2"/>
      <path d="M202 285l29 3-4 48-30-4M276 288l31-3 5 47-31 5" fill="none" stroke="#657b64" strokeWidth="1.7"/>
      {[175, 325, 398].map(y => <g key={y}><circle cx="269" cy={y} r="8" fill="#777459" stroke="#aa9a70"/><path d={'M266 ' + (y - 2) + 'l5 4m-5 0l5-4'} stroke="#d1c19a" strokeWidth=".8"/></g>)}
      <path d="M260 246q7-9 16 0m-13-5l-5 14m10-13l7 12m-9-9l-3 16" stroke="#b5ac8d" strokeWidth="1.2" fill="none"/>
      <path d="M263 243Q280 255 294 242" stroke="#6d7b62" strokeWidth=".8" fill="none"/>
    </g>}
    <path d="M24 28h32M24 28v22M616 28h-32M616 28v22M24 332h32M24 332v-22M616 332h-32M616 332v-22" stroke="#b7b38c" opacity=".35" fill="none"/>
  </svg>;
}
