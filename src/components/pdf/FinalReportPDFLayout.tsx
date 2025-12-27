import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type FinalReportUser = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
};

type FinalReportProgress = {
  assignedCount: number;
  completedCount: number;
  completionPercent: number;
  lastCompletedAt: string | null;
  isReady: boolean;
};

type FinalReportOverview = {
  overallScore: number;
  averageScore: number;
};

type FinalReportCategory = {
  key: string;
  label: string;
  normalizedScore: number;
  completedCount: number;
  totalAssignments: number;
};

type FinalReportRadarEntry = {
  subject: string;
  userScore: number;
  targetScore: number;
};

export interface FinalReportPdfDetail {
  user: FinalReportUser;
  progress: FinalReportProgress;
  overview: FinalReportOverview;
  categories: FinalReportCategory[];
  radar: FinalReportRadarEntry[];
  strengths: string[];
  recommendations: string[];
  developmentPlan: string[];
  risks: string[];
}

const pageStyle: React.CSSProperties = {
  width: "794px",
  minHeight: "1123px",
  backgroundColor: "#fff",
  padding: "48px 56px",
  color: "#0f172a",
  fontFamily: "'Vazirmatn', 'IRANSans', 'Tahoma', sans-serif",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "32px",
};

const sectionCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  padding: "20px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
};

const statCardStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: "16px",
  background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(15,23,42,0.85))",
  color: "#fff",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#475569",
  margin: "6px 0 0",
};

const ChartBox = ({ width, height, children }: { width: number; height: number; children: React.ReactNode }) => (
  <div
    style={{
      width,
      height,
      margin: "0 auto",
    }}
  >
    {children}
  </div>
);

const ListSection = ({ title, items }: { title: string; items: string[] }) => (
  <div style={{ marginBottom: "18px" }}>
    <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#0f172a" }}>{title}</h3>
    {items.length === 0 ? (
      <p style={{ fontSize: "13px", color: "#64748b" }}>موردی ثبت نشده است.</p>
    ) : (
      <ol style={{ margin: 0, paddingInlineStart: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item, index) => (
          <li key={`${title}-${index}`} style={{ fontSize: "13px", color: "#0f172a", lineHeight: 1.6 }}>
            {item}
          </li>
        ))}
      </ol>
    )}
  </div>
);

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fa-IR", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return value;
  }
};

export const FinalReportPDFLayout = React.forwardRef<HTMLDivElement, { detail: FinalReportPdfDetail }>(({ detail }, ref) => {
  const radarData =
    detail.radar && detail.radar.length > 0
      ? detail.radar.map((entry) => ({
          subject: entry.subject,
          user: Math.min(Math.max(entry.userScore, 0), 100),
          target: Math.min(Math.max(entry.targetScore ?? 100, 0), 100),
        }))
      : detail.categories.map((category) => ({
          subject: category.label,
          user: Math.min(Math.max(category.normalizedScore ?? 0, 0), 100),
          target: 100,
        }));

  const categoryScores = detail.categories.map((category) => ({
    name: category.label,
    score: Math.min(Math.max(category.normalizedScore ?? 0, 0), 100),
    completed: category.completedCount,
    total: category.totalAssignments,
  }));

  const listGroups = [
    { title: "نقاط قوت کلیدی", items: detail.strengths ?? [] },
    { title: "پیشنهادهای توسعه", items: detail.developmentPlan ?? [] },
    { title: "توصیه‌های فوری", items: detail.recommendations ?? [] },
    { title: "ریسک‌ها / هشدارها", items: detail.risks ?? [] },
  ];

  return (
    <div ref={ref}>
      <div className="pdf-page" style={pageStyle}>
        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>گزارش نهایی ارزیابی شایستگی</p>
          <h1 style={titleStyle}>
            {detail.user.first_name} {detail.user.last_name}
          </h1>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>@{detail.user.username} · {detail.user.email}</p>
          <p style={subtitleStyle}>آخرین بروزرسانی: {formatDateTime(detail.progress.lastCompletedAt)}</p>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>نمای کلی مسیر</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>پیشرفت</span>
              <strong style={{ fontSize: "24px" }}>
                {detail.progress.completedCount}/{detail.progress.assignedCount}
              </strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>مراحل کامل شده</span>
            </div>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>میانگین نهایی</span>
              <strong style={{ fontSize: "24px" }}>{detail.overview.overallScore.toFixed(1)}</strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>از ۱۰۰</span>
            </div>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>میانگین خام</span>
              <strong style={{ fontSize: "24px" }}>{detail.overview.averageScore.toFixed(1)}</strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>میانگین گفت‌وگوها</span>
            </div>
          </div>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>نمای کلی شایستگی‌ها</h2>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <ChartBox width={320} height={280}>
              <RadarChart width={320} height={280} data={radarData}>
                <PolarGrid stroke="#cbd5f5" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#0f172a", fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 10 }} angle={30} domain={[0, 100]} />
                <Radar name="امتیاز" dataKey="user" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                <Radar name="هدف" dataKey="target" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
              </RadarChart>
            </ChartBox>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "right", padding: "6px 0", fontSize: "12px", color: "#64748b" }}>شایستگی</th>
                    <th style={{ textAlign: "center", padding: "6px 0", fontSize: "12px", color: "#64748b" }}>امتیاز</th>
                    <th style={{ textAlign: "center", padding: "6px 0", fontSize: "12px", color: "#64748b" }}>مراحل</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryScores.map((row) => (
                    <tr key={row.name}>
                      <td style={{ padding: "6px 0", fontSize: "13px", borderBottom: "1px solid #e2e8f0" }}>{row.name}</td>
                      <td style={{ padding: "6px 0", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                        {row.score.toFixed(1)}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                        {row.completed}/{row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>مقایسه امتیازها</h2>
          <ChartBox width={640} height={280}>
            <BarChart width={640} height={280} data={categoryScores} margin={{ top: 8, left: 8, right: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#0f172a" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#0f172a" }} />
              <ReferenceLine y={70} stroke="#f97316" strokeDasharray="4 4" />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartBox>
        </section>
      </div>

      <div className="pdf-page" style={pageStyle}>
        <section style={{ ...sectionCardStyle, flex: 1 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", color: "#0f172a" }}>نتایج کیفی</h2>
          {listGroups.map((group) => (
            <ListSection key={group.title} title={group.title} items={group.items} />
          ))}
        </section>
      </div>
    </div>
  );
});

FinalReportPDFLayout.displayName = "FinalReportPDFLayout";
