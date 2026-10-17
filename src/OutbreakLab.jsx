import React, { useMemo, useState } from "react";
import RSCRIPT from "./assets/epicurve_exercise.R?raw";

/* ============================================================
   Outbreak lab: interactive exercises for the outbreak module
   (dormitory norovirus epi curve, early-detection algorithms,
   food-specific attack rates, downloadable teaching files).
   All data are synthetic and for teaching only.
   Design tokens copied from App.jsx to keep the same look.
============================================================ */
const FONT = "'Vazirmatn', Tahoma, 'Segoe UI', sans-serif";
const NAVY = "#1F2A3C";
const PAPER = "#F6F4EF";
const TEAL = "#3E7C74";
const OCHRE = "#B8873D";
const RED = "#C0604A";
const LINE = "#E4DFD3";
const MUTED = "#8A8272";
const GREY = "#9AA3AF";

const DATA = {
  curve: {
    start: "2026-02-12",
    onset1: [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,19,65,17,24,37,29,34,41,44,34,30,33,21,6,3,3,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    onset2: [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,19,65,17,24,37,29,35,41,48,44,39,46,35,25,14,12,10,14,11,6,2,3,4,5,3,0,0,1,0,0,0,0,0],
    report1: [0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,7,14,11,13,12,51,40,78,37,31,38,45,41,0,10,8,5,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    report2: [0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,7,14,11,13,12,51,40,78,37,31,38,45,41,0,10,8,5,2,101,10,0,14,5,4,3,3,0,0,8,0,0,0],
    six: [0,0,0,0,0,1,6,12,19,16,13,7,6,4,4,1,0,0,0,0],
  },
  detect: [17,27,13,20,22,17,10,23,25,17,26,19,16,8,23,25,25,22,18,24,15,26,25,26,21,20,13,14,35,28,14,18,28,23,22,37,48,41,40,29,26,15],
  ar: [
    { fa: "برنج", a: 66, n1: 152, c: 5, n0: 8 },
    { fa: "کباب کوبیده", a: 42, n1: 85, c: 29, n0: 75 },
    { fa: "جوجه‌کباب", a: 44, n1: 95, c: 27, n0: 65 },
    { fa: "سالاد شیرازی", a: 62, n1: 80, c: 9, n0: 80 },
    { fa: "ماست", a: 36, n1: 83, c: 35, n0: 77 },
    { fa: "دوغ", a: 48, n1: 99, c: 23, n0: 61 },
    { fa: "ژله و دسر", a: 32, n1: 77, c: 39, n0: 83 },
    { fa: "آب لوله‌کشی یا یخ", a: 29, n1: 66, c: 42, n0: 94 },
  ],
};

/* ---------------- helpers ---------------- */
const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (x) => String(x).replace(/\d/g, (d) => FA[d]).replace(/\./g, "/");
const pct = (a, n) => (n ? fa(Math.round((a / n) * 100)) + "٪" : "—");

// Gregorian ISO day index (from 2026-02-12) -> short Jalali label
function jalali(idx) {
  const d = new Date(Date.UTC(2026, 1, 12 + idx));
  const ms = (y, m, dd) => Date.UTC(y, m, dd);
  const t = d.getTime();
  if (t < ms(2026, 1, 20)) return `${fa(Math.round((t - ms(2026, 0, 21)) / 864e5) + 1)} بهمن`;
  if (t < ms(2026, 2, 21)) return `${fa(Math.round((t - ms(2026, 1, 20)) / 864e5) + 1)} اسفند`;
  return `${fa(Math.round((t - ms(2026, 2, 21)) / 864e5) + 1)} فروردین`;
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${LINE}`, borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(31,42,60,0.06)", minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {label && <span style={{ fontSize: 12.5, color: MUTED, minWidth: 54 }}>{label}</span>}
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

function Reveal({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, background: PAPER, padding: "10px 14px" }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: NAVY, lineHeight: 1.9 }}>{q}</div>
      {open ? (
        <div style={{ fontSize: 13, lineHeight: 2, color: "#4A4437", marginTop: 6 }}>{children}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{ marginTop: 6, background: "none", border: `1px solid ${OCHRE}`, color: OCHRE, borderRadius: 8, padding: "4px 12px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}
        >
          نمایش پاسخ
        </button>
      )}
    </div>
  );
}

/* generic bar chart (SVG, left-to-right time axis) */
function Bars({ values, labels, labelEvery = 1, colors, shades = [], vlines = [], hline, height = 230, unitNote }) {
  const W = 700, H = height, L = 34, R = 8, T = 18, B = 46;
  const n = values.length, max = Math.max(1, ...values, ...(hline || []).filter((h) => h !== null));
  const nice = max <= 10 ? 10 : max <= 25 ? 25 : max <= 50 ? 50 : max <= 80 ? 80 : max <= 120 ? 120 : Math.ceil(max / 50) * 50;
  const bw = (W - L - R) / n, y = (v) => T + (H - T - B) * (1 - v / nice);
  const ticks = [0, nice / 2, nice];
  return (
    <div style={{ direction: "ltr", width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 340, height: "auto", display: "block", fontFamily: FONT }} role="img">
        {shades.map((s, i) => (
          <g key={"s" + i}>
            <rect x={L + s.from * bw} y={T} width={(s.to - s.from) * bw} height={H - T - B} fill={s.color} opacity={0.14} />
            <text x={L + ((s.from + s.to) / 2) * bw} y={T - 5} fontSize="10" textAnchor="middle" fill={s.color}>{s.label}</text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={LINE} />
            <text x={L - 5} y={y(t) + 4} fontSize="10" textAnchor="end" fill={MUTED}>{fa(t)}</text>
          </g>
        ))}
        {values.map((v, i) => (
          <rect key={i} x={L + i * bw + bw * 0.08} y={y(v)} width={bw * 0.84} height={Math.max(0, H - B - y(v))} fill={colors ? colors[i] : GREY}>
            <title>{`${labels[i]}: ${v}`}</title>
          </rect>
        ))}
        {hline !== undefined &&
          hline.map((h, i) =>
            h === null ? null : (
              <line key={"h" + i} x1={L + i * bw} x2={L + (i + 1) * bw} y1={y(h)} y2={y(h)} stroke={OCHRE} strokeWidth="2" />
            ),
          )}
        {vlines.map((v, i) => (
          <g key={"v" + i}>
            <line x1={L + v.at * bw} x2={L + v.at * bw} y1={T} y2={H - B} stroke={v.color} strokeWidth="2" strokeDasharray="4 3" />
            <text x={L + v.at * bw + 3} y={T + 12 + i * 12} fontSize="10" fill={v.color}>{v.label}</text>
          </g>
        ))}
        {labels.map((t, i) =>
          i % labelEvery === 0 ? (
            <text key={"l" + i} x={L + (i + 0.5) * bw} y={H - B + 14} fontSize="9.5" textAnchor="end" fill={MUTED} transform={`rotate(-40 ${L + (i + 0.5) * bw} ${H - B + 14})`}>
              {t}
            </text>
          ) : null,
        )}
      </svg>
      {unitNote && <div style={{ fontSize: 11.5, color: MUTED, textAlign: "center", direction: "rtl" }}>{unitNote}</div>}
    </div>
  );
}

/* ============================================================
   1. Epi curve lab (dormitory norovirus outbreak)
============================================================ */
export function EpiCurveLab() {
  const [bin, setBin] = useState("day");
  const [axis, setAxis] = useState("onset");
  const [ext, setExt] = useState("1");
  const C = DATA.curve;
  const daily = C[(axis === "onset" ? "onset" : "report") + ext];
  const total = daily.reduce((s, v) => s + v, 0);

  let values, labels, labelEvery, shades = [], vlines = [], note;
  if (bin === "six") {
    values = C.six;
    labels = values.map((_, i) => `${fa(14 + Math.floor(i / 4))} اسفند ${fa(((i % 4) * 6).toString().padStart(2, "0"))}`);
    labelEvery = 2;
    vlines = [{ at: 20 / 6, color: RED, label: "شام" }];
    note = "بازه ۶ ساعته، ۱۴ تا ۱۸ اسفند؛ فقط مواردی که ساعت شروع علائم دارند";
  } else if (bin === "week") {
    values = [];
    for (let i = 0; i < daily.length; i += 7) values.push(daily.slice(i, i + 7).reduce((s, v) => s + v, 0));
    labels = values.map((_, i) => `هفته از ${jalali(i * 7)}`);
    labelEvery = 1;
    vlines = [{ at: 21 / 7 + 20 / 24 / 7, color: RED, label: "شام" }];
    note = "هر ستون یک هفته (پنجشنبه تا چهارشنبه)";
  } else {
    values = daily;
    labels = daily.map((_, i) => jalali(i));
    labelEvery = 3;
    shades = [
      { from: 28, to: 31, color: TEAL, label: "بیماریابی فعال" },
      { from: 36, to: 41, color: OCHRE, label: "تعطیلات نوروز" },
    ];
    vlines = [
      { at: 21 + 20 / 24, color: RED, label: "شام" },
      { at: 31, color: NAVY, label: "مداخله" },
      ...(ext === "1" ? [{ at: 41, color: "#6B5B95", label: "تاریخ برداشت" }] : []),
    ];
    note = `${axis === "onset" ? "بر اساس تاریخ شروع علائم" : "بر اساس تاریخ گزارش"}؛ ${fa(total)} مورد`;
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>آزمایشگاه منحنی اپیدمی: طغیان شام خوابگاه</h3>
      <p style={{ fontSize: 13.5, lineHeight: 2, color: "#4A4437", margin: "0 0 12px" }}>
        پنجشنبه ۱۴ اسفند ۱۴۰۴، ساعت ۲۰، شام جشن در خوابگاه سرو شد و از روز بعد موارد استفراغ و اسهال گزارش شد. آزمایشگاه نوروویروس را تأیید کرد.
        شما صبح ۴ فروردین باید به معاون بهداشت گزارش بدهید. با دکمه‌ها بازی کنید و ببینید هر انتخاب چه داستانی تعریف می‌کند.
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        <Segmented label="بازه" value={bin} onChange={setBin} options={[["six", "۶ ساعته"], ["day", "روزانه"], ["week", "هفتگی"]]} />
        {bin !== "six" && <Segmented label="محور زمان" value={axis} onChange={setAxis} options={[["onset", "شروع علائم"], ["report", "تاریخ گزارش"]]} />}
        {bin !== "six" && <Segmented label="داده" value={ext} onChange={setExt} options={[["1", "برداشت ۴ فروردین"], ["2", "برداشت ۱۸ فروردین"]]} />}
      </div>
      <Bars values={values} labels={labels} labelEvery={labelEvery} shades={shades} vlines={vlines} unitNote={note} />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <Reveal q="۱. در نمای هفتگی، نوع طغیان را می‌توانید تشخیص دهید؟ بعد ۶ ساعته را ببینید.">
          نمای هفتگی فقط دو ستون بزرگ نشان می‌دهد و منبع مشترک کاملاً پنهان می‌شود. نمای ۶ ساعته یک قله تیز و چوله به راست، حدود یک دوره کمون پس از شام، نشان می‌دهد.
          قاعده: بازه حدود یک‌چهارم تا یک‌سوم دوره کمون باشد. برای نوروویروس با میانه ۳۳ ساعت، یعنی ۶ تا ۱۲ ساعت.
        </Reveal>
        <Reveal q="۲. روی «تاریخ گزارش» بزنید. چرا ۲۱ تا ۲۳ اسفند جهش دارد؟ آیا انتقال بیشتر شده است؟">
          نه. در آن روزها تعریف مورد گسترده‌تر شد و بیماریابی فعال در خوابگاه انجام شد؛ موارد قدیمی یک‌جا ثبت شدند.
          به جمعه‌ها و تعطیلات نوروز هم نگاه کنید: گزارش تقریباً صفر است و پس از تعطیلات یک‌باره بالا می‌رود.
        </Reveal>
        <Reveal q="۳. با «برداشت ۴ فروردین»، طغیان تمام شده است؟ حالا «برداشت ۱۸ فروردین» را بزنید.">
          در برداشت اول فقط ۱۳ مورد با شروع علائم از ۲۸ اسفند به بعد وجود دارد. در داده نهایی این عدد ۱۰۹ است.
          این همان برش راست (right truncation) به‌علاوه شکاف گزارش در نوروز است. پاسخ درست به معاون: «روند نزولی است، ولی داده هفت روز آخر قابل اتکا نیست.»
        </Reveal>
        <Reveal q="۴. چند مورد پیش از شام شروع شده‌اند. چه معنایی دارند؟">
          چهار مورد بهمن و اوایل اسفند در جامعه، نویز زمینه‌ای گاستروانتریت هستند. مورد ۱۳ اسفند یک کارکن ۴۴ ساله آشپزخانه با PCR مثبت است، حدود ۳۸ ساعت پیش از شام.
          او فقط در بیماریابی فعال پیدا شد و احتمالاً منبع طغیان است.
        </Reveal>
      </div>
    </Card>
  );
}

/* ============================================================
   2. Early detection lab (EARS C2 vs CUSUM)
============================================================ */
export function DetectionLab() {
  const [method, setMethod] = useState("c2");
  const [m, setM] = useState(3);
  const [h, setH] = useState(4);
  const y = DATA.detect, START = 30;

  const res = useMemo(() => {
    const alarm = y.map(() => false), thr = y.map(() => null);
    if (method === "c2") {
      for (let t = 9; t < y.length; t++) {
        const b = y.slice(t - 9, t - 2), mean = b.reduce((s, v) => s + v, 0) / b.length;
        const sd = Math.max(0.5, Math.sqrt(b.reduce((s, v) => s + (v - mean) ** 2, 0) / (b.length - 1)));
        thr[t] = mean + m * sd;
        alarm[t] = y[t] > thr[t];
      }
    } else {
      const base = y.slice(0, 28), m0 = base.reduce((s, v) => s + v, 0) / 28;
      const s0 = Math.sqrt(base.reduce((s, v) => s + (v - m0) ** 2, 0) / 27);
      let S = 0;
      for (let t = 1; t < y.length; t++) {
        S = Math.max(0, S + (y[t] - m0) / s0 - 0.5);
        if (S > h) { alarm[t] = true; S = 0; } // reset after each alarm
      }
    }
    const fals = alarm.filter((a, i) => a && i < START).length;
    const first = alarm.findIndex((a, i) => a && i >= START);
    return { alarm, thr, fals, first };
  }, [method, m, h]);

  const colors = y.map((_, i) => (res.alarm[i] ? (i < START ? RED : TEAL) : GREY));
  const labels = y.map((_, i) => fa(i + 1));

  return (
    <Card>
      <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>کشف زودهنگام: آستانه را خودتان تنظیم کنید</h3>
      <p style={{ fontSize: 13.5, lineHeight: 2, color: "#4A4437", margin: "0 0 12px" }}>
        مراجعه روزانه اسهال حاد در یک شبکه بهداشت (۴۲ روز، داده ساختگی). طغیان واقعی از روز ۳۱ شروع شده است. جمعه‌ها مراجعه کم و شنبه‌ها زیاد است.
        آستانه را تغییر دهید و ببینید حساسیت، هشدار کاذب و بهنگامی چطور با هم جابه‌جا می‌شوند.
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        <Segmented label="روش" value={method} onChange={setMethod} options={[["c2", "EARS C2"], ["cusum", "CUSUM"]]} />
        {method === "c2" ? (
          <label style={{ fontSize: 13, color: NAVY, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            آستانه: میانگین + {fa(m)} انحراف معیار
            <input type="range" min="1.5" max="4" step="0.5" value={m} onChange={(e) => setM(Number(e.target.value))} style={{ accentColor: OCHRE }} />
          </label>
        ) : (
          <label style={{ fontSize: 13, color: NAVY, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            آستانه h = {fa(h)} (k = ۰/۵)
            <input type="range" min="1" max="8" step="1" value={h} onChange={(e) => setH(Number(e.target.value))} style={{ accentColor: OCHRE }} />
          </label>
        )}
      </div>
      <Bars
        values={y}
        labels={labels}
        labelEvery={3}
        colors={colors}
        hline={method === "c2" ? res.thr : undefined}
        shades={[{ from: START, to: y.length, color: RED, label: "دوره طغیان واقعی" }]}
        unitNote="روز (روز ۱ = ۱۶ خرداد)؛ قرمز = هشدار کاذب، سبزآبی = هشدار درست، خط نارنجی = آستانه C2"
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 12 }}>
        <div style={{ background: PAPER, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: MUTED }}>هشدار کاذب پیش از طغیان</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: res.fals ? RED : TEAL }}>{fa(res.fals)}</div>
        </div>
        <div style={{ background: PAPER, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: MUTED }}>اولین هشدار درست</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{res.first >= 0 ? `روز ${fa(res.first + 1)}` : "هیچ"}</div>
        </div>
        <div style={{ background: PAPER, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: MUTED }}>تأخیر از شروع واقعی</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{res.first >= 0 ? `${fa(res.first - START)} روز` : "—"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <Reveal q="۱. با آستانه ۳ انحراف معیار، هشدار کاذب روز ۲۹ از کجا آمده است؟">
          روز ۲۹ شنبه است و شنبه‌ها پس از تعطیلی جمعه همیشه شلوغ‌ترند. روش C2 روز هفته را نمی‌شناسد. همین نوسان روز هفته انحراف معیار پایه را بزرگ می‌کند و آستانه را بالا می‌برد؛ برای همین C2 روزهای ۳۲ تا ۳۶ را نمی‌بیند.
        </Reveal>
        <Reveal q="۲. آستانه را پایین بیاورید. چه چیزی بهتر و چه چیزی بدتر می‌شود؟">
          هشدار زودتر می‌آید (بهنگامی بهتر) ولی هشدارهای کاذب زیاد می‌شود. این سه ویژگی با هم بیشینه نمی‌شوند؛ انتخاب آستانه یک تصمیم سیاستی است:
          تیم شما در روز چند سیگنال را می‌تواند راستی‌آزمایی کند؟
        </Reveal>
        <Reveal q="۳. CUSUM با h = ۴ را با C2 مقایسه کنید.">
          CUSUM افزایش‌های کوچک ولی پایدار را جمع می‌کند. در این داده یک روز زودتر از C2 هشدار می‌دهد و هشدار کاذب روز ۲۹ را ندارد. البته k و h باید با داده هر منطقه تنظیم شوند.
        </Reveal>
      </div>
    </Card>
  );
}

/* ============================================================
   3. Food-specific attack rates
============================================================ */
function rrci(a, n1, c, n0) {
  const rr = a / n1 / (c / n0), se = Math.sqrt(1 / a - 1 / n1 + 1 / c - 1 / n0);
  return { rr, lo: Math.exp(Math.log(rr) - 1.96 * se), hi: Math.exp(Math.log(rr) + 1.96 * se) };
}
const f2 = (x) => fa(x.toFixed(2));

export function AttackRateLab() {
  const [pick, setPick] = useState(null);
  const rows = DATA.ar.map((r) => ({ ...r, ...rrci(r.a, r.n1, r.c, r.n0) }));
  const answer = "سالاد شیرازی";
  const cell = { padding: "7px 4px", borderBottom: `1px solid ${LINE}`, textAlign: "center", fontSize: 12.5 };
  return (
    <Card>
      <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>میزان حمله به تفکیک غذا: کدام غذا مقصر است؟</h3>
      <p style={{ fontSize: 13.5, lineHeight: 2, color: "#4A4437", margin: "0 0 10px" }}>
        از ۱۶۰ نفر حاضر در شام پرسشنامه گرفته شد. میزان حمله در خورندگان و نخورندگان هر غذا را مقایسه کنید و غذای مشکوک را انتخاب کنید.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
          <thead>
            <tr style={{ background: NAVY, color: PAPER }}>
              <th style={{ ...cell, textAlign: "right" }}>غذا</th>
              <th style={cell}>خورده<br />بیمار/کل</th>
              <th style={cell}>حمله</th>
              <th style={cell}>نخورده<br />بیمار/کل</th>
              <th style={cell}>حمله</th>
              {pick && <th style={cell}>RR<br />(۹۵٪ CI)</th>}
              {!pick && <th style={cell}></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hl = pick && r.fa === answer;
              return (
                <tr key={r.fa} style={{ background: hl ? "#EAF2F0" : pick === r.fa ? "#FBEAE6" : "#FFF" }}>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{r.fa}</td>
                  <td style={cell}>{fa(r.a)}/{fa(r.n1)}</td>
                  <td style={cell}>{pct(r.a, r.n1)}</td>
                  <td style={cell}>{fa(r.c)}/{fa(r.n0)}</td>
                  <td style={cell}>{pct(r.c, r.n0)}</td>
                  <td style={cell}>
                    {pick ? (
                      <span style={{ whiteSpace: "nowrap" }}>
                        <b>{f2(r.rr)}</b>
                        <br />
                        <span style={{ fontSize: 11, color: MUTED }}>{f2(r.lo)} تا {f2(r.hi)}</span>
                      </span>
                    ) : (
                      <button onClick={() => setPick(r.fa)} style={{ border: `1px solid ${OCHRE}`, background: "#FFF", color: OCHRE, borderRadius: 8, padding: "3px 10px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                        این است
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pick && (
        <div style={{ marginTop: 12, padding: "12px 14px", background: PAPER, borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 13, lineHeight: 2, color: "#4A4437" }}>
          <b style={{ color: pick === answer ? TEAL : RED }}>{pick === answer ? "درست است." : `${pick} نبود.`}</b>{" "}
          سالاد شیرازی با RR حدود ۶/۹ و فاصله اطمینانی که از ۱ دور است، مشکوک اصلی است. غذای سرد و دست‌ساز، و یک کارکن بیمار آشپزخانه، با نوروویروس سازگار است.
          <br />
          دو سؤال برای بحث: (۱) چرا برنج با وجود میزان حمله ۴۳٪ مقصر نیست؟ تقریباً همه برنج خورده‌اند و گروه مقایسه فقط ۸ نفر است. (۲) ۹ بیمار سالاد نخورده بودند. توضیح احتمالی؟
          آلودگی متقاطع، خطای یادآوری، یا سرایت فرد به فرد.
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setPick(null)} style={{ background: NAVY, color: PAPER, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
              دوباره
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   4. Downloadable teaching files (served from /public/files)
============================================================ */
const FILES = [
  ["dorm_outbreak_form.html", "فرم آفلاین پرسشنامه طغیان", "بدون اینترنت روی گوشی باز می‌شود؛ CSV می‌دهد و صفحه تحلیل مدرس دارد"],
  ["dorm_outbreak_xlsform.xlsx", "XLSForm همان پرسشنامه", "برای KoboToolbox یا ODK؛ برای آموزش طراحی پرسشنامه"],
  ["linelist_extract_1405-01-04.csv", "لاین‌لیست برداشت ۴ فروردین", "داده تمرین منحنی اپیدمی"],
  ["linelist_update_1405-01-18.csv", "لاین‌لیست برداشت ۱۸ فروردین", "برای بخش «افشاگری» برش راست"],
  ["epicurve_exercise.R", "اسکریپت R تمرین منحنی", "R پایه؛ از پاک‌سازی تا Rt"],
  ["codebook.md", "کدبوک لاین‌لیست", "تعریف متغیرها و تاریخ‌های کلیدی"],
  ["early_outbreak_detection.pptx", "اسلاید: کشف زودهنگام طغیان", "۱۵ اسلاید با یادداشت گفتاری"],
  ["one_health_cchf.pptx", "اسلاید: One Health و CCHF", "۱۵ اسلاید با یادداشت گفتاری"],
];

export function OutbreakResources() {
  return (
    <Card>
      <h3 style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>فایل‌های کلاس</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {FILES.map(([f, t, d]) => (
          <a
            key={f}
            href={`/files/${f}`}
            download
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${LINE}`, borderRadius: 10, textDecoration: "none", color: NAVY, background: PAPER }}
          >
            <span>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{t}</span>
              <span style={{ display: "block", fontSize: 12, color: MUTED }}>{d}</span>
            </span>
            <span style={{ fontSize: 12, color: OCHRE, whiteSpace: "nowrap" }}>دانلود ↓</span>
          </a>
        ))}
      </div>
      <p style={{ fontSize: 12, color: MUTED, margin: "10px 0 0" }}>همه داده‌ها ساختگی و برای آموزش‌اند.</p>
    </Card>
  );
}

