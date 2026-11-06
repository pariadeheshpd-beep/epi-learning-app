import React, { useMemo, useState } from "react";

/* ============================================================
   Sample size lab: interactive calculators for the main sample
   size formulas, a power visualiser, a short quiz and the
   downloadable Excel calculator and slide deck.
   Design tokens copied from App.jsx to keep the same look.
============================================================ */
const FONT = "'Vazirmatn', Tahoma, 'Segoe UI', sans-serif";
const MATH = "'Cambria Math', Cambria, 'Times New Roman', serif";
const NAVY = "#1F2A3C";
const PAPER = "#F6F4EF";
const TEAL = "#3E7C74";
const OCHRE = "#B8873D";
const RED = "#C0604A";
const LINE = "#E4DFD3";
const MUTED = "#8A8272";

/* ---------------- maths helpers ---------------- */
// standard normal CDF (Abramowitz & Stegun 26.2.17, |error| < 7.5e-8)
function pnorm(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}
// inverse standard normal (Acklam's algorithm, relative error < 1.2e-9)
function qnorm(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p <= 0 || p >= 1) return NaN;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
const dnorm = (x, m = 0) => Math.exp(-((x - m) ** 2) / 2) / Math.sqrt(2 * Math.PI);
const up = (x) => Math.ceil(x - 1e-9);

/* ---------------- formatting ---------------- */
const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (x) => String(x).replace(/\d/g, (d) => FA[d]).replace(/\./g, "/");
const r2 = (x, k = 2) => (isFinite(x) ? Number(x.toFixed(k)).toString() : "—");

