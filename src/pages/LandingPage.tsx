import { useNavigate } from 'react-router-dom'
import {
  Sparkles, FileText, Zap, Shield, ArrowRight, CheckCircle2,
  Download, Target, Wand2, LayoutTemplate, Clock, Award,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI Writes For You',
    desc: 'Describe your experience and AI generates professional bullet points, summaries, and skills instantly.',
    from: '#fff0f6', to: '#f9e8ff', border: '#f9a8d4', iconColor: '#db2777',
  },
  {
    icon: Shield,
    title: 'ATS Optimized',
    desc: 'Beat applicant tracking systems with keyword-rich content tailored to your exact job title.',
    from: '#f0f4ff', to: '#ede9fe', border: '#c4b5fd', iconColor: '#7c3aed',
  },
  {
    icon: Target,
    title: 'Role-Specific Content',
    desc: 'Enter your target job and location — every suggestion adapts to that exact role and market.',
    from: '#f0fdf4', to: '#ecfdf5', border: '#6ee7b7', iconColor: '#059669',
  },
  {
    icon: LayoutTemplate,
    title: '20+ Templates',
    desc: 'Harvard academic to modern tech layouts — pick, preview, and switch any time, no re-typing.',
    from: '#fffbeb', to: '#fef3c7', border: '#fcd34d', iconColor: '#d97706',
  },
  {
    icon: Download,
    title: 'Export PDF, DOCX & PNG',
    desc: 'Download in any format. Print-ready formatting, recruiter-ready output, ATS-safe structure.',
    from: '#fff7f0', to: '#fef2f2', border: '#fca5a5', iconColor: '#ef4444',
  },
  {
    icon: Clock,
    title: 'Done in Minutes',
    desc: 'Step-by-step guided builder. No blank page. No frustration. Just a great resume, fast.',
    from: '#f5f3ff', to: '#ede9fe', border: '#c4b5fd', iconColor: '#8b5cf6',
  },
]

const STEPS = [
  { n: '1', title: 'Pick Your Target Job',   desc: 'Tell AI what role you want — it shapes everything from bullet points to skills.' },
  { n: '2', title: 'Choose a Template',       desc: '20+ professionally designed layouts. Switch any time, even after writing.' },
  { n: '3', title: 'Fill In with AI Help',    desc: 'Every section has one-click AI assist. Write, improve, or get suggestions instantly.' },
  { n: '4', title: 'Download & Apply',         desc: 'Export as PDF, DOCX, or image — ATS-ready, recruiter-approved.' },
]

