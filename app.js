/* BLAIR FARMS BIOTA ARCHIVE: page logic. Data lives in data.json. */
let D = { wool: [], concentrates: [] },
  W = [];
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
const TY = ["Lightfastness", "Waterfastness", "Washfastness"],
  LC = ["#e0a030", "#3b82c4", "#8a63c9", "#4aa56b", "#c9566b"];
function labSteps(h) {
  const c = [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255),
    r = c.map((v) =>
      v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
    ),
    X = r[0] * 0.4124 + r[1] * 0.3576 + r[2] * 0.1805,
    Y = r[0] * 0.2126 + r[1] * 0.7152 + r[2] * 0.0722,
    Z = r[0] * 0.0193 + r[1] * 0.1192 + r[2] * 0.9505,
    n = [X / 0.95047, Y, Z / 1.08883],
    f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116),
    F = n.map(f);
  return {
    c,
    r,
    xyz: [X, Y, Z],
    n,
    F,
    lab: [116 * F[1] - 16, 500 * (F[0] - F[1]), 200 * (F[1] - F[2])],
  };
}
const lab = (h) => labSteps(h).lab;
const dE = (a, b) => {
  const p = lab(a),
    q = lab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};
const drift = (t) => t.colors.map((c) => dE(t.colors[0].h, c.h)),
  last = (t) => t.colors[t.colors.length - 1],
  P = (id) => W.find((p) => p.id === id);
let tab = "lib",
  cur = null,
  q = "",
  vp = null,
  va = "All",
  wm = "all",
  wn = false,
  mp = null,
  mt = 0,
  mf = 0,
  mto = null,
  cs = null;
const TABS = [
  ["lib", "Wool Library"],
  ["wheel", "Color Wheel"],
  ["fast", "Fastness"],
  ["conc", "Concentrates", 1],
  ["sol", "Solution Analysis"],
  ["meth", "Methods"],
];
function go(t) {
  tab = t;
  if (t == "sol") cs = null;
  draw();
}
function draw() {
  $("tabs").innerHTML = TABS.map(
    (t) =>
      `<button class="${t[0] == tab ? "on" : ""}" onclick="go('${t[0]}')">${t[1]}${t[2] ? '<span class="soon">soon</span>' : ""}</button>`,
  ).join("");
  $("app").innerHTML = {
    lib: libV,
    wheel: wheelV,
    fast: fastV,
    conc: concV,
    sol: solV,
    meth: methV,
  }[tab]();
  if (tab == "lib") grid();
}
/* Library (read-only) */
const card = (p) =>
  `<div class="card" onclick="openP('${p.id}')"><div class="sw" style="background:${p.tests[0] ? p.tests[0].colors[0].h : "#ccc"}"></div><b>${esc(p.common)}</b><i>${esc(p.sci)}</i><small>${esc(p.part)} · ${p.tests.length} test${p.tests.length == 1 ? "" : "s"}</small><div class="strip">${p.tests.map((t) => `<span title="${esc(t.aspect)}: final color" style="background:${last(t).h}"></span>`).join("")}</div></div>`;