/* ---------------- UI atoms ---------------- */
function Card({ children, style }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${LINE}`, borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(31,42,60,0.06)", minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

function H3({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: NAVY }}>{children}</h3>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.8 }}>{sub}</p>}
    </div>
  );
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {label && <span style={{ fontSize: 12.5, color: MUTED }}>{label}</span>}
      <div style={{ display: "inline-flex", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 999, padding: 3, flexWrap: "wrap" }}>
        {options.map(([v, t]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              border: "none", borderRadius: 999, padding: "6px 12px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer",
              background: value === v ? NAVY : "transparent", color: value === v ? PAPER : NAVY,
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step = 1, min, max, suffix, hint, optional }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 12.5, color: NAVY }}>
      <span style={{ fontWeight: 600 }}>
        {label}
        {optional && <span style={{ color: MUTED, fontWeight: 400 }}> (اختیاری)</span>}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            width: "100%", boxSizing: "border-box", minWidth: 0, padding: "7px 8px", border: "1.5px solid #D8D1C0", borderRadius: 8,
            fontSize: 15, fontFamily: FONT, color: NAVY, background: "#FFFDF6", textAlign: "center", direction: "ltr",
          }}
        />
        {suffix && <span style={{ color: MUTED, fontSize: 13, minWidth: 14 }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.6 }}>{hint}</span>}
    </label>
  );
}

function Formula({ children, size = 16 }) {
  return (
    <div
      style={{
        direction: "ltr", textAlign: "center", fontFamily: MATH, fontStyle: "italic", fontSize: size, color: NAVY,
        background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </div>
  );
}

function Reveal({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "right", background: open ? "#EAF2F0" : "#FFFFFF", border: "none", padding: "10px 14px", fontFamily: FONT, fontSize: 13.5, color: NAVY, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, lineHeight: 1.7 }}
      >
        <span>{q}</span>
        <span style={{ color: MUTED }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.9, color: "#4A4437", background: PAPER }}>{children}</div>}
    </div>
  );
}

/* ============================================================
   1. Calculator
============================================================ */
const TEST = [
  { key: "alpha", label: "سطح معنی‌داری α", def: 5, step: 1, min: 0.1, max: 20, suffix: "٪" },
  { key: "power", label: "توان آزمون", def: 80, step: 5, min: 50, max: 99, suffix: "٪" },
];
const EST = [{ key: "conf", label: "سطح اطمینان", def: 95, step: 1, min: 80, max: 99.9, suffix: "٪" }];
const DROP = (def) => ({ key: "drop", label: "نرخ ریزش یا عدم پاسخ", def, step: 5, min: 0, max: 60, suffix: "٪" });

// two-proportion core shared by several designs; k = n2/n1
function twoProp(za, zb, p1, p2, k) {
  const pbar = (p1 + k * p2) / (1 + k);
  const n1 = (za * Math.sqrt(pbar * (1 - pbar) * (1 + 1 / k)) + zb * Math.sqrt(p1 * (1 - p1) + (p2 * (1 - p2)) / k)) ** 2 / (p1 - p2) ** 2;
  return { pbar, n1 };
}

const METHODS = [
  {
    id: "prop",
    title: "برآورد یک نسبت",
    design: "مقطعی توصیفی: برآورد شیوع",
    example: "مثال: شیوع میگرن در دانشجویان پزشکی",
    formula: "n₀ = Z²₁₋α/₂ · p(1 − p) / d²",
    inputs: [
      ...EST,
      { key: "p", label: "نسبت مورد انتظار p", def: 25, step: 1, min: 0.1, max: 99.9, suffix: "٪", hint: "اگر نامعلوم است ۵۰٪ بگذارید" },
      { key: "d", label: "دقت مطلق d", def: 5, step: 0.5, min: 0.1, max: 50, suffix: "٪" },
      { key: "N", label: "حجم جامعه N", def: "", step: 100, min: 1, optional: true, hint: "خالی = جامعه بزرگ" },
      { key: "deff", label: "اثر طرح (DEFF)", def: 1, step: 0.1, min: 1, max: 10, hint: "تصادفی ساده = ۱" },
      DROP(10),
    ],
    compute(v) {
      const z = qnorm(1 - (1 - v.conf / 100) / 2);
      const p = v.p / 100, d = v.d / 100;
      const n0 = (z ** 2 * p * (1 - p)) / d ** 2;
      const nf = v.N ? n0 / (1 + (n0 - 1) / v.N) : n0;
      const n = up(nf * v.deff);
      const steps = [
        `Z = ${r2(z, 3)}`,
        `n₀ = ${r2(z, 2)}² × ${p} × ${r2(1 - p)} / ${d}² = ${r2(n0)}`,
        ...(v.N ? [`n = n₀ / [1 + (n₀ − 1)/N] = ${r2(nf)}`] : []),
        ...(v.deff !== 1 ? [`n × DEFF = ${r2(nf)} × ${v.deff} = ${r2(nf * v.deff)}`] : []),
      ];
      const warn = d / p > 0.25 ? "دقت نسبی (d/p) بیش از ۲۵٪ است؛ برای شیوع‌های کم، d را کوچک‌تر بگیرید." : null;
      return { steps, groups: [{ label: "حجم نمونه", n }], warn };
    },
    text: (v, g, f) =>
      `حجم نمونه با استفاده از فرمول برآورد یک نسبت، با سطح اطمینان ${fa(v.conf)} درصد، نسبت مورد انتظار ${fa(v.p)} درصد بر اساس مطالعه … و دقت ${fa(v.d)} درصد، ${fa(g[0].n)} نفر برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "mean",
    title: "برآورد یک میانگین",
    design: "مقطعی توصیفی: برآورد میانگین",
    example: "مثال: میانگین نمره کیفیت خواب در پرستاران شیفت شب",
    formula: "n₀ = Z²₁₋α/₂ · σ² / d²",
    inputs: [
      ...EST,
      { key: "sd", label: "انحراف معیار σ", def: 3.2, step: 0.1, min: 0.01 },
      { key: "d", label: "دقت مطلق d (واحد متغیر)", def: 0.5, step: 0.1, min: 0.01 },
      { key: "N", label: "حجم جامعه N", def: "", step: 100, min: 1, optional: true },
      DROP(10),
    ],
    compute(v) {
      const z = qnorm(1 - (1 - v.conf / 100) / 2);
      const n0 = (z ** 2 * v.sd ** 2) / v.d ** 2;
      const nf = v.N ? n0 / (1 + (n0 - 1) / v.N) : n0;
      return {
        steps: [`Z = ${r2(z, 3)}`, `n₀ = ${r2(z, 2)}² × ${v.sd}² / ${v.d}² = ${r2(n0)}`, ...(v.N ? [`n = n₀ / [1 + (n₀ − 1)/N] = ${r2(nf)}`] : [])],
        groups: [{ label: "حجم نمونه", n: up(nf) }],
      };
    },
    text: (v, g, f) =>
      `حجم نمونه با استفاده از فرمول برآورد میانگین، با سطح اطمینان ${fa(v.conf)} درصد، انحراف معیار ${fa(v.sd)} بر اساس مطالعه … و دقت ${fa(v.d)} واحد، ${fa(g[0].n)} نفر برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "twomeans",
    title: "مقایسه دو میانگین",
    design: "کارآزمایی یا مقطعی تحلیلی، دو گروه مستقل",
    example: "مثال: اثر توان‌بخشی شناختی بر نمره MoCA در اختلال شناختی خفیف",
    formula: "n₁ = (Z₁₋α/₂ + Z₁₋β)² · σ² · (1 + 1/k) / Δ²     n₂ = k · n₁",
    test: true,
    inputs: [
      ...TEST,
      { key: "sd", label: "انحراف معیار مشترک σ", def: 3.5, step: 0.1, min: 0.01 },
      { key: "delta", label: "حداقل تفاوت مهم Δ", def: 2, step: 0.1, min: 0.01 },
      { key: "k", label: "نسبت تخصیص k = n₂/n₁", def: 1, step: 0.5, min: 0.1, max: 10 },
      DROP(15),
    ],
    compute(v, za, zb) {
      const n1 = ((za + zb) ** 2 * v.sd ** 2 * (1 + 1 / v.k)) / v.delta ** 2;
      return {
        steps: [
          `Zα = ${r2(za, 3)} ,  Zβ = ${r2(zb, 3)} ,  Cohen's d = ${r2(v.delta / v.sd)}`,
          `n₁ = (${r2(za)} + ${r2(zb)})² × ${v.sd}² × (1 + 1/${v.k}) / ${v.delta}² = ${r2(n1)}`,
        ],
        groups: [{ label: "گروه ۱", n: up(n1) }, { label: "گروه ۲", n: up(v.k * n1) }],
      };
    },
    text: (v, g, f) =>
      `حجم نمونه بر اساس فرمول مقایسه دو میانگین و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد، انحراف معیار ${fa(v.sd)} بر اساس مطالعه … و حداقل تفاوت معنی‌دار ${fa(v.delta)} واحد، ${fa(g[0].n)} نفر در گروه اول و ${fa(g[1].n)} نفر در گروه دوم برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} و ${fa(f[1])} نفر (مجموعاً ${fa(f[0] + f[1])} نفر) وارد مطالعه خواهند شد.`,
  },
  {
    id: "twoprops",
    title: "مقایسه دو نسبت",
    design: "کارآزمایی یا مقطعی تحلیلی با پیامد کیفی",
    example: "مثال: پاسخ به درمان پیشگیرانه میگرن، دارو در برابر دارونما",
    formula: "n₁ = [Z₁₋α/₂ √(p̄q̄(1 + 1/k)) + Z₁₋β √(p₁q₁ + p₂q₂/k)]² / (p₁ − p₂)²",
    test: true,
    inputs: [
      ...TEST,
      { key: "p1", label: "نسبت در گروه ۱ (p₁)", def: 60, step: 1, min: 0.1, max: 99.9, suffix: "٪" },
      { key: "p2", label: "نسبت در گروه ۲ (p₂)", def: 40, step: 1, min: 0.1, max: 99.9, suffix: "٪" },
      { key: "k", label: "نسبت تخصیص k = n₂/n₁", def: 1, step: 0.5, min: 0.1, max: 10 },
      DROP(10),
    ],
    compute(v, za, zb) {
      const p1 = v.p1 / 100, p2 = v.p2 / 100;
      const { pbar, n1 } = twoProp(za, zb, p1, p2, v.k);
      const cc = (n1 / 4) * (1 + Math.sqrt(1 + (2 * (v.k + 1)) / (n1 * v.k * Math.abs(p1 - p2)))) ** 2;
      return {
        steps: [`Zα = ${r2(za, 3)} ,  Zβ = ${r2(zb, 3)} ,  p̄ = ${r2(pbar, 3)}`, `n₁ = ${r2(n1)}`, `n₁ (Fleiss continuity correction) = ${r2(cc)}`],
        groups: [{ label: "گروه ۱", n: up(n1) }, { label: "گروه ۲", n: up(v.k * n1) }],
        note: `با اصلاح پیوستگی (محافظه‌کارانه‌تر): ${fa(up(cc))} و ${fa(up(v.k * cc))} نفر پیش از ریزش.`,
      };
    },
    text: (v, g, f) =>
      `حجم نمونه بر اساس فرمول مقایسه دو نسبت و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد و نسبت مورد انتظار ${fa(v.p1)} درصد در گروه اول و ${fa(v.p2)} درصد در گروه دوم بر اساس مطالعه …، ${fa(g[0].n)} و ${fa(g[1].n)} نفر برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} و ${fa(f[1])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "paired",
    title: "مقایسه زوجی (قبل و بعد)",
    design: "اندازه‌گیری تکراری یا داده‌های جورشده",
    example: "مثال: اثر rTMS بر نمره افسردگی همیلتون در یک گروه بیمار",
    formula: "n = (Z₁₋α/₂ + Z₁₋β)² · σd² / Δ²        σd² = σ₁² + σ₂² − 2ρσ₁σ₂",
    test: true,
    inputs: [
      ...TEST,
      { key: "delta", label: "میانگین تفاوت مورد انتظار Δ", def: 4, step: 0.5, min: 0.01 },
      { key: "sdd", label: "انحراف معیار تفاوت‌ها σd", def: 8, step: 0.5, min: 0.01, hint: "اگر ندارید خالی بگذارید" },
      { key: "s1", label: "SD قبل σ₁", def: 7, step: 0.5, min: 0, optional: true },
      { key: "s2", label: "SD بعد σ₂", def: 7, step: 0.5, min: 0, optional: true },
      { key: "rho", label: "همبستگی قبل و بعد ρ", def: 0.5, step: 0.1, min: -1, max: 1, optional: true },
      DROP(20),
    ],
    compute(v, za, zb) {
      const sd = v.sdd === "" ? Math.sqrt(v.s1 ** 2 + v.s2 ** 2 - 2 * v.rho * v.s1 * v.s2) : v.sdd;
      const n = ((za + zb) ** 2 * sd ** 2) / v.delta ** 2;
      return {
        steps: [
          ...(v.sdd === "" ? [`σd = √(${v.s1}² + ${v.s2}² − 2×${v.rho}×${v.s1}×${v.s2}) = ${r2(sd)}`] : []),
          `dz = Δ/σd = ${r2(v.delta / sd)}`,
          `n = (${r2(za)} + ${r2(zb)})² × ${r2(sd)}² / ${v.delta}² = ${r2(n)}`,
        ],
        groups: [{ label: "تعداد افراد", n: up(n) }],
        sd,
      };
    },
    text: (v, g, f, res) =>
      `حجم نمونه بر اساس فرمول مقایسه میانگین‌های زوجی و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد، میانگین تفاوت مورد انتظار ${fa(v.delta)} و انحراف معیار تفاوت‌ها ${fa(r2(res.sd, 1))} بر اساس مطالعه …، ${fa(g[0].n)} نفر برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "corr",
    title: "همبستگی",
    design: "رابطه دو متغیر کمّی",
    example: "مثال: رابطه کیفیت خواب با نمره حافظه کاری",
    formula: "n = [(Z₁₋α/₂ + Z₁₋β) / C]² + 3        C = ½ ln[(1 + r)/(1 − r)]",
    test: true,
    inputs: [...TEST, { key: "r", label: "ضریب همبستگی مورد انتظار r", def: 0.3, step: 0.05, min: 0.01, max: 0.99 }, DROP(10)],
    compute(v, za, zb) {
      const C = 0.5 * Math.log((1 + v.r) / (1 - v.r));
      const n = ((za + zb) / C) ** 2 + 3;
      return { steps: [`C = ${r2(C, 4)}`, `n = ((${r2(za)} + ${r2(zb)}) / ${r2(C, 3)})² + 3 = ${r2(n)}`], groups: [{ label: "حجم نمونه", n: up(n) }] };
    },
    text: (v, g, f) =>
      `حجم نمونه بر اساس فرمول آزمون ضریب همبستگی و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد و ضریب همبستگی مورد انتظار ${fa(v.r)} بر اساس مطالعه …، ${fa(g[0].n)} نفر برآورد شد که با احتساب ${fa(v.drop)} درصد ریزش، ${fa(f[0])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "casecontrol",
    title: "مورد-شاهدی (OR)",
    design: "مطالعه مورد-شاهدی",
    example: "مثال: مواجهه با آفت‌کش‌ها و بیماری پارکینسون",
    formula: "p₁ = OR·p₀ / [1 + p₀(OR − 1)]   →   فرمول دو نسبت",
    test: true,
    inputs: [
      ...TEST,
      { key: "p0", label: "نسبت مواجهه در شاهدها p₀", def: 20, step: 1, min: 0.1, max: 99.9, suffix: "٪" },
      { key: "or", label: "نسبت شانس مورد انتظار OR", def: 2, step: 0.1, min: 0.05 },
      { key: "k", label: "تعداد شاهد به ازای هر مورد", def: 1, step: 1, min: 1, max: 10, hint: "بیش از ۴ سود چندانی ندارد" },
      DROP(5),
    ],
    compute(v, za, zb) {
      const p0 = v.p0 / 100;
      const p1 = (v.or * p0) / (1 + p0 * (v.or - 1));
      const { n1 } = twoProp(za, zb, p1, p0, v.k);
      return { steps: [`p₁ = ${v.or} × ${p0} / [1 + ${p0}(${v.or} − 1)] = ${r2(p1, 3)}`, `n (cases) = ${r2(n1)}`], groups: [{ label: "موارد", n: up(n1) }, { label: "شاهدها", n: up(v.k * n1) }] };
    },
    text: (v, g, f) =>
      `حجم نمونه بر اساس فرمول مطالعات مورد-شاهدی و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد، نسبت مواجهه ${fa(v.p0)} درصد در گروه شاهد بر اساس مطالعه … و حداقل نسبت شانس ${fa(v.or)}، ${fa(g[0].n)} مورد و ${fa(g[1].n)} شاهد برآورد شد که با احتساب ${fa(v.drop)} درصد عدم پاسخ، ${fa(f[0])} مورد و ${fa(f[1])} شاهد وارد مطالعه خواهند شد.`,
  },
  {
    id: "cohort",
    title: "کوهورت (RR)",
    design: "مطالعه کوهورت",
    example: "مثال: آسیب مغزی تروماتیک و بروز صرع پس از ضربه",
    formula: "p₁ = RR · p₀   →   فرمول دو نسبت",
    test: true,
    inputs: [
      ...TEST,
      { key: "p0", label: "بروز در غیرمواجهه p₀", def: 5, step: 0.5, min: 0.1, max: 99, suffix: "٪" },
      { key: "rr", label: "خطر نسبی مورد انتظار RR", def: 2.5, step: 0.1, min: 0.05 },
      { key: "k", label: "نسبت غیرمواجهه به مواجهه", def: 1, step: 0.5, min: 0.1, max: 10 },
      DROP(15),
    ],
    compute(v, za, zb) {
      const p0 = v.p0 / 100, p1 = v.rr * p0;
      if (p1 >= 1) return { error: "RR × p₀ باید کمتر از ۱۰۰٪ باشد." };
      const { n1 } = twoProp(za, zb, p1, p0, v.k);
      return { steps: [`p₁ = ${v.rr} × ${p0} = ${r2(p1, 3)}`, `n (exposed) = ${r2(n1)}`], groups: [{ label: "مواجهه", n: up(n1) }, { label: "غیرمواجهه", n: up(v.k * n1) }] };
    },
    text: (v, g, f) =>
      `حجم نمونه بر اساس فرمول مطالعات کوهورت و با در نظر گرفتن سطح معنی‌داری ${fa(v.alpha / 100)}، توان آزمون ${fa(v.power)} درصد، بروز ${fa(v.p0)} درصد در گروه غیرمواجهه بر اساس مطالعه … و حداقل خطر نسبی ${fa(v.rr)}، ${fa(g[0].n)} نفر در گروه مواجهه و ${fa(g[1].n)} نفر در گروه غیرمواجهه برآورد شد که با احتساب ${fa(v.drop)} درصد از دست رفتن در پیگیری، ${fa(f[0])} و ${fa(f[1])} نفر وارد مطالعه خواهند شد.`,
  },
  {
    id: "animal",
    title: "حیوانی (معادله منابع)",
    design: "مطالعه حیوانی اکتشافی، بدون اطلاعات اندازه اثر",
    example: "مثال: ۴ گروه موش صحرایی (کنترل، شم، مدل، درمان)",
    formula: "E = N − k        10 ≤ E ≤ 20",
    inputs: [{ key: "k", label: "تعداد گروه‌ها k", def: 4, step: 1, min: 2, max: 20 }, DROP(10)],
    compute(v) {
      const lo = up((10 + v.k) / v.k), hi = Math.floor((20 + v.k) / v.k);
      return {
        steps: [`N = 10 + ${v.k} = ${10 + v.k}  …  N = 20 + ${v.k} = ${20 + v.k}`, `n per group = ${lo} … ${hi}`],
        groups: [{ label: "حداقل در هر گروه", n: lo }, { label: "حداکثر در هر گروه", n: hi }],
        note: "اگر از مطالعات قبلی اندازه اثر دارید، آنالیز توان (مقایسه دو میانگین یا G*Power) ارجح است. واحد تحلیل حیوان است، نه سلول یا برش.",
      };
    },
    text: (v, g, f) =>
      `حجم نمونه با روش معادله منابع (E = N − k، با ۱۰ ≤ E ≤ ۲۰) برای ${fa(v.k)} گروه، ${fa(g[0].n)} تا ${fa(g[1].n)} سر حیوان در هر گروه برآورد شد که با احتساب ${fa(v.drop)} درصد مرگ‌ومیر یا حذف، ${fa(f[0])} تا ${fa(f[1])} سر در هر گروه در نظر گرفته می‌شود.`,
  },
];

function defaults(m) {
  const o = { tails: 2 };
  m.inputs.forEach((i) => (o[i.key] = i.def));
  return o;
}

export function SampleSizeCalculator() {
  const [mid, setMid] = useState("twomeans");
  const [vals, setVals] = useState(() => Object.fromEntries(METHODS.map((m) => [m.id, defaults(m)])));
  const [copied, setCopied] = useState(false);
  const m = METHODS.find((x) => x.id === mid);
  const v = vals[mid];
  const set = (k, x) => setVals((s) => ({ ...s, [mid]: { ...s[mid], [k]: x } }));

  const res = useMemo(() => {
    const need = m.inputs.filter((i) => !i.optional && i.key !== "N" && !(m.id === "paired" && i.key === "sdd"));
    if (need.some((i) => v[i.key] === "" || !isFinite(v[i.key]))) return { error: "همه خانه‌های لازم را پر کنید." };
    if (m.id === "paired" && v.sdd === "" && [v.s1, v.s2, v.rho].some((x) => x === "")) return { error: "σd یا سه مقدار SD قبل، SD بعد و ρ را وارد کنید." };
    if (m.id === "twoprops" && v.p1 === v.p2) return { error: "دو نسبت نباید برابر باشند." };
    const za = m.test ? qnorm(1 - v.alpha / 100 / v.tails) : null;
    const zb = m.test ? qnorm(v.power / 100) : null;
    const r = m.compute(v, za, zb);
    if (r.error) return r;
    if (r.groups.some((g) => !isFinite(g.n) || g.n <= 0)) return { error: "با این ورودی‌ها محاسبه ممکن نیست؛ مقادیر را بررسی کنید." };
    const drop = Number(v.drop) || 0;
    const finals = r.groups.map((g) => up(g.n / (1 - drop / 100)));
    return { ...r, finals, text: m.text(v, r.groups, finals, r) };
  }, [m, v]);

  const copy = () => {
    if (!res.text) return;
    navigator.clipboard?.writeText(res.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Card>
      <H3 sub="روش متناسب با طرح مطالعه را انتخاب کنید، ورودی‌ها را تغییر دهید و جایگذاری گام‌به‌گام، حجم نهایی و متن آماده پروپوزال را ببینید.">
        محاسبه‌گر حجم نمونه
      </H3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {METHODS.map((x) => (
          <button
            key={x.id}
            onClick={() => setMid(x.id)}
            style={{
              border: `1.5px solid ${mid === x.id ? NAVY : "#D8D1C0"}`, background: mid === x.id ? NAVY : "#FFFFFF", color: mid === x.id ? PAPER : NAVY,
              borderRadius: 999, padding: "6px 12px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer",
            }}
          >
            {x.title}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8, lineHeight: 1.8 }}>
        <b style={{ color: TEAL }}>{m.design}</b> · {m.example}
      </div>
      <Formula>{m.formula}</Formula>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "16px 0 10px" }}>
        {m.inputs.map((i) => (
          <Field key={i.key} {...i} value={v[i.key]} onChange={(x) => set(i.key, x)} />
        ))}
      </div>
      {m.test && (
        <div style={{ marginBottom: 14 }}>
          <Segmented label="نوع آزمون" value={v.tails} onChange={(x) => set("tails", x)} options={[[2, "دودامنه"], [1, "یک‌دامنه"]]} />
        </div>
      )}

      {res.error ? (
        <div style={{ padding: "10px 14px", background: "#FBEAE6", border: `1px solid ${RED}`, borderRadius: 10, fontSize: 13, color: RED }}>{res.error}</div>
      ) : (
        <>
          <div style={{ direction: "ltr", fontFamily: MATH, fontSize: 14, color: "#4A4437", background: PAPER, borderRadius: 10, padding: "10px 14px", lineHeight: 2, overflowX: "auto" }}>
            {res.steps.map((s, i) => (
              <div key={i}>{s}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${res.groups.length}, minmax(0, 1fr))`, gap: 10, marginTop: 12 }}>
            {res.groups.map((g, i) => (
              <div key={i} style={{ background: NAVY, color: PAPER, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#D8DEE8" }}>{g.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#F3D9A8", lineHeight: 1.4 }}>{fa(res.finals[i])}</div>
                <div style={{ fontSize: 11.5, color: "#D8DEE8" }}>
                  بدون ریزش: {fa(g.n)}
                  {Number(v.drop) > 0 && ` · ریزش ${fa(v.drop)}٪`}
                </div>
              </div>
            ))}
          </div>
          {res.groups.length === 2 && m.id !== "animal" && (
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>حجم کل با احتساب ریزش: <b style={{ color: NAVY }}>{fa(res.finals[0] + res.finals[1])}</b></div>
          )}
          {(res.note || res.warn) && (
            <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.8, color: res.warn ? RED : OCHRE }}>{res.warn || res.note}</p>
          )}

          <div style={{ marginTop: 14, padding: "12px 14px", background: "#EAF2F0", border: `1px solid ${TEAL}55`, borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
              <b style={{ fontSize: 13, color: TEAL }}>متن پیشنهادی برای پروپوزال</b>
              <button onClick={copy} style={{ background: TEAL, color: "#FFF", border: "none", borderRadius: 8, padding: "5px 12px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                {copied ? "کپی شد ✓" : "کپی متن"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 2, color: NAVY }}>{res.text}</p>
          </div>
        </>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 11.5, color: MUTED, lineHeight: 1.8 }}>
        فرمول‌ها بر پایه توزیع نرمال‌اند. برای آزمون t، نرم‌افزار G*Power معمولاً ۱ تا ۲ نفر بیشتر می‌دهد. ریزش با تقسیم بر (۱ − نرخ ریزش) اعمال می‌شود.
      </p>
    </Card>
  );
}

