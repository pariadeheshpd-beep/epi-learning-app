import React, { useState, useMemo } from "react";

/* ============================================================
   DESIGN TOKENS
   Background paper: #F6F4EF | Ink navy: #1F2A3C | Panel navy: #2C3E54
   Accent teal: #3E7C74 | Accent ochre: #B8873D | Warn/red: #C0604A
   Font: Persian-friendly system stack
============================================================ */
const FONT = "'Vazirmatn', Tahoma, 'Segoe UI', sans-serif";
const NAVY = "#1F2A3C";
const PAPER = "#F6F4EF";
const TEAL = "#3E7C74";
const OCHRE = "#B8873D";
const RED = "#C0604A";
const LINE = "#E4DFD3";
const MUTED = "#8A8272";

/* ---------------- shared UI atoms ---------------- */

function Chip({ children, color = TEAL }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        color,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        borderRadius: 999,
        padding: "3px 10px",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(31,42,60,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#D8D1C0" }} />
      {label && <span style={{ fontSize: 12, color: MUTED }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: "#D8D1C0" }} />
    </div>
  );
}

function NumberCell({ value, onChange }) {
  return (
    <td style={{ padding: 6, textAlign: "center", borderLeft: `1px solid ${LINE}` }}>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{
          width: 66,
          textAlign: "center",
          padding: "6px 4px",
          border: "1.5px solid #D8D1C0",
          borderRadius: 6,
          fontSize: 15,
          fontFamily: FONT,
          color: NAVY,
          background: "#FFFFFF",
        }}
      />
    </td>
  );
}

function TwoByTwo({ title, data, setData, note }) {
  const { a, b, c, d } = data;
  const total = a + b + c + d;
  const riskExp = a + b > 0 ? a / (a + b) : 0;
  const riskUnexp = c + d > 0 ? c / (c + d) : 0;
  const rr = riskUnexp > 0 ? riskExp / riskUnexp : NaN;
  const or = b * c > 0 ? (a * d) / (b * c) : NaN;
  const rd = riskExp - riskUnexp;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: NAVY, fontWeight: 700 }}>{title}</h3>
        <span style={{ fontSize: 12, color: MUTED }}>مجموع n = {total}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
        <thead>
          <tr style={{ background: NAVY }}>
            <th style={{ padding: "10px 14px", fontSize: 13, color: PAPER, borderLeft: "1px solid rgba(246,244,239,0.15)" }} />
            <th style={{ padding: "10px 14px", fontSize: 13, color: PAPER, borderLeft: "1px solid rgba(246,244,239,0.15)" }}>پیامد +</th>
            <th style={{ padding: "10px 14px", fontSize: 13, color: PAPER }}>پیامد −</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: PAPER }}>
            <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: NAVY, borderLeft: `1px solid ${LINE}` }}>
              مواجهه +
            </td>
            <NumberCell value={a} onChange={(v) => setData({ ...data, a: v })} />
            <NumberCell value={b} onChange={(v) => setData({ ...data, b: v })} />
          </tr>
          <tr>
            <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: NAVY, borderLeft: `1px solid ${LINE}` }}>
              مواجهه −
            </td>
            <NumberCell value={c} onChange={(v) => setData({ ...data, c: v })} />
            <NumberCell value={d} onChange={(v) => setData({ ...data, d: v })} />
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#4A4437" }}>
        <span>خطر مواجهه‌یافته: <b style={{ color: TEAL }}>{(riskExp * 100).toFixed(1)}٪</b></span>
        <span>خطر غیرمواجهه: <b style={{ color: TEAL }}>{(riskUnexp * 100).toFixed(1)}٪</b></span>
        <span>RR: <b style={{ color: OCHRE }}>{isFinite(rr) ? rr.toFixed(2) : "—"}</b></span>
        <span>OR: <b style={{ color: OCHRE }}>{isFinite(or) ? or.toFixed(2) : "—"}</b></span>
        <span>RD: <b style={{ color: OCHRE }}>{isFinite(rd) ? (rd * 100).toFixed(1) + "٪" : "—"}</b></span>
      </div>
      {note && <p style={{ marginTop: 10, fontSize: 12.5, color: MUTED, lineHeight: 1.8 }}>{note}</p>}
    </Card>
  );
}