const TEMPLATE_SAMPLES = [
  { name: 'Modern',    bg: '#1a1a2e', accent: '#a855f7', layout: 'two-col' },
  { name: 'Executive', bg: '#0f172a', accent: '#f59e0b', layout: 'exec' },
  { name: 'Harvard',   bg: '#1c1c1c', accent: '#f5f5f5', layout: 'classic' },
  { name: 'Minimal',   bg: '#a855f7', accent: '#fff',    layout: 'minimal' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Melo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl tracking-tight brand-gradient-text">melo</span>
        </div>
        <button
          onClick={() => navigate('/build')}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg"
          style={{ background: 'var(--melo-gradient)', boxShadow: '0 4px 16px rgba(168,85,247,0.35)' }}
        >
          Build for Free
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24">
        {/* Soft gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />
          <div className="animate-float-delayed absolute top-1/3 -left-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
          <div className="animate-float absolute bottom-0 right-1/3 h-64 w-64 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff6b6b, transparent)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: '#f9a8d4', backgroundColor: '#fff0f8', color: '#be185d' }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#ec4899' }} />
            AI-Powered · No login · 100% Free Forever
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Build a Resume That
            <br />
            <span className="brand-gradient-text">Gets You Hired</span>
          </h1>

          <p className="animate-slide-up delay-200 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            Answer a few questions, pick a template, and let AI craft the perfect resume
            for your exact role and location. Download in minutes.
          </p>

          {/* CTA */}
          <div className="animate-slide-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/build')}
              className="group flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-2xl transition-all duration-200 hover:opacity-95 active:scale-95"
              style={{ background: 'var(--melo-gradient)', boxShadow: '0 8px 32px rgba(168,85,247,0.45)' }}
            >
              <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
              Start Building My Resume
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-sm text-gray-400">No account · No credit card · ~5 minutes</p>
          </div>

          {/* Feature pills */}
          <div className="animate-fade-in delay-500 mt-12 flex flex-wrap items-center justify-center gap-2.5">
            {['PDF Export', 'Word Export', 'Image Export', 'ATS Optimizer', 'AI Writing', 'Cover Letter', '20 Templates'].map(f => (
              <span key={f}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 font-medium">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                {f}
              </span>
            ))}
          </div>

          {/* Template mini previews */}
          <div className="animate-scale-in delay-600 mt-16 flex gap-4 items-end justify-center">
            {TEMPLATE_SAMPLES.map((t, i) => (
              <MiniResumePreview key={t.name} template={t} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#a855f7' }}>How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ready in{' '}
              <span className="brand-gradient-text">4 simple steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <div key={step.n}
                className="relative rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-black"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-2.5 h-0.5 w-5"
                    style={{ background: 'linear-gradient(to right, #f9a8d4, transparent)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#a855f7' }}>Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              The smartest resume builder{' '}
              <span className="brand-gradient-text">ever built</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
                style={{ background: `linear-gradient(135deg, ${f.from}, ${f.to})`, borderColor: f.border }}>
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"
                >
                  <f.icon className="h-5 w-5" style={{ color: f.iconColor }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="relative rounded-3xl overflow-hidden p-10 text-white"
            style={{ background: 'var(--melo-gradient)' }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white, transparent 60%)' }} />
            <Award className="h-10 w-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold mb-3">Your next job starts with a great resume</h2>
            <p className="text-white/70 mb-8 text-sm leading-relaxed">
              Build for free, no account needed. Download PDF, Word, or image instantly.
            </p>
            <button
              onClick={() => navigate('/build')}
              className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold transition-all duration-200 hover:opacity-90 active:scale-95 shadow-xl"
              style={{ color: '#a855f7' }}
            >
              <Sparkles className="h-5 w-5" />
              Build My Resume — It's Free
            </button>
            <p className="mt-4 text-xs text-white/50">No login · No credit card · Instant download</p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Melo" className="h-6 w-6 object-contain" />
            <span className="font-bold brand-gradient-text">melo</span>
          </div>
          <p>Made with care · Free forever · Your data stays in your browser</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              PDF · DOCX · PNG
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Powered by Groq AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Mini Resume Preview ───────────────────────────────────────────────────────

type TemplateSample = { name: string; bg: string; accent: string; layout: string }

function MiniResumePreview({ template: t, delay }: { template: TemplateSample; delay: number }) {
  const isWide = t.layout === 'two-col'
  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-default"
      style={{
        width: isWide ? 120 : 100,
        height: isWide ? 156 : 130,
        backgroundColor: t.bg,
        animationDelay: `${delay}ms`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {t.layout === 'two-col' ? (
        <div className="flex h-full">
          <div className="w-8 h-full p-1.5 flex flex-col gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div className="h-4 w-4 rounded-full mx-auto mb-1" style={{ backgroundColor: t.accent, opacity: 0.6 }} />
            {[70,85,60,75,50,65,70].map((w,i) => (
              <div key={i} className="rounded-full" style={{ height:1.5, backgroundColor:t.accent, opacity:0.3, width:`${w}%` }} />
            ))}
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className="rounded-sm mb-1.5" style={{ height:3, width:'80%', backgroundColor:t.accent, opacity:0.85 }} />
            <div className="rounded-sm" style={{ height:1.5, width:'55%', backgroundColor:t.accent, opacity:0.4 }} />
            <div className="rounded-full mt-1.5" style={{ height:1, width:'100%', backgroundColor:t.accent, opacity:0.15 }} />
            {[90,70,82,60,76,55,68,75].map((w,i) => (
              <div key={i} className="rounded-full" style={{ height:1.5, backgroundColor:t.accent, opacity:0.22, width:`${w}%` }} />
            ))}
          </div>
        </div>
      ) : t.layout === 'exec' ? (
        <div className="h-full flex flex-col">
          <div className="p-2.5" style={{ backgroundColor:'rgba(0,0,0,0.5)' }}>
            <div className="rounded-sm mb-1" style={{ height:3.5, width:'70%', backgroundColor:t.accent, opacity:0.9 }} />
            <div className="rounded-sm mb-1" style={{ height:1.5, width:'45%', backgroundColor:t.accent, opacity:0.5 }} />
            <div className="rounded-full" style={{ height:1, width:'85%', backgroundColor:t.accent, opacity:0.3 }} />
          </div>
          <div className="h-px" style={{ backgroundColor:t.accent, opacity:0.7 }} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className="rounded-full mb-1" style={{ height:1.5, width:'48%', backgroundColor:t.accent, opacity:0.6 }} />
            {[88,68,80,58,74,52,65,74].map((w,i) => (
              <div key={i} className="rounded-full" style={{ height:1.5, backgroundColor:t.accent, opacity:0.22, width:`${w}%` }} />
            ))}
          </div>
        </div>
      ) : t.layout === 'classic' ? (
        <div className="h-full p-2.5 flex flex-col gap-1">
          <div className="flex flex-col items-center gap-0.5 mb-1.5">
            <div className="rounded-sm mx-auto" style={{ height:3.5, width:'58%', backgroundColor:t.accent, opacity:0.88 }} />
            <div className="rounded-full mx-auto" style={{ height:1, width:'85%', backgroundColor:t.accent, opacity:0.25 }} />
          </div>
          {[82,62,76,52,72,55,65,48,73].map((w,i) => (
            <div key={i} className="rounded-full" style={{ height:1.5, backgroundColor:t.accent, opacity: i%3===0?0.5:0.2, width:`${w}%` }} />
          ))}
        </div>
      ) : (
        <div className="h-full flex">
          <div className="w-1.5 h-full" style={{ backgroundColor:t.accent, opacity:0.9 }} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className="rounded-sm mb-1" style={{ height:3, width:'68%', backgroundColor:'rgba(255,255,255,0.85)', opacity:0.9 }} />
            <div className="rounded-sm" style={{ height:1.5, width:'48%', backgroundColor:t.accent, opacity:0.8 }} />
            <div className="rounded-full mt-1.5" style={{ height:1, width:'100%', backgroundColor:'rgba(255,255,255,0.15)' }} />
            {[85,65,78,55,70,50,64,76].map((w,i) => (
              <div key={i} className="rounded-full" style={{ height:1.5, backgroundColor:'rgba(255,255,255,0.55)', opacity:0.35, width:`${w}%` }} />
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center"
        style={{ backgroundColor:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}>
        <p className="text-[8px] font-semibold" style={{ color:t.accent, opacity:0.85 }}>{t.name}</p>
      </div>
    </div>
  )
}