/* ============================================================
   2. Power visualiser: null vs alternative distributions
============================================================ */
export function PowerLab() {
  const [d, setD] = useState(0.5);
  const [n, setN] = useState(40);
  const [alpha, setAlpha] = useState(0.05);

  const zc = qnorm(1 - alpha / 2);
  const delta = d * Math.sqrt(n / 2);
  const power = 1 - pnorm(zc - delta) + pnorm(-zc - delta);
  const n80 = up((2 * (zc + qnorm(0.8)) ** 2) / d ** 2);
  const n90 = up((2 * (zc + qnorm(0.9)) ** 2) / d ** 2);

  // SVG geometry
  const W = 640, H = 230, padB = 28, padT = 12;
  const xmin = -4, xmax = Math.max(4.5, delta + 4);
  const X = (x) => ((x - xmin) / (xmax - xmin)) * W;
  const Y = (y) => H - padB - (y / 0.42) * (H - padB - padT);
  const pts = (m, a = xmin, b = xmax) => {
    const out = [];
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N;
      out.push(`${X(x).toFixed(1)},${Y(dnorm(x, m)).toFixed(1)}`);
    }
    return out;
  };
  const area = (m, a, b) => {
    if (b <= a) return "";
    const p = pts(m, a, b);
    return `M${X(a).toFixed(1)},${Y(0)} L${p.join(" L")} L${X(b).toFixed(1)},${Y(0)} Z`;
  };

  const slider = (label, value, set, min, max, step, show) => (
    <label style={{ display: "grid", gap: 4, fontSize: 12.5, color: NAVY }}>
      <span>
        {label}: <b style={{ color: OCHRE }}>{show}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} style={{ width: "100%", accentColor: TEAL }} />
    </label>
  );

  return (
    <Card>
      <H3 sub="منحنی خاکستری توزیع آماره آزمون وقتی تفاوتی وجود ندارد (H₀) و منحنی سبز وقتی تفاوت واقعی وجود دارد (H₁). با افزایش حجم نمونه یا اندازه اثر، دو منحنی از هم دور می‌شوند و توان بالا می‌رود.">
        آزمایشگاه توان: α، β و توان را ببینید
      </H3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 10 }}>
        {slider("اندازه اثر (Cohen's d)", d, setD, 0.1, 1.5, 0.05, fa(d.toFixed(2)))}
        {slider("حجم هر گروه", n, setN, 5, 300, 1, fa(n))}
        <div style={{ alignSelf: "end" }}>
          <Segmented label="α" value={alpha} onChange={setAlpha} options={[[0.01, fa("0.01")], [0.05, fa("0.05")], [0.1, fa("0.10")]]} />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", direction: "ltr", display: "block" }} role="img" aria-label="توزیع‌های H0 و H1">
        <path d={area(delta, zc, xmax)} fill={TEAL} fillOpacity="0.35" />
        <path d={area(delta, xmin, zc)} fill={OCHRE} fillOpacity="0.35" />
        <path d={area(0, zc, xmax)} fill={RED} fillOpacity="0.55" />
        <polyline points={pts(0).join(" ")} fill="none" stroke="#7D8796" strokeWidth="2" />
        <polyline points={pts(delta).join(" ")} fill="none" stroke={TEAL} strokeWidth="2.5" />
        <line x1={X(zc)} x2={X(zc)} y1={padT} y2={Y(0)} stroke={NAVY} strokeDasharray="4 3" strokeWidth="1.5" />
        <line x1="0" x2={W} y1={Y(0)} y2={Y(0)} stroke="#BFB8A8" />
        <text x={X(0)} y={Y(0.4) - 2} textAnchor="middle" fontSize="13" fill="#5B6472" fontFamily={FONT}>H₀</text>
        <text x={X(delta)} y={Y(0.4) - 2} textAnchor="middle" fontSize="13" fill={TEAL} fontFamily={FONT}>H₁</text>
        <text x={X(zc) - 5} y={Y(0.07)} textAnchor="end" fontSize="11" fill={NAVY}>Zc = {zc.toFixed(2)}</text>
        <text x={X(0)} y={H - 8} textAnchor="middle" fontSize="11" fill={MUTED}>0</text>
        <text x={X(delta)} y={H - 8} textAnchor="middle" fontSize="11" fill={TEAL}>δ = {delta.toFixed(2)}</text>
      </svg>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#4A4437", margin: "6px 0 12px" }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: RED, opacity: 0.6, borderRadius: 3, verticalAlign: "middle" }} /> α (خطای نوع اول)</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: OCHRE, opacity: 0.5, borderRadius: 3, verticalAlign: "middle" }} /> β (خطای نوع دوم)</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: TEAL, opacity: 0.5, borderRadius: 3, verticalAlign: "middle" }} /> توان = 1 − β</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          ["توان فعلی", fa(Math.round(power * 100)) + "٪", power >= 0.8 ? TEAL : RED],
          ["β", fa(Math.round((1 - power) * 100)) + "٪", OCHRE],
          ["n لازم برای توان ۸۰٪", fa(n80) + " در هر گروه", NAVY],
          ["n لازم برای توان ۹۰٪", fa(n90) + " در هر گروه", NAVY],
        ].map(([l, x, c]) => (
          <div key={l} style={{ background: PAPER, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: MUTED }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: c }}>{x}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.9, color: MUTED }}>
        تمرین: d را از ۰/۸ به ۰/۴ کاهش دهید و ببینید حجم لازم برای توان ۸۰٪ تقریباً چهار برابر می‌شود. سپس α را از ۰/۰۵ به ۰/۰۱ تغییر دهید و اثر آن را روی توان ببینید.
      </p>
    </Card>
  );
}