function Quiz({ question, options, correctId }) {
  const [answer, setAnswer] = useState(null);
  return (
    <Card>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: NAVY }}>سؤال تمرینی</h3>
      <p style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 14, color: NAVY }}>{question}</p>
      <div style={{ display: "grid", gap: 8 }}>
        {options.map((opt) => {
          const isSelected = answer === opt.id;
          const showCorrect = answer && opt.id === correctId;
          const showWrong = isSelected && opt.id !== correctId;
          return (
            <button
              key={opt.id}
              onClick={() => setAnswer(opt.id)}
              style={{
                textAlign: "right",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1.5px solid ${showCorrect ? TEAL : showWrong ? RED : "#D8D1C0"}`,
                background: showCorrect ? "#EAF2F0" : showWrong ? "#FBEAE6" : "#FFFFFF",
                fontFamily: FONT,
                fontSize: 13.5,
                color: NAVY,
                cursor: "pointer",
                lineHeight: 1.7,
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {answer && (
        <p style={{ marginTop: 12, fontSize: 13, color: answer === correctId ? TEAL : RED }}>
          {answer === correctId ? "درست است." : "دوباره فکر کنید و گزینه دیگری را امتحان کنید."}
        </p>
      )}
    </Card>
  );
}

function TopicShell({ eyebrow, title, intro, onBack, children }) {
  return (
    <div style={{ fontFamily: FONT, direction: "rtl", background: PAPER, minHeight: "100vh", color: NAVY }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #2C3E54 100%)`,
          color: PAPER,
          padding: "28px 24px 30px",
          borderBottom: `4px solid ${OCHRE}`,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#D8DEE8",
              fontFamily: FONT,
              fontSize: 12.5,
              cursor: "pointer",
              padding: 0,
              marginBottom: 14,
            }}
          >
            ← بازگشت به فهرست موضوعات
          </button>
          <Chip color={OCHRE}>{eyebrow}</Chip>
          <h1 style={{ fontSize: 24, margin: "10px 0 10px", fontWeight: 800, lineHeight: 1.5 }}>{title}</h1>
          <p style={{ fontSize: 14.5, lineHeight: 2, color: "#D8DEE8", maxWidth: 640 }}>{intro}</p>
        </div>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 24px 60px", display: "grid", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Topic 1: Confounding ---------------- */

function ConfoundingTopic({ onBack }) {
  const [crude, setCrude] = useState({ a: 60, b: 40, c: 30, d: 70 });
  const [s1, setS1] = useState({ a: 30, b: 30, c: 10, d: 30 });
  const [s2, setS2] = useState({ a: 30, b: 10, c: 20, d: 40 });

  const rr = (s) => {
    const re = s.a + s.b > 0 ? s.a / (s.a + s.b) : 0;
    const ru = s.c + s.d > 0 ? s.c / (s.c + s.d) : 0;
    return ru > 0 ? re / ru : NaN;
  };
  const rrCrude = rr(crude);
  const rr1 = rr(s1);
  const rr2 = rr(s2);
  const stratClose = isFinite(rr1) && isFinite(rr2) && Math.abs(rr1 - rr2) < 0.3;
  const confounded = stratClose && isFinite(rrCrude) && Math.abs(rrCrude - (rr1 + rr2) / 2) > 0.15;

  return (
    <TopicShell
      eyebrow="مفاهیم بایاس و ارتباط"
      title="مخدوش‌کنندگی (Confounding) چیست؟"
      intro="وقتی رابطه‌ی خام بین مواجهه و پیامد پس از تفکیک بر اساس یک متغیر سوم (Stratification) به‌طور محسوسی تغییر کند، احتمال مخدوش‌کنندگی مطرح می‌شود. با اعداد جدول‌ها بازی کنید."
      onBack={onBack}
    >
      <TwoByTwo title="جدول خام (بدون تفکیک)" data={crude} setData={setCrude} />
      <SectionDivider label="تفکیک بر اساس متغیر سوم" />
      <TwoByTwo title="لایه ۱ (مثلاً سن < ۵۰)" data={s1} setData={setS1} />
      <TwoByTwo title="لایه ۲ (مثلاً سن ≥ ۵۰)" data={s2} setData={setS2} />

      <Card style={{ background: confounded ? "#FBF2E2" : "#EAF2F0", border: `1.5px solid ${confounded ? OCHRE : TEAL}` }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10, fontSize: 13.5 }}>
          <span>RR خام: <b>{isFinite(rrCrude) ? rrCrude.toFixed(2) : "—"}</b></span>
          <span>RR لایه ۱: <b>{isFinite(rr1) ? rr1.toFixed(2) : "—"}</b></span>
          <span>RR لایه ۲: <b>{isFinite(rr2) ? rr2.toFixed(2) : "—"}</b></span>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9 }}>
          {confounded ? (
            <>
              <b style={{ color: OCHRE }}>احتمال مخدوش‌کنندگی وجود دارد:</b> RRهای دو لایه به هم نزدیک‌اند اما هر دو با RR
              خام فاصله‌ی محسوسی دارند.
            </>
          ) : (
            <>
              <b style={{ color: TEAL }}>در وضعیت فعلی شواهد قوی برای مخدوش‌کنندگی دیده نمی‌شود.</b> اعداد را طوری تغییر
              دهید که RR خام از میانگین RRهای دو لایه فاصله بگیرد.
            </>
          )}
        </p>
      </Card>

      <Quiz
        question="کدام گزینه، تعریف صحیح یک «مخدوش‌کننده» را بیان می‌کند؟"
        options={[
          { id: "a", text: "متغیر سوم با مواجهه و پیامد هر دو مرتبط است و در مسیر علّی بین آن‌ها قرار ندارد" },
          { id: "b", text: "متغیر سوم فقط با پیامد مرتبط است" },
          { id: "c", text: "متغیر سوم پیامد مطالعه را مستقیماً تغییر می‌دهد" },
          { id: "d", text: "متغیر سوم نتیجه‌ی مواجهه است و در مسیر علّی قرار دارد" },
        ]}
        correctId="a"
      />
    </TopicShell>
  );
}

/* ---------------- Topic 2: Interaction / Effect modification ---------------- */

function InteractionTopic({ onBack }) {
  const [s1, setS1] = useState({ a: 50, b: 10, c: 20, d: 40 });
  const [s2, setS2] = useState({ a: 20, b: 40, c: 25, d: 35 });

  const rr = (s) => {
    const re = s.a + s.b > 0 ? s.a / (s.a + s.b) : 0;
    const ru = s.c + s.d > 0 ? s.c / (s.c + s.d) : 0;
    return ru > 0 ? re / ru : NaN;
  };
  const rr1 = rr(s1);
  const rr2 = rr(s2);
  const interacting = isFinite(rr1) && isFinite(rr2) && Math.abs(rr1 - rr2) >= 0.5;

  return (
    <TopicShell
      eyebrow="مفاهیم بایاس و ارتباط"
      title="اینتراکشن (تعدیل‌کنندگی اثر)"
      intro="برخلاف کانفاندینگ، در اینتراکشن هدف حذف اثر متغیر سوم نیست، بلکه گزارش جداگانه‌ی اثر مواجهه در هر لایه است — چون قدرت اثر واقعاً بین زیرگروه‌ها فرق می‌کند."
      onBack={onBack}
    >
      <TwoByTwo title="لایه ۱ (مثلاً زنان)" data={s1} setData={setS1} />
      <TwoByTwo title="لایه ۲ (مثلاً مردان)" data={s2} setData={setS2} />

      <Card style={{ background: interacting ? "#FBF2E2" : "#EAF2F0", border: `1.5px solid ${interacting ? OCHRE : TEAL}` }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10, fontSize: 13.5 }}>
          <span>RR لایه ۱: <b>{isFinite(rr1) ? rr1.toFixed(2) : "—"}</b></span>
          <span>RR لایه ۲: <b>{isFinite(rr2) ? rr2.toFixed(2) : "—"}</b></span>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9 }}>
          {interacting ? (
            <>
              <b style={{ color: OCHRE }}>نشانه‌ی اینتراکشن:</b> اثر مواجهه در دو لایه به‌طور محسوسی متفاوت است. در این
              حالت گزارش یک RR تجمیعی واحد گمراه‌کننده است؛ باید نتایج را به تفکیک لایه گزارش کرد.
            </>
          ) : (
            <>
              <b style={{ color: TEAL }}>اثر مواجهه در دو لایه مشابه است</b> — شاهدی برای اینتراکشن دیده نمی‌شود؛ در این
              حالت گزارش یک برآورد تجمیعی (تعدیل‌شده) معقول است.
            </>
          )}
        </p>
      </Card>

      <Quiz
        question="تفاوت اصلی بین کانفاندینگ و اینتراکشن چیست؟"
        options={[
          { id: "a", text: "در کانفاندینگ تلاش می‌کنیم اثر متغیر سوم را کنترل/حذف کنیم؛ در اینتراکشن اثر واقعاً بین لایه‌ها متفاوت است و باید گزارش شود" },
          { id: "b", text: "کانفاندینگ فقط در مطالعات کوهورت رخ می‌دهد و اینتراکشن فقط در کارآزمایی‌ها" },
          { id: "c", text: "هیچ تفاوتی ندارند و هر دو یک پدیده‌اند" },
          { id: "d", text: "اینتراکشن همیشه باید با تفکیک حذف شود" },
        ]}
        correctId="a"
      />
    </TopicShell>
  );
}