/* ============================================================
   5. R code, step by step (same script as the download)
============================================================ */

const R_NOTES = [
  ["آماده‌سازی", "خواندن داده و تعریف تاریخ‌های کلیدی سناریو. فقط R پایه لازم است و نیازی به نصب بسته نیست. اگر SAVE_PLOTS را TRUE کنید، همه نمودارها در پوشه figures هم ذخیره می‌شوند."],
  ["گام ۱: پاک‌سازی پیش از رسم", "پیش از هر منحنی، تاریخ‌های ناممکن، تاریخ شروع بعد از گزارش، تاریخ گمشده و گزارش تکراری یک نفر را پیدا کنید. هر اصلاح را با دلیل یادداشت کنید."],
  ["گام ۲: یک داده، سه بازه", "همان داده با بازه روزانه، هفتگی و ۶ ساعته رسم می‌شود. نمای هفتگی منبع مشترک را پنهان می‌کند."],
  ["گام ۳: برآورد زمان مواجهه", "از اولین، میانه و آخرین مورد، با حداقل، میانه و حداکثر دوره کمون، زمان مواجهه را به عقب حساب کنید."],
  ["گام ۴: موارد ناهمخوان", "مواردی که پیش از شام شروع شده‌اند: نویز زمینه‌ای یا منبع طغیان؟"],
  ["گام ۵: الگوی طغیان", "منحنی لایه‌بندی‌شده بر اساس حضور در شام و محل سکونت؛ منبع مشترک و سپس انتشار فرد به فرد."],
  ["گام ۶: تاریخ شروع در برابر تاریخ گزارش", "اثر جمعه، نوروز، بیماریابی فعال و تغییر تعریف مورد روی منحنی گزارش."],
  ["گام ۷: آیا طغیان تمام شده است؟", "مقایسه برداشت ۴ فروردین با ۱۸ فروردین و یک nowcast ساده با توزیع تأخیر گزارش."],
  ["گام ۸: سرعت فروکش", "رگرسیون پواسون روی دوره نزولی؛ نرخ رشد روزانه و زمان نصف‌شدن موارد."],
  ["گام ۹: عدد تولید مثل لحظه‌ای (Rt)", "روش Cori با R پایه؛ موارد شام «وارداتی» حساب می‌شوند. مقایسه با حالتی که منبع مشترک نادیده گرفته شود."],
  ["گام ۱۰: گزارش یک‌دقیقه‌ای", "بدون کد: با نمودارهای خود به معاون بهداشت بگویید چه شد، کجای طغیان هستیم و چه چیزی نامطمئن است."],
];

