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
  pendingCount?: number;
};

type FinalReportRadarEntry = {
  subject: string;
  userScore: number;
  targetScore: number;
};

type FinalReportPowerWheelSegment = {
  label: string;
  value: number;
  status: "pending" | "partial" | "completed";
  completedCount: number;
  totalAssignments: number;
};

type FinalReportAssessment = {
  assessmentId: number;
  questionnaireTitle: string;
  category: string;
  normalizedScore: number;
  completedAt: string | null;
};

type FinalReportPendingAssignment = {
  questionnaire_id: number;
  questionnaire_title: string;
  category: string | null;
};

export interface FinalReportPdfDetail {
  user: FinalReportUser;
  progress: FinalReportProgress;
  overview: FinalReportOverview;
  categories: FinalReportCategory[];
  radar: FinalReportRadarEntry[];
  powerWheel: FinalReportPowerWheelSegment[];
  assessments: FinalReportAssessment[];
  pendingAssignments: FinalReportPendingAssignment[];
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
  gap: "24px",
};

const sectionCardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid #e2e8f0",
  padding: "20px 24px",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  backgroundColor: "#fff",
};

const statCardStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: "18px",
  background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(15,23,42,0.85))",
  color: "#fff",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  minWidth: 0,
};

const headerTitle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  margin: 0,
  color: "#0f172a",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#475569",
  margin: "6px 0 0",
};

const tableHeaderStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  borderBottom: "1px solid #e2e8f0",
  padding: "6px 0",
  textAlign: "right",
};

const tableCellStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#0f172a",
  borderBottom: "1px solid #f1f5f9",
  padding: "6px 0",
};

const statusLabelMap: Record<FinalReportPowerWheelSegment["status"], string> = {
  pending: "در انتظار",
  partial: "در حال تکمیل",
  completed: "تکمیل شده",
};

const statusBadgeStyle: Record<FinalReportPowerWheelSegment["status"], React.CSSProperties> = {
  pending: { backgroundColor: "rgba(244,114,182,0.15)", color: "#be185d" },
  partial: { backgroundColor: "rgba(251,191,36,0.2)", color: "#b45309" },
  completed: { backgroundColor: "rgba(52,211,153,0.2)", color: "#047857" },
};

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