function libV() {
  return `<div class="bar"><input style="flex:1;min-width:160px" placeholder="Search by common or scientific name…" value="${esc(q)}" oninput="q=this.value;grid()"><span class="note">${W.length} plants · dyed wool</span></div><div class="grid" id="g"></div><div class="note" style="margin-top:10px">Big swatch = starting color on the wool. Small swatches = final color after each test. Source: original study (Fig. 3), colorimeter hex readings.</div>`;
}
function grid() {
  const L = W.filter((p) =>
    (p.common + " " + p.sci).toLowerCase().includes(q.toLowerCase()),
  );
  $("g").innerHTML =
    L.map(card).join("") || '<div class="note">No matches.</div>';
}
function openP(id) {
  cur = id;
  modal();
}
function closeP() {
  cur = null;
  modal();
}
function tHtml(t) {
  const d = drift(t);
  return `<div class="t"><div class="row" style="justify-content:space-between;align-items:center"><b>${esc(t.aspect)}</b><span class="note">${esc(t.date || "date not recorded")} · texture ${esc(t.texture)}/7 · drift ΔE ${d[d.length - 1].toFixed(1)}</span></div><div class="row" style="margin-top:8px">${t.colors.map((c) => `<div class="chip"><div style="background:${c.h}"></div>${esc(c.l)}<br>${esc(c.h)}</div>`).join("")}</div>${t.notes ? `<div class="note" style="margin-top:6px">${esc(t.notes)}</div>` : ""}</div>`;
}
function modal() {
  if (!cur || !P(cur)) {
    $("ov").innerHTML = "";
    return;
  }
  const p = P(cur);
  $("ov").innerHTML =
    `<div class="ov" onclick="if(event.target==this)closeP()"><div class="md"><div class="row" style="justify-content:space-between;align-items:center"><div><h2 style="margin:0">${esc(p.common)}</h2><i class="note">${esc(p.sci)}</i></div><button onclick="closeP()">Close</button></div>
<p class="note">Part used: ${esc(p.part || "not recorded")} · Mordant: ${esc(p.mordant || "not recorded")}${p.notes ? " · " + esc(p.notes) : ""}</p><h2>Tests</h2>${p.tests.map(tHtml).join("") || '<div class="note">No tests recorded.</div>'}</div></div>`;
}
/* Color wheel */
const HN = [
  "Red",
  "Orange",
  "Yellow",
  "Chartreuse",
  "Green",
  "Spring green",
  "Cyan",
  "Azure",
  "Blue",
  "Violet",
  "Magenta",
  "Rose",
];
const pt = (r, a) => [
  r * Math.sin((a * Math.PI) / 180),
  -r * Math.cos((a * Math.PI) / 180),
];
const arc = (a0, a1, r0, r1) => {
  const A = pt(r1, a0),
    B = pt(r1, a1),
    C = pt(r0, a1),
    D = pt(r0, a0);
  return `M${A}A${r1},${r1} 0 0 1 ${B}L${C}A${r0},${r0} 0 0 0 ${D}Z`;
};
function hsv(h) {
  const r = [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255),
    m = Math.max(...r),
    n = Math.min(...r),
    d = m - n;
  let H = 0;
  if (d) {
    H =
      m == r[0]
        ? ((r[1] - r[2]) / d) % 6
        : m == r[1]
          ? (r[2] - r[0]) / d + 2
          : (r[0] - r[1]) / d + 4;
    H *= 60;
    if (H < 0) H += 360;
  }
  return [H, m ? d / m : 0, m];
}
function wheelV() {
  const pts = [];
  W.forEach((p) =>
    p.tests.forEach((t) =>
      t.colors.forEach((c, i) => {
        if (wm == "final" && i < t.colors.length - 1) return;
        if (wm == "start" && i > 0) return;
        pts.push({ p, t, c });
      }),
    ),
  );
  const cnt = Array(12).fill(0);
  let neu = 0,
    dots = "",
    dotsN = "";
  pts.forEach((o) => {
    const [H, S, V] = hsv(o.c.h),
      neutral = S < 0.15 || V < 0.15;
    if (neutral) {
      neu++;
      if (!wn) return;
    } else cnt[Math.round(H / 30) % 12]++;
    const [x, y] = pt(S * 74, H),
      dot = `<circle cx="${x}" cy="${y}" r="${neutral ? 3.2 : 3.6}" fill="${o.c.h}" stroke="#000" ${neutral ? 'stroke-opacity=".85" stroke-width=".9" stroke-dasharray="1.4 1"' : 'stroke-opacity=".55" stroke-width=".7"'} style="cursor:pointer" onclick="openP('${o.p.id}')"><title>${neutral ? "(low saturation or near-black) " : ""}${esc(o.p.common)} · ${esc(o.t.aspect)} · ${esc(o.c.l)} · ${o.c.h}</title></circle>`;
    if (neutral) dotsN += dot;
    else dots += dot;
  });
  const ring = cnt
    .map(
      (n, i) =>
        `<path d="${arc(i * 30 - 14, i * 30 + 14, 80, 96)}" ${n ? `fill="hsl(${i * 30},80%,50%)"` : `fill="none" stroke="var(--mute)" stroke-dasharray="2 2"`}><title>${HN[i]}: ${n ? n + " colors" : "not reached yet"}</title></path>`,
    )
    .join("");
  const got = cnt.filter((n) => n).length,
    sel = (v) => (wm == v ? " selected" : "");
  return `<h2 style="margin-top:0">Color wheel</h2><div class="sub">Which parts of the visible spectrum the dyes reach. Angle is hue, distance from the center is saturation, and every dot is a measured color.</div><div class="bar"><span class="note">Show:</span><select onchange="wm=this.value;draw()"><option value="all"${sel("all")}>Every checkpoint</option><option value="final"${sel("final")}>Final colors only</option><option value="start"${sel("start")}>Starting colors only</option></select><span class="note">${got} of 12 hue families reached · ${neu} low-saturation or near-black colors ${wn ? "shown with dashed outlines" : "not plotted"}</span><button class="${wn ? "on" : ""}" aria-pressed="${wn}" onclick="wn=!wn;draw()">${wn ? "Hide" : "Show"} low-saturation and near-black colors</button></div><div class="wh"><div class="bg"></div><svg viewBox="-100 -100 200 200">${ring}${dotsN}${dots}</svg></div><div class="cov">${cnt.map((n, i) => (n ? `<span class="y" style="background:hsl(${i * 30},70%,42%)">${HN[i]} · ${n}</span>` : `<span class="n">${HN[i]} · none yet</span>`)).join("")}</div><div class="note">Dashed ring segments are hues not produced yet. Grays, near-blacks and very pale beiges sit close to the center, where hue is unreliable, so they are ${wn ? "drawn with dashed outlines" : "left off the wheel"} and never count toward the hue families above. Click a dot to open its plant.</div>`;
}
/* Fastness */
function fastV() {
  const ps = W.filter((p) => p.tests.length);
  if (!vp || !P(vp)) vp = (ps[0] || {}).id;
  const asp = [
    "All",
    ...new Set(W.flatMap((p) => p.tests.map((t) => t.aspect))),
  ];
  return `<h2 style="margin-top:0">Color drift for one plant</h2><div class="bar"><select onchange="vp=this.value;draw()">${ps.map((p) => `<option value="${p.id}"${p.id == vp ? " selected" : ""}>${esc(p.common)}</option>`).join("")}</select></div><div class="pad">${chart(P(vp))}</div>
<div class="note">Drift = CIE76 ΔE from the starting color (see the Methods tab). Around 2.3 is barely visible; higher means the color moved more. Dots show the measured color.</div>
<h2>Which plants hold their color?</h2><div class="bar"><span class="note">Aspect:</span><select onchange="va=this.value;draw()">${asp.map((a) => `<option${a == va ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></div>${rank()}
<div class="note" style="margin-top:8px">The length of the bar visualizes the stability of the pigment using ΔE. Shorter bar = more stable (average Start-to-final ΔE across matching tests). Left chip is the start color, right chip is where it ended. The readings came from a colorimeter with a high margin of error, so treat this as exploratory.</div>`;
}
function chart(p) {
  if (!p || !p.tests.length)
    return '<div class="note">No tests recorded.</div>';
  const Wd = 640,
    H = 230,
    L = 40,
    B = 28,
    T = 12,
    n = Math.max(...p.tests.map((t) => t.colors.length)),
    all = p.tests.map(drift),
    m = Math.max(5, ...all.flat()) * 1.1,
    X = (i) => L + (n > 1 ? (i * (Wd - L - 16)) / (n - 1) : 0),
    Y = (v) => T + (H - T - B) * (1 - v / m),
    l0 = p.tests.reduce(
      (a, t) => (t.colors.length > a.length ? t.colors : a),
      [],
    ),
    lc = (t) =>
      LC[(TY.indexOf(t.aspect) >= 0 ? TY.indexOf(t.aspect) : 3) % LC.length];
  let s = `<svg viewBox="0 0 ${Wd} ${H}" width="${Wd}">`;
  for (let k = 0; k <= 4; k++) {
    const v = (m * k) / 4;
    s += `<line x1="${L}" x2="${Wd - 8}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(0)}</text>`;
  }
  l0.forEach(
    (c, i) =>
      (s += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(c.l)}</text>`),
  );
  p.tests.forEach((t, j) => {
    const col = lc(t),
      d = all[j];
    s +=
      `<polyline fill="none" stroke="${col}" stroke-width="2" points="${d.map((v, i) => X(i) + "," + Y(v)).join(" ")}"/>` +
      d
        .map(
          (v, i) =>
            `<circle cx="${X(i)}" cy="${Y(v)}" r="6" fill="${t.colors[i].h}" stroke="${col}" stroke-width="2"><title>${esc(t.aspect)} ${esc(t.colors[i].l)}: ${t.colors[i].h}, ΔE ${v.toFixed(1)}</title></circle>`,
        )
        .join("");
  });
  return (
    s +
    '</svg><div class="row" style="margin-top:4px">' +
    p.tests
      .map(
        (t) =>
          `<span class="note"><b style="color:${lc(t)}">━</b> ${esc(t.aspect)}</span>`,
      )
      .join("") +
    "</div>"
  );
}
function rank() {
  const R = W.map((p) => {
    const ts = p.tests.filter((t) => va == "All" || t.aspect == va);
    if (!ts.length) return null;
    const d = ts.map((t) => drift(t).pop());
    return {
      p,
      v: d.reduce((a, b) => a + b, 0) / d.length,
      s: ts[0].colors[0].h,
      e: last(ts[0]).h,
    };
  })
    .filter(Boolean)
    .sort((a, b) => a.v - b.v);
  if (!R.length) return '<div class="note">No data for that aspect.</div>';
  const m = Math.max(...R.map((r) => r.v), 1);
  return R.map(
    (r) =>
      `<div class="rk"><div class="g"><span style="background:${r.s}"></span><span style="background:${r.e}"></span></div><div><div class="b" style="width:${Math.max(2, (r.v / m) * 100)}%"></div><div class="note">${esc(r.p.common)}</div></div><div>${r.v.toFixed(1)}</div></div>`,
  ).join("");
}
/* Placeholders */
const ph = (t, d, l) =>
  `<div class="ph"><h2 style="margin-top:0">${t}</h2><p>${d}</p><div class="note">Planned fields</div><ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul><div class="note">Records loaded: ${(D.concentrates || []).length}</div></div>`;
const concV = () =>
  ph(
    "Concentrate Solutions",
    "Placeholder window. Liquid dye concentrates will be catalogued here.",
    [
      "Source plant (linked to all of its other entries)",
      "Full extraction methodology I used, sources that inspired it, and date prepared.",
      "Concentration and dilution ratio",
      "Shelf-life checks over time",
      "Color of the solution at each checkpoint",
    ],
  );
/* Solution Analysis: case studies (data.json "studies") */
const ST = (id) => (D.studies || []).find((x) => x.id === id);
function csOpen(id) {
  cs = id;
  draw();
  window.scrollTo(0, 0);
}
function csBack() {
  cs = null;
  draw();
  window.scrollTo(0, 0);
}
function blk(b) {
  if (typeof b == "string") return `<p>${esc(b)}</p>`;
  if (b.h3) return `<h3 class="st-h3">${esc(b.h3)}</h3>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  if (b.ol) return `<ol>${b.ol.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
  if (b.note) return `<div class="st-call">${esc(b.note)}</div>`;
  if (b.formula) return `<div class="fm st-fm">${esc(b.formula)}</div>`;
  if (b.facts)
    return `<table class="tb st-facts">${b.facts.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</table>`;
  if (b.table)
    return `<div class="pad"><table class="tb st-tb"><tr>${b.table.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></div>`;
  return "";
}
const secHtml = (x) =>
  x.fold
    ? `<details class="st-fold"><summary>${esc(x.h)}</summary>${x.body.map(blk).join("")}</details>`
    : `<h2>${esc(x.h)}</h2>${x.body.map(blk).join("")}`;
const stCard = (x) =>
  `<div class="card" onclick="csOpen('${esc(x.id)}')"><img class="st-th" src="${esc(x.image)}" alt="${esc(x.alt || "")}" loading="lazy"><b>${esc(x.title)}</b><i>${esc(x.sci)}</i><small>${esc(x.tagline)}</small><div><span class="st-chip">${esc(x.status)}</span></div></div>`;
function studyV(x) {
  const p = P(x.plant),
    lib =
      p && p.tests.length
        ? `<h2>Dyed wool readings</h2><p class="note">From the Wool Library: part used ${esc(p.part || "not recorded")}, mordant ${esc(p.mordant || "not recorded")}. Colorimeter hex readings from the original study, with a high margin of error.</p>${p.tests.map(tHtml).join("")}<button onclick="openP('${esc(p.id)}')">Open in Wool Library</button>`
        : "";
  return `<div class="bar"><button onclick="csBack()">← All case studies</button></div>
<div class="st-head"><img src="${esc(x.image)}" alt="${esc(x.alt || "")}"><div><h2 style="margin:0">${esc(x.title)}</h2><i class="note">${esc(x.sci)}</i><p style="margin:8px 0">${esc(x.tagline)}</p><span class="st-chip">${esc(x.status)}</span>${x.statusNote ? `<div class="note" style="margin-top:6px">${esc(x.statusNote)}</div>` : ""}</div></div>
${x.sections.map(secHtml).join("")}${lib}`;
}
function solV() {
  const L = D.studies || [];
  if (cs && ST(cs)) return studyV(ST(cs));
  return `<h2 style="margin-top:0">Solution Analysis</h2><div class="sub">Case studies: a micro research project on each plant, from botanical profile to dye results to planned experiments.</div><div class="grid st-grid">${L.map(stCard).join("") || '<div class="note">No case studies yet.</div>'}</div><div class="note" style="margin-top:10px">More plants will be added as their case studies are written. Click a study to read it.</div>`;
}
/* Worked example (plant, test, then two readings) */
function mpSet(id) {
  mp = id;
  mt = 0;
  mf = 0;
  mto = null;
  draw();
}
function mtSet(i) {
  mt = i;
  mf = 0;
  mto = null;
  draw();
}
function mfSet(i) {
  mf = i;
  draw();
}
function mtoSet(i) {
  mto = i;
  draw();
}
function exampleV() {
  if (!W.length) return '<div class="note">No data loaded.</div>';
  if (!mp || !P(mp)) {
    mp = W[0].id;
    mt = 0;
    mf = 0;
    mto = null;
  }
  const p = P(mp),
    head = `<h2>Worked example</h2><p class="note">Pick a plant, pick one of its tests, then pick the two readings to compare.</p><div class="bar"><span class="note">Plant:</span><select onchange="mpSet(this.value)">${W.map((q) => `<option value="${q.id}"${q.id == mp ? " selected" : ""}>${esc(q.common)}</option>`).join("")}</select></div>`;
  if (!p.tests.length)
    return head + '<div class="note">No tests recorded for this plant.</div>';
  const ti = Math.min(mt, p.tests.length - 1),
    t = p.tests[ti],
    n = t.colors.length,
    from = mf < n ? mf : 0,
    to = mto == null || mto >= n ? n - 1 : mto,
    a = t.colors[from],
    b = t.colors[to],
    S = labSteps(a.h),
    T = labSteps(b.h),
    d = T.lab.map((v, k) => v - S.lab[k]),
    e = dE(a.h, b.h),
    f2 = (x) => x.toFixed(2),
    f4 = (x) => x.toFixed(4),
    v4 = (arr) => arr.map(f4).join(", "),
    chips = (sel, fn) =>
      t.colors
        .map(
          (c, i) =>
            `<button class="ck${i == sel ? " on" : ""}" onclick="${fn}(${i})"><span class="cs" style="background:${c.h}"></span>${esc(c.l)}</button>`,
        )
        .join(""),
    word =
      e < 1
        ? "not visible to most people"
        : e < 2.3
          ? "barely visible"
          : e < 5
            ? "noticeable"
            : e < 10
              ? "clearly different"
              : "a very different color",
    steps = [
      ["1. Hex to RGB (0 to 1)", v4(S.c), v4(T.c)],
      ["2. Linearized R′, G′, B′", v4(S.r), v4(T.r)],
      ["3. X, Y, Z", v4(S.xyz), v4(T.xyz)],
      ["4. Normalized x, y, z", v4(S.n), v4(T.n)],
      ["5. f(x), f(y), f(z)", v4(S.F), v4(T.F)],
      ["6. L*, a*, b*", S.lab.map(f2).join(", "), T.lab.map(f2).join(", ")],
    ],
    row = (c, h, v) =>
      `<tr><td>${esc(c)}</td><td>${h}</td><td>${f2(v[0])}</td><td>${f2(v[1])}</td><td>${f2(v[2])}</td></tr>`;
  return `${head}<div class="bar"><span class="note">Test:</span>${p.tests.map((x, i) => `<button class="${i == ti ? "on" : ""}" onclick="mtSet(${i})">${esc(x.aspect)}</button>`).join("")}</div>
<div class="note">From (reference reading)</div><div class="row">${chips(from, "mfSet")}</div>
<div class="note" style="margin-top:8px">To (reading to compare)</div><div class="row">${chips(to, "mtoSet")}</div>
<div class="cmp"><div class="sq" style="background:${a.h}"></div><div class="note">${esc(a.l)}<br>${a.h}</div><div>→</div><div class="sq" style="background:${b.h}"></div><div class="note">${esc(b.l)}<br>${b.h}</div><div><div class="big">ΔE = ${f2(e)}</div><div class="note">${word}</div></div></div>
<table class="tb"><tr><th></th><th>Hex</th><th>L*</th><th>a*</th><th>b*</th></tr>${row(a.l, a.h, S.lab)}${row(b.l, b.h, T.lab)}${row("Difference", "", d)}</table><div>ΔE*ab = √( (${f2(d[0])})² + (${f2(d[1])})² + (${f2(d[2])})² ) = <b>${f2(e)}</b></div>
<details><summary>Show every step</summary><div class="pad"><table class="tb"><tr><th>Step</th><th>From: ${esc(a.l)} (${a.h})</th><th>To: ${esc(b.l)} (${b.h})</th></tr>${steps.map((s) => `<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`).join("")}</table></div></details>
<div class="note" style="margin-top:6px">Rough guide for the word label: under 1 is invisible, 1 to 2.3 barely visible, 2.3 to 5 noticeable, 5 to 10 clearly different, above 10 very different.</div>`;
}
/* Methods */
function methV() {
  return `<h2 style="margin-top:0">How ΔE is calculated</h2><p>Every colorimeter hex reading is converted to CIELAB, and the CIE76 color difference (ΔE*ab) is the straight-line distance between two colors in that space.</p>
<div class="fm">1. Hex to RGB (0 to 1)
     R = 0xRR / 255,  G = 0xGG / 255,  B = 0xBB / 255

2. Linearize each channel c (sRGB inverse gamma)
     c′ = c / 12.92                    if c ≤ 0.04045
     c′ = ((c + 0.055) / 1.055)^2.4    otherwise

3. Linear RGB to XYZ (sRGB primaries, D65)
     X = 0.4124·R′ + 0.3576·G′ + 0.1805·B′
     Y = 0.2126·R′ + 0.7152·G′ + 0.0722·B′
     Z = 0.0193·R′ + 0.1192·G′ + 0.9505·B′

4. Normalize by the D65 white point
     x = X / 0.95047,  y = Y / 1.00000,  z = Z / 1.08883

5. Helper function
     f(t) = t^(1/3)             if t &gt; 0.008856
     f(t) = 7.787·t + 16/116    otherwise

6. CIELAB
     L* = 116·f(y) − 16
     a* = 500·(f(x) − f(y))
     b* = 200·(f(y) − f(z))

7. CIE76 color difference between color 1 and color 2
     ΔE*ab = √( (L₂* − L₁*)² + (a₂* − a₁*)² + (b₂* − b₁*)² )</div>
${exampleV()}
<h2>How the archive uses it</h2><p class="note">Drift is the ΔE between a test’s Start reading and each later checkpoint. The ranking averages the Start-to-final ΔE across the selected tests, and lower means the color moved less. A ΔE near 2.3 is roughly the smallest difference the average person can notice with the naked eye.</p>
<p class="note">Caveats: hex values are assumed to be sRGB under D65, which adds error on top of the colorimeter’s own margin of error. CIE76 is the simplest ΔE formula and is uneven for saturated colors. This is not an ISO 105 Grey Scale or Blue Wool rating.</p>`;
}
/* Load data.json, then draw the page */
fetch("data.json")
  .then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then((j) => {
    D = j;
    W = j.wool || [];
    vp = (W[0] || {}).id;
    draw();
  })
  .catch(() => {
    $("app").textContent =
      "Could not load data.json. If you opened index.html straight from your disk, run a local server instead (for example: python -m http.server).";
  });