/* ---------------- Topic 3: Measures of association ---------------- */

function MeasuresTopic({ onBack }) {
  const [d, setD] = useState({ a: 45, b: 15, c: 20, d: 60 });
  const { a, b, c, d: dd } = d;
  const total = a + b + c + dd;
  const riskExp = a + b > 0 ? a / (a + b) : 0;
  const riskUnexp = c + dd > 0 ? c / (c + dd) : 0;
  const rr = riskUnexp > 0 ? riskExp / riskUnexp : NaN;
  const or = b * c > 0 ? (a * dd) / (b * c) : NaN;
  const rd = riskExp - riskUnexp;
  const arPercent = riskExp > 0 ? (rd / riskExp) * 100 : NaN;

  return (
    <TopicShell
      eyebrow="مفاهیم بایاس و ارتباط"
      title="اندازه‌های ارتباط: RR، OR و RD"
      intro="سه شاخص رایج برای بیان قدرت ارتباط بین مواجهه و پیامد: خطر نسبی (RR)، نسبت شانس (OR) و تفاضل خطر (RD). با تغییر جدول ۲×۲ زیر، تفاوت رفتار این سه شاخص را ببینید."
      onBack={onBack}
    >
      <TwoByTwo
        title="جدول ۲×۲"
        data={d}
        setData={setD}
        note="نکته: در بیماری‌های نادر (low incidence)، OR تقریباً به RR نزدیک می‌شود؛ اما هرچه بروز پیامد بالاتر رود، OR از RR فاصله می‌گیرد و مقدار بزرگ‌تری نشان می‌دهد."
      />

      <Card>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>خلاصه شاخص‌ها (n = {total})</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13.5 }}>
          <div style={{ padding: 12, background: PAPER, borderRadius: 10 }}>
            <div style={{ color: MUTED, fontSize: 12 }}>خطر نسبی (RR)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: OCHRE }}>{isFinite(rr) ? rr.toFixed(2) : "—"}</div>
          </div>
          <div style={{ padding: 12, background: PAPER, borderRadius: 10 }}>
            <div style={{ color: MUTED, fontSize: 12 }}>نسبت شانس (OR)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: OCHRE }}>{isFinite(or) ? or.toFixed(2) : "—"}</div>
          </div>
          <div style={{ padding: 12, background: PAPER, borderRadius: 10 }}>
            <div style={{ color: MUTED, fontSize: 12 }}>تفاضل خطر (RD)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: OCHRE }}>{isFinite(rd) ? (rd * 100).toFixed(1) + "٪" : "—"}</div>
          </div>
          <div style={{ padding: 12, background: PAPER, borderRadius: 10 }}>
            <div style={{ color: MUTED, fontSize: 12 }}>درصد اسنادی در مواجهه‌یافته‌ها (AR٪)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: OCHRE }}>{isFinite(arPercent) ? arPercent.toFixed(1) + "٪" : "—"}</div>
          </div>
        </div>
      </Card>

      <Quiz
        question="در یک مطالعه‌ی مورد-شاهدی (Case-Control)، کدام شاخص ارتباط قابل محاسبه‌ی مستقیم است؟"
        options={[
          { id: "a", text: "نسبت شانس (OR)، چون بروز واقعی پیامد در جمعیت مبنا مشخص نیست" },
          { id: "b", text: "خطر نسبی (RR)، چون گروه‌ها بر اساس مواجهه انتخاب شده‌اند" },
          { id: "c", text: "تفاضل خطر (RD)، چون جدول ۲×۲ در دسترس است" },
          { id: "d", text: "هر سه شاخص به یک اندازه معتبرند" },
        ]}
        correctId="a"
      />
    </TopicShell>
  );
}