/* ============================================================
   3. Quiz: common mistakes
============================================================ */
const QUIZ = [
  {
    q: "حجم نمونه محاسبه‌شده ۸۰ نفر است و ۲۰٪ ریزش پیش‌بینی می‌شود. حجم نهایی چقدر است؟",
    opts: [["a", "۹۶ نفر (۸۰ × ۱/۲)"], ["b", "۱۰۰ نفر (۸۰ ÷ ۰/۸)"], ["c", "۸۰ نفر؛ ریزش در تحلیل جبران می‌شود"]],
    correct: "b",
    exp: "ریزش با تقسیم بر (۱ − نرخ ریزش) اعمال می‌شود. با ۹۶ نفر و ۲۰٪ ریزش فقط حدود ۷۷ نفر باقی می‌مانند که کمتر از ۸۰ است.",
  },
  {
    q: "در یک طرح قبل و بعد، کدام انحراف معیار در فرمول قرار می‌گیرد؟",
    opts: [["a", "انحراف معیار نمره‌ها در اندازه‌گیری پایه"], ["b", "میانگین انحراف معیار قبل و بعد"], ["c", "انحراف معیار تفاوت قبل و بعد (σd)"]],
    correct: "c",
    exp: "در طرح زوجی، واحد تحلیل «تفاوت» هر فرد است. اگر همبستگی قبل و بعد بالا باشد، σd کوچک و حجم نمونه کمتر می‌شود؛ مزیت اصلی طرح زوجی همین است.",
  },
  {
    q: "در یک مطالعه الکتروفیزیولوژی، از ۴ موش در هر گروه ۲۵ نورون ثبت شده است. حجم نمونه هر گروه چند است؟",
    opts: [["a", "۱۰۰ نورون"], ["b", "۴ موش"], ["c", "۲۵ نورون"]],
    correct: "b",
    exp: "نورون‌های یک حیوان مستقل نیستند (تکرار کاذب یا pseudoreplication). واحد مستقل، حیوان است؛ برای داده‌های چندسطحی از مدل اثر آمیخته استفاده کنید.",
  },
  {
    q: "شیوع یک بیماری در جامعه مورد مطالعه کاملاً نامعلوم است. برای برآورد شیوع چه مقداری برای p در نظر می‌گیرید؟",
    opts: [["a", "۵۰٪؛ بیشترین حجم نمونه را می‌دهد"], ["b", "۱۰٪؛ چون بیماری‌ها معمولاً نادرند"], ["c", "صفر؛ چون اطلاعی نداریم"]],
    correct: "a",
    exp: "حاصل p(1 − p) در p = ۰/۵ بیشینه است؛ بنابراین محافظه‌کارانه‌ترین (بزرگ‌ترین) حجم نمونه به دست می‌آید.",
  },
  {
    q: "پس از پایان مطالعه، نتیجه معنی‌دار نشد. داور می‌خواهد «توان پس از مطالعه» را با اندازه اثر مشاهده‌شده گزارش کنید. بهترین پاسخ چیست؟",
    opts: [["a", "توان را با اثر مشاهده‌شده محاسبه و گزارش کنیم"], ["b", "به جای آن فاصله اطمینان اثر را گزارش کنیم"], ["c", "حجم نمونه را آن‌قدر زیاد کنیم تا معنی‌دار شود"]],
    correct: "b",
    exp: "توان محاسبه‌شده با اثر مشاهده‌شده فقط تابعی از مقدار p است و اطلاع تازه‌ای نمی‌دهد. فاصله اطمینان نشان می‌دهد چه اندازه اثرهایی با داده‌ها سازگارند.",
  },
];

