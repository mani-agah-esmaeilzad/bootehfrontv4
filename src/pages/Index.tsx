import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Globe2,
  Languages,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import heroTexture from "@/assets/avatar5.jpg";
import teamLeadImg from "@/assets/avatar1.jpg";
import recruiterImg from "@/assets/avatar2.jpg";
import teacherImg from "@/assets/avatar3.jpg";

const Index = () => {
  const navigate = useNavigate();

  const featureHighlights = [
    {
      icon: Sparkles,
      title: "Tailored Soft Skills Assessment",
    },
    {
      icon: ShieldCheck,
      title: "Comprehensive Result",
    },
    {
      icon: LineChart,
      title: "Data-Driven Insights Dashboard",
    },
    {
      icon: BriefcaseBusiness,
      title: "Role and Career Matching",
    },
    {
      icon: Languages,
      title: "Multi-language Assessment",
    },
  ];

  const audienceCards = [
    {
      title: "For Team Leads",
      description: "Empower teams with clear visibility into collaboration and leadership skills.",
      cta: "Learn more",
      image: teamLeadImg,
    },
    {
      title: "For Recruiters",
      description: "Elevate hiring decisions with nuanced soft skill diagnostics.",
      cta: "Learn more",
      image: recruiterImg,
    },
    {
      title: "For Teachers",
      description: "Help learners build the interpersonal strengths modern classrooms demand.",
      cta: "Learn more",
      image: teacherImg,
    },
  ];

  const articles = [
    {
      title: "2030: A Soft Skills-Dominated Job Market",
      description:
        "Explore the increasing importance of soft skills in the modern workplace, shaped by digital transformation.",
    },
    {
      title: "Soft skills ensure 85% of career success",
      description:
        "Uncover the data-driven insights that highlight why human-centric capabilities drive organizational success.",
    },
    {
      title: "Gamification in Human Resource Management",
      description:
        "See how immersive assessment journeys improve engagement by connecting learning with real outcomes.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-right font-vazir">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-hrbooteh-surface-elevated">
        <div className="container mx-auto flex items-center justify-between gap-6 py-4">
          <Logo variant="large" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-hrbooteh-text-secondary">
            <a className="hover:text-hrbooteh-text-primary transition" href="#about">
              About
            </a>
            <a className="hover:text-hrbooteh-text-primary transition" href="#blog">
              Blog
            </a>
            <a className="hover:text-hrbooteh-text-primary transition" href="#use-cases">
              Use Cases
            </a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Button variant="hrbooteh-ghost" onClick={() => navigate("/login")}>
              ورود
            </Button>
            <Button variant="hrbooteh" onClick={() => navigate("/register")}>
              ثبت‌نام
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <div className="absolute right-1/2 top-10 h-64 w-64 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-3xl" />
          <div className="absolute left-1/2 bottom-0 h-72 w-72 rounded-full bg-gradient-to-br from-hrbooteh-primary/70 to-purple-500 blur-3xl" />
        </div>
        <div className="container mx-auto grid gap-16 lg:grid-cols-[1.1fr,0.9fr] items-center py-24 md:py-32">
          <div className="relative z-10 text-hrbooteh-text-primary">
            <span className="inline-flex items-center gap-2 rounded-full border border-hrbooteh-primary/30 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-hrbooteh-text-secondary">
              Soft Skills Intelligence
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl xl:text-6xl">
              <span className="text-hrbooteh-text-primary">WiseWorld</span> is the only platform turning soft skills into
              <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"> data-driven insights.</span>
            </h1>
            <p className="mt-6 text-lg text-hrbooteh-text-secondary md:text-xl leading-8">
              Illuminate the human capabilities that fuel collaboration, innovation, and growth. Our AI-powered assessments unlock the language of soft skills and translate them into actionable strategies.
            </p>
            <div className="mt-10 flex flex-col-reverse items-center justify-end gap-4 sm:flex-row">
              <Button
                variant="hrbooteh-outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate("/login")}
              >
                مشاهده دموی تعاملی
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
              <Button
                variant="hrbooteh"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate("/register")}
              >
                Book a demo
              </Button>
            </div>
            <div className="mt-14 grid gap-4 rounded-3xl border border-hrbooteh-surface-elevated bg-white/80 p-6 shadow-hrbooteh-lg md:grid-cols-5">
              {featureHighlights.map(({ icon: Icon, title }) => (
                <div key={title} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-medium text-hrbooteh-text-primary">{title}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative overflow-hidden rounded-[40px] border border-white/40 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-6 shadow-hrbooteh-lg">
              <div className="rounded-[28px] border border-white/40 bg-white/90 p-6 text-left shadow-inner">
                <div className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-600">Insight Snapshot</div>
                <h3 className="mt-4 text-2xl font-bold text-hrbooteh-text-primary">Team Collaboration Pulse</h3>
                <p className="mt-2 text-sm text-hrbooteh-text-secondary">
                  Adaptive assessment reveals communication, empathy, and leadership signals across your workforce.
                </p>
                <div className="mt-6 space-y-4">
                  {["Strategic Thinking", "Empathy", "Agility"].map((label) => (
                    <div key={label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-hrbooteh-text-secondary">
                        <span>{label}</span>
                        <span>High</span>
                      </div>
                      <div className="h-2 rounded-full bg-purple-100">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-3xl bg-purple-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-purple-700">Actionable Insight</p>
                  <p className="mt-2 text-sm text-hrbooteh-text-secondary">
                    Unlock tailored coaching plans and track measurable improvement paths across every team member.
                  </p>
                </div>
              </div>
              <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full border border-white/30 bg-white/20 blur-2xl" aria-hidden />
              <img
                src={heroTexture}
                alt="Soft skill insights"
                className="pointer-events-none absolute -bottom-10 -right-8 h-48 w-48 rounded-3xl border-4 border-white/60 object-cover opacity-70"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Soft Skills */}
      <section id="about" className="container mx-auto py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-hrbooteh-text-primary md:text-4xl">Why Measuring Soft Skills Matters?</h2>
          <p className="mt-4 text-lg text-hrbooteh-text-secondary md:max-w-2xl md:mx-auto">
            Make the invisible visible. Connect communication flows, teamwork strengths, and collaboration drivers to strategic outcomes.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-hrbooteh-surface-elevated bg-white p-10 shadow-hrbooteh-md">
            <h3 className="text-2xl font-semibold text-hrbooteh-text-primary">Soft Skills Are Invisible</h3>
            <p className="mt-4 text-hrbooteh-text-secondary leading-8">
              They’re there, but unnoticed. Without recognition, teamwork weakens, communication breaks, and collaboration stalls.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-hrbooteh-text-secondary">
              <div className="rounded-2xl border border-dashed border-purple-200 p-4">Communication</div>
              <div className="rounded-2xl border border-dashed border-purple-200 p-4">Teamwork</div>
              <div className="rounded-2xl border border-dashed border-purple-200 p-4">Collaboration</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[32px] border border-transparent bg-gradient-to-br from-purple-500 to-indigo-500 p-[1px] shadow-hrbooteh-lg">
            <div className="h-full rounded-[30px] bg-gradient-to-br from-purple-600/95 to-indigo-600/95 p-10 text-white">
              <h3 className="text-2xl font-semibold">Let’s Make Them Visible</h3>
              <p className="mt-4 leading-8 text-white/85">
                When recognized, they connect us. Communication flows, teamwork strengthens, and collaboration thrives.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {["Reach Clarity", "Boost Trust", "Grow Momentum"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-12 h-48 w-full rounded-[28px] border border-white/30 bg-white/10 backdrop-blur-sm" aria-hidden>
                <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.5em] text-white/70">
                  Insight Overlay
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Result */}
      <section id="use-cases" className="bg-gradient-to-b from-white via-purple-50 to-white py-24">
        <div className="container mx-auto grid items-center gap-12 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
              <Target className="h-4 w-4" /> Comprehensive Result
            </div>
            <h2 className="mt-6 text-3xl font-bold text-hrbooteh-text-primary md:text-4xl">
              Unbiased & Unique Individual Showcase
            </h2>
            <p className="mt-4 text-lg leading-8 text-hrbooteh-text-secondary">
              Complete results for each individual across 44 soft skills, highlighting their strengths and areas for growth. Build a continuous development journey anchored in evidence.
            </p>
            <div className="mt-8 space-y-4">
              {["AI-guided evaluation rubric", "Personalized coaching next steps", "Organization-wide benchmarking"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3 text-hrbooteh-text-secondary">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-purple-600 shadow-hrbooteh-sm">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative flex h-80 w-80 items-center justify-center rounded-full border-8 border-white bg-white shadow-hrbooteh-lg">
              <div className="absolute inset-6 rounded-full border border-dashed border-purple-200" />
              <div className="absolute inset-12 rounded-full border border-dashed border-purple-200" />
              <div className="absolute inset-20 rounded-full border border-dashed border-purple-200" />
              <div className="relative flex flex-col items-center text-center">
                <span className="text-sm font-semibold uppercase tracking-[0.4em] text-purple-600">Soft Skill Index</span>
                <p className="mt-3 max-w-[12rem] text-lg font-bold text-hrbooteh-text-primary">
                  Collaboration & Leadership Excellence
                </p>
                <span className="mt-6 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                  92/100 Score
                </span>
              </div>
              <div className="absolute -right-8 top-1/2 flex -translate-y-1/2 flex-col items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-hrbooteh-md">
                <div className="flex items-center gap-3 text-sm text-hrbooteh-text-secondary">
                  <UsersRound className="h-5 w-5 text-purple-600" />
                  Cross-team collaboration lifted 28%
                </div>
                <div className="flex items-center gap-3 text-sm text-hrbooteh-text-secondary">
                  <Globe2 className="h-5 w-5 text-purple-600" />
                  Culture adoption accelerated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="container mx-auto py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-hrbooteh-text-primary md:text-4xl">Who is WiseWorld for?</h2>
          <p className="mt-4 text-lg text-hrbooteh-text-secondary md:max-w-2xl md:mx-auto">
            From high-performing teams to emerging talent, tailor assessment journeys to every audience.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {audienceCards.map(({ title, description, cta, image }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-[32px] border border-hrbooteh-surface-elevated bg-white shadow-hrbooteh-md transition hover:-translate-y-1 hover:shadow-hrbooteh-lg"
            >
              <img
                src={image}
                alt={title}
                className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-8">
                <h3 className="text-xl font-semibold text-hrbooteh-text-primary">{title}</h3>
                <p className="mt-3 text-sm text-hrbooteh-text-secondary leading-7">{description}</p>
                <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
                  {cta}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section id="blog" className="bg-white py-24">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-right">
            <div>
              <h2 className="text-3xl font-bold text-hrbooteh-text-primary md:text-4xl">
                Your Soft Skills Deep Dive Starts Here.
              </h2>
              <p className="mt-4 text-lg text-hrbooteh-text-secondary md:max-w-xl">
                Dive into the research, strategies, and stories guiding the future of people development.
              </p>
            </div>
            <Button variant="hrbooteh-outline" size="lg">
              View all insights
            </Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {articles.map(({ title, description }) => (
              <article
                key={title}
                className="flex h-full flex-col rounded-[32px] border border-hrbooteh-surface-elevated bg-white p-8 shadow-hrbooteh-md transition hover:-translate-y-1 hover:shadow-hrbooteh-lg"
              >
                <div className="h-36 w-full rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20" />
                <h3 className="mt-6 text-xl font-semibold text-hrbooteh-text-primary">{title}</h3>
                <p className="mt-3 flex-1 text-sm text-hrbooteh-text-secondary leading-7">{description}</p>
                <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
                  Read more
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" aria-hidden />
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl font-bold md:text-4xl">Unlock your team’s potential with HRbooteh now</h2>
          <p className="mt-4 text-lg text-white/80 md:max-w-2xl md:mx-auto">
            Harness AI-powered insights to illuminate the capabilities that make your people extraordinary.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
              onClick={() => navigate("/register")}
            >
              Book a demo
            </Button>
            <Button variant="hrbooteh-outline" size="lg" className="border-white text-white hover:bg-white/10">
              Talk to our team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hrbooteh-surface py-16 text-hrbooteh-text-secondary">
        <div className="container mx-auto grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Logo variant="default" />
            <p className="text-sm leading-6">
              HRbooteh empowers organizations to understand, measure, and grow the soft skills that drive performance.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">About</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>About</li>
              <li>Blog</li>
              <li>For Team Leads</li>
              <li>For Teachers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">Use Cases</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>Recruiting</li>
              <li>Performance</li>
              <li>Culture</li>
              <li>Growth</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-hrbooteh-text-primary">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>hello@hrbooteh.com</li>
              <li>+351 445 485</li>
              <li>Porto, Portugal</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-hrbooteh-surface-elevated pt-6 text-center text-sm">
          © {new Date().getFullYear()} HRbooteh. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