/* ---------------- Topic 4: Bias (conceptual, no 2x2 needed) ---------------- */

function BiasTopic({ onBack }) {
  const [selected, setSelected] = useState(null);
  const biasTypes = [
    {
      id: "selection",
      title: "بایاس انتخاب (Selection Bias)",
      desc: "از نحوه‌ی انتخاب یا حفظ افراد در مطالعه ناشی می‌شود، به‌گونه‌ای که رابطه‌ی مواجهه-پیامد در نمونه با جمعیت مبنا متفاوت شود.",
      example: "مثال: در یک مطالعه‌ی مورد-شاهدی بیمارستانی، اگر بیماران بستری با مواجهه‌ی خاص بیشتر به بیمارستان مراجعه کنند، ارتباط برآوردشده تحریف می‌شود (Berkson's bias).",
    },
    {
      id: "information",
      title: "بایاس اطلاعات (Information Bias)",
      desc: "از خطای سیستماتیک در اندازه‌گیری مواجهه یا پیامد ناشی می‌شود.",
      example: "مثال: خطای یادآوری (Recall bias) — مادران کودکان مبتلا به ناهنجاری مادرزادی، مواجهات دوران بارداری خود را دقیق‌تر و بیشتر به‌یاد می‌آورند تا مادران گروه شاهد.",
    },
    {
      id: "confounding",
      title: "مخدوش‌کنندگی (Confounding)",
      desc: "از تأثیر یک متغیر سوم مرتبط با مواجهه و پیامد ناشی می‌شود که در مسیر علّی بین آن‌ها قرار ندارد.",
      example: "مثال: سن به‌عنوان مخدوش‌کننده‌ی رابطه‌ی مصرف الکل و سرطان دهان — با فراوانی افزایش سن، هم مصرف الکل و هم بروز سرطان بالا می‌رود.",
    },
  ];

  return (
    <TopicShell
      eyebrow="مفاهیم بایاس و ارتباط"
      title="انواع بایاس در مطالعات اپیدمیولوژیک"
      intro="بایاس یعنی خطای سیستماتیک (نه تصادفی) که برآورد ارتباط را از مقدار واقعی منحرف می‌کند. سه دسته‌ی اصلی را کلیک کنید تا توضیح و مثال هرکدام را ببینید."
      onBack={onBack}
    >
      <div style={{ display: "grid", gap: 10 }}>
        {biasTypes.map((b) => (
          <Card key={b.id} style={{ cursor: "pointer" }}>
            <div onClick={() => setSelected(selected === b.id ? null : b.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: NAVY }}>{b.title}</h3>
                <span style={{ color: MUTED, fontSize: 18 }}>{selected === b.id ? "−" : "+"}</span>
              </div>
              {selected === b.id && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "#4A4437", margin: "0 0 8px" }}>{b.desc}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.9, color: TEAL, margin: 0, background: "#EAF2F0", padding: "8px 12px", borderRadius: 8 }}>
                    {b.example}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Quiz
        question="کدام مورد نمونه‌ای از بایاس اطلاعات (Information Bias) است؟"
        options={[
          { id: "a", text: "خطای یادآوری متفاوت بین گروه مورد و شاهد (Recall bias)" },
          { id: "b", text: "خروج غیرتصادفی بیماران شدیدتر از مطالعه پیش از اتمام پیگیری" },
          { id: "c", text: "تأثیر سن بر رابطه‌ی مواجهه و پیامد" },
          { id: "d", text: "انتخاب گروه شاهد از میان بیماران بستری در بیمارستان" },
        ]}
        correctId="a"
      />
    </TopicShell>
  );
}

/* ---------------- Topic 5: Study Designs (scenario-based) ---------------- */