function splitScript(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const idx = lines.map((l, i) => (/^# STEP \d+/.test(l) ? i : -1)).filter((i) => i >= 0);
  const trim = (arr) => arr.filter((l) => !/^#{20,}\s*$/.test(l)).join("\n").replace(/^\n+|\n+$/g, "");
  const parts = [trim(lines.slice(0, idx[0]))];
  idx.forEach((s, k) => {
    const end = k + 1 < idx.length ? idx[k + 1] : lines.length;
    parts.push(trim(lines.slice(s + 1, end)));
  });
  return parts;
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { setCopied(false); }
  };
  return (
    <div style={{ position: "relative", marginTop: 8, minWidth: 0 }}>
      <button
        onClick={copy}
        style={{ position: "absolute", top: 6, left: 6, background: copied ? TEAL : "#2C3E54", color: PAPER, border: "none", borderRadius: 6, padding: "3px 10px", fontFamily: FONT, fontSize: 11.5, cursor: "pointer" }}
      >
        {copied ? "کپی شد" : "کپی"}
      </button>
      <pre
        dir="ltr"
        style={{ margin: 0, background: NAVY, color: "#E8E4DA", borderRadius: 10, padding: "34px 12px 12px", fontFamily: "'Courier New', Consolas, monospace", fontSize: 12, lineHeight: 1.55, overflowX: "auto", textAlign: "left", maxHeight: 420 }}
      >
        {code}
      </pre>
    </div>
  );
}

export function RCodeLab() {
  const parts = useMemo(() => splitScript(RSCRIPT), []);
  const [open, setOpen] = useState(1);
  return (
    <Card>
      <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>کد R تمرین منحنی اپیدمی، گام‌به‌گام</h3>
      <p style={{ fontSize: 13.5, lineHeight: 2, color: "#4A4437", margin: "0 0 10px" }}>
        اسکریپت و دو فایل داده را در یک پوشه بگذارید، در RStudio همان پوشه را working directory کنید (Session → Set Working Directory)
        و هر گام را جدا اجرا کنید. پیش از رفتن به گام بعد، به سؤال آن گام پاسخ دهید.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[["epicurve_exercise.R", "اسکریپت کامل"], ["linelist_extract_1405-01-04.csv", "داده ۴ فروردین"], ["linelist_update_1405-01-18.csv", "داده ۱۸ فروردین"]].map(([f, t]) => (
          <a key={f} href={`/files/${f}`} download style={{ fontSize: 12.5, color: NAVY, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 999, padding: "5px 12px", textDecoration: "none" }}>
            ↓ {t}
          </a>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {parts.map((code, i) => {
          const [title, note] = R_NOTES[i] || [`بخش ${fa(i)}`, ""];
          const isOpen = open === i;
          return (
            <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 10, background: isOpen ? "#FFFFFF" : PAPER, minWidth: 0 }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "10px 14px", fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: NAVY, cursor: "pointer", textAlign: "right" }}
              >
                <span>{title}</span>
                <span style={{ color: OCHRE }}>{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 14px 14px", minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 2, color: "#4A4437" }}>{note}</div>
                  <CodeBlock code={code} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
