import React, { useMemo, useState } from "react";

/* ============================================================
   Statistical tests lab: a step-by-step test chooser, calculators
   that run common tests from summary statistics, a cheat sheet
   and a scenario quiz. Design tokens copied from App.jsx.
============================================================ */
const FONT = "'Vazirmatn', Tahoma, 'Segoe UI', sans-serif";
const MATH = "'Cambria Math', Cambria, 'Times New Roman', serif";
const MONO = "ui-monospace, 'Cascadia Code', Consolas, monospace";
const NAVY = "#1F2A3C";
const PAPER = "#F6F4EF";
const TEAL = "#3E7C74";
const OCHRE = "#B8873D";
const RED = "#C0604A";
const LINE = "#E4DFD3";
const MUTED = "#8A8272";

/* ---------------- distributions ---------------- */
function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let s = 1.000000000190015;
  for (let j = 0; j < 6; j++) s += c[j] / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}
function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
// regularised incomplete beta I_x(a,b)
function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
// regularised lower incomplete gamma P(a,x)
function gammp(a, x) {
  if (x <= 0) return 0;
  const gln = lgamma(a);
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}
const pT2 = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5); // two-sided p for t
const pF = (F, d1, d2) => (F <= 0 ? 1 : ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2)); // upper tail
const pChi = (x, k) => 1 - gammp(k / 2, x / 2); // upper tail
function qT(p, df) { // quantile of t (p > 0.5) by bisection on two-sided p
  const target = 2 * (1 - p);
  let lo = 0, hi = 1000;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (pT2(mid, df) > target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
const Z975 = 1.959963984540054;
const lfact = (n) => lgamma(n + 1);
function fisher2x2(a, b, c, d) {
  const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
  const lp = (x) => lfact(r1) + lfact(r2) + lfact(c1) + lfact(n - c1) - lfact(n) - lfact(x) - lfact(r1 - x) - lfact(c1 - x) - lfact(r2 - c1 + x);
  const obs = lp(a);
  let p = 0;
  for (let x = Math.max(0, c1 - r2); x <= Math.min(r1, c1); x++) { const l = lp(x); if (l <= obs + 1e-7) p += Math.exp(l); }
  return Math.min(1, p);
}

/* ---------------- formatting ---------------- */
const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (x) => String(x).replace(/\d/g, (d) => FA[d]).replace(/\./g, "/");
const f2 = (x, k = 2) => (isFinite(x) ? x.toFixed(k) : "—");
const fp = (p) => (p < 0.001 ? "< 0.001" : "= " + p.toFixed(3));
const fpFa = (p) => (p < 0.001 ? "کمتر از ۰/۰۰۱" : fa(p.toFixed(3)));

/* ---------------- UI atoms ---------------- */
function Card({ children, style }) {
  return <div style={{ background: "#FFFFFF", border: `1px solid ${LINE}`, borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(31,42,60,0.06)", minWidth: 0, ...style }}>{children}</div>;
}
function H3({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: NAVY }}>{children}</h3>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.8 }}>{sub}</p>}
    </div>
  );
}
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ border: `1.5px solid ${active ? NAVY : "#D8D1C0"}`, background: active ? NAVY : "#FFFFFF", color: active ? PAPER : NAVY, borderRadius: 999, padding: "6px 12px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>
      {children}
    </button>
  );
}
function Num({ label, value, onChange, step = 1, min }) {
  return (
    <label style={{ display: "grid", gap: 3, fontSize: 12, color: NAVY, minWidth: 0 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input type="number" value={value} step={step} min={min} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "6px 6px", border: "1.5px solid #D8D1C0", borderRadius: 8, fontSize: 14.5, fontFamily: FONT, color: NAVY, background: "#FFFDF6", textAlign: "center", direction: "ltr" }} />
    </label>
  );
}
function Reveal({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "right", background: open ? "#EAF2F0" : "#FFFFFF", border: "none", padding: "10px 14px", fontFamily: FONT, fontSize: 13.5, color: NAVY, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, lineHeight: 1.7 }}>
        <span>{q}</span><span style={{ color: MUTED }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.9, color: "#4A4437", background: PAPER }}>{children}</div>}
    </div>
  );
}
function Code({ children }) {
  return <pre style={{ direction: "ltr", textAlign: "left", fontFamily: MONO, fontSize: 12, background: NAVY, color: "#E8ECF2", borderRadius: 8, padding: "10px 12px", margin: 0, overflowX: "auto", whiteSpace: "pre-wrap" }}>{children}</pre>;
}