const SCENARIOS = [
  {
    id: 1,
    text: "پژوهشگری ۵۰۰ نفر پرستار سالم را از سال ۱۳۹۸ وارد مطالعه کرد، وضعیت مواجهه با شیفت‌کاری شبانه را در ابتدا ثبت نمود و آن‌ها را تا سال ۱۴۰۴ از نظر بروز دیابت نوع ۲ پیگیری کرد.",
    options: [
      { id: "cohort_p", text: "کوهورت آینده‌نگر (Prospective Cohort)" },
      { id: "cohort_r", text: "کوهورت گذشته‌نگر (Retrospective Cohort)" },
      { id: "cc", text: "مورد–شاهدی (Case-Control)" },
      { id: "cs", text: "مقطعی (Cross-sectional)" },
    ],
    correct: "cohort_p",
    clues: [
      "افراد سالم (بدون پیامد) از ابتدا وارد شدند",
      "مواجهه پیش از وقوع پیامد اندازه‌گیری شد",
      "پیگیری به‌سمت جلو در طول زمان (۱۳۹۸ تا ۱۴۰۴) انجام شد",
    ],
    explanation: "چون گروه در ابتدا عاری از پیامد بوده و به‌صورت آینده‌نگر تا وقوع پیامد پیگیری شده، این یک کوهورت آینده‌نگر است — نه گذشته‌نگر که در آن پرونده‌های قدیمی مرور می‌شود.",
  },
  {
    id: 2,
    text: "محققی ۲۰۰ بیمار مبتلا به سرطان ریه و ۲۰۰ فرد سالم مشابه از نظر سن و جنس را انتخاب کرد و با مراجعه به پرونده و مصاحبه، سابقه‌ی مصرف سیگار آن‌ها را در ۲۰ سال گذشته بررسی کرد.",
    options: [
      { id: "cc", text: "مورد–شاهدی (Case-Control)" },
      { id: "cohort_p", text: "کوهورت آینده‌نگر" },
      { id: "rct", text: "کارآزمایی بالینی تصادفی‌شده (RCT)" },
      { id: "ecological", text: "اکولوژیک (Ecological)" },
    ],
    correct: "cc",
    clues: [
      "شروع از وضعیت پیامد (بیمار در برابر سالم)",
      "مواجهه به‌صورت گذشته‌نگر بررسی شده",
      "گروه شاهد بر اساس سن و جنس همتاسازی شده",
    ],
    explanation: "انتخاب بر اساس پیامد (مورد/شاهد) و بررسی گذشته‌نگر مواجهه، مشخصه‌ی کلاسیک مطالعه‌ی مورد–شاهدی است.",
  },
  {
    id: 3,
    text: "تیم تحقیقاتی در یک روز مشخص، ۱۰۰۰ نفر از ساکنان یک شهر را به‌طور تصادفی انتخاب کردند و هم‌زمان وضعیت فشار خون بالا و میزان فعالیت بدنی فعلی آن‌ها را با یک پرسش‌نامه ثبت کردند.",
    options: [
      { id: "cs", text: "مقطعی (Cross-sectional)" },
      { id: "cohort_p", text: "کوهورت آینده‌نگر" },
      { id: "cc", text: "مورد–شاهدی" },
      { id: "case_series", text: "گزارش/سری موارد (Case Report/Series)" },
    ],
    correct: "cs",
    clues: [
      "مواجهه و پیامد هر دو در یک نقطه زمانی ثبت شدند",
      "بدون پیگیری در طول زمان",
      "امکان تعیین توالی علّی وجود ندارد",
    ],
    explanation: "اندازه‌گیری هم‌زمان مواجهه و پیامد در یک برهه‌ی زمانی، بدون پیگیری، مشخصه‌ی مطالعه‌ی مقطعی است. این طراحی برای برآورد شیوع مناسب است، نه بروز.",
  },
  {
    id: 4,
    text: "پژوهشگران ۳۰۰ بیمار مبتلا به فشار خون بالا را به‌صورت تصادفی به دو گروه دارونما و داروی جدید تقسیم کردند و بعد از ۶ ماه، میزان کاهش فشار خون را در دو گروه مقایسه کردند.",
    options: [
      { id: "rct", text: "کارآزمایی بالینی تصادفی‌شده (RCT)" },
      { id: "cohort_p", text: "کوهورت آینده‌نگر" },
      { id: "cc", text: "مورد–شاهدی" },
      { id: "cs", text: "مقطعی" },
    ],
    correct: "rct",
    clues: [
      "تخصیص مواجهه (دارو) توسط پژوهشگر و به‌صورت تصادفی انجام شده",
      "وجود گروه کنترل (دارونما)",
      "پیگیری آینده‌نگر برای مقایسه پیامد",
    ],
    explanation: "تصادفی‌سازی تخصیص مداخله توسط پژوهشگر، ویژگی تعیین‌کننده‌ی کارآزمایی بالینی تصادفی‌شده است و آن را از مطالعات مشاهده‌ای متمایز می‌کند.",
  },
  {
    id: 5,
    text: "محققی داده‌های میانگین مصرف نمک و میزان مرگ‌ومیر ناشی از بیماری‌های قلبی‌عروقی را برای ۴۰ کشور مختلف (نه برای افراد) از آمار سازمان جهانی بهداشت استخراج و مقایسه کرد.",
    options: [
      { id: "ecological", text: "اکولوژیک (Ecological)" },
      { id: "cohort_p", text: "کوهورت آینده‌نگر" },
      { id: "cc", text: "مورد–شاهدی" },
      { id: "rct", text: "کارآزمایی بالینی تصادفی‌شده" },
    ],
    correct: "ecological",
    clues: [
      "واحد تحلیل، جمعیت/کشور است، نه فرد",
      "داده‌ها از منابع آماری موجود گردآوری شده",
      "خطر تعمیم نادرست به سطح فردی وجود دارد (مغالطه اکولوژیک)",
    ],
    explanation: "وقتی واحد مشاهده و تحلیل، گروه یا جمعیت باشد (نه فرد)، مطالعه از نوع اکولوژیک است؛ باید مراقب مغالطه‌ی اکولوژیک (Ecological Fallacy) در تفسیر نتایج بود.",
  },
  {
    id: 6,
    text: "پزشکی گزارش بالینی مفصلی از ۳ بیمار با یک واکنش دارویی نادر و غیرمنتظره منتشر کرد که پیش از این در متون علمی ثبت نشده بود.",
    options: [
      { id: "case_series", text: "گزارش/سری موارد (Case Report/Series)" },
      { id: "cs", text: "مقطعی" },
      { id: "cohort_p", text: "کوهورت آینده‌نگر" },
      { id: "rct", text: "کارآزمایی بالینی تصادفی‌شده" },
    ],
    correct: "case_series",
    clues: [
      "توصیف دقیق چند مورد بالینی، بدون گروه مقایسه",
      "هدف: مطرح‌کردن فرضیه یا هشدار درباره یک پدیده نادر",
      "فاقد قدرت آماری برای استنباط علّی",
    ],
    explanation: "گزارش/سری موارد صرفاً توصیفی است و گروه مقایسه ندارد؛ ارزش اصلی آن، تولید فرضیه برای مطالعات تحلیلی بعدی است.",
  },
];

