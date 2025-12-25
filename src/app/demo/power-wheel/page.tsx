// src/app/demo/power-wheel/page.tsx

import { PowerWheel } from "@/components/charts/PowerWheel";
import {
  DEFAULT_POWER_WHEEL_COLORS,
  PowerWheelAxis,
  PowerWheelGroup,
} from "@/components/charts/powerWheelTypes";

const SAMPLE_AXES: PowerWheelAxis[] = [
  { key: "team-collab", label: "Collaboration Quality", group: "Teamwork", value: 82 },
  { key: "team-support", label: "Peer Support", group: "Teamwork", value: 74 },
  { key: "team-alignment", label: "Goal Alignment", group: "Teamwork", value: 63 },
  { key: "team-mediation", label: "Conflict Mediation", group: "Teamwork", value: 58 },
  { key: "comm-active", label: "Active Listening", group: "Communication", value: 88 },
  { key: "comm-writing", label: "Business Writing", group: "Communication", value: 70 },
  { key: "comm-briefs", label: "Executive Briefings", group: "Communication", value: 65 },
  { key: "comm-feedback", label: "Feedback Delivery", group: "Communication", value: 77 },
  { key: "cog-proc", label: "Processing Speed", group: "Cognitive Abilities", value: 69 },
  { key: "cog-memory", label: "Working Memory", group: "Cognitive Abilities", value: 80 },
  { key: "cog-reasoning", label: "Abstract Reasoning", group: "Cognitive Abilities", value: 72 },
  { key: "cog-planning", label: "Scenario Planning", group: "Cognitive Abilities", value: 61 },
  { key: "ethic-reliability", label: "Reliability", group: "Work Ethic", value: 84 },
  { key: "ethic-ownership", label: "Ownership Mindset", group: "Work Ethic", value: 78 },
  { key: "ethic-discipline", label: "Self Discipline", group: "Work Ethic", value: 73 },
  { key: "ethic-learning", label: "Continuous Learning", group: "Work Ethic", value: 68 },
  { key: "prob-analysis", label: "Root Cause Analysis", group: "Problem Solving", value: 71 },
  { key: "prob-experiment", label: "Experiment Design", group: "Problem Solving", value: 64 },
  { key: "prob-iteration", label: "Iterative Mindset", group: "Problem Solving", value: 75 },
  { key: "prob-innovation", label: "Creative Solutions", group: "Problem Solving", value: 69 },
  { key: "lead-vision", label: "Vision Setting", group: "Leadership", value: 66 },
  { key: "lead-mentoring", label: "Mentoring Others", group: "Leadership", value: 81 },
  { key: "lead-decisions", label: "Decision Velocity", group: "Leadership", value: 73 },
  { key: "lead-empower", label: "Empowering Teams", group: "Leadership", value: 77 },
];

const groupDescriptions: Record<PowerWheelGroup, string> = {
  Teamwork: "Collaboration, support, and mediation metrics.",
  Communication: "Listening, messaging, and executive communication.",
  "Cognitive Abilities": "Thinking speed, reasoning, and planning.",
  "Work Ethic": "Discipline and reliability signals.",
  "Problem Solving": "Analytical and creative execution.",
  Leadership: "Vision, mentoring, and empowerment.",
};

export default function PowerWheelDemoPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-slate-100">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Components · Charts</p>
        <h1 className="text-3xl font-bold text-white">PowerWheel Demo</h1>
        <p className="text-sm text-slate-300">
          نمونه‌ای از چارت پاورویل اختصاصی که بدون کتابخانه‌های سنگین ساخته شده و می‌تواند برای تحلیل شایستگی‌ها یا پرسشنامه‌ها استفاده شود.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/40">
        <PowerWheel data={SAMPLE_AXES} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {(Object.keys(groupDescriptions) as PowerWheelGroup[]).map((group) => (
          <article
            key={group}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-3.5 w-3.5 rounded"
                style={{ backgroundColor: DEFAULT_POWER_WHEEL_COLORS[group] }}
              />
              <h2 className="font-semibold text-white">{group}</h2>
            </div>
            <p>{groupDescriptions[group]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