export function SampleSizeQuiz() {
  const [ans, setAns] = useState({});
  const score = QUIZ.filter((x, i) => ans[i] === x.correct).length;
  return (
    <Card>
      <H3 sub="هر سؤال یکی از خطاهای رایج در محاسبه یا گزارش حجم نمونه است.">پنج خطای رایج: خودتان را بسنجید</H3>
      <div style={{ display: "grid", gap: 16 }}>
        {QUIZ.map((item, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.9, color: NAVY }}>
              <b style={{ color: OCHRE }}>{fa(i + 1)}.</b> {item.q}
            </p>
            <div style={{ display: "grid", gap: 6 }}>
              {item.opts.map(([id, t]) => {
                const sel = ans[i] === id;
                const ok = ans[i] && id === item.correct;
                const bad = sel && id !== item.correct;
                return (
                  <button
                    key={id}
                    disabled={!!ans[i]}
                    onClick={() => setAns((s) => ({ ...s, [i]: id }))}
                    style={{
                      textAlign: "right", padding: "9px 13px", borderRadius: 10, fontFamily: FONT, fontSize: 13.5, color: NAVY, lineHeight: 1.7,
                      border: `1.5px solid ${ok ? TEAL : bad ? RED : "#D8D1C0"}`, background: ok ? "#EAF2F0" : bad ? "#FBEAE6" : "#FFFFFF",
                      cursor: ans[i] ? "default" : "pointer",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {ans[i] && <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.9, color: TEAL }}>{item.exp}</p>}
          </div>
        ))}
      </div>
      {Object.keys(ans).length === QUIZ.length && (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{fa(score)} / {fa(QUIZ.length)}</div>
          <button onClick={() => setAns({})} style={{ marginTop: 8, background: OCHRE, color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>
            شروع دوباره
          </button>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   4. Concepts + resources
============================================================ */
export function SampleSizeConcepts() {
  return (
    <Card>
      <H3>مفاهیم پایه در چهار پرسش</H3>
      <div style={{ display: "grid", gap: 8 }}>
        <Reveal q="چهار جزء اصلی هر محاسبه حجم نمونه چیست؟">
          سطح معنی‌داری (α، معمولاً ۰/۰۵)، توان آزمون (۱ − β، معمولاً ۸۰ یا ۹۰ درصد)، اندازه اثر (کوچک‌ترین تفاوت مهم بالینی یا علمی) و پراکندگی (انحراف معیار
          برای پیامد کمّی یا نسبت مورد انتظار برای پیامد کیفی). اثر کوچک‌تر، پراکندگی بیشتر، α کوچک‌تر یا توان بالاتر، حجم نمونه بزرگ‌تری می‌خواهد.
        </Reveal>
        <Reveal q="اندازه اثر را از کجا بیاوریم؟">
          به ترتیب اولویت: مطالعات قبلی و متاآنالیزها با جمعیت و ابزار مشابه، مطالعه پایلوت (برای برآورد SD؛ پایلوت‌های خیلی کوچک برآورد ناپایدار می‌دهند)، حداقل
          تفاوت مهم بالینی (MCID)، و در آخر قراردادهای کوهن (d = ۰/۲ کوچک، ۰/۵ متوسط، ۰/۸ بزرگ).
        </Reveal>
        <Reveal q="کدام فرمول برای طرح من مناسب است؟">
          دو سؤال بپرسید: پیامد اصلی کمّی است یا کیفی؟ گروه‌ها مستقل‌اند یا اندازه‌گیری تکراری روی یک نفر است؟ برآورد شیوع ← یک نسبت؛ مقایسه نمره دو گروه ← دو
          میانگین؛ قبل و بعد ← زوجی؛ رابطه دو متغیر کمّی ← همبستگی؛ مورد-شاهدی ← OR؛ کوهورت ← RR؛ مطالعه حیوانی بدون اطلاعات قبلی ← معادله منابع.
        </Reveal>
        <Reveal q="ترتیب تعدیل‌ها چگونه است؟">
          ابتدا فرمول اصلی، سپس ضرب در اثر طرح (DEFF = ۱ + (m − ۱)·ICC برای نمونه‌گیری خوشه‌ای) و اصلاح جامعه محدود، و در پایان تقسیم بر (۱ − نرخ ریزش). برای
          مقایسه‌های چندگانه، α را اصلاح کنید (بونفرونی: α/m).
        </Reveal>
      </div>
    </Card>
  );
}

const FILES = [
  ["sample_size_calculator.xlsx", "ماشین‌حساب اکسل حجم نمونه", "۱۱ برگه با فرمول زنده، متن آماده پروپوزال و جدول Z"],
  ["sample_size_neuro.pptx", "اسلایدهای آموزشی تعیین حجم نمونه", "۱۹ اسلاید با مثال‌های علوم اعصاب و تمرین کلاسی"],
];

export function SampleSizeResources() {
  return (
    <Card>
      <H3>فایل‌های قابل دانلود</H3>
      <div style={{ display: "grid", gap: 8 }}>
        {FILES.map(([f, t, d]) => (
          <a
            key={f}
            href={`/files/${f}`}
            download
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px solid ${LINE}`, borderRadius: 10, textDecoration: "none", color: NAVY, background: PAPER }}
          >
            <span>
              <b style={{ fontSize: 13.5 }}>{t}</b>
              <span style={{ display: "block", fontSize: 12, color: MUTED }}>{d}</span>
            </span>
            <span style={{ fontSize: 12, color: TEAL, whiteSpace: "nowrap" }}>دانلود ↓</span>
          </a>
        ))}
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 11.5, color: MUTED, lineHeight: 1.8, direction: "ltr", textAlign: "left" }}>
        Lwanga & Lemeshow, WHO 1991 · Chow et al., Sample Size Calculations in Clinical Research, 2017 · Fleiss et al., 2003 · Arifin & Zahiruddin, Malays J Med Sci 2017
      </p>
    </Card>
  );
}