/* ============================================================
   1. Test chooser wizard
============================================================ */
const TESTS = {
  t1: { fa: "آزمون t تک‌نمونه‌ای", en: "One-sample t-test", np: "Wilcoxon signed-rank (تک‌نمونه‌ای)", ex: "آیا میانگین هموگلوبین زنان باردار شهرستان با مقدار مرجع ۱۱ g/dL تفاوت دارد؟", r: "t.test(hb, mu = 11)", spss: "Analyze > Compare Means > One-Sample T Test", as: ["متغیر کمّی با توزیع تقریباً نرمال", "مشاهدات مستقل"] },
  binom: { fa: "آزمون دوجمله‌ای یا z برای یک نسبت", en: "Binomial / one-proportion z-test", np: "—", ex: "آیا پوشش واکسن در این منطقه با هدف ملی ۹۵٪ تفاوت دارد؟", r: "binom.test(x = 172, n = 190, p = 0.95)", spss: "Analyze > Nonparametric Tests > Legacy Dialogs > Binomial", as: ["پیامد دوحالتی", "مشاهدات مستقل"] },
  tind: { fa: "آزمون t مستقل", en: "Independent-samples t-test (Welch)", np: "Mann-Whitney U", ex: "مقایسه میانگین فشار خون سیستولیک بین کارگران معدن و کارمندان اداری", r: "t.test(sbp ~ group, data = d)   # Welch by default", spss: "Analyze > Compare Means > Independent-Samples T Test", as: ["پیامد کمّی با توزیع تقریباً نرمال در هر گروه (یا n بزرگ)", "دو گروه مستقل", "برابری واریانس برای نسخه Student؛ نسخه Welch این فرض را لازم ندارد"] },
  mw: { fa: "آزمون من-ویتنی", en: "Mann-Whitney U (Wilcoxon rank-sum)", np: "—", ex: "مقایسه نمره درد (۰ تا ۱۰) بین دو روش بی‌حسی", r: "wilcox.test(pain ~ group, data = d)", spss: "Analyze > Nonparametric Tests > Independent Samples", as: ["دو گروه مستقل", "متغیر رتبه‌ای یا کمّی غیرنرمال"] },
  tpair: { fa: "آزمون t زوجی", en: "Paired t-test", np: "Wilcoxon signed-rank", ex: "مقایسه HbA1c قبل و ۶ ماه بعد از آموزش خودمراقبتی در همان بیماران", r: "t.test(after, before, paired = TRUE)", spss: "Analyze > Compare Means > Paired-Samples T Test", as: ["تفاوت‌های زوجی تقریباً نرمال باشد", "هر فرد دو بار اندازه‌گیری شده یا زوج‌ها جورشده‌اند"] },
  wil: { fa: "آزمون رتبه‌ای علامت‌دار ویلکاکسون", en: "Wilcoxon signed-rank test", np: "—", ex: "مقایسه نمره رضایت (لیکرت) قبل و بعد از تغییر نوبت‌دهی در همان بیماران", r: "wilcox.test(after, before, paired = TRUE)", spss: "Analyze > Nonparametric Tests > Related Samples", as: ["داده‌های زوجی", "متغیر رتبه‌ای یا تفاوت‌های غیرنرمال"] },
  anova: { fa: "تحلیل واریانس یک‌طرفه", en: "One-way ANOVA (+ Tukey post hoc)", np: "Kruskal-Wallis", ex: "مقایسه میانگین BMI دانش‌آموزان در سه منطقه شهری، حاشیه و روستا", r: "m <- aov(bmi ~ region, data = d); summary(m); TukeyHSD(m)", spss: "Analyze > Compare Means > One-Way ANOVA", as: ["پیامد کمّی تقریباً نرمال در هر گروه", "گروه‌های مستقل", "برابری واریانس‌ها (در غیر این صورت Welch ANOVA)"] },
  kw: { fa: "آزمون کروسکال-والیس", en: "Kruskal-Wallis (+ Dunn post hoc)", np: "—", ex: "مقایسه مدت بستری (چوله به راست) بین سه بخش بیمارستان", r: "kruskal.test(los ~ ward, data = d)", spss: "Analyze > Nonparametric Tests > Independent Samples", as: ["سه گروه مستقل یا بیشتر", "متغیر رتبه‌ای یا کمّی غیرنرمال"] },
  rmanova: { fa: "تحلیل واریانس با اندازه‌های تکراری", en: "Repeated-measures ANOVA / mixed model", np: "Friedman", ex: "مقایسه وزن نوزادان در ماه‌های ۲، ۴ و ۶ در همان کودکان", r: "library(lme4); lmer(weight ~ time + (1|id), data = d)", spss: "Analyze > General Linear Model > Repeated Measures", as: ["پیامد کمّی", "سه بار اندازه‌گیری یا بیشتر روی همان افراد", "فرض کرویت (یا مدل آمیخته)"] },
  fried: { fa: "آزمون فریدمن", en: "Friedman test", np: "—", ex: "رتبه‌بندی سه طعم داروی شربتی توسط همان کودکان", r: "friedman.test(score ~ taste | id, data = d)", spss: "Analyze > Nonparametric Tests > Related Samples", as: ["سه اندازه‌گیری وابسته یا بیشتر", "داده رتبه‌ای یا غیرنرمال"] },
  chi: { fa: "آزمون کای‌دو", en: "Chi-square test of independence", np: "Fisher's exact (وقتی فراوانی مورد انتظار کم است)", ex: "ارتباط سابقه سیگار (بله/خیر) با سرطان ریه (بله/خیر) در مطالعه مورد-شاهدی", r: "chisq.test(table(d$smoke, d$cancer))", spss: "Analyze > Descriptive Statistics > Crosstabs > Statistics: Chi-square", as: ["مشاهدات مستقل", "فراوانی مورد انتظار حداقل ۵ در دست‌کم ۸۰٪ خانه‌ها"] },
  fisher: { fa: "آزمون دقیق فیشر", en: "Fisher's exact test", np: "—", ex: "ارتباط مواجهه با یک غذای خاص و ابتلا در طغیانی با ۲۴ نفر", r: "fisher.test(table(d$food, d$ill))", spss: "Crosstabs > Exact > Exact", as: ["مشاهدات مستقل", "مناسب برای نمونه‌های کوچک"] },
  mcnemar: { fa: "آزمون مک‌نمار", en: "McNemar test", np: "—", ex: "مقایسه مثبت بودن دو روش تشخیصی روی همان نمونه‌ها، یا مطالعه مورد-شاهدی جورشده", r: "mcnemar.test(table(d$test1, d$test2))", spss: "Analyze > Nonparametric Tests > Legacy Dialogs > 2 Related Samples > McNemar", as: ["پیامد دوحالتی", "داده‌های زوجی یا جورشده"] },
  cochran: { fa: "آزمون Q کوکران", en: "Cochran's Q test", np: "—", ex: "مقایسه نسبت مثبت بودن سه روش تشخیصی روی همان بیماران", r: "library(RVAideMemoire); cochran.qtest(res ~ method | id, data = d)", spss: "Analyze > Nonparametric Tests > Related Samples", as: ["پیامد دوحالتی", "سه اندازه‌گیری وابسته یا بیشتر"] },
  pearson: { fa: "همبستگی پیرسون", en: "Pearson correlation", np: "Spearman", ex: "رابطه سن با فشار خون سیستولیک در بزرگسالان", r: "cor.test(d$age, d$sbp)", spss: "Analyze > Correlate > Bivariate > Pearson", as: ["دو متغیر کمّی", "رابطه خطی", "توزیع تقریباً نرمال و بدون داده پرت شدید"] },
  spearman: { fa: "همبستگی اسپیرمن", en: "Spearman rank correlation", np: "—", ex: "رابطه سطح تحصیلات (رتبه‌ای) با نمره سواد سلامت", r: "cor.test(d$edu, d$hl, method = \"spearman\")", spss: "Analyze > Correlate > Bivariate > Spearman", as: ["دو متغیر رتبه‌ای یا کمّی غیرنرمال", "رابطه یکنوا (نه لزوماً خطی)"] },
  linreg: { fa: "رگرسیون خطی چندگانه", en: "Multiple linear regression", np: "—", ex: "عوامل مرتبط با وزن هنگام تولد (سن مادر، مراقبت بارداری، شاخص توده بدنی)", r: "summary(lm(bw ~ age + anc + bmi, data = d))", spss: "Analyze > Regression > Linear", as: ["پیامد کمّی", "خطی بودن، استقلال، نرمال بودن و همسانی واریانس باقی‌مانده‌ها", "عدم هم‌خطی شدید"] },
  logreg: { fa: "رگرسیون لجستیک", en: "Logistic regression (adjusted OR)", np: "—", ex: "عوامل مرتبط با ابتلا به دیابت با کنترل سن، جنس و BMI", r: "m <- glm(dm ~ age + sex + bmi, family = binomial, data = d); exp(coef(m))", spss: "Analyze > Regression > Binary Logistic", as: ["پیامد دوحالتی", "مشاهدات مستقل", "حدود ۱۰ پیامد به ازای هر متغیر مستقل"] },
  cox: { fa: "آزمون لگ‌رنک و رگرسیون کاکس", en: "Log-rank test / Cox regression", np: "—", ex: "مقایسه بقای بیماران سرطان کولورکتال بر اساس مرحله تشخیص", r: "library(survival); survdiff(Surv(time, event) ~ stage, data = d); coxph(Surv(time, event) ~ stage + age, data = d)", spss: "Analyze > Survival > Kaplan-Meier / Cox Regression", as: ["پیامد زمان تا رخداد با سانسور", "فرض خطرهای متناسب برای کاکس"] },
};