const ChartBox = ({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) => (
  <div style={{ width, height, margin: "0 auto" }}>
    {children}
  </div>
);

export const FinalReportPDFLayout = React.forwardRef<HTMLDivElement, { detail: FinalReportPdfDetail }>(({ detail }, ref) => {
  const radarData =
    detail.radar && detail.radar.length > 0
      ? detail.radar.map((entry) => ({
          subject: entry.subject,
          user: Math.min(Math.max(entry.userScore ?? 0, 0), 100),
          target: Math.min(Math.max(entry.targetScore ?? 100, 0), 100),
        }))
      : detail.categories.map((category) => ({
          subject: category.label,
          user: Math.min(Math.max(category.normalizedScore ?? 0, 0), 100),
          target: 100,
        }));

  const categoryRows = detail.categories.map((category) => ({
    name: category.label,
    score: Math.min(Math.max(category.normalizedScore ?? 0, 0), 100),
    completed: category.completedCount,
    total: category.totalAssignments,
    pending: Math.max((category.totalAssignments ?? 0) - (category.completedCount ?? 0), 0),
  }));

  const categoryCards = categoryRows.map((row) => ({
    ...row,
    pendingText: row.pending > 0 ? `${row.pending} مرحله تا تکمیل بخش باقی‌مانده است.` : "کاملاً تکمیل شده است.",
  }));

  const assessmentRows = detail.assessments.map((assessment) => ({
    title: assessment.questionnaireTitle || `پرسشنامه ${assessment.assessmentId}`,
    category: assessment.category || "سایر دسته‌بندی‌ها",
    score: Number.isFinite(assessment.normalizedScore) ? assessment.normalizedScore.toFixed(1) : "—",
    completedAt: formatDateTime(assessment.completedAt),
  }));

  const pendingCategories = categoryRows.filter((row) => row.pending > 0);
  const pendingAssignments = detail.pendingAssignments ?? [];

  const listGroups = [
    { title: "نقاط قوت کلیدی", items: detail.strengths ?? [] },
    { title: "پیشنهادهای توسعه", items: detail.developmentPlan ?? [] },
    { title: "توصیه‌های فوری", items: detail.recommendations ?? [] },
    { title: "ریسک‌ها / هشدارها", items: detail.risks ?? [] },
  ];

  return (
    <div ref={ref}>
      <div className="pdf-page" style={pageStyle}>
        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>گزارش نهایی ارزیابی مسیر</p>
          <h1 style={headerTitle}>
            {detail.user.first_name} {detail.user.last_name}
          </h1>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
            @{detail.user.username} · {detail.user.email}
          </p>
          <p style={subtitleStyle}>آخرین بروزرسانی: {formatDateTime(detail.progress.lastCompletedAt)}</p>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>وضعیت کلی مسیر</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>پیشرفت مسیر</span>
              <strong style={{ fontSize: "26px" }}>
                {detail.progress.completedCount}/{detail.progress.assignedCount}
              </strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>مراحل کامل شده</span>
            </div>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>امتیاز نهایی</span>
              <strong style={{ fontSize: "26px" }}>{detail.overview.overallScore.toFixed(1)}</strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>از ۱۰۰</span>
            </div>
            <div style={statCardStyle}>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>میانگین خام گفت‌وگو</span>
              <strong style={{ fontSize: "26px" }}>{detail.overview.averageScore.toFixed(1)}</strong>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>میانگین نمرات</span>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#0f172a" }}>
            وضعیت مسیر:{" "}
            <strong>{detail.progress.isReady ? "تمام مراحل به اتمام رسیده است." : "برخی مراحل هنوز در انتظار تکمیل هستند."}</strong>
          </div>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>خلاصه شایستگی‌ها (پاورویل)</h2>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, textAlign: "right" }}>شایستگی</th>
                <th style={{ ...tableHeaderStyle, textAlign: "center" }}>امتیاز</th>
                <th style={{ ...tableHeaderStyle, textAlign: "center" }}>مراحل</th>
                <th style={{ ...tableHeaderStyle, textAlign: "center" }}>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {detail.powerWheel.map((segment) => (
                <tr key={segment.label}>
                  <td style={tableCellStyle}>{segment.label}</td>
                  <td style={{ ...tableCellStyle, textAlign: "center" }}>{segment.value.toFixed(1)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "center" }}>
                    {segment.completedCount}/{segment.totalAssignments}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: "center" }}>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 600,
                        ...statusBadgeStyle[segment.status],
                      }}
                    >
                      {statusLabelMap[segment.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ ...sectionCardStyle, display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 340px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>نمودار عنکبوتی دسته‌بندی‌ها</h2>
            <ChartBox width={320} height={280}>
              <RadarChart width={320} height={280} data={radarData}>
                <PolarGrid stroke="#cbd5f5" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#0f172a", fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 10 }} angle={30} domain={[0, 100]} />
                <Radar name="امتیاز" dataKey="user" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                <Radar name="هدف" dataKey="target" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
              </RadarChart>
            </ChartBox>
          </div>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>خلاصه امتیازات</h2>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>شایستگی</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>امتیاز</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>مراحل</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.name}>
                    <td style={tableCellStyle}>{row.name}</td>
                    <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.score.toFixed(1)}</td>
                    <td style={{ ...tableCellStyle, textAlign: "center" }}>
                      {row.completed}/{row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="pdf-page" style={pageStyle}>
        <section style={{ ...sectionCardStyle }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", color: "#0f172a" }}>مقایسه نموداری شایستگی‌ها</h2>
          <ChartBox width={640} height={280}>
            <BarChart width={640} height={280} data={categoryRows} margin={{ top: 10, left: 12, right: 12, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#0f172a" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#0f172a" }} />
              <ReferenceLine y={70} stroke="#f97316" strokeDasharray="4 4" />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartBox>
        </section>

        <section style={{ ...sectionCardStyle }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", color: "#0f172a" }}>وضعیت هر شایستگی</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {categoryCards.map((card) => (
              <div key={card.name} style={{ borderRadius: "16px", border: "1px solid #e2e8f0", padding: "12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569" }}>شایستگی</p>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>{card.name}</h3>
                <p style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 700 }}>{card.score.toFixed(1)}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                  {card.completed}/{card.total} مرحله
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b" }}>{card.pendingText}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...sectionCardStyle }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>جزئیات گفت‌وگوها</h2>
          {assessmentRows.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>هنوز گفت‌وگوی تکمیل‌شده‌ای ثبت نشده است.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>پرسشنامه</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>دسته‌بندی</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>امتیاز</th>
                  <th style={{ ...tableHeaderStyle, textAlign: "center" }}>تاریخ تکمیل</th>
                </tr>
              </thead>
              <tbody>
                {assessmentRows.map((row) => (
                  <tr key={row.title + row.completedAt}>
                    <td style={tableCellStyle}>{row.title}</td>
                    <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.category}</td>
                    <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.score}</td>
                    <td style={{ ...tableCellStyle, textAlign: "center" }}>{row.completedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="pdf-page" style={pageStyle}>
        <section style={{ ...sectionCardStyle, display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>مراحل باقی‌مانده بر اساس شایستگی</h2>
            {pendingCategories.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#16a34a" }}>تمام دسته‌بندی‌ها تکمیل شده‌اند.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingCategories.map((item) => (
                  <li key={item.name} style={{ borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 12px" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                      {item.pending} مرحله از {item.total} هنوز تکمیل نشده است.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#0f172a" }}>ماموریت‌های باقی‌مانده</h2>
            {pendingAssignments.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#16a34a" }}>ماموریت باز ندارید.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingAssignments.map((assignment) => (
                  <li
                    key={assignment.questionnaire_id}
                    style={{ borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 12px" }}
                  >
                    <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{assignment.questionnaire_title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                      دسته‌بندی: {assignment.category || "سایر دسته‌بندی‌ها"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section style={{ ...sectionCardStyle, flex: 1 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", color: "#0f172a" }}>تحلیل‌های کیفی</h2>
          {listGroups.map((group) => (
            <ListSection key={group.title} title={group.title} items={group.items} />
          ))}
        </section>
      </div>
    </div>
  );
});

FinalReportPDFLayout.displayName = "FinalReportPDFLayout";