function StudyDesignsTopic({ onBack }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState([]);

  const scenario = SCENARIOS[idx];
  const isLast = idx === SCENARIOS.length - 1;
  const isFirst = idx === 0;

  const handleAnswer = (optId) => {
    if (answer) return;
    setAnswer(optId);
    if (optId === scenario.correct) setScore((s) => s + 1);
    setAnswered((arr) => [...arr, optId === scenario.correct]);
  };

  const next = () => {
    setAnswer(null);
    setIdx((i) => Math.min(i + 1, SCENARIOS.length - 1));
  };
  const restart = () => {
    setIdx(0);
    setAnswer(null);
    setScore(0);
    setAnswered([]);
  };

  const finished = answered.length === SCENARIOS.length;

  return (
    <TopicShell
      eyebrow="سناریومحور"
      title="انواع مطالعات و طراحی پژوهش"
      intro="یک سناریوی پژوهشی واقعی بخوانید و نوع طراحی مطالعه را تشخیص دهید. بعد از هر پاسخ، سرنخ‌های کلیدی متن و توضیح تحلیلی نمایش داده می‌شود."
      onBack={onBack}
    >
      {/* progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: LINE, borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              width: `${(answered.length / SCENARIOS.length) * 100}%`,
              height: "100%",
              background: TEAL,
              transition: "width .3s",
            }}
          />
        </div>
        <span style={{ fontSize: 12.5, color: MUTED, whiteSpace: "nowrap" }}>
          سناریو {idx + 1} از {SCENARIOS.length} · امتیاز {score}
        </span>
      </div>

      {!finished || answer === null ? (
        <Card>
          <Chip>سناریو {scenario.id}</Chip>
          <p style={{ fontSize: 15, lineHeight: 2, color: NAVY, margin: "12px 0 16px" }}>{scenario.text}</p>

          <div style={{ display: "grid", gap: 8 }}>
            {scenario.options.map((opt) => {
              const isSelected = answer === opt.id;
              const showCorrect = answer && opt.id === scenario.correct;
              const showWrong = isSelected && opt.id !== scenario.correct;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={!!answer}
                  style={{
                    textAlign: "right",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${showCorrect ? TEAL : showWrong ? RED : "#D8D1C0"}`,
                    background: showCorrect ? "#EAF2F0" : showWrong ? "#FBEAE6" : "#FFFFFF",
                    fontFamily: FONT,
                    fontSize: 13.5,
                    color: NAVY,
                    cursor: answer ? "default" : "pointer",
                    lineHeight: 1.7,
                  }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>

          {answer && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: PAPER, borderRadius: 10, border: `1px solid ${LINE}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                {answer === scenario.correct ? "✓ پاسخ درست" : "✗ پاسخ نادرست — پاسخ صحیح مشخص شده"}
              </div>
              <ul style={{ margin: "0 0 10px", paddingRight: 18, fontSize: 13, lineHeight: 1.9, color: "#4A4437" }}>
                {scenario.clues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: TEAL }}>{scenario.explanation}</p>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                {!isLast ? (
                  <button
                    onClick={next}
                    style={{
                      background: NAVY,
                      color: PAPER,
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontFamily: FONT,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    سناریوی بعدی ←
                  </button>
                ) : (
                  <span style={{ fontSize: 12.5, color: MUTED }}>این آخرین سناریو بود — نتیجه در پایین</span>
                )}
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {finished && (
        <Card style={{ textAlign: "center", background: "#EAF2F0", border: `1.5px solid ${TEAL}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>نتیجه نهایی</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TEAL, marginBottom: 10 }}>
            {score} / {SCENARIOS.length}
          </div>
          <button
            onClick={restart}
            style={{
              background: OCHRE,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontFamily: FONT,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            شروع دوباره
          </button>
        </Card>
      )}
    </TopicShell>
  );
}

/* ---------------- Topic 6: Outbreak Investigation ---------------- */

const OUTBREAK_SCENARIOS = [
  {
    id: 1,
    text: "در یک مراسم عروسی، ۸۰ نفر از ۲۰۰ مهمان طی ۱۲ تا ۴۸ ساعت پس از صرف غذا دچار تهوع و اسهال شدند. منحنی اپیدمی یک قله‌ی تیز و باریک نشان می‌دهد و پس از آن موارد جدید به‌سرعت متوقف شد.",
    options: [
      { id: "point", text: "منبع مشترک نقطه‌ای (Point-Source)" },
      { id: "continuous", text: "منبع مشترک مستمر (Continuous Common-Source)" },
      { id: "propagated", text: "انتشار فرد‌به‌فرد (Propagated)" },
      { id: "mixed", text: "مختلط (Mixed)" },
    ],
    correct: "point",
    clues: [
      "همه‌ی افراد تقریباً هم‌زمان و از یک منبع واحد (غذای مراسم) مواجهه یافتند",
      "قله‌ی تیز و باریک با یک دوره کمون تقریباً یکسان",
      "توقف سریع پس از حذف مواجهه (تمام‌شدن غذا)",
    ],
    explanation: "الگوی کلاسیک منبع مشترک نقطه‌ای: مواجهه‌ی کوتاه و هم‌زمان همه‌ی افراد با یک منبع، و قله‌ی باریک متناسب با دوره کمون بیماری.",
  },
  {
    id: 2,
    text: "در یک روستا، طی ۳ هفته به‌طور پیوسته و با نوسان کم، هر روز چند مورد اسهال حاد گزارش می‌شد. بررسی نشان داد منبع آب آشامیدنی روستا به‌طور مداوم آلوده بوده است.",
    options: [
      { id: "continuous", text: "منبع مشترک مستمر (Continuous Common-Source)" },
      { id: "point", text: "منبع مشترک نقطه‌ای" },
      { id: "propagated", text: "انتشار فرد‌به‌فرد" },
      { id: "mixed", text: "مختلط" },
    ],
    correct: "continuous",
    clues: [
      "مواجهه به‌صورت پیوسته و طولانی‌مدت ادامه داشته (نه یک‌بار)",
      "منحنی اپیدمی کشیده با فلات نسبی، نه یک قله‌ی تیز",
      "منبع آلودگی (آب) تا رفع مشکل فعال باقی مانده",
    ],
    explanation: "وقتی منبع آلودگی برطرف نشود و مواجهه ادامه یابد، منحنی اپیدمی به‌جای قله‌ی باریک، یک فلات کشیده نشان می‌دهد.",
  },
  {
    id: 3,
    text: "یک بیماری تنفسی ابتدا در ۳ نفر از اعضای یک خانواده دیده شد، سپس طی هفته‌های بعد به همکلاسی‌ها و همکاران آن‌ها سرایت کرد و منحنی اپیدمی چند قله‌ی متوالی و فزاینده نشان داد که فاصله‌ی هر قله تقریباً برابر با یک دوره کمون بود.",
    options: [
      { id: "propagated", text: "انتشار فرد‌به‌فرد (Propagated)" },
      { id: "point", text: "منبع مشترک نقطه‌ای" },
      { id: "continuous", text: "منبع مشترک مستمر" },
      { id: "mixed", text: "مختلط" },
    ],
    correct: "propagated",
    clues: [
      "سرایت مستقیم از فرد به فرد، نه از یک منبع مشترک",
      "چند قله‌ی متوالی با فاصله‌ی معادل دوره کمون بیماری",
      "گسترش تدریجی در شبکه‌ی تماس اجتماعی (خانواده → مدرسه → محل کار)",
    ],
    explanation: "الگوی موج‌های متوالی و فزاینده با فاصله‌ی برابر دوره کمون، مشخصه‌ی طغیان‌های منتقله از فرد به فرد است، نه مواجهه با یک منبع واحد.",
  },
];

const OUTBREAK_STEPS = [
  "تأیید وجود طغیان (مقایسه با روند پایه/انتظاری)",
  "تأیید تشخیص بالینی/آزمایشگاهی موارد",
  "تعریف مورد (Case Definition) و یافتن موارد بیشتر",
  "توصیف داده‌ها بر اساس زمان، مکان و فرد (منحنی اپیدمی)",
  "تدوین فرضیه درباره منبع و نحوه انتقال",
  "آزمون فرضیه با مطالعه تحلیلی (کوهورت یا مورد–شاهدی)",
  "اجرای اقدامات کنترلی و پیشگیرانه",
  "برقراری نظام مراقبت مستمر و گزارش‌دهی نهایی",
];

function OutbreakCurveQuiz() {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const scenario = OUTBREAK_SCENARIOS[idx];
  const isLast = idx === OUTBREAK_SCENARIOS.length - 1;

  const handleAnswer = (optId) => {
    if (answer) return;
    setAnswer(optId);
    if (optId === scenario.correct) setScore((s) => s + 1);
  };
  const next = () => {
    setAnswer(null);
    setIdx((i) => Math.min(i + 1, OUTBREAK_SCENARIOS.length - 1));
  };
  const restart = () => {
    setIdx(0);
    setAnswer(null);
    setScore(0);
  };
  const finishedAll = isLast && answer !== null;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: NAVY }}>تشخیص نوع منحنی اپیدمی</h3>
        <span style={{ fontSize: 12, color: MUTED }}>سناریو {idx + 1} از {OUTBREAK_SCENARIOS.length} · امتیاز {score}</span>
      </div>

      <p style={{ fontSize: 14.5, lineHeight: 2, color: NAVY, margin: "0 0 14px" }}>{scenario.text}</p>

      <div style={{ display: "grid", gap: 8 }}>
        {scenario.options.map((opt) => {
          const isSelected = answer === opt.id;
          const showCorrect = answer && opt.id === scenario.correct;
          const showWrong = isSelected && opt.id !== scenario.correct;
          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt.id)}
              disabled={!!answer}
              style={{
                textAlign: "right",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1.5px solid ${showCorrect ? TEAL : showWrong ? RED : "#D8D1C0"}`,
                background: showCorrect ? "#EAF2F0" : showWrong ? "#FBEAE6" : "#FFFFFF",
                fontFamily: FONT,
                fontSize: 13.5,
                color: NAVY,
                cursor: answer ? "default" : "pointer",
                lineHeight: 1.7,
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {answer && (
        <div style={{ marginTop: 14, padding: "12px 14px", background: PAPER, borderRadius: 10, border: `1px solid ${LINE}` }}>
          <ul style={{ margin: "0 0 8px", paddingRight: 18, fontSize: 13, lineHeight: 1.9, color: "#4A4437" }}>
            {scenario.clues.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: TEAL }}>{scenario.explanation}</p>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            {!isLast ? (
              <button
                onClick={next}
                style={{ background: NAVY, color: PAPER, border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}
              >
                سناریوی بعدی ←
              </button>
            ) : (
              <button
                onClick={restart}
                style={{ background: OCHRE, color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}
              >
                نتیجه: {score}/{OUTBREAK_SCENARIOS.length} — شروع دوباره
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function OutbreakStepsOrdering() {
  const shuffled = useMemo(() => {
    const arr = OUTBREAK_STEPS.map((text, correctIndex) => ({ text, correctIndex }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const [picked, setPicked] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);

  const remaining = shuffled.filter((s) => !picked.includes(s.correctIndex));
  const done = picked.length === OUTBREAK_STEPS.length;

  const pick = (item) => {
    const expectedNext = picked.length;
    if (item.correctIndex === expectedNext) {
      setPicked((p) => [...p, item.correctIndex]);
      setWrongFlash(null);
    } else {
      setWrongFlash(item.correctIndex);
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  const restart = () => setPicked([]);

  return (
    <Card>
      <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: NAVY }}>ترتیب صحیح مراحل بررسی طغیان</h3>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: MUTED, lineHeight: 1.8 }}>
        روی مرحله‌ای که فکر می‌کنید مرحله‌ی بعدی درست است کلیک کنید. اگر اشتباه بود، دکمه لحظه‌ای قرمز می‌شود.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {picked.map((ci, i) => (
          <div
            key={ci}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "9px 14px",
              borderRadius: 10,
              background: "#EAF2F0",
              border: `1px solid ${TEAL}`,
              fontSize: 13.5,
            }}
          >
            <span style={{ fontWeight: 800, color: TEAL, minWidth: 18 }}>{i + 1}</span>
            <span style={{ color: NAVY }}>{OUTBREAK_STEPS[ci]}</span>
          </div>
        ))}
      </div>

      {!done && (
        <div style={{ display: "grid", gap: 8 }}>
          {remaining.map((item) => (
            <button
              key={item.correctIndex}
              onClick={() => pick(item)}
              style={{
                textAlign: "right",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1.5px solid ${wrongFlash === item.correctIndex ? RED : "#D8D1C0"}`,
                background: wrongFlash === item.correctIndex ? "#FBEAE6" : "#FFFFFF",
                fontFamily: FONT,
                fontSize: 13.5,
                color: NAVY,
                cursor: "pointer",
                lineHeight: 1.7,
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {done && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: TEAL, marginBottom: 10 }}>✓ ترتیب کامل و صحیح چیده شد.</p>
          <button
            onClick={restart}
            style={{ background: OCHRE, color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}
          >
            شروع دوباره
          </button>
        </div>
      )}
    </Card>
  );
}

function OutbreakTopic({ onBack }) {
  return (
    <TopicShell
      eyebrow="سناریومحور"
      title="طغیان‌ها و بررسی اپیدمی (Outbreak Investigation)"
      intro="طغیان (Outbreak) یعنی بروز موارد یک بیماری بیش از حد انتظار در یک زمان و مکان مشخص. در این ماژول، هم الگوی منحنی اپیدمی را تشخیص می‌دهید و هم ترتیب صحیح مراحل بررسی یک طغیان را می‌چینید."
      onBack={onBack}
    >
      <OutbreakCurveQuiz />
      <OutbreakStepsOrdering />
    </TopicShell>
  );
}

/* ---------------- Home ---------------- */

const TOPICS = [
  { id: "bias", title: "انواع بایاس", desc: "بایاس انتخاب، اطلاعات و مخدوش‌کنندگی با مثال‌های کاربردی", tag: "مفهومی" },
  { id: "confounding", title: "مخدوش‌کنندگی", desc: "شبیه‌ساز تعاملی خام در برابر لایه‌بندی‌شده", tag: "تعاملی" },
  { id: "interaction", title: "اینتراکشن", desc: "تفاوت تعدیل‌کنندگی اثر با کانفاندینگ، با مثال عددی", tag: "تعاملی" },
  { id: "measures", title: "اندازه‌های ارتباط", desc: "محاسبه‌گر زنده‌ی RR، OR، RD و AR٪ از جدول ۲×۲", tag: "محاسبه‌گر" },
  { id: "designs", title: "انواع مطالعات و طراحی پژوهش", desc: "سناریوهای واقعی بخوانید و نوع طراحی مطالعه را تشخیص دهید", tag: "سناریومحور" },
  { id: "outbreak", title: "طغیان‌ها و بررسی اپیدمی", desc: "تشخیص نوع منحنی اپیدمی و چیدن مراحل صحیح بررسی طغیان", tag: "سناریومحور" },
];

function Home({ onOpen }) {
  return (
    <div style={{ fontFamily: FONT, direction: "rtl", background: PAPER, minHeight: "100vh", color: NAVY }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #2C3E54 100%)`,
          color: PAPER,
          padding: "46px 24px 40px",
          borderBottom: `4px solid ${OCHRE}`,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Chip color={OCHRE}>آموزش تعاملی اپیدمیولوژی</Chip>
          <h1 style={{ fontSize: 28, margin: "12px 0 12px", fontWeight: 800, lineHeight: 1.5 }}>
            مفاهیم بنیادی بایاس و اندازه‌های ارتباط
          </h1>
          <p style={{ fontSize: 14.5, lineHeight: 2, color: "#D8DEE8", maxWidth: 620 }}>
            چهار ماژول تعاملی برای مرور مفاهیم کلیدی اپیدمیولوژی: بایاس، مخدوش‌کنندگی، اینتراکشن و
            اندازه‌های ارتباط. با اعداد جدول‌ها بازی کنید و نتیجه را بلافاصله ببینید.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "30px 24px 60px" }}>
        <div style={{ display: "grid", gap: 14 }}>
          {TOPICS.map((t) => (
            <Card key={t.id} style={{ cursor: "pointer" }}>
              <div onClick={() => onOpen(t.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <Chip>{t.tag}</Chip>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: NAVY }}>{t.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.8 }}>{t.desc}</p>
                </div>
                <span style={{ fontSize: 20, color: OCHRE }}>←</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- App root ---------------- */

export default function EpiLearningApp() {
  const [view, setView] = useState("home");

  if (view === "bias") return <BiasTopic onBack={() => setView("home")} />;
  if (view === "confounding") return <ConfoundingTopic onBack={() => setView("home")} />;
  if (view === "interaction") return <InteractionTopic onBack={() => setView("home")} />;
  if (view === "measures") return <MeasuresTopic onBack={() => setView("home")} />;
  if (view === "designs") return <StudyDesignsTopic onBack={() => setView("home")} />;
  if (view === "outbreak") return <OutbreakTopic onBack={() => setView("home")} />;
  return <Home onOpen={setView} />;
}