// returns either {q, opts:[[value,label]]} or {result:testId, alt?:testId}
function nextStep(a) {
  if (!a.goal) return { key: "goal", q: "هدف اصلی تحلیل چیست؟", opts: [["compare", "مقایسه گروه‌ها یا زمان‌ها"], ["relate", "بررسی رابطه یا پیش‌بینی"], ["one", "مقایسه با یک مقدار مرجع"]] };
  if (a.goal === "one") {
    if (!a.y) return { key: "y", q: "نوع متغیر پیامد؟", opts: [["num", "کمّی (مثل هموگلوبین)"], ["bin", "دوحالتی (مثل واکسینه/غیرواکسینه)"]] };
    return { result: a.y === "num" ? "t1" : "binom" };
  }
  if (a.goal === "relate") {
    if (!a.rel) return { key: "rel", q: "نوع متغیرها و هدف؟", opts: [["nn", "دو متغیر کمّی"], ["oo", "دست‌کم یکی رتبه‌ای یا غیرنرمال"], ["cc", "دو متغیر کیفی"], ["multi", "یک پیامد و چند متغیر مستقل (کنترل مخدوش‌کننده)"]] };
    if (a.rel === "nn") {
      if (!a.norm) return { key: "norm", q: "آیا هر دو متغیر تقریباً نرمال‌اند و رابطه خطی است؟", opts: [["y", "بله"], ["n", "خیر یا داده پرت دارد"]] };
      return { result: a.norm === "y" ? "pearson" : "spearman" };
    }
    if (a.rel === "oo") return { result: "spearman" };
    if (a.rel === "cc") return { result: "chi", alt: "fisher" };
    if (!a.out) return { key: "out", q: "نوع پیامد در مدل؟", opts: [["num", "کمّی"], ["bin", "دوحالتی"], ["time", "زمان تا رخداد"]] };
    return { result: { num: "linreg", bin: "logreg", time: "cox" }[a.out] };
  }
  if (!a.y) return { key: "y", q: "نوع متغیر پیامد؟", opts: [["num", "کمّی (میانگین)"], ["ord", "رتبه‌ای (مثل لیکرت یا شدت)"], ["cat", "کیفی (نسبت یا فراوانی)"], ["time", "زمان تا رخداد"]] };
  if (a.y === "time") return { result: "cox" };
  if (!a.k) return { key: "k", q: "چند گروه یا چند زمان را مقایسه می‌کنید؟", opts: [["2", "دو"], ["3", "سه یا بیشتر"]] };
  if (!a.dep) return { key: "dep", q: "گروه‌ها مستقل‌اند یا وابسته؟", opts: [["ind", "مستقل (افراد متفاوت)"], ["dep", "وابسته (همان افراد یا جورشده)"]] };
  if (a.y === "cat") {
    if (a.dep === "ind") return { result: "chi", alt: "fisher" };
    return { result: a.k === "2" ? "mcnemar" : "cochran" };
  }
  if (a.y === "num" && !a.norm) return { key: "norm", q: a.dep === "dep" ? "آیا تفاوت‌ها (یا داده‌ها) تقریباً نرمال‌اند؟" : "آیا پیامد در هر گروه تقریباً نرمال است (یا n هر گروه بزرگ است)؟", opts: [["y", "بله"], ["n", "خیر"]] };
  const para = a.y === "num" && a.norm === "y";
  const map = { "2ind": ["tind", "mw"], "2dep": ["tpair", "wil"], "3ind": ["anova", "kw"], "3dep": ["rmanova", "fried"] }[a.k + a.dep];
  return { result: para ? map[0] : map[1], alt: para ? map[1] : null };
}

