'use strict';

/* ============================================================
   将星图鉴 · 图版
   两套图版语言：
   1. plate —— 公有领域清代刻本 / 颐和园长廊彩绘，做纸本图版；
   2. scene —— 以纸雕剪影重绘的史事场景，不冒充古画。
   ============================================================ */

(() => {
  let seq = 0;
  const PAPER = '#e8dcc2';
  const INK = '#1a1610';
  const GOLD = '#b98a3e';

  const FACTION = {
    wei: { ink: '#1d2433', accent: '#3f5f91', pale: '#c9d3df', seal: '#7d2f25' },
    shu: { ink: '#1b2a22', accent: '#356a50', pale: '#c9d9c8', seal: '#8a3126' },
    wu: { ink: '#2b1d17', accent: '#9a452f', pale: '#e2cbb8', seal: '#8f3222' },
    qun: { ink: '#2a2317', accent: '#8b6a2c', pale: '#dccda9', seal: '#7e2e22' },
  };

  function hash(text) {
    let h = 0;
    for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function skyDefs(id, top, bottom) {
    return `<linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="sun-${id}" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#f6e7c8" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#e8c58b" stop-opacity=".55"/>
      <stop offset="1" stop-color="#e8c58b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${INK}" stop-opacity="0"/>
      <stop offset=".72" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="1" stop-color="${INK}" stop-opacity=".38"/>
    </linearGradient>`;
  }

  function mountains(id, ink, accent, dense = 1) {
    return `
      <g fill="${ink}" opacity="${0.12 * dense}">
        <path d="M-20 520 L70 380 L112 440 L170 330 L232 448 L286 396 L350 512 L420 410 L488 500 L552 430 L620 530 V820 H-20Z"/>
      </g>
      <g fill="${accent}" opacity="${0.16 * dense}">
        <path d="M-30 590 L58 470 L104 522 L166 430 L224 536 L300 470 L370 574 L446 492 L512 570 L620 512 V820 H-30Z"/>
      </g>
      <g fill="${ink}" opacity="${0.22 * dense}">
        <path d="M-40 690 C70 640 120 666 190 632 C250 604 300 630 360 606 C440 574 500 616 640 578 V820 H-40Z"/>
      </g>`;
  }

  function mist(id, accent) {
    return `<g fill="${PAPER}" opacity=".28">
      <path d="M-30 540 C70 508 120 566 210 532 C300 498 360 550 450 520 C520 498 580 514 630 500 V590 C540 610 480 574 390 596 C310 616 250 586 170 610 C90 634 30 606 -30 620Z"/>
    </g>
    <g fill="${accent}" opacity=".08">
      <path d="M-30 500 C80 470 140 520 240 492 C330 466 400 506 500 482 C550 470 600 478 630 472 V530 C540 548 470 514 380 538 C300 560 230 528 150 552 C70 576 20 548 -30 562Z"/>
    </g>`;
  }

  function sun(x, y, r, id, color = '#b73b26') {
    return `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="url(#sun-${id})"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity=".82"/>`;
  }

  function ship(x, y, s, ink, accent, sail = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${ink}">
      <path d="M-80 34 C-54 52 54 52 88 30 L70 48 C40 60 -40 60 -66 48Z"/>
      <path d="M-4 -78 L-4 34 L8 34 L8 -78Z"/>
      ${sail ? `<path d="M8 -74 C38 -58 48 -24 44 16 L8 16Z" fill="${accent}" opacity=".8"/>
      <path d="M-4 -66 C-34 -52 -42 -22 -38 12 L-4 12Z" fill="${PAPER}" opacity=".55"/>` : ''}
      <path d="M-70 44 L-120 70 M70 44 L118 68" stroke="${ink}" stroke-width="3" opacity=".55"/>
      <path d="M8 -78 L26 -92 L18 -72Z" fill="${accent}"/>
    </g>`;
  }

  function boat(x, y, s, ink, accent, lantern = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${ink}">
      <path d="M-64 12 C-40 30 40 30 66 10 L54 28 C28 38 -26 38 -52 28Z"/>
      <path d="M0 -34 L0 12 L6 12 L6 -34Z"/>
      <path d="M6 -30 C26 -20 32 -2 28 8 L6 8Z" fill="${accent}" opacity=".7"/>
      ${lantern ? `<circle cx="-28" cy="-14" r="5" fill="#d98a48"/><path d="M-28 -20 L-28 -30" stroke="${ink}" stroke-width="2"/>` : ''}
    </g>`;
  }

  function tent(x, y, s, ink, accent) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-52 26 L0 -34 L52 26Z" fill="${ink}" opacity=".82"/>
      <path d="M-52 26 L52 26" stroke="${ink}" stroke-width="4"/>
      <path d="M0 -34 L0 -52 L18 -46 L0 -40" fill="${accent}" opacity=".8"/>
    </g>`;
  }

  function flame(x, y, s, hot = '#b84026') {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${hot}">
      <path d="M0 30 C-20 12 -22 -14 -6 -30 C-4 -10 6 -6 8 6 C18 -10 18 -22 12 -36 C34 -16 34 14 16 30 C10 38 -8 38 0 30Z" opacity=".85"/>
      <path d="M0 28 C-10 18 -10 2 0 -8 C2 6 12 10 10 22 C8 32 -4 34 0 28Z" fill="#e2a34c" opacity=".8"/>
    </g>`;
  }

  function spearRow(x, y, count, ink, gap = 18, tilt = -6) {
    let out = '';
    for (let i = 0; i < count; i += 1) {
      const dx = x + i * gap;
      out += `<g transform="translate(${dx} ${y + (i % 3) * 5}) rotate(${tilt + (i % 2) * 4})" stroke="${ink}" opacity=".6">
        <path d="M0 0 L0 -96" stroke-width="3"/>
        <path d="M0 -96 L-7 -74 L7 -74Z" fill="${ink}" stroke="none"/>
      </g>`;
    }
    return out;
  }

  function banner(x, y, s, ink, accent) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 0 L0 -130" stroke="${ink}" stroke-width="4"/>
      <path d="M2 -126 L46 -116 L34 -92 L42 -70 L0 -78Z" fill="${accent}" opacity=".85"/>
      <path d="M0 -70 L24 -58 L0 -44Z" fill="${ink}" opacity=".55"/>
    </g>`;
  }

  function cloud(x, y, s, ink, opacity = 0.35) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${ink}" stroke-width="2" opacity="${opacity}">
      <path d="M0 0 C18 -14 38 -4 42 8 C58 -4 82 4 82 20 C100 12 118 20 118 34"/>
      <path d="M12 12 C26 2 42 10 46 20 C60 10 78 18 78 30" opacity=".6"/>
    </g>`;
  }

  function castle(x, y, s, ink, accent) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${ink}">
      <path d="M-180 40 L-180 -46 L-150 -46 L-150 -66 L-130 -66 L-130 -46 L-102 -46 L-102 -66 L-82 -66 L-82 -46 L-54 -46 L-54 -66 L-34 -66 L-34 -46 L-6 -46 L-6 -66 L14 -66 L14 -46 L42 -46 L42 -66 L62 -66 L62 -46 L90 -46 L90 -66 L110 -66 L110 -46 L150 -46 L150 40Z" opacity=".9"/>
      <path d="M-36 40 L-36 4 C-36 -18 36 -18 36 4 L36 40Z" fill="${PAPER}" opacity=".5"/>
      <path d="M-12 40 L-12 12 L12 12 L12 40" fill="${ink}"/>
      <path d="M-80 -46 L-80 -100 L-60 -112 L-40 -100 L-40 -46Z" opacity=".85"/>
      <path d="M40 -46 L40 -110 L58 -122 L76 -110 L76 -46Z" opacity=".85"/>
      <path d="M-88 -100 L-32 -100 M32 -110 L84 -110" stroke="${accent}" stroke-width="5" opacity=".7"/>
    </g>`;
  }

  function pavilion(x, y, s, ink, accent) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${ink}">
      <path d="M-70 0 L70 0 L60 10 L-60 10Z"/>
      <path d="M-56 10 L-56 60 M56 10 L56 60 M-28 10 L-28 60 M28 10 L28 60" stroke="${ink}" stroke-width="5"/>
      <path d="M-86 0 C-62 -26 -40 -30 0 -40 C40 -30 62 -26 86 0Z" fill="${accent}" opacity=".8"/>
      <path d="M-84 0 C-104 -8 -114 -2 -122 10 M84 0 C104 -8 114 -2 122 10" stroke="${ink}" stroke-width="4" fill="none"/>
    </g>`;
  }

  function figures(ink, accent, n = 4, y = 690) {
    let out = '';
    for (let i = 0; i < n; i += 1) {
      const x = 40 + i * 42;
      out += `<g transform="translate(${x} ${y + (i % 2) * 8})" fill="${ink}" opacity=".55">
        <circle cx="0" cy="-54" r="8"/><path d="M-10 -46 C-12 -18 -12 8 -8 26 L8 26 C12 8 12 -18 10 -46Z"/>
      </g>`;
    }
    return out;
  }

  function propLayer(props, faction, key) {
    if (!props || !props.length) return '';
    const f = FACTION[faction] || FACTION.qun;
    const seed = parseInt(hash(key), 36);
    let out = '';
    props.forEach((prop, i) => {
      const x = 60 + ((seed + i * 137) % 470);
      const y = 560 + ((seed * 3 + i * 71) % 120);
      switch (prop) {
        case 'ships':
          out += ship(110 + (i * 190) % 380, 610 + (i % 2) * 40, 0.86, INK, f.accent);
          break;
        case 'boats':
          out += boat(x, y, 0.9, INK, f.accent);
          break;
        case 'tents':
          out += tent(90 + (i * 210) % 420, 640 + (i % 2) * 26, 0.9, INK, f.accent);
          break;
        case 'banners':
          out += banner(70 + (i * 210) % 460, 700, 0.95 + (i % 2) * 0.12, INK, f.accent);
          break;
        case 'spears':
          out += spearRow(50 + (i * 40) % 80, 770, 11, INK, 21, -7);
          break;
        case 'arrows':
          out += `<g stroke="${INK}" stroke-width="2" opacity=".5">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const ax = 70 + ((seed + n * 83) % 470);
            const ay = 120 + ((seed + n * 47) % 380);
            return `<path d="M${ax} ${ay} l-14 28"/><path d="M${ax - 14} ${ay + 28} l-2 -7 l7 2" fill="${INK}" stroke="none"/>`;
          }).join('')}</g>`;
          break;
        case 'cranes':
          out += `<g fill="none" stroke="${INK}" stroke-width="2" opacity=".5">${[0, 1, 2].map((n) => `<path d="M${90 + n * 150} ${170 + (n % 2) * 46} c12 -10 22 -10 34 0 c12 -10 22 -10 34 0"/>`).join('')}</g>`;
          break;
        case 'plum':
          out += `<g stroke="${INK}" stroke-width="4" fill="none" opacity=".6"><path d="M40 620 C110 570 150 520 230 470"/><path d="M130 560 C150 520 180 510 210 500 M90 600 C80 560 60 540 40 520"/></g>
            <g fill="${f.accent}" opacity=".65">${[0, 1, 2, 3, 4, 5].map((n) => `<circle cx="${70 + n * 28}" cy="${590 - n * 22}" r="4"/>`).join('')}</g>`;
          break;
        case 'lanterns':
          out += `<g>${[0, 1, 2].map((n) => `<path d="M${100 + n * 190} 0 v70" stroke="${INK}" stroke-width="2"/><rect x="${84 + n * 190}" y="70" width="32" height="46" rx="6" fill="${f.accent}" opacity=".7"/><path d="M${100 + n * 190} 116 v18" stroke="${INK}" stroke-width="2"/>`).join('')}</g>`;
          break;
        case 'drums':
          out += `<g>${[0, 1].map((n) => `<ellipse cx="${90 + n * 370}" cy="${640 - n * 30}" rx="34" ry="20" fill="${INK}" opacity=".65"/><ellipse cx="${90 + n * 370}" cy="${628 - n * 30}" rx="34" ry="16" fill="${PAPER}" opacity=".3"/><path d="M${90 + n * 370} ${650 - n * 30} v56" stroke="${INK}" stroke-width="5"/>`).join('')}</g>`;
          break;
        case 'gourd':
          out += `<g fill="${f.ink}" opacity=".7"><path d="M420 620 c-14 0 -24 12 -24 26 c0 12 8 20 18 24 l-2 34 c0 12 8 20 18 20 c10 0 18 -8 18 -20 l-2 -34 c10 -4 18 -12 18 -24 c0 -14 -10 -26 -24 -26 c-8 0 -14 4 -18 10 c-4 -6 -10 -10 -18 -10Z"/><path d="M412 616 c0 -18 6 -30 18 -34" stroke="${f.ink}" stroke-width="3" fill="none"/></g>`;
          break;
        case 'scrolls':
          out += `<g fill="${PAPER}" stroke="${INK}" stroke-width="2" opacity=".8"><rect x="150" y="648" width="150" height="20" rx="10" transform="rotate(-6 150 648)"/><rect x="300" y="662" width="130" height="18" rx="9" transform="rotate(4 300 662)"/></g>`;
          break;
        case 'map':
          out += `<g transform="translate(370 600) rotate(-4)"><rect width="170" height="116" fill="${PAPER}" stroke="${INK}" stroke-width="2" opacity=".82"/><g stroke="${INK}" stroke-width="1.4" fill="none" opacity=".45"><path d="M12 30 C40 18 62 44 92 30 C120 18 140 38 158 26"/><path d="M12 62 C46 50 74 76 108 58 C132 46 146 62 158 56"/><path d="M12 92 C54 82 86 98 120 86"/><circle cx="42" cy="44" r="3" fill="${INK}"/><circle cx="122" cy="72" r="3" fill="${INK}"/></g></g>`;
          break;
        case 'qin':
          out += `<g transform="translate(360 640) rotate(-3)"><rect width="170" height="34" rx="4" fill="${f.ink}" opacity=".75"/><path d="M8 8 H162 M8 16 H162 M8 24 H162" stroke="${GOLD}" stroke-width=".8" opacity=".55"/><path d="M20 4 v26 M40 4 v26 M60 4 v26 M80 4 v26 M100 4 v26 M120 4 v26 M140 4 v26" stroke="${PAPER}" stroke-width=".8" opacity=".35"/></g>`;
          break;
        case 'wine':
          out += `<g fill="${INK}" opacity=".65"><path d="M180 690 h24 v-20 h-24Z"/><path d="M210 696 h20 v-14 h-20Z"/><ellipse cx="300" cy="694" rx="26" ry="9"/><path d="M282 694 v-24 h36 v24Z"/></g>`;
          break;
        case 'ox':
          out += `<g fill="${INK}" opacity=".72" transform="translate(290 620)"><path d="M0 42 L14 -6 L86 -6 L104 42 L88 72 L18 72Z"/><path d="M86 0 L128 -18 L144 6 L108 28Z"/><path d="M108 -18 L120 -42 L128 -4" stroke="${INK}" stroke-width="6" fill="none"/><path d="M22 72 L10 104 M90 72 L102 104" stroke="${INK}" stroke-width="9"/></g>`;
          break;
        case 'elephant':
          out += `<g fill="${INK}" opacity=".48" transform="translate(420 560)"><path d="M0 56 C6 16 40 0 78 4 C110 8 126 30 126 58 L126 104 L104 104 L100 74 L34 74 L30 104 L8 104Z"/><path d="M0 56 C-24 62 -30 84 -18 104 C-6 96 -2 82 -4 70Z"/><path d="M126 30 C144 36 148 56 138 68" stroke="${INK}" stroke-width="9" fill="none"/></g>`;
          break;
        case 'fire':
          out += flame(120 + (i * 170) % 380, 700, 0.9 + (i % 3) * 0.15);
          break;
        case 'smoke':
          out += `<g fill="none" stroke="${INK}" stroke-width="4" opacity=".22"><path d="M400 620 c-18 -30 22 -42 4 -74 c-16 -28 16 -38 2 -64"/><path d="M432 626 c-16 -26 18 -36 2 -64"/></g>`;
          break;
        case 'snow':
          out += `<g fill="${PAPER}" opacity=".75">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => `<circle cx="${40 + (seed + n * 97) % 520}" cy="${70 + (seed + n * 53) % 480}" r="${1 + (n % 3)}"/>`).join('')}</g>`;
          break;
        case 'rain':
          out += `<g stroke="${INK}" stroke-width="1.5" opacity=".3">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => `<path d="M${50 + (seed + n * 73) % 520} ${60 + (seed + n * 41) % 380} l-8 34"/>`).join('')}</g>`;
          break;
        case 'moon':
          out += `<circle cx="410" cy="180" r="86" fill="${PAPER}" opacity=".7"/><circle cx="410" cy="180" r="86" fill="none" stroke="${GOLD}" stroke-width="1" opacity=".5"/>`;
          break;
        case 'city':
          out += castle(470, 560, 0.6, f.ink, f.accent);
          break;
        case 'bridge':
          out += `<g fill="${INK}" opacity=".5"><path d="M80 640 C180 610 300 610 420 642 L420 660 C300 630 180 630 80 660Z"/><path d="M120 640 v34 M190 628 v40 M260 624 v42 M330 628 v40 M390 640 v34" stroke="${INK}" stroke-width="4"/></g>`;
          break;
        case 'tower':
          out += `<g fill="${INK}" opacity=".45"><path d="M430 610 h70 v-54 h-70Z"/><path d="M418 556 h94 l-12 -24 h-70Z"/><path d="M446 610 v-40 h38 v40Z" fill="${PAPER}" opacity=".35"/></g>`;
          break;
        case 'well':
          out += `<g fill="${INK}" opacity=".55"><ellipse cx="160" cy="690" rx="34" ry="12"/><path d="M126 690 v-30 h68 v30" fill="none" stroke="${INK}" stroke-width="6"/><path d="M126 660 h68" stroke="${INK}" stroke-width="4"/></g>`;
          break;
        case 'grave':
          out += `<g fill="${INK}" opacity=".5"><path d="M430 710 C450 660 530 660 550 710Z"/><path d="M482 660 h16 v-44 h-16Z"/><path d="M470 616 h40" stroke="${INK}" stroke-width="4"/></g>`;
          break;
        case 'bell':
          out += `<g fill="${INK}" opacity=".5"><path d="M400 560 h50 l10 70 h-70Z"/><path d="M390 630 h70" stroke="${INK}" stroke-width="5"/><path d="M425 560 v-50 M380 510 h90" stroke="${INK}" stroke-width="5"/></g>`;
          break;
        case 'incense':
          out += `<g fill="${INK}" opacity=".6"><path d="M430 620 h46 l-6 30 h-34Z"/><path d="M440 650 h26" stroke="${INK}" stroke-width="4"/></g><g stroke="${INK}" stroke-width="2" fill="none" opacity=".3"><path d="M450 620 c-12 -24 12 -34 0 -56 c-10 -20 8 -28 2 -44"/></g>`;
          break;
        case 'baby':
          out += `<g transform="translate(330 600) rotate(-12)" fill="${PAPER}" stroke="${INK}" stroke-width="2" opacity=".85"><ellipse cx="0" cy="0" rx="20" ry="30"/><path d="M-14 -8 h28 M-16 4 h32 M-14 16 h28"/><circle cx="0" cy="-30" r="12"/></g>`;
          break;
        case 'seal':
          out += `<g transform="translate(470 620) rotate(8)"><rect width="52" height="52" fill="#9e3426" opacity=".82"/><path d="M10 10 h32 v32 h-32Z" fill="none" stroke="${PAPER}" stroke-width="2" opacity=".8"/><path d="M18 20 h16 M18 28 h16 M18 36 h10" stroke="${PAPER}" stroke-width="2" opacity=".8"/></g>`;
          break;
        case 'throne':
          out += `<g fill="${INK}" opacity=".55"><path d="M380 650 h110 v-90 h-110Z"/><path d="M368 560 h134 l-14 -40 h-106Z"/><path d="M400 650 v-60 h70 v60Z" fill="${PAPER}" opacity=".28"/></g>`;
          break;
        case 'swords':
          out += `<g stroke="${INK}" stroke-width="5" opacity=".6"><path d="M170 660 L240 580"/><path d="M240 660 L170 580"/><path d="M196 598 l-10 10 M214 598 l10 10" stroke="${f.accent}" stroke-width="7"/></g>`;
          break;
        case 'feather':
          out += `<g transform="translate(420 560) rotate(18)" fill="${PAPER}" stroke="${INK}" stroke-width="2" opacity=".8"><path d="M0 0 C30 -26 62 -22 78 0 C50 18 22 18 0 0Z"/><path d="M4 0 L70 0"/></g>`;
          break;
        case 'horse':
          out += `<g fill="${INK}" opacity=".5" transform="translate(360 590)"><path d="M0 42 C10 8 28 -2 54 0 C76 2 90 16 102 40 L120 46 L116 58 L96 52 L86 68 L74 52 L30 52 L22 68 L12 54Z"/><path d="M54 0 C48 -20 58 -32 72 -34 L82 -46 L88 -30 C96 -24 98 -10 92 0Z"/></g>`;
          break;
        case 'carts':
          out += `<g fill="${INK}" opacity=".55"><rect x="330" y="630" width="120" height="46"/><circle cx="354" cy="686" r="20" fill="none" stroke="${INK}" stroke-width="7"/><circle cx="430" cy="686" r="20" fill="none" stroke="${INK}" stroke-width="7"/><path d="M330 630 l-40 -30" stroke="${INK}" stroke-width="5"/></g>`;
          break;
        case 'reeds':
          out += `<g stroke="${f.accent}" stroke-width="3" fill="none" opacity=".5">${[0, 1, 2, 3, 4, 5].map((n) => `<path d="M${60 + n * 18} 730 c4 -30 -4 -50 6 -76"/><path d="M${64 + n * 18} 660 l-12 -14 M${64 + n * 18} 676 l12 -12"/>`).join('')}</g>`;
          break;
        case 'lotus':
          out += `<g fill="${f.accent}" opacity=".45"><ellipse cx="120" cy="710" rx="46" ry="12"/><ellipse cx="470" cy="700" rx="38" ry="10"/><path d="M150 690 c-16 -24 8 -48 24 -54 c2 24 0 42 -10 54Z"/><path d="M180 700 c-12 -20 4 -40 20 -44 c0 20 -4 34 -12 44Z"/></g>`;
          break;
        case 'ribbon':
          out += `<g fill="none" stroke="${f.accent}" stroke-width="4" opacity=".5"><path d="M90 180 C180 140 220 240 310 200 C380 170 420 220 500 190"/><path d="M120 210 C200 180 240 260 330 226 C400 200 440 240 510 220"/></g>`;
          break;
        case 'dust':
          out += `<g fill="${INK}" opacity=".12"><ellipse cx="140" cy="650" rx="120" ry="34"/><ellipse cx="460" cy="680" rx="150" ry="40"/></g>`;
          break;
        case 'figures':
          out += figures(INK, f.accent, 7, 700);
          break;
        default:
          break;
      }
    });
    return `<g class="cx-prop-layer">${out}</g>`;
  }

  function sceneBase(kind, faction, key, props = []) {
    const f = FACTION[faction] || FACTION.qun;
    const id = `${kind}-${hash(key + seq)}`;
    seq += 1;
    const palette = kind === 'yellow'
      ? { top: '#d8b873', bottom: '#d8c9a2' }
      : kind === 'fire'
        ? { top: '#d6b08e', bottom: '#b87a5c' }
        : kind === 'snow'
          ? { top: '#dfe2dc', bottom: '#cfd2ca' }
          : { top: f.pale, bottom: '#e6d8bc' };
    let inner = '';
    let overlay = '';

    switch (kind) {
      case 'fire':
        inner += sun(430, 220, 82, id, '#a93423');
        inner += mountains(id, f.ink, f.accent, 0.9);
        inner += mist(id, f.accent);
        inner += `<g opacity=".9">${ship(130, 610, 1.1, INK, f.accent)}${ship(300, 640, 0.9, INK, f.accent)}${ship(470, 600, 1.2, INK, f.accent)}</g>`;
        inner += `<g fill="${INK}" opacity=".3"><path d="M-20 700 C80 670 160 696 250 676 C350 654 440 684 620 650 V820 H-20Z"/></g>`;
        inner += flame(120, 690, 1.3) + flame(250, 710, 0.9, '#9d2d20') + flame(390, 696, 1.2) + flame(510, 716, 0.8, '#9d2d20');
        overlay += `<g fill="${f.accent}" opacity=".14"><path d="M-20 760 C120 700 240 740 360 706 C470 676 560 700 630 680 V820 H-20Z"/></g>`;
        break;
      case 'river':
        inner += sun(440, 190, 74, id, '#a63a2a');
        inner += mountains(id, f.ink, f.accent, 0.75);
        inner += mist(id, f.accent);
        inner += `<g opacity=".7">${boat(130, 610, 1.2, INK, f.accent)}${boat(340, 650, 0.95, INK, f.accent)}${boat(500, 600, 0.8, INK, f.accent)}</g>`;
        inner += `<g stroke="${INK}" stroke-width="2" opacity=".22">
          <path d="M-20 660 C60 650 120 672 200 660 C290 646 360 668 450 656 C520 646 580 662 630 654"/>
          <path d="M-20 700 C80 690 150 710 240 698 C330 686 400 706 500 694 C560 686 600 696 630 690"/>
        </g>`;
        inner += `<g stroke="${INK}" stroke-width="2" opacity=".3">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${80 + i * 62} ${560 - (i % 3) * 12} l18 -46"/>`).join('')}</g>`;
        break;
      case 'bridge':
        inner += sun(150, 180, 66, id, '#9d3a29');
        inner += mountains(id, f.ink, f.accent, 0.8);
        inner += `<g fill="${f.ink}" opacity=".8">
          <path d="M-20 610 C100 590 220 600 330 592 L410 600 L410 624 C300 632 180 626 -20 650Z"/>
          <path d="M340 600 C380 566 420 566 460 600 L460 614 C420 590 380 590 340 614Z"/>
        </g>`;
        inner += `<g stroke="${INK}" stroke-width="3" opacity=".45">${[0, 1, 2, 3, 4].map((i) => `<path d="M${60 + i * 60} 612 l-4 34"/>`).join('')}</g>`;
        inner += `<g fill="${INK}" opacity=".35">${figures(INK, f.accent, 5, 700)}</g>`;
        break;
      case 'snow':
        inner += sun(430, 190, 62, id, '#a65540');
        inner += mountains(id, '#4d5560', '#87909a', 0.9);
        inner += `<g fill="#f7f3e9" opacity=".8">
          <path d="M-20 700 C90 660 170 690 260 668 C360 642 470 680 630 650 V820 H-20Z"/>
        </g>`;
        inner += `<g stroke="#f7f3e9" stroke-width="2" opacity=".55">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const x = 40 + (i * 97) % 520;
          const y = 120 + (i * 61) % 430;
          return `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3)}" fill="#f7f3e9" stroke="none"/>`;
        }).join('')}</g>`;
        inner += `<g fill="${INK}" opacity=".55"><path d="M450 610 L466 520 L482 610Z"/><path d="M466 540 L430 512 M466 560 L500 528 M466 580 L424 566" stroke="${INK}" stroke-width="4"/></g>`;
        break;
      case 'court':
        inner += `<g fill="${f.ink}" opacity=".9">
          <path d="M-20 -20 H620 V80 C500 54 430 66 340 42 C250 18 160 52 70 30 C30 20 -10 30 -20 26Z"/>
          <path d="M18 80 H70 V700 H18Z M530 80 H582 V700 H530Z"/>
          <path d="M-20 700 H620 V820 H-20Z"/>
        </g>`;
        inner += `<g fill="${f.accent}" opacity=".5">
          <path d="M230 180 C260 160 340 160 370 180 L354 300 H246Z"/>
          <path d="M254 300 H346 V360 H254Z"/>
        </g>`;
        inner += `<g stroke="${f.ink}" stroke-width="3" opacity=".35">
          <path d="M246 220 H354 M246 250 H354 M246 280 H354"/>
          <path d="M180 340 C230 320 300 330 340 350 M260 360 C320 340 380 346 420 366"/>
        </g>`;
        inner += `<g fill="${f.ink}" opacity=".55">${[0, 1, 2, 3].map((i) => `<circle cx="${90 + i * 140}" cy="${560 + (i % 2) * 24}" r="20"/><path d="M${70 + i * 140} 580 C${64 + i * 140} 630 ${64 + i * 140} 690 ${70 + i * 140} 720 H${110 + i * 140} C${116 + i * 140} 690 ${116 + i * 140} 630 ${110 + i * 140} 580Z"/>`).join('')}</g>`;
        inner += `<g fill="${PAPER}" opacity=".18">${[0, 1, 2].map((i) => `<path d="M${210 + i * 90} 0 H${224 + i * 90} V800 H${210 + i * 90}Z"/>`).join('')}</g>`;
        break;
      case 'city':
        inner += sun(470, 190, 66, id, '#a74730');
        inner += mountains(id, f.ink, f.accent, 0.55);
        inner += castle(300, 620, 1.35, f.ink, f.accent);
        inner += `<g opacity=".65">${banner(90, 690, 1.1, INK, f.accent)}${banner(540, 690, 1.0, INK, f.accent)}</g>`;
        inner += spearRow(92, 740, 7, INK, 16, -5);
        inner += `<g fill="${INK}" opacity=".28"><path d="M-20 740 C100 710 200 738 300 718 C400 698 500 728 630 700 V820 H-20Z"/></g>`;
        break;
      case 'bamboo':
        inner += sun(420, 190, 78, id, '#8e3a2b');
        inner += mountains(id, f.ink, f.accent, 0.45);
        inner += `<g transform="translate(300 610) scale(1.1)">
          <path d="M-90 40 L90 40 L66 0 L-66 0Z" fill="${INK}" opacity=".82"/>
          <path d="M-70 0 C-50 -68 50 -68 70 0Z" fill="${f.ink}" opacity=".9"/>
          <path d="M-50 42 L-50 100 M50 42 L50 100" stroke="${INK}" stroke-width="5"/>
          <path d="M-58 18 L58 18" stroke="${f.accent}" stroke-width="4" opacity=".6"/>
          <path d="M-14 -68 L-14 -112 L-4 -112 L-4 -68" fill="${INK}"/>
        </g>`;
        inner += `<g stroke="${f.accent}" stroke-width="6" fill="none" opacity=".65">
          <path d="M70 700 C80 540 64 420 90 280"/><path d="M550 700 C540 540 560 420 536 300"/>
        </g>`;
        inner += `<g fill="${f.accent}" opacity=".55">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${80 + (i % 2) * 450} ${620 - i * 46} C${140 + (i % 2) * 380} ${560 - i * 46} ${180 + (i % 2) * 320} ${580 - i * 46} ${210 + (i % 2) * 280} ${610 - i * 46} C${170 + (i % 2) * 340} ${630 - i * 46} ${120 + (i % 2) * 400} ${620 - i * 46} ${80 + (i % 2) * 450} ${620 - i * 46}Z"/>`).join('')}</g>`;
        inner += `<g fill="${PAPER}" opacity=".5"><path d="M80 700 C180 670 260 692 340 678 C430 662 500 686 600 670 V820 H80Z"/></g>`;
        break;
      case 'horse':
        inner += sun(300, 210, 92, id, '#a83a28');
        inner += mountains(id, f.ink, f.accent, 0.5);
        inner += `<g fill="${INK}" opacity=".82">
          <path d="M70 640 C90 600 110 586 146 586 C176 586 196 600 216 632 L252 640 L246 660 L206 650 L190 676 L164 650 L110 656 L100 680 L84 660Z"/>
          <path d="M136 586 C128 550 142 530 162 526 L176 510 L184 532 C196 540 202 560 196 580Z"/>
          <path d="M168 512 L184 486 L190 516" stroke="${INK}" stroke-width="6"/>
          <path d="M98 590 C80 560 88 530 116 516" stroke="${INK}" stroke-width="10" fill="none"/>
        </g>`;
        inner += `<g fill="${INK}" opacity=".5" transform="translate(360 40) scale(.8)">
          <path d="M70 640 C90 600 110 586 146 586 C176 586 196 600 216 632 L252 640 L246 660 L206 650 L190 676 L164 650 L110 656 L100 680 L84 660Z"/>
          <path d="M136 586 C128 550 142 530 162 526 L176 510 L184 532 C196 540 202 560 196 580Z"/>
        </g>`;
        inner += spearRow(60, 770, 12, INK, 22, -8);
        inner += `<g fill="${INK}" opacity=".25"><path d="M-20 740 C120 710 220 744 330 716 C440 690 530 724 630 700 V820 H-20Z"/></g>`;
        break;
      case 'mountain':
        inner += sun(440, 190, 68, id, '#9b3a2a');
        inner += mountains(id, f.ink, f.accent, 1.15);
        inner += mist(id, f.accent);
        inner += `<g fill="${INK}" opacity=".6">
          <path d="M150 470 L166 420 L182 470Z"/><path d="M420 460 L434 410 L448 460Z"/>
          <path d="M170 470 L170 520 M432 460 L432 520" stroke="${INK}" stroke-width="4"/>
        </g>`;
        inner += `<g stroke="${INK}" stroke-width="2" opacity=".3">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${80 + i * 64} ${610 - (i % 3) * 18} l-16 -52"/>`).join('')}</g>`;
        break;
      case 'medicine':
        inner += `<g fill="${f.ink}" opacity=".85">
          <path d="M-20 660 H620 V820 H-20Z"/>
          <path d="M150 540 H450 L430 660 H170Z" opacity=".7"/>
        </g>`;
        inner += `<g fill="${f.accent}" opacity=".55"><path d="M250 570 C300 540 350 560 370 588 L350 620 H270Z"/></g>`;
        inner += `<g fill="${INK}" opacity=".7">
          <path d="M310 430 L322 430 L328 470 L304 470Z"/><circle cx="316" cy="412" r="8"/>
          <path d="M300 520 L336 520 L330 560 L306 560Z"/>
        </g>`;
        inner += `<g stroke="${f.accent}" stroke-width="4" fill="none" opacity=".7"><path d="M316 470 C300 490 300 500 316 520 M316 470 C332 490 332 500 316 520"/></g>`;
        inner += `<g stroke="${INK}" stroke-width="4" fill="none" opacity=".55"><path d="M380 520 C420 500 450 510 470 540 M380 540 C420 520 450 530 470 560"/></g>`;
        break;
      case 'moon':
        inner += sun(310, 230, 108, id, '#b34a38');
        inner += mountains(id, f.ink, f.accent, 0.35);
        inner += pavilion(330, 600, 1.1, f.ink, f.accent);
        inner += `<g fill="${PAPER}" opacity=".35"><path d="M-20 650 C100 630 200 656 300 640 C410 622 510 648 630 632 V820 H-20Z"/></g>`;
        inner += `<g stroke="${f.accent}" stroke-width="3" fill="none" opacity=".4">
          <path d="M60 700 C180 680 250 720 380 700 C480 684 560 704 620 690"/>
          <path d="M-20 740 C110 720 200 756 330 736 C450 718 550 742 630 726"/>
        </g>`;
        inner += `<g stroke="${f.ink}" stroke-width="5" fill="none" opacity=".45"><path d="M470 700 C480 600 520 560 600 540"/><path d="M500 610 C530 600 550 570 560 540 M520 580 C550 580 570 560 580 540"/></g>`;
        break;
      case 'yellow':
        inner += sun(300, 230, 100, id, '#c19a36');
        inner += mountains(id, f.ink, '#a7823a', 0.55);
        inner += `<g fill="#b58a32" opacity=".45"><path d="M-20 600 C90 560 160 590 250 570 C360 544 450 584 630 550 V820 H-20Z"/></g>`;
        inner += `<g opacity=".65">${banner(110, 670, 1.1, INK, '#a7823a')}${banner(490, 680, 1.2, INK, '#a7823a')}</g>`;
        inner += `<g fill="${INK}" opacity=".5">${figures(INK, '#a7823a', 8, 700)}</g>`;
        inner += spearRow(60, 760, 12, INK, 22, -10);
        break;
      case 'workshop':
        inner += `<g fill="${f.ink}" opacity=".85">
          <path d="M-20 120 H620 V160 H-20Z"/><path d="M40 160 L40 700 M560 160 L560 700"/>
          <path d="M-20 700 H620 V820 H-20Z"/>
        </g>`;
        inner += `<g fill="${f.accent}" opacity=".55"><circle cx="180" cy="360" r="44" fill="none" stroke="${f.accent}" stroke-width="10"/><circle cx="380" cy="360" r="56" fill="none" stroke="${f.accent}" stroke-width="10"/></g>`;
        inner += `<g fill="${INK}" opacity=".7">
          <path d="M150 590 L170 520 L300 520 L330 590 L300 660 L180 660Z"/>
          <path d="M300 540 L360 520 L390 560 L340 590Z"/>
          <path d="M170 660 L150 730 M310 660 L330 730" stroke="${INK}" stroke-width="12"/>
          <path d="M330 540 L380 500 L395 515" stroke="${INK}" stroke-width="7" fill="none"/>
        </g>`;
        inner += `<g stroke="${INK}" stroke-width="3" opacity=".3">${[0, 1, 2, 3].map((i) => `<path d="M90 ${250 + i * 52} H510"/>`).join('')}</g>`;
        break;
      case 'jungle':
        inner += sun(420, 230, 72, id, '#9c4028');
        inner += `<g fill="${f.ink}" opacity=".16"><path d="M-20 500 C80 430 120 460 190 410 C270 350 340 420 420 380 C500 340 570 400 630 370 V820 H-20Z"/></g>`;
        inner += `<g fill="${f.accent}" opacity=".5">
          <path d="M30 760 C0 600 40 460 110 400 C120 520 90 660 100 760Z"/>
          <path d="M70 760 C110 590 210 500 300 480 C250 590 180 690 170 760Z"/>
          <path d="M560 760 C600 590 540 460 470 400 C470 530 510 660 500 760Z"/>
        </g>`;
        inner += `<g fill="${INK}" opacity=".65"><path d="M250 600 C300 560 380 560 430 600 L450 660 L380 690 L300 680 L250 650Z"/>
          <path d="M430 600 C450 540 480 520 500 540 L486 610Z"/></g>`;
        inner += `<g stroke="${f.ink}" stroke-width="3" opacity=".35"><path d="M150 560 C230 520 330 520 430 560 M120 620 C240 580 360 590 470 620"/></g>`;
        break;
      case 'camp':
        inner += sun(430, 210, 74, id, '#a3422c');
        inner += mountains(id, f.ink, f.accent, 0.55);
        inner += mist(id, f.accent);
        inner += `<g>${tent(120, 600, 1.1, f.ink, f.accent)}${tent(280, 620, 0.9, f.ink, f.accent)}${tent(440, 596, 1.2, f.ink, f.accent)}</g>`;
        inner += `<g stroke="${INK}" stroke-width="4" opacity=".45">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${40 + i * 62} 660 l-4 -66"/>`).join('')}</g>`;
        inner += `<g stroke="${INK}" stroke-width="2" opacity=".35">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${56 + i * 62} 620 l-14 -14 M${56 + i * 62} 640 l14 -14"/>`).join('')}</g>`;
        inner += flame(210, 710, 0.9) + flame(360, 722, 0.7);
        inner += spearRow(60, 760, 11, INK, 22, -6);
        inner += `<g fill="${INK}" opacity=".25"><path d="M-20 740 C110 712 220 742 330 718 C440 692 540 726 630 700 V820 H-20Z"/></g>`;
        break;
      case 'warroom':
        inner += `<g fill="${f.ink}" opacity=".9">
          <path d="M-20 620 H620 V820 H-20Z"/><path d="M80 620 L40 260 L100 240 L150 620Z"/>
          <path d="M520 620 L560 260 L500 240 L450 620Z"/>
        </g>`;
        inner += `<g fill="${f.accent}" opacity=".5"><path d="M150 560 H450 L420 620 H180Z"/></g>`;
        inner += `<g stroke="${INK}" stroke-width="4" opacity=".45"><path d="M180 580 H420 M200 600 H400 M240 540 C300 500 360 540 400 520"/></g>`;
        inner += `<g fill="${INK}" opacity=".6"><path d="M130 610 L250 480 L310 510 L220 620Z"/><path d="M470 620 L380 500 L330 530 L400 630Z"/></g>`;
        inner += `<g fill="${PAPER}" opacity=".5"><path d="M280 470 L330 460 L338 480 L288 492Z"/></g>`;
        break;
      default:
        inner += mountains(id, f.ink, f.accent, 1);
    }

    return `<svg class="cx-scene" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>${skyDefs(id, palette.top, palette.bottom)}</defs>
      <rect width="600" height="800" fill="${PAPER}"/>
      <rect width="600" height="800" fill="url(#sky-${id})" opacity=".9"/>
      ${inner}
      ${overlay}
      ${propLayer(props, faction, key)}
      <rect width="600" height="800" fill="url(#fade-${id})"/>
      <rect x="12" y="12" width="576" height="776" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity=".55"/>
    </svg>`;
  }

  /* ------------------------- 人物剪影 ------------------------- */

  function cutout(d, fill = PAPER, opacity = 0.34) {
    return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
  }

  function weaponSVG(kind, ink, gold) {
    const w = (inner) => `<g stroke="${gold}" stroke-width="1.4" fill="${ink}" opacity=".95">${inner}</g>`;
    switch (kind) {
      case 'glaive':
        return w(`<path d="M46 500 L64 40" stroke="${ink}" stroke-width="7" fill="none"/>
          <path d="M64 40 C36 62 34 108 52 132 C74 108 80 74 64 40Z" fill="${ink}"/>
          <path d="M50 128 C36 150 44 172 62 180 C64 158 62 142 50 128Z" fill="${gold}" opacity=".8"/>
          <path d="M40 240 L70 232" stroke="${gold}" stroke-width="4"/>`);
      case 'spear':
        return w(`<path d="M44 510 L58 38" stroke="${ink}" stroke-width="6" fill="none"/>
          <path d="M58 38 L44 84 L58 106 L72 84Z" fill="${ink}"/>
          <path d="M58 106 C44 122 44 144 58 158 C72 144 72 122 58 106Z" fill="${gold}" opacity=".7"/>`);
      case 'halberd':
        return w(`<path d="M48 500 L62 40" stroke="${ink}" stroke-width="7" fill="none"/>
          <path d="M62 40 L48 92 L62 112 L76 92Z" fill="${ink}"/>
          <path d="M62 74 C30 78 22 104 38 126 C46 100 54 90 62 88Z" fill="${gold}" opacity=".82"/>`);
      case 'sword':
        return w(`<path d="M44 400 L96 128" stroke="${ink}" stroke-width="8" fill="none"/>
          <path d="M96 128 L84 92 L104 112Z" fill="${gold}" opacity=".8"/>
          <path d="M36 414 L66 398" stroke="${gold}" stroke-width="5"/>`);
      case 'bow':
        return w(`<path d="M52 300 C10 240 10 150 42 92" stroke="${ink}" stroke-width="6" fill="none"/>
          <path d="M52 300 L42 92" stroke="${gold}" stroke-width="1.4" fill="none"/>
          <path d="M40 200 L96 200" stroke="${ink}" stroke-width="4"/>`);
      case 'fan':
        return w(`<path d="M38 360 C98 300 152 300 196 360 C154 392 84 392 38 360Z" fill="${ink}"/>
          <path d="M38 360 L118 346 L196 360" stroke="${gold}" stroke-width="1.6" fill="none"/>
          <path d="M118 346 L118 440" stroke="${ink}" stroke-width="5"/>`);
      case 'staff':
        return w(`<path d="M38 500 L58 60" stroke="${ink}" stroke-width="7" fill="none"/>
          <circle cx="72" cy="76" r="22" fill="${ink}"/><path d="M72 54 L72 98 M50 76 L94 76" stroke="${gold}" stroke-width="2"/>`);
      default:
        return '';
    }
  }

  function figureSVG(type = 'warrior', weapon = 'spear', faction = 'qun', opts = {}) {
    const f = FACTION[faction] || FACTION.qun;
    const ink = f.ink;
    const gold = GOLD;
    const accent = f.accent;
    const flip = opts.flip ? -1 : 1;
    let body = '';
    let head = '';

    const eyes = `<path d="M108 70 q4 3 8 0 M124 70 q4 3 8 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M107 64 q5 -2 9 1 M124 65 q5 -3 9 -1" stroke="${INK}" stroke-width="1.2" fill="none" opacity=".75"/>
      <path d="M120 72 l-1 7 l3 1" stroke="${INK}" stroke-width="1" fill="none" opacity=".7"/>
      <path d="M114 84 q6 3 12 0" stroke="${INK}" stroke-width="1.2" fill="none" opacity=".8"/>`;

    const beard = (d = 'M104 86 C108 106 132 106 136 86 C130 96 110 96 104 86Z') =>
      `<path d="${d}" fill="${ink}" opacity=".92"/>`;

    if (type === 'lady') {
      head = `<g>
        <path d="M96 62 C94 30 122 20 140 32 C154 42 148 62 144 74 C136 60 110 56 100 68Z" fill="${ink}"/>
        <ellipse cx="120" cy="72" rx="14.5" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M100 62 C102 42 116 34 128 38 C120 44 112 50 108 64Z" fill="${ink}"/>
        <path d="M140 34 C150 30 156 38 150 46" stroke="${gold}" stroke-width="2" fill="none"/>
        <circle cx="146" cy="30" r="3.2" fill="${accent}"/>
        ${eyes}
        <path d="M114 84 q6 2 12 0" stroke="${accent}" stroke-width="1.8" fill="none"/>
      </g>`;
      body = `<g fill="${ink}">
        <path d="M98 104 C84 114 78 148 76 188 C74 240 70 292 64 340 C56 396 44 458 36 506 C82 522 158 522 204 506 C196 458 184 396 176 340 C170 292 166 240 164 188 C162 148 156 114 142 104 C134 96 106 96 98 104Z"/>
        <path d="M76 188 C48 214 38 270 50 324 C62 378 90 400 110 386 C90 340 82 292 86 246Z"/>
        <path d="M164 188 C192 214 202 270 190 324 C178 378 150 400 130 386 C150 340 158 292 154 246Z"/>
      </g>
      <path d="M100 108 C108 142 112 180 116 220 L124 220 C128 180 132 142 140 108Z" fill="${PAPER}" opacity=".18"/>
      <path d="M88 236 C108 248 132 248 152 236 L148 264 C128 276 112 276 92 264Z" fill="${accent}" opacity=".45"/>
      <path d="M64 340 C92 356 148 356 176 340" stroke="${gold}" stroke-width="1.4" fill="none" opacity=".6"/>
      <path d="M120 250 C118 336 120 424 124 508" stroke="${accent}" stroke-width="2.2" fill="none" opacity=".55"/>
      <path d="M78 300 C58 342 44 402 38 462" stroke="${accent}" stroke-width="3.4" fill="none" opacity=".5"/>
      <path d="M166 300 C188 342 198 398 202 454" stroke="${accent}" stroke-width="2.6" fill="none" opacity=".38"/>
      <path d="M104 84 q6 2 12 0" stroke="${INK}" stroke-width="1" fill="none" opacity=".35"/>`;
    } else if (type === 'strategist') {
      head = `<g>
        <path d="M98 60 C98 32 142 32 142 60 L138 72 C132 58 108 58 102 72Z" fill="${ink}"/>
        <ellipse cx="120" cy="72" rx="14.5" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M102 54 C104 34 136 34 138 54 L134 58 C128 46 112 46 106 58Z" fill="${ink}"/>
        <path d="M102 54 L96 44 L144 44 L138 54" stroke="${ink}" stroke-width="4" fill="none"/>
        <path d="M120 44 L120 30" stroke="${gold}" stroke-width="2"/>
        ${eyes}
        ${beard('M106 86 C110 112 130 112 134 86 C128 100 112 100 106 86Z')}
      </g>`;
      body = `<g fill="${ink}">
        <path d="M96 104 C80 114 72 148 70 192 C68 256 60 360 48 500 C92 516 148 516 192 500 C180 360 172 256 170 192 C168 148 160 114 144 104 C134 96 106 96 96 104Z"/>
        <path d="M72 186 C44 218 36 272 48 326 C60 380 90 402 110 388 C90 342 82 294 84 248Z"/>
        <path d="M168 186 C196 218 204 272 192 326 C180 380 150 402 130 388 C150 342 158 294 156 248Z"/>
      </g>
      <path d="M102 106 C110 144 114 184 118 224 L122 224 C126 184 130 144 138 106Z" fill="${PAPER}" opacity=".2"/>
      <path d="M88 240 C108 252 132 252 152 240 L148 268 C128 280 112 280 92 268Z" fill="${accent}" opacity=".42"/>
      <path d="M74 196 C62 260 58 352 52 470" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".45"/>
      <path d="M166 196 C178 260 182 352 188 470" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".35"/>
      <path d="M112 260 C110 340 112 424 116 502" stroke="${accent}" stroke-width="2" fill="none" opacity=".5"/>
      <path d="M68 300 C48 342 38 400 34 452" stroke="${accent}" stroke-width="3" fill="none" opacity=".38"/>`;
    } else if (type === 'ruler') {
      head = `<g>
        <path d="M98 60 C98 32 142 32 142 60 L138 72 C132 58 108 58 102 72Z" fill="${ink}"/>
        <ellipse cx="120" cy="73" rx="14.5" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M100 50 L140 50 L138 58 L102 58Z" fill="${ink}"/>
        <path d="M100 50 L86 40 L154 40 L140 50Z" fill="${gold}" opacity=".85"/>
        <path d="M92 40 L88 26 M148 40 L152 26 M108 38 L108 26 M132 38 L132 26" stroke="${gold}" stroke-width="1.6"/>
        <circle cx="88" cy="26" r="2.4" fill="${accent}"/><circle cx="152" cy="26" r="2.4" fill="${accent}"/>
        <circle cx="108" cy="26" r="2.2" fill="${accent}"/><circle cx="132" cy="26" r="2.2" fill="${accent}"/>
        ${eyes}
        ${beard('M104 87 C108 114 132 114 136 87 C130 102 110 102 104 87Z')}
      </g>`;
      body = `<g fill="${ink}">
        <path d="M94 104 C76 116 68 152 66 208 C64 276 56 378 44 508 C92 526 148 526 196 508 C184 378 176 276 174 208 C172 152 164 116 146 104 C136 96 104 96 94 104Z"/>
        <path d="M68 198 C40 230 32 288 44 342 C56 396 86 418 106 404 C86 356 78 308 80 260Z"/>
        <path d="M172 198 C200 230 208 288 196 342 C184 396 154 418 134 404 C154 356 162 308 160 260Z"/>
      </g>
      <path d="M100 106 C108 146 112 188 116 230 L124 230 C128 188 132 146 140 106Z" fill="${PAPER}" opacity=".18"/>
      <path d="M86 238 C108 252 132 252 154 238 L150 270 C128 284 112 284 90 270Z" fill="${accent}" opacity=".52"/>
      <path d="M88 286 C108 300 132 300 152 286" stroke="${gold}" stroke-width="1.6" fill="none" opacity=".7"/>
      <circle cx="120" cy="320" r="13" fill="none" stroke="${gold}" stroke-width="1.6" opacity=".6"/>
      <path d="M120 307 L120 333 M107 320 L133 320" stroke="${gold}" stroke-width="1.2" opacity=".5"/>
      <path d="M66 220 C54 290 52 390 46 486" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".4"/>
      <path d="M174 220 C186 290 188 390 194 486" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".4"/>
      <path d="M64 330 C48 374 40 430 38 478" stroke="${accent}" stroke-width="3" fill="none" opacity=".4"/>`;
    } else if (type === 'healer') {
      head = `<g>
        <path d="M98 60 C96 34 118 24 136 32 C150 40 146 60 142 72 C134 58 110 56 102 70Z" fill="${ink}"/>
        <ellipse cx="120" cy="72" rx="14.5" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M100 54 C104 34 136 34 140 54" stroke="${ink}" stroke-width="7" fill="none"/>
        ${eyes}
        ${beard('M106 86 C110 110 130 110 134 86 C128 98 112 98 106 86Z')}
      </g>`;
      body = `<g fill="${ink}">
        <path d="M96 106 C80 118 72 152 70 200 C68 268 60 376 50 504 C92 518 148 518 190 504 C180 376 172 268 170 200 C168 152 160 118 144 106 C134 98 106 98 96 106Z"/>
        <path d="M72 194 C46 226 38 280 50 332 C62 384 90 404 110 390 C90 346 82 298 84 252Z"/>
        <path d="M168 194 C194 226 202 280 190 332 C178 384 150 404 130 390 C150 346 158 298 156 252Z"/>
      </g>
      <path d="M102 108 C110 146 114 186 118 224 L122 224 C126 186 130 146 138 108Z" fill="${PAPER}" opacity=".2"/>
      <path d="M86 246 C108 260 132 260 154 246 L150 276 C128 290 112 290 90 276Z" fill="${accent}" opacity=".38"/>
      <path d="M74 500 C112 512 148 512 186 500" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".4"/>`;
    } else if (type === 'rebel') {
      head = `<g>
        <path d="M96 58 C96 30 144 30 144 58 L140 74 C132 58 108 58 100 74Z" fill="${ink}"/>
        <ellipse cx="120" cy="72" rx="14.5" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M94 56 C98 32 142 32 146 56 L140 62 C130 46 110 46 100 62Z" fill="${gold}" opacity=".9"/>
        <path d="M146 56 L158 72" stroke="${gold}" stroke-width="4"/>
        ${eyes}
        ${beard('M106 86 C110 108 130 108 134 86 C128 98 112 98 106 86Z')}
      </g>`;
      body = `<g fill="${ink}">
        <path d="M94 106 C76 118 66 154 64 210 C62 282 52 396 38 512 C88 530 152 530 202 512 C188 396 178 282 176 210 C174 154 164 118 146 106 C136 96 104 96 94 106Z"/>
        <path d="M66 200 C38 234 30 292 42 346 C54 400 84 422 104 408 C84 360 76 312 78 264Z"/>
        <path d="M174 200 C202 234 210 292 198 346 C186 400 156 422 136 408 C156 360 164 312 162 264Z"/>
      </g>
      <path d="M100 108 C108 146 112 188 116 230 L124 230 C128 188 132 146 140 108Z" fill="${PAPER}" opacity=".16"/>
      <path d="M84 252 C108 266 132 266 156 252 L152 282 C128 296 112 296 88 282Z" fill="${accent}" opacity=".45"/>
      <path d="M68 300 C56 366 50 438 42 500" stroke="${gold}" stroke-width="1.4" fill="none" opacity=".45"/>`;
    } else {
      head = `<g>
        <path d="M98 58 C98 32 142 32 142 58 L138 72 C132 58 108 58 102 72Z" fill="${ink}"/>
        <ellipse cx="120" cy="72" rx="15" ry="18.5" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
        <path d="M100 50 C104 34 136 34 140 50 L136 58 C128 46 112 46 104 58Z" fill="${ink}"/>
        <path d="M100 52 L140 52" stroke="${gold}" stroke-width="2"/>
        <path d="M120 52 L120 34" stroke="${gold}" stroke-width="2.4"/>
        <path d="M120 34 C130 40 128 50 120 54 C112 50 110 40 120 34Z" fill="${accent}"/>
        ${eyes}
        ${beard('M104 86 C108 108 132 108 136 86 C130 98 110 98 104 86Z')}
      </g>`;
      body = `<g fill="${ink}">
        <path d="M92 106 C74 118 64 154 62 210 C60 282 52 390 42 508 C90 524 150 524 198 508 C188 390 180 282 178 210 C176 154 166 118 148 106 C138 96 102 96 92 106Z"/>
        <path d="M64 200 C38 234 30 292 42 346 C54 400 82 420 102 406 C82 358 74 310 76 262Z"/>
        <path d="M176 200 C202 234 210 292 198 346 C186 400 158 420 138 406 C158 358 166 310 164 262Z"/>
        <path d="M92 300 L148 300 L158 476 C158 508 146 534 120 534 C94 534 82 508 82 476Z" opacity=".92"/>
      </g>
      <path d="M100 108 C108 146 112 188 116 230 L124 230 C128 188 132 146 140 108Z" fill="${PAPER}" opacity=".18"/>
      <path d="M86 232 C108 246 132 246 154 232 L150 262 C128 276 112 276 90 262Z" fill="${accent}" opacity=".55"/>
      <path d="M92 276 L148 276" stroke="${gold}" stroke-width="1.8" opacity=".7"/>
      <path d="M94 330 L146 330 M92 370 L148 370" stroke="${gold}" stroke-width="1" opacity=".35"/>
      <path d="M64 220 C52 292 48 400 42 494" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".38"/>
      <path d="M176 220 C188 292 192 400 198 494" stroke="${gold}" stroke-width="1.2" fill="none" opacity=".38"/>`;
    }

    return `<svg class="cx-figure" viewBox="0 0 240 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g transform="translate(${flip === 1 ? 0 : 240} 0) scale(${flip} 1)">
        ${weaponSVG(weapon, ink, gold)}
        ${body}
        ${head}
      </g>
    </svg>`;
  }

  const SCENES = new Set([
    'fire', 'river', 'bridge', 'snow', 'court', 'city', 'bamboo', 'horse',
    'mountain', 'medicine', 'moon', 'yellow', 'workshop', 'jungle', 'warroom', 'camp',
  ]);

  window.CodexArt = {
    sceneSVG: (kind, faction, key, props) => sceneBase(SCENES.has(kind) ? kind : 'mountain', faction, key, props || []),
    figureSVG,
    isScene: (kind) => SCENES.has(kind),
    palette: FACTION,
  };
})();