function TestCard({ id, alt }) {
  const t = TESTS[id];
  return (
    <div style={{ border: `1.5px solid ${TEAL}`, background: "#EAF2F0", borderRadius: 12, padding: "14px 16px", display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, color: TEAL }}>آزمون پیشنهادی</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: NAVY }}>{t.fa}</div>
        <div style={{ fontSize: 12.5, color: MUTED, direction: "ltr", textAlign: "right" }}>{t.en}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.9, color: "#4A4437" }}>
        <b>پیش‌فرض‌ها:</b>
        <ul style={{ margin: "2px 0 0", paddingRight: 18 }}>{t.as.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      {alt && TESTS[alt] && (
        <div style={{ fontSize: 13, color: OCHRE, lineHeight: 1.8 }}>
          <b>جایگزین:</b> {TESTS[alt].fa} ({TESTS[alt].en}) — {id === "chi" ? "وقتی فراوانی مورد انتظار بیش از ۲۰٪ خانه‌ها کمتر از ۵ است" : "وقتی پیش‌فرض نرمال بودن برقرار نیست"}
        </div>
      )}
      <div style={{ fontSize: 13, lineHeight: 1.8, color: NAVY }}><b>مثال:</b> {t.ex}</div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: MUTED }}>R</span>
        <Code>{t.r}</Code>
        <span style={{ fontSize: 12, color: MUTED }}>SPSS</span>
        <Code>{t.spss}</Code>
      </div>
    </div>
  );
}

export function TestChooser() {
  const [ans, setAns] = useState({});
  const [hist, setHist] = useState([]);
  const step = nextStep(ans);
  const choose = (key, val, label, q) => {
    setAns((s) => ({ ...s, [key]: val }));
    setHist((h) => [...h, { key, q, label }]);
  };
  const back = () => {
    const last = hist[hist.length - 1];
    if (!last) return;
    setHist((h) => h.slice(0, -1));
    setAns((s) => { const o = { ...s }; delete o[last.key]; return o; });
  };
  return (
    <Card>
      <H3 sub="به چند پرسش ساده درباره هدف و نوع داده پاسخ دهید تا آزمون مناسب، پیش‌فرض‌ها و کد R و مسیر SPSS را ببینید.">کدام آزمون آماری؟ راهنمای گام‌به‌گام</H3>
      {hist.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {hist.map((h, i) => (
            <span key={i} style={{ fontSize: 12, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 999, padding: "3px 10px", color: NAVY }}>{h.label}</span>
          ))}
        </div>
      )}
      {step.result ? (
        <TestCard id={step.result} alt={step.alt} />
      ) : (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 14.5, fontWeight: 700, color: NAVY }}>{step.q}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {step.opts.map(([v, l]) => (
              <button key={v} onClick={() => choose(step.key, v, l, step.q)} style={{ textAlign: "right", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #D8D1C0", background: "#FFFFFF", fontFamily: FONT, fontSize: 13.5, color: NAVY, cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      {hist.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={back} style={{ background: "#FFFFFF", color: NAVY, border: `1px solid ${LINE}`, borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>→ مرحله قبل</button>
          <button onClick={() => { setAns({}); setHist([]); }} style={{ background: OCHRE, color: "#FFF", border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>شروع دوباره</button>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   2. Calculators from summary statistics
============================================================ */
function ResultBox({ stat, p, extra, text, warn }) {
  const sig = p < 0.05;
  return (
    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <div style={{ background: NAVY, color: PAPER, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: "#D8DEE8" }}>آماره آزمون</div>
          <div style={{ fontSize: 17, fontWeight: 800, direction: "ltr", textAlign: "right", fontFamily: MATH }}>{stat}</div>
        </div>
        <div style={{ background: sig ? "#EAF2F0" : "#FBF2E2", border: `1.5px solid ${sig ? TEAL : OCHRE}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: MUTED }}>مقدار p</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: sig ? TEAL : OCHRE, direction: "ltr", textAlign: "right", fontFamily: MATH }}>p {fp(p)}</div>
        </div>
        {extra.map(([l, x]) => (
          <div key={l} style={{ background: PAPER, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: MUTED }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, direction: "ltr", textAlign: "right", fontFamily: MATH }}>{x}</div>
          </div>
        ))}
      </div>
      {warn && <p style={{ margin: 0, fontSize: 12.5, color: RED, lineHeight: 1.8 }}>{warn}</p>}
      <div style={{ padding: "10px 14px", background: "#EAF2F0", borderRadius: 10, fontSize: 13.5, lineHeight: 2, color: NAVY }}>
        <b style={{ color: TEAL }}>تفسیر و گزارش: </b>{text}
      </div>
    </div>
  );
}

function TInd() {
  const [v, setV] = useState({ m1: 128.4, s1: 14.2, n1: 60, m2: 121.9, s2: 12.8, n2: 55 });
  const s = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const r = useMemo(() => {
    const { m1, s1, n1, m2, s2, n2 } = v;
    if ([m1, s1, n1, m2, s2, n2].some((x) => x === "") || n1 < 2 || n2 < 2 || s1 <= 0 || s2 <= 0) return null;
    const diff = m1 - m2;
    const sp = Math.sqrt(((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2));
    const seS = sp * Math.sqrt(1 / n1 + 1 / n2), dfS = n1 + n2 - 2;
    const a = s1 ** 2 / n1, b = s2 ** 2 / n2;
    const seW = Math.sqrt(a + b), dfW = (a + b) ** 2 / (a ** 2 / (n1 - 1) + b ** 2 / (n2 - 1));
    const tS = diff / seS, tW = diff / seW;
    const tc = qT(0.975, dfW);
    return { diff, tS, dfS, pS: pT2(tS, dfS), tW, dfW, pW: pT2(tW, dfW), lo: diff - tc * seW, hi: diff + tc * seW, d: diff / sp, vr: Math.max(s1, s2) ** 2 / Math.min(s1, s2) ** 2 };
  }, [v]);
  return (
    <div>
      <Grid6 v={v} s={s} labels={["گروه ۱", "گروه ۲"]} />
      {r && (
        <ResultBox
          stat={`t(${f2(r.dfW, 1)}) = ${f2(r.tW)}`}
          p={r.pW}
          extra={[["تفاوت میانگین (۹۵٪ CI)", `${f2(r.diff)} (${f2(r.lo)} to ${f2(r.hi)})`], ["Cohen's d", f2(r.d)], ["نسخه Student", `t(${r.dfS}) = ${f2(r.tS)}, p ${fp(r.pS)}`]]}
          warn={r.vr > 2 ? "نسبت واریانس‌ها بیش از ۲ است؛ نسخه Welch (پیش‌فرض این محاسبه‌گر) مناسب‌تر است." : null}
          text={`میانگین در گروه اول ${fa(v.m1)} (انحراف معیار ${fa(v.s1)}) و در گروه دوم ${fa(v.m2)} (انحراف معیار ${fa(v.s2)}) بود. تفاوت میانگین ${fa(f2(r.diff))} واحد (فاصله اطمینان ۹۵٪: ${fa(f2(r.lo))} تا ${fa(f2(r.hi))}) ${r.pW < 0.05 ? "از نظر آماری معنی‌دار بود" : "از نظر آماری معنی‌دار نبود"} (آزمون t مستقل با اصلاح Welch، p ${r.pW < 0.001 ? "<" : "="} ${fpFa(r.pW)}).`}
        />
      )}
    </div>
  );
}

function Grid6({ v, s, labels }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[1, 2].map((g) => (
        <div key={g} style={{ display: "grid", gridTemplateColumns: "70px repeat(3, minmax(0, 1fr))", gap: 8, alignItems: "end" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, paddingBottom: 8 }}>{labels[g - 1]}</span>
          <Num label="میانگین" value={v["m" + g]} onChange={s("m" + g)} step={0.1} />
          <Num label="انحراف معیار" value={v["s" + g]} onChange={s("s" + g)} step={0.1} min={0} />
          <Num label="تعداد" value={v["n" + g]} onChange={s("n" + g)} min={2} />
        </div>
      ))}
    </div>
  );
}

function TPaired() {
  const [v, setV] = useState({ md: -0.6, sd: 1.1, n: 40 });
  const s = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const r = useMemo(() => {
    if ([v.md, v.sd, v.n].some((x) => x === "") || v.n < 2 || v.sd <= 0) return null;
    const se = v.sd / Math.sqrt(v.n), df = v.n - 1, t = v.md / se, tc = qT(0.975, df);
    return { t, df, p: pT2(t, df), lo: v.md - tc * se, hi: v.md + tc * se, dz: v.md / v.sd };
  }, [v]);
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: MUTED }}>مثال: تغییر HbA1c (بعد منهای قبل) پس از آموزش خودمراقبتی</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Num label="میانگین تفاوت‌ها" value={v.md} onChange={s("md")} step={0.1} />
        <Num label="انحراف معیار تفاوت‌ها" value={v.sd} onChange={s("sd")} step={0.1} min={0} />
        <Num label="تعداد زوج‌ها" value={v.n} onChange={s("n")} min={2} />
      </div>
      {r && (
        <ResultBox
          stat={`t(${r.df}) = ${f2(r.t)}`}
          p={r.p}
          extra={[["میانگین تفاوت (۹۵٪ CI)", `${f2(v.md)} (${f2(r.lo)} to ${f2(r.hi)})`], ["dz", f2(r.dz)]]}
          text={`میانگین تغییر ${fa(v.md)} واحد (فاصله اطمینان ۹۵٪: ${fa(f2(r.lo))} تا ${fa(f2(r.hi))}) بود که ${r.p < 0.05 ? "از نظر آماری معنی‌دار بود" : "از نظر آماری معنی‌دار نبود"} (آزمون t زوجی، p ${r.p < 0.001 ? "<" : "="} ${fpFa(r.p)}).`}
        />
      )}
    </div>
  );
}

function Anova() {
  const [g, setG] = useState([
    { m: 21.4, s: 3.9, n: 120 },
    { m: 22.6, s: 4.3, n: 95 },
    { m: 20.8, s: 3.6, n: 80 },
  ]);
  const names = ["شهری", "حاشیه", "روستا", "گروه ۴"];
  const set = (i, k) => (x) => setG((a) => a.map((o, j) => (j === i ? { ...o, [k]: x } : o)));
  const r = useMemo(() => {
    if (g.some((o) => o.m === "" || o.s === "" || o.n === "" || o.n < 2 || o.s <= 0)) return null;
    const N = g.reduce((a, o) => a + o.n, 0), k = g.length;
    const gm = g.reduce((a, o) => a + o.n * o.m, 0) / N;
    const ssb = g.reduce((a, o) => a + o.n * (o.m - gm) ** 2, 0);
    const ssw = g.reduce((a, o) => a + (o.n - 1) * o.s ** 2, 0);
    const d1 = k - 1, d2 = N - k, F = ssb / d1 / (ssw / d2);
    return { F, d1, d2, p: pF(F, d1, d2), eta: ssb / (ssb + ssw) };
  }, [g]);
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: MUTED }}>مثال: BMI دانش‌آموزان در سه منطقه</p>
      <div style={{ display: "grid", gap: 10 }}>
        {g.map((o, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "70px repeat(3, minmax(0, 1fr))", gap: 8, alignItems: "end" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, paddingBottom: 8 }}>{names[i]}</span>
            <Num label="میانگین" value={o.m} onChange={set(i, "m")} step={0.1} />
            <Num label="انحراف معیار" value={o.s} onChange={set(i, "s")} step={0.1} />
            <Num label="تعداد" value={o.n} onChange={set(i, "n")} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        {g.length < 4 ? <Pill onClick={() => setG((a) => [...a, { m: 21, s: 4, n: 60 }])}>+ افزودن گروه</Pill> : <Pill onClick={() => setG((a) => a.slice(0, 3))}>− حذف گروه ۴</Pill>}
      </div>
      {r && (
        <ResultBox
          stat={`F(${r.d1}, ${r.d2}) = ${f2(r.F)}`}
          p={r.p}
          extra={[["اندازه اثر η²", f2(r.eta, 3)]]}
          text={`تحلیل واریانس یک‌طرفه نشان داد میانگین بین ${fa(g.length)} گروه ${r.p < 0.05 ? "تفاوت معنی‌داری داشت" : "تفاوت معنی‌داری نداشت"} (F = ${fa(f2(r.F))}، p ${r.p < 0.001 ? "<" : "="} ${fpFa(r.p)}، η² = ${fa(f2(r.eta, 3))}).${r.p < 0.05 ? " برای تعیین اینکه کدام گروه‌ها با هم تفاوت دارند، آزمون تعقیبی (مثلاً Tukey) لازم است." : ""}`}
        />
      )}
    </div>
  );
}

function Chi2() {
  const [v, setV] = useState({ a: 12, b: 8, c: 5, d: 25 });
  const s = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const r = useMemo(() => {
    const { a, b, c, d } = v;
    if ([a, b, c, d].some((x) => x === "" || x < 0)) return null;
    const n = a + b + c + d, r1 = a + b, r2 = c + d, c1 = a + c, c2 = b + d;
    if (!r1 || !r2 || !c1 || !c2) return null;
    const E = [r1 * c1 / n, r1 * c2 / n, r2 * c1 / n, r2 * c2 / n];
    const O = [a, b, c, d];
    const chi = O.reduce((s_, o, i) => s_ + (o - E[i]) ** 2 / E[i], 0);
    const ad = Math.abs(a * d - b * c);
    const yates = (n * Math.max(0, ad - n / 2) ** 2) / (r1 * r2 * c1 * c2);
    const small = E.filter((e) => e < 5).length;
    const or = (a * d) / (b * c);
    const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
    return { chi, p: pChi(chi, 1), yates, pY: pChi(yates, 1), fisher: fisher2x2(a, b, c, d), E, small, or, lo: Math.exp(Math.log(or) - Z975 * se), hi: Math.exp(Math.log(or) + Z975 * se) };
  }, [v]);
  const idx = { a: 0, b: 1, c: 2, d: 3 };
  const cell = (k) => <Num label={r ? `انتظار: ${fa(f2(r.E[idx[k]], 1))}` : ""} value={v[k]} onChange={s(k)} min={0} />;
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: MUTED }}>مثال: مصرف سالاد و ابتلا در یک طغیان غذایی</p>
      <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 8, alignItems: "center", maxWidth: 380 }}>
        <span />
        <b style={{ fontSize: 12.5, textAlign: "center" }}>بیمار</b>
        <b style={{ fontSize: 12.5, textAlign: "center" }}>سالم</b>
        <b style={{ fontSize: 12.5, alignSelf: "end", paddingBottom: 8 }}>مواجهه +</b>{cell("a")}{cell("b")}
        <b style={{ fontSize: 12.5, alignSelf: "end", paddingBottom: 8 }}>مواجهه −</b>{cell("c")}{cell("d")}
      </div>
      {r && (
        <>
          <ResultBox
            stat={`χ²(1) = ${f2(r.chi)}`}
            p={r.small ? r.fisher : r.p}
            extra={[["OR (۹۵٪ CI)", isFinite(r.or) && r.or > 0 ? `${f2(r.or)} (${f2(r.lo)} to ${f2(r.hi)})` : "—"], ["با اصلاح Yates", `χ² = ${f2(r.yates)}, p ${fp(r.pY)}`], ["Fisher's exact", `p ${fp(r.fisher)}`]]}
            warn={r.small ? `${fa(r.small)} خانه فراوانی مورد انتظار کمتر از ۵ دارد؛ مقدار p نمایش‌داده‌شده از آزمون دقیق فیشر است.` : null}
            text={`ارتباط بین مواجهه و پیامد ${(r.small ? r.fisher : r.p) < 0.05 ? "از نظر آماری معنی‌دار بود" : "از نظر آماری معنی‌دار نبود"} (${r.small ? "آزمون دقیق فیشر" : "آزمون کای‌دو"}، p ${(r.small ? r.fisher : r.p) < 0.001 ? "<" : "="} ${fpFa(r.small ? r.fisher : r.p)}). نسبت شانس ${isFinite(r.or) && r.or > 0 ? `${fa(f2(r.or))} (فاصله اطمینان ۹۵٪: ${fa(f2(r.lo))} تا ${fa(f2(r.hi))})` : "قابل محاسبه نیست (خانه صفر)"} بود.`}
          />
        </>
      )}
    </div>
  );
}

function Corr() {
  const [v, setV] = useState({ r: 0.28, n: 150 });
  const s = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const res = useMemo(() => {
    if (v.r === "" || v.n === "" || v.n < 4 || Math.abs(v.r) >= 1) return null;
    const df = v.n - 2, t = (v.r * Math.sqrt(df)) / Math.sqrt(1 - v.r ** 2);
    const z = Math.atanh(v.r), se = 1 / Math.sqrt(v.n - 3);
    return { t, df, p: pT2(t, df), lo: Math.tanh(z - Z975 * se), hi: Math.tanh(z + Z975 * se) };
  }, [v]);
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: MUTED }}>مثال: رابطه سن با فشار خون سیستولیک</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, maxWidth: 380 }}>
        <Num label="ضریب همبستگی r" value={v.r} onChange={s("r")} step={0.01} />
        <Num label="حجم نمونه n" value={v.n} onChange={s("n")} min={4} />
      </div>
      {res && (
        <ResultBox
          stat={`t(${res.df}) = ${f2(res.t)}`}
          p={res.p}
          extra={[["r (۹۵٪ CI)", `${f2(v.r)} (${f2(res.lo)} to ${f2(res.hi)})`], ["r² (واریانس تبیین‌شده)", (v.r ** 2 * 100).toFixed(1) + "%"]]}
          text={`همبستگی ${Math.abs(v.r) < 0.3 ? "ضعیف" : Math.abs(v.r) < 0.5 ? "متوسط" : "قوی"} و ${v.r > 0 ? "مثبت" : "منفی"} (r = ${fa(f2(v.r))}، فاصله اطمینان ۹۵٪: ${fa(f2(res.lo))} تا ${fa(f2(res.hi))}) ${res.p < 0.05 ? "از نظر آماری معنی‌دار بود" : "از نظر آماری معنی‌دار نبود"} (p ${res.p < 0.001 ? "<" : "="} ${fpFa(res.p)}). همبستگی به معنای رابطه علّی نیست.`}
        />
      )}
    </div>
  );
}

const CALCS = [
  ["tind", "t مستقل", TInd],
  ["tpair", "t زوجی", TPaired],
  ["anova", "ANOVA یک‌طرفه", Anova],
  ["chi", "کای‌دو و فیشر (۲×۲)", Chi2],
  ["corr", "همبستگی", Corr],
];

export function TestCalculators() {
  const [c, setC] = useState("tind");
  const C = CALCS.find((x) => x[0] === c)[2];
  return (
    <Card>
      <H3 sub="آزمون‌ها را از روی آماره‌های خلاصه (میانگین، انحراف معیار، تعداد یا جدول ۲×۲) اجرا کنید؛ مناسب برای تمرین و بررسی نتایج مقالات.">محاسبه‌گر آزمون‌ها</H3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {CALCS.map(([id, t]) => <Pill key={id} active={c === id} onClick={() => setC(id)}>{t}</Pill>)}
      </div>
      <C key={c} />
    </Card>
  );
}

/* ============================================================
   3. Concepts, cheat sheet, quiz
============================================================ */
export function StatConcepts() {
  return (
    <Card>
      <H3>مفاهیم کلیدی</H3>
      <div style={{ display: "grid", gap: 8 }}>
        <Reveal q="مقدار p دقیقاً چه می‌گوید؟">
          احتمال مشاهده نتیجه‌ای به این شدت یا شدیدتر، به شرط درست بودن فرضیه صفر. مقدار p احتمال درست بودن فرضیه صفر نیست و اندازه یا اهمیت بالینی اثر را
          نشان نمی‌دهد. همیشه همراه آن اندازه اثر و فاصله اطمینان را گزارش کنید.
        </Reveal>
        <Reveal q="فاصله اطمینان ۹۵٪ چه اطلاعاتی بیش از p می‌دهد؟">
          محدوده‌ای از مقادیر اثر که با داده‌ها سازگارند. هم جهت و اندازه اثر را نشان می‌دهد و هم دقت برآورد را. اگر فاصله اطمینان تفاوت میانگین شامل صفر (یا
          فاصله اطمینان OR و RR شامل ۱) باشد، نتیجه در سطح ۰/۰۵ معنی‌دار نیست.
        </Reveal>
        <Reveal q="آزمون پارامتری یا ناپارامتری؟">
          آزمون‌های پارامتری (t، ANOVA، پیرسون) فرض توزیع نرمال دارند و در صورت برقراری فرض، توان بیشتری دارند. نرمال بودن را با نمودار Q-Q و هیستوگرام بررسی کنید؛
          آزمون شاپیرو-ویلک در نمونه‌های بزرگ حتی انحراف‌های کوچک را معنی‌دار نشان می‌دهد. با حجم نمونه بزرگ (حدود ۳۰ در هر گروه یا بیشتر) آزمون t نسبت به
          عدم نرمال بودن مقاوم است. برای داده‌های رتبه‌ای یا بسیار چوله، آزمون ناپارامتری انتخاب کنید.
        </Reveal>
        <Reveal q="مستقل یا وابسته؟ مهم‌ترین سؤال پیش از انتخاب آزمون">
          اگر هر فرد فقط در یک گروه است، گروه‌ها مستقل‌اند. اگر همان فرد دو بار اندازه‌گیری شده (قبل و بعد)، یا هر مورد با یک شاهد جور شده، یا دو چشم یک نفر
          بررسی شده، داده‌ها وابسته‌اند و آزمون زوجی لازم است.
        </Reveal>
        <Reveal q="مقایسه‌های چندگانه">
          با انجام ۲۰ آزمون مستقل در سطح ۰/۰۵، احتمال دست‌کم یک نتیجه مثبت کاذب حدود ۶۴٪ است. به جای چند آزمون t از ANOVA و آزمون تعقیبی استفاده کنید، یا α را
          اصلاح کنید (بونفرونی یا Holm). پیامد اصلی را پیش از تحلیل مشخص کنید.
        </Reveal>
      </div>
    </Card>
  );
}

const SHEET = [
  ["دو گروه مستقل، پیامد کمّی", "t مستقل", "Mann-Whitney U"],
  ["دو اندازه‌گیری وابسته، کمّی", "t زوجی", "Wilcoxon signed-rank"],
  ["سه گروه مستقل یا بیشتر، کمّی", "ANOVA یک‌طرفه", "Kruskal-Wallis"],
  ["سه اندازه‌گیری وابسته یا بیشتر", "ANOVA تکراری / مدل آمیخته", "Friedman"],
  ["دو متغیر کیفی مستقل", "کای‌دو", "Fisher's exact"],
  ["پیامد دوحالتی زوجی", "McNemar", "—"],
  ["رابطه دو متغیر کمّی", "پیرسون", "اسپیرمن"],
  ["پیامد کمّی با چند متغیر مستقل", "رگرسیون خطی", "—"],
  ["پیامد دوحالتی با چند متغیر مستقل", "رگرسیون لجستیک", "—"],
  ["زمان تا رخداد", "لگ‌رنک / کاکس", "—"],
];

export function CheatSheet() {
  return (
    <Card>
      <H3>جدول خلاصه انتخاب آزمون</H3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: NAVY, color: PAPER }}>
              {["موقعیت", "آزمون پارامتری", "جایگزین ناپارامتری"].map((h) => <th key={h} style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {SHEET.map((r, i) => (
              <tr key={i} style={{ background: i % 2 ? "#FFFFFF" : PAPER }}>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}` }}>{r[0]}</td>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, color: TEAL, fontWeight: 700 }}>{r[1]}</td>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, color: OCHRE }}>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const QUIZ = [
  { q: "میانگین سطح ویتامین D (توزیع نرمال) بین زنان شاغل و خانه‌دار مقایسه می‌شود.", c: "tind", o: ["tind", "tpair", "chi"] },
  { q: "نمره افسردگی بیماران قبل و بعد از ۸ جلسه مشاوره، در همان بیماران؛ تفاوت‌ها به‌شدت چوله‌اند.", c: "wil", o: ["tpair", "wil", "mw"] },
  { q: "ارتباط نوع زایمان (طبیعی/سزارین) با تغذیه انحصاری با شیر مادر (بله/خیر) در ۴۰۰ مادر.", c: "chi", o: ["chi", "mcnemar", "pearson"] },
  { q: "مقایسه مدت بستری (روز، بسیار چوله) بین چهار بیمارستان.", c: "kw", o: ["anova", "kw", "fried"] },
  { q: "نتیجه دو روش تشخیص سل (مثبت/منفی) روی نمونه خلط همان ۱۵۰ بیمار مقایسه می‌شود.", c: "mcnemar", o: ["chi", "mcnemar", "fisher"] },
  { q: "بررسی عوامل مرتبط با بستری مجدد ۳۰ روزه (بله/خیر) با کنترل سن، جنس و بیماری‌های همراه.", c: "logreg", o: ["linreg", "logreg", "chi"] },
];

export function StatQuiz() {
  const [ans, setAns] = useState({});
  const score = QUIZ.filter((x, i) => ans[i] === x.c).length;
  return (
    <Card>
      <H3 sub="برای هر سناریو آزمون مناسب را انتخاب کنید.">آزمونک سناریومحور</H3>
      <div style={{ display: "grid", gap: 16 }}>
        {QUIZ.map((it, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.9, color: NAVY }}><b style={{ color: OCHRE }}>{fa(i + 1)}.</b> {it.q}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {it.o.map((id) => {
                const sel = ans[i] === id, ok = ans[i] && id === it.c, bad = sel && id !== it.c;
                return (
                  <button key={id} disabled={!!ans[i]} onClick={() => setAns((s) => ({ ...s, [i]: id }))}
                    style={{ padding: "8px 12px", borderRadius: 10, fontFamily: FONT, fontSize: 13, color: NAVY, border: `1.5px solid ${ok ? TEAL : bad ? RED : "#D8D1C0"}`, background: ok ? "#EAF2F0" : bad ? "#FBEAE6" : "#FFFFFF", cursor: ans[i] ? "default" : "pointer" }}>
                    {TESTS[id].fa}
                  </button>
                );
              })}
            </div>
            {ans[i] && (
              <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.8, color: TEAL }}>
                پاسخ: {TESTS[it.c].fa} — {TESTS[it.c].as.join("؛ ")}
              </p>
            )}
          </div>
        ))}
      </div>
      {Object.keys(ans).length === QUIZ.length && (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{fa(score)} / {fa(QUIZ.length)}</div>
          <button onClick={() => setAns({})} style={{ marginTop: 8, background: OCHRE, color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>شروع دوباره</button>
        </div>
      )}
    </Card>
  );
}
