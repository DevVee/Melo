import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Layout, User, FileText, Briefcase, GraduationCap, Star,
  ChevronLeft, ChevronRight, Eye, Check,
  Sparkles, Download, Settings, X, KeyRound, Loader2,
  Target, MapPin, Search, Navigation, Heart, Smile,
  AlertCircle, TrendingUp, ChevronDown, ChevronUp, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore, storeToSections } from '@/store/builder.store'
import type { WorkEntry, EducationEntry, SkillEntry, PersonalInfo } from '@/store/builder.store'
import {
  useAISuggestJobTitle,
  useScoreResume,
  useAutoGenerateInterests,
  useGenerateSummary,
  useSuggestSkills,
  useImproveBullets,
  useGenerateBulletsFromRole,
  type ResumeScoreResult,
} from '@/features/resume/hooks/useAI'
import { ResumePreviewPanel } from '@/features/resume/components/ResumePreviewPanel'
import { ScaledResumePreview } from '@/features/resume/components/ScaledResumePreview'
import { PersonalInfoForm } from '@/features/resume/components/forms/PersonalInfoForm'
import { SummaryForm } from '@/features/resume/components/forms/SummaryForm'
import { WorkExperienceForm } from '@/features/resume/components/forms/WorkExperienceForm'
import { EducationForm } from '@/features/resume/components/forms/EducationForm'
import { SkillsForm } from '@/features/resume/components/forms/SkillsForm'
import { StrengthsForm } from '@/features/resume/components/forms/StrengthsForm'
import { HobbiesForm } from '@/features/resume/components/forms/HobbiesForm'
import { exportToPDF, exportToPNG, exportToDOCX } from '@/lib/export'
import { JOB_TITLES } from '@/data/job-titles'

// ─── Static template list — no DB needed ─────────────────────────────────────

// 9 templates — each a genuinely different layout, no color-swap duplicates
const TEMPLATES = [
  { id: 'classic',      name: 'Classic',        category: 'general',   bg: '#1e293b', accent: '#f1f5f9' },
  { id: 'minimal',      name: 'Minimal',        category: 'general',   bg: '#6366f1', accent: '#f8f9fa' },
  { id: 'modern',       name: 'Modern',         category: 'creative',  bg: '#1a1a2e', accent: '#e9d5ff' },
  { id: 'executive',    name: 'Executive',      category: 'corporate', bg: '#0f172a', accent: '#c9a84c' },
  { id: 'harvard',      name: 'Harvard',        category: 'academic',  bg: '#111827', accent: '#e2e2e2' },
  { id: 'fresh-grad',   name: 'Fresh Graduate', category: 'general',   bg: '#0369a1', accent: '#e0f2fe' },
  { id: 'software-dev', name: 'Software Dev',   category: 'tech',      bg: '#065f46', accent: '#d1fae5' },
  { id: 'designer',     name: 'Designer',       category: 'creative',  bg: '#0e7490', accent: '#ecfeff' },
  { id: 'split',        name: 'Split',          category: 'general',   bg: '#1d4ed8', accent: '#dbeafe' },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'target',
    label: 'Your Goal',
    icon: Target,
    hint: "What job are you going for? This helps our AI write everything specifically for you — don't skip it! 🎯",
    tip: "Tip from recruiters: A resume tailored to a specific job title gets 3× more callbacks than a generic one.",
  },
  {
    id: 'personal',
    label: 'About You',
    icon: User,
    hint: "Let's start with the basics — your name and how employers can reach you.",
    tip: "Make sure your email looks professional. If yours is something like 'coolkid99@', consider making a new one for job hunting.",
  },
  {
    id: 'experience',
    label: 'Experience',
    icon: Briefcase,
    hint: "Tell us about your work history — full-time, part-time, freelance, even OJT counts!",
    tip: "No experience yet? That's totally fine — skip this step. Fresh grads and career changers get hired every day.",
  },
  {
    id: 'education',
    label: 'Education',
    icon: GraduationCap,
    hint: "Where did you study? Add all your schools — elementary, high school, vocational, college, everything counts.",
    tip: "Even if you didn't finish a degree, add the school and years attended. It shows commitment.",
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Star,
    hint: "What can you actually do? Think broadly — technical skills, tools, languages, anything you've used at work or school.",
    tip: "Aim for 6–10 skills. Recruiters spend less than 10 seconds scanning a resume — make those skills easy to spot.",
  },
  {
    id: 'strengths',
    label: 'Strengths',
    icon: Smile,
    hint: "Beyond what you know, what kind of person are you? These character traits go in their own section on your resume.",
    tip: "Personal strengths are especially powerful for fresh grads or career changers — they show who you are, not just what you've done.",
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    hint: "Our AI will read everything you've entered and write a sharp 2-sentence professional summary for you.",
    tip: "The summary is the first thing a recruiter reads. Keep it honest and specific — our AI knows what works.",
  },
  {
    id: 'hobbies',
    label: 'Interests',
    icon: Heart,
    hint: "Optionally add a short interests line at the bottom of your resume — it adds personality and sparks conversation in interviews.",
    tip: "Hobbies can actually help! If a hiring manager shares your interest, it builds instant rapport. Worth the 30 seconds.",
  },
  {
    id: 'design',
    label: 'Design',
    icon: Layout,
    hint: "Pick a template that fits the job you're applying for. Preview it live before you download.",
    tip: "For corporate or government jobs, try Harvard or Executive. For tech and creative roles, try Minimal or Modern.",
  },
  {
    id: 'done',
    label: 'Done!',
    icon: Check,
    hint: "Your resume is ready. Download as PDF for applications, or PNG to share on social media.",
    tip: "Always save your PDF. Attach it to your email application — don't paste resume text into the email body.",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const stepParam = parseInt(searchParams.get('step') ?? '0', 10)
  const [step, setStepRaw] = useState(isNaN(stepParam) ? 0 : Math.min(stepParam, STEPS.length - 1))
  const [showSettings, setShowSettings]     = useState(false)
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [exporting, setExporting]           = useState(false)
  const [exportType, setExportType]         = useState<'pdf' | 'docx' | 'png' | null>(null)
  const [polishing, setPolishing]           = useState(false)          // AI polish step active
  const [cachedScore, setCachedScore]       = useState<ResumeScoreResult | null>(null) // score from polish

  // Store
  const templateId       = useBuilderStore(s => s.templateId)
  const profilePhoto     = useBuilderStore(s => s.profilePhoto)
  const personal         = useBuilderStore(s => s.personal)
  const experience       = useBuilderStore(s => s.experience)
  const education        = useBuilderStore(s => s.education)
  const skills           = useBuilderStore(s => s.skills)
  const strengths        = useBuilderStore(s => s.strengths)
  const hobbies          = useBuilderStore(s => s.hobbies)
  const targetJobTitle   = useBuilderStore(s => s.targetJobTitle)
  const targetCity       = useBuilderStore(s => s.targetCity)
  const targetCountry    = useBuilderStore(s => s.targetCountry)
  const setTemplate      = useBuilderStore(s => s.setTemplate)
  const setTargetJob     = useBuilderStore(s => s.setTargetJob)
  const setTargetLoc     = useBuilderStore(s => s.setTargetLocation)
  const groqApiKey    = useBuilderStore(s => s.groqApiKey)
  const setGroqApiKey = useBuilderStore(s => s.setGroqApiKey)
  const resetResume   = useBuilderStore(s => s.reset)

  // Derived live sections for preview
  const sections = storeToSections({ personal, experience, education, skills, strengths, hobbies, profilePhoto })
  const currentTemplate = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0]

  const setStep = useCallback((n: number) => {
    setStepRaw(n)
    setSearchParams({ step: String(n) }, { replace: true })
  }, [setSearchParams])

  // ─── Step gating logic ──────────────────────────────────────────────────────
  // Returns null if OK to advance, or a friendly message if blocked.
  function getBlockMessage(s: number): string | null {
    if (s === 0 && !targetJobTitle.trim()) {
      return "Please tell us what job you're applying for — our AI needs this to tailor your resume."
    }
    if (s === 1 && (!personal.firstName.trim() || !personal.lastName.trim())) {
      return "We need at least your first and last name to build your resume."
    }
    return null
  }

  // Soft nudge — no hard block, just a gentle reminder shown above Continue
  function getNudgeMessage(s: number): string | null {
    if (s === 2 && experience.length === 0) {
      return "Heads up: you haven't added any work experience yet. That's okay for fresh grads — tap Continue to skip, or add at least one role."
    }
    if (s === 3 && education.length === 0) {
      return "You haven't added any education yet. Recruiters like to see at least your highest level — tap Continue to skip if needed."
    }
    if (s === 4 && skills.length === 0) {
      return "No skills added yet. Try adding at least 5–8 so recruiters can quickly spot what you bring."
    }
    return null
  }

  const baseName = [personal.firstName, personal.lastName].filter(Boolean).join('-') || 'resume'

  async function handleExport(type: 'pdf' | 'docx' | 'png') {
    setExporting(true)
    setExportType(type)
    try {
      if (type === 'docx') {
        await exportToDOCX({
          name:     [personal.firstName, personal.lastName].filter(Boolean).join(' '),
          title:    personal.professionalTitle || undefined,
          email:    personal.email    || undefined,
          phone:    personal.phone    || undefined,
          location: [personal.city, personal.country].filter(Boolean).join(', ') || undefined,
          summary:  personal.summary  || undefined,
          experience: experience.map(e => ({
            position: e.position,
            company:  e.company,
            dates:    [e.startDate, e.isCurrent ? 'Present' : e.endDate].filter(Boolean).join(' – '),
            bullets:  e.bullets.filter(Boolean),
          })),
          education: education.map(e => ({
            school: e.school,
            degree: [e.degree, e.program].filter(Boolean).join(', '),
            years:  [e.startDate, e.endDate ?? 'Present'].filter(Boolean).join(' – '),
          })),
          skills: skills.map(s => s.name),
        }, `${baseName}.docx`)
        return
      }
      // PDF / PNG — capture the rendered resume from the Done step preview
      const el = document.getElementById('resume-export-canvas')
      if (!el) {
        alert('Resume preview not found. Please wait for the page to load fully.')
        return
      }
      if (type === 'pdf') await exportToPDF(el, `${baseName}.pdf`)
      if (type === 'png') await exportToPNG(el, `${baseName}.png`)
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  const currentStepDef = STEPS[step]

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Subtle brand gradient top stripe */}
      <div className="h-1 w-full shrink-0" style={{ background: 'var(--melo-gradient)' }} />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm">
        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400" />
          <img src="/logo.png" alt="Melo" className="h-7 w-7 object-contain" />
          <span className="font-bold text-base brand-gradient-text">melo</span>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              title={s.label}
              className={cn('rounded-full transition-all duration-300', i === step ? 'h-2.5 w-7' : 'h-2.5 w-2.5')}
              style={{
                background: i === step ? 'var(--melo-gradient)' : i < step ? '#e9d5ff' : '#e5e7eb',
                boxShadow: i === step ? '0 0 8px rgba(168,85,247,0.5)' : 'none',
                cursor: i > step ? 'not-allowed' : i < step ? 'pointer' : 'default',
              }}
            />
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <LightHeaderBtn
            icon={<Settings className="h-3.5 w-3.5" />}
            label="Settings"
            onClick={() => setShowSettings(true)}
          />
        </div>
      </header>

      {/* ── Main body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Form panel — full width, centered */}
        <main className="flex flex-col overflow-y-auto w-full max-w-2xl mx-auto">
          <div className="flex-1 px-6 py-8 space-y-6">
            {/* Step header */}
            <div key={`header-${step}`} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  {currentStepDef && <currentStepDef.icon className="h-4 w-4" />}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] brand-gradient-text">
                  Step {step + 1} of {STEPS.length}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{currentStepDef?.label}</h1>
              <p className="text-sm mt-1 text-gray-500">{currentStepDef?.hint}</p>
            </div>

            {/* ── Tip card — shown on every step ──────────────────────────── */}
            {STEPS[step]?.tip && (
              <div
                key={`tip-${step}`}
                className="animate-fade-in flex gap-3 rounded-[3px] border border-purple-100 bg-purple-50 px-4 py-3"
              >
                <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700 leading-relaxed">{STEPS[step].tip}</p>
              </div>
            )}

            {/* ── Step 0: Job Target ───────────────────────────────────────── */}
            {step === 0 && (
              <JobTargetStep
                jobTitle={targetJobTitle}
                city={targetCity}
                country={targetCountry}
                onJobChange={setTargetJob}
                onLocationChange={setTargetLoc}
              />
            )}

            {/* ── Steps 1-7: Form steps wrapped in card ────────────────────── */}
            {step >= 1 && step <= 7 && (
              <div
                key={`step-${step}`}
                className="animate-slide-up-sm rounded-[3px] p-5 bg-white border border-gray-100 shadow-sm"
              >
                {step === 1 && <PersonalInfoForm />}
                {step === 2 && <WorkExperienceForm />}
                {step === 3 && <EducationForm />}
                {step === 4 && <SkillsForm />}
                {step === 5 && <StrengthsForm />}
                {step === 6 && <SummaryForm />}
                {step === 7 && <HobbiesForm />}
              </div>
            )}

            {/* ── AI Polish Screen — shown between step 8 and step 9 ─────── */}
            {polishing && (
              <AIPolishScreen
                onDone={() => { setPolishing(false); setStep(9) }}
                onScoreReady={setCachedScore}
              />
            )}

            {/* ── Step 8: Design / Template selection ─────────────────────── */}
            {step === 8 && !polishing && (
              <div key="step-8" className="animate-slide-up-sm space-y-4">

                {/* Template picker row — small scrollable thumbnails */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Choose a Template</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {TEMPLATES.map(t => {
                      const isSelected = t.id === templateId || (!templateId && t.id === TEMPLATES[0].id)
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTemplate(t.id, t.name)}
                          className={cn(
                            'shrink-0 rounded-[3px] border-2 overflow-hidden transition-all',
                            isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'
                          )}
                          style={isSelected ? { boxShadow: '0 0 0 3px rgba(168,85,247,0.2)' } : {}}
                          title={t.name}
                        >
                          <TemplateThumbnail template={t} />
                          <div className="px-1.5 py-1 bg-white text-center">
                            <p className="text-[9px] font-semibold text-gray-700 truncate w-14">{t.name}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-[3px] bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <p className="text-sm font-semibold text-gray-800">
                      Resume Preview
                    </p>
                    <span className="ml-auto brand-gradient-text text-sm font-bold">{currentTemplate.name}</span>
                  </div>
                  <div id="resume-preview-target" className="bg-gray-50 p-2 sm:p-3">
                    <div className="shadow-lg rounded-sm overflow-hidden">
                      <ScaledResumePreview
                        sections={sections}
                        templateName={currentTemplate.name}
                        primaryColor={currentTemplate.bg}
                        secondaryColor={currentTemplate.accent}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── Step 9: Done ─────────────────────────────────────────────── */}
            {step === 9 && (
              <DoneStep
                sections={sections}
                templateName={currentTemplate.name}
                primaryColor={currentTemplate.bg}
                secondaryColor={currentTemplate.accent}
                exporting={exporting}
                exportType={exportType}
                onExport={handleExport}
                onReset={() => { resetResume(); setStep(0); setCachedScore(null) }}
                initialScore={cachedScore}
              />
            )}
          </div>

          {/* Navigation */}
          {step < STEPS.length - 1 && !polishing && (
            <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              {/* Nudge message (soft warning, non-blocking) */}
              {getNudgeMessage(step) && (
                <div className="flex items-start gap-2 px-6 pt-3 pb-1">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">{getNudgeMessage(step)}</p>
                </div>
              )}
              {/* Block message (hard stop) */}
              {getBlockMessage(step) && (
                <div className="flex items-start gap-2 px-6 pt-3 pb-1">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">{getBlockMessage(step)}</p>
                </div>
              )}
              <div className="flex items-center justify-between px-6 py-4">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 rounded-[3px] px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                ) : <div />}
                <button
                  onClick={() => {
                    if (getBlockMessage(step)) return
                    // On design step → launch AI polish instead of jumping to Done
                    if (step === STEPS.length - 2) {
                      setPolishing(true)
                    } else {
                      setStep(step + 1)
                    }
                  }}
                  disabled={!!getBlockMessage(step)}
                  className="flex items-center gap-2 rounded-[3px] px-7 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--melo-gradient)',
                    boxShadow: getBlockMessage(step) ? 'none' : '0 4px 20px rgba(168,85,247,0.35)',
                  }}
                >
                  {step === STEPS.length - 2 ? 'Finish & Preview' : 'Continue'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* ── Settings drawer ─────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 backdrop-blur-sm bg-black/30" onClick={() => setShowSettings(false)} />

          <div className="w-full max-w-sm flex flex-col bg-white border-l border-gray-200 shadow-2xl animate-slide-up-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--melo-gradient)' }}>
                  <Settings className="h-3.5 w-3.5" />
                </div>
                <h2 className="font-semibold text-gray-900">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)}
                className="rounded-[3px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* AI status — always on via server proxy */}
              <div className="rounded-[3px] p-3.5 bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> AI features are active for all users
                </p>
                <p className="text-xs mt-1 text-gray-500">
                  Powered by Groq · llama-3.3-70b-versatile — no setup needed
                </p>
              </div>

              {/* Advanced: own key (higher rate limits) */}
              <details className="group">
                <summary className="cursor-pointer text-xs font-semibold text-gray-500 flex items-center gap-1.5 list-none select-none hover:text-gray-700 transition-colors">
                  <KeyRound className="h-3.5 w-3.5" />
                  Advanced — use your own Groq key
                  <span className="ml-auto text-[10px] text-gray-400 group-open:hidden">▼</span>
                  <span className="ml-auto text-[10px] text-gray-400 hidden group-open:inline">▲</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <input
                    type="password"
                    value={groqApiKey}
                    onChange={e => setGroqApiKey(e.target.value)}
                    placeholder="gsk_…"
                    className="w-full rounded-[3px] px-3 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {groqApiKey && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Using your own key
                    </p>
                  )}
                  <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                    className="text-xs text-purple-600 underline">
                    Get a free key at console.groq.com →
                  </a>
                </div>
              </details>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Danger zone */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-red-500">Danger Zone</h3>
                <p className="text-xs text-gray-400">
                  Clears all resume data from your browser. Cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Clear all resume data? This cannot be undone.')) {
                      resetResume()
                      setShowSettings(false)
                      setStep(0)
                    }
                  }}
                  className="rounded-[3px] px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Clear Resume Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Template side panel ─────────────────────────────────────────────── */}
      {showTemplatePanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 backdrop-blur-sm bg-black/30" onClick={() => setShowTemplatePanel(false)} />
          <div className="w-full max-w-sm flex flex-col bg-white border-l border-gray-200 shadow-2xl animate-slide-up-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--melo-gradient)' }}>
                  <Layout className="h-3.5 w-3.5" />
                </div>
                <h2 className="font-semibold text-gray-900">Choose Template</h2>
              </div>
              <button onClick={() => setShowTemplatePanel(false)}
                className="rounded-[3px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-gray-400 mb-3">Click a template to preview it on the left.</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => {
                  const isSelected = t.id === templateId || (!templateId && t.id === TEMPLATES[0].id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTemplate(t.id, t.name); setShowTemplatePanel(false) }}
                      className={cn(
                        'group relative rounded-[3px] border-2 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                        isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'
                      )}
                      style={isSelected ? { boxShadow: '0 0 16px rgba(168,85,247,0.3)' } : {}}
                    >
                      <TemplateThumbnail template={t} />
                      <div className="px-2.5 py-2 bg-gray-50">
                        <p className="text-xs font-semibold truncate text-gray-800">{t.name}</p>
                        <p className="text-[10px] capitalize text-gray-400">{t.category}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center text-white"
                          style={{ background: 'var(--melo-gradient)', boxShadow: '0 0 8px rgba(168,85,247,0.5)' }}>
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Header button helper (light mode) ───────────────────────────────────────

function LightHeaderBtn({
  icon, label, onClick, warn, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  warn?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
        warn
          ? 'text-amber-600 bg-amber-50 border border-amber-200'
          : active
            ? 'text-purple-600 bg-purple-50 border border-purple-200'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ─── AI Polish Screen ─────────────────────────────────────────────────────────

const POLISH_TASKS = [
  { id: 'read',     label: 'Reading your resume data...' },
  { id: 'summary',  label: 'Polishing your career summary...' },
  { id: 'bullets',  label: 'Enhancing experience bullets...' },
  { id: 'fill',     label: 'Filling in missing sections...' },
  { id: 'score',    label: 'Scoring your resume...' },
]

function AIPolishScreen({ onDone, onScoreReady }: { onDone: () => void; onScoreReady: (s: ResumeScoreResult) => void }) {
  // ── Store reads ──
  const personal   = useBuilderStore(s => s.personal)
  const experience = useBuilderStore(s => s.experience)
  const education  = useBuilderStore(s => s.education)
  const skills     = useBuilderStore(s => s.skills)
  const strengths  = useBuilderStore(s => s.strengths)
  const hobbies    = useBuilderStore(s => s.hobbies)
  const targetJob  = useBuilderStore(s => s.targetJobTitle)

  // ── Store writes ──
  const updatePersonal = useBuilderStore(s => s.updatePersonal)
  const setBullets     = useBuilderStore(s => s.setBullets)
  const setHobbies     = useBuilderStore(s => s.setHobbies)
  const addSkill       = useBuilderStore(s => s.addSkill)
  const addStrength    = useBuilderStore(s => s.addStrength)

  // ── AI hooks (top-level, used via mutateAsync) ──
  const { mutateAsync: genSummary }     = useGenerateSummary()
  const { mutateAsync: genInterests }   = useAutoGenerateInterests()
  const { mutateAsync: genSkills }      = useSuggestSkills()
  const { mutateAsync: improveBullets } = useImproveBullets()
  const { mutateAsync: genBullets }     = useGenerateBulletsFromRole()
  const { mutateAsync: scoreResume }    = useScoreResume()

  // ── UI state ──
  const [activeIdx, setActiveIdx]   = useState(-1)
  const [doneSet,   setDoneSet]     = useState<Set<number>>(new Set())
  const [allDone,   setAllDone]     = useState(false)
  const [changes,   setChanges]     = useState<string[]>([])
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void runPolish()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function done(i: number) {
    setDoneSet(prev => new Set([...prev, i]))
  }
  function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

  async function runPolish() {
    const log: string[] = []

    // ─ 0: Read ──────────────────────────────────────────────────────────────
    setActiveIdx(0)
    await sleep(600)
    done(0)

    // ─ 1: Summary ───────────────────────────────────────────────────────────
    setActiveIdx(1)
    try {
      const had = !!personal.summary?.trim()
      const result = await genSummary({ personal, experience, education })
      if (result?.trim()) {
        updatePersonal({ summary: result.trim() })
        log.push(had ? '✦ Career summary improved' : '✦ Career summary written')
      }
    } catch { /* no key or quota — skip silently */ }
    done(1)

    // ─ 2: Bullets ───────────────────────────────────────────────────────────
    setActiveIdx(2)
    let bulletsEnhanced = 0
    for (const exp of experience.slice(0, 4)) {      // cap at 4 jobs to avoid timeout
      try {
        const filled = exp.bullets.filter(Boolean)
        if (filled.length > 0) {
          const improved = await improveBullets({ bullets: filled, context: `${exp.position} at ${exp.company}` })
          if (Array.isArray(improved) && improved.length > 0) {
            setBullets(exp.id, improved)
            bulletsEnhanced++
          }
        } else if (exp.position) {
          const generated = await genBullets({ position: exp.position, company: exp.company, employmentType: exp.employmentType })
          if (Array.isArray(generated) && generated.length > 0) {
            setBullets(exp.id, generated)
            bulletsEnhanced++
          }
        }
      } catch { /* skip this entry */ }
    }
    if (bulletsEnhanced > 0) {
      log.push(`✦ ${bulletsEnhanced} role${bulletsEnhanced !== 1 ? 's' : ''} — bullets enhanced`)
    }
    done(2)

    // ─ 3: Fill gaps ──────────────────────────────────────────────────────────
    setActiveIdx(3)
    const expDesc = experience.map(e => e.position).filter(Boolean).join(', ')
    if (!hobbies?.trim()) {
      try {
        const res = await genInterests({ jobTitle: targetJob || personal.professionalTitle || '', experience: expDesc })
        if (res?.trim()) { setHobbies(res.trim()); log.push('✦ Interests section filled') }
      } catch {}
    }
    // Capture current snapshot from store (strengths/skills may have changed)
    const currentStrengths = useBuilderStore.getState().strengths
    if (currentStrengths.length < 3) {
      const preset = ['Adaptability', 'Problem Solving', 'Work Ethic', 'Communication', 'Reliability']
      const toAdd = preset.filter(s => !currentStrengths.includes(s)).slice(0, Math.max(0, 3 - currentStrengths.length))
      toAdd.forEach(s => addStrength(s))
      if (toAdd.length > 0) log.push(`✦ Personal strengths added`)
    }
    const currentSkills = useBuilderStore.getState().skills
    if (currentSkills.length < 5) {
      try {
        const suggested = await genSkills({ personal, experience })
        const existing = new Set(currentSkills.map(s => s.name.toLowerCase()))
        const toAdd = suggested.filter(s => !existing.has(s.name.toLowerCase())).slice(0, 8)
        toAdd.forEach(s => addSkill(s))
        if (toAdd.length > 0) log.push(`✦ ${toAdd.length} skills suggested & added`)
      } catch {}
    }
    done(3)

    // ─ 4: Score ─────────────────────────────────────────────────────────────
    setActiveIdx(4)
    try {
      // Build text from the updated store (after all improvements)
      const s = useBuilderStore.getState()
      const resumeText = buildResumeTextForScore(
        s.personal, s.experience, s.education, s.skills, s.strengths, s.hobbies, s.targetJobTitle,
      )
      const result = await scoreResume({ resumeText })
      onScoreReady(result)
    } catch { /* no key — skip, DoneStep will handle missing score */ }
    done(4)

    setChanges(log.length > 0 ? log : ['✦ Resume looks complete!'])
    setAllDone(true)
  }

  const progress = Math.round(((doneSet.size) / POLISH_TASKS.length) * 100)

  return (
    <div className="animate-slide-up-sm space-y-5 py-2">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {allDone
            ? <span className="text-xl">🎉</span>
            : <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />}
          <h2 className="text-base font-bold text-gray-900">
            {allDone ? 'Your Resume is Polished!' : 'Polishing Your Resume…'}
          </h2>
        </div>
        <p className="text-xs text-gray-500 ml-7">
          {allDone
            ? 'AI has improved your content. Here\'s what was done:'
            : 'AI is reading your data and making it job-ready. This takes about 20–40 seconds.'}
        </p>
      </div>

      {/* Progress bar */}
      {!allDone && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'var(--melo-gradient)' }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2.5">
        {POLISH_TASKS.map((task, i) => {
          const isDone   = doneSet.has(i)
          const isActive = activeIdx === i && !isDone
          const isPending = activeIdx < i

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[3px] transition-all',
                isDone   ? 'bg-emerald-50 border border-emerald-100'  : '',
                isActive ? 'bg-purple-50 border border-purple-100'    : '',
                isPending ? 'bg-gray-50 border border-gray-100 opacity-40' : '',
              )}
            >
              {isDone && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
              {isActive && <Loader2 className="h-4 w-4 text-purple-500 animate-spin shrink-0" />}
              {isPending && <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />}
              <p className={cn(
                'text-sm',
                isDone ? 'text-emerald-700 font-medium' : isActive ? 'text-purple-700 font-semibold' : 'text-gray-400',
              )}>
                {task.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Changes summary */}
      {allDone && changes.length > 0 && (
        <div className="rounded-[3px] border border-purple-200 bg-purple-50 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2">What was improved</p>
          {changes.map((c, i) => (
            <p key={i} className="text-sm text-purple-800">{c}</p>
          ))}
        </div>
      )}

      {/* Got it button */}
      {allDone && (
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 rounded-[3px] py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--melo-gradient)', boxShadow: '0 6px 24px rgba(168,85,247,0.35)' }}
        >
          <Check className="h-4 w-4" />
          Got it — See My Score
        </button>
      )}
    </div>
  )
}

// ─── Resume text builder (for AI scoring) ────────────────────────────────────

function buildResumeTextForScore(
  personal: PersonalInfo,
  experience: WorkEntry[],
  education: EducationEntry[],
  skills: SkillEntry[],
  strengths: string[],
  hobbies: string,
  targetJob: string,
): string {
  const lines: string[] = []
  const name = [personal.firstName, personal.lastName].filter(Boolean).join(' ')
  lines.push(`NAME: ${name || 'N/A'}`)
  lines.push(`TARGET ROLE: ${targetJob || personal.professionalTitle || 'N/A'}`)
  lines.push(`CONTACT: ${[personal.email, personal.phone, personal.city, personal.country].filter(Boolean).join(' | ')}`)
  if (personal.summary) lines.push(`\nSUMMARY:\n${personal.summary}`)
  if (experience.length > 0) {
    lines.push('\nWORK EXPERIENCE:')
    experience.forEach(e => {
      lines.push(`  ${e.position} at ${e.company} (${e.startDate}–${e.isCurrent ? 'Present' : e.endDate})`)
      e.bullets.filter(Boolean).forEach(b => lines.push(`    • ${b}`))
    })
  }
  if (education.length > 0) {
    lines.push('\nEDUCATION:')
    education.forEach(edu => lines.push(`  ${edu.degree}${edu.program ? ` in ${edu.program}` : ''} — ${edu.school} (${edu.endDate || 'ongoing'})`))
  }
  if (skills.length > 0) {
    lines.push(`\nSKILLS (${skills.length}): ${skills.map(s => s.name).join(', ')}`)
  }
  if (strengths.length > 0) {
    lines.push(`\nSTRENGTHS: ${strengths.join(', ')}`)
  }
  if (hobbies) {
    lines.push(`\nINTERESTS: ${hobbies}`)
  }
  return lines.join('\n')
}

// ─── Score ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r    = 38
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - Math.max(0, Math.min(100, score)) / 100)
  return (
    <svg width={96} height={96} viewBox="0 0 96 96" style={{ display: 'block' }}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="48" y="43" textAnchor="middle" fontSize="19" fontWeight="800" fill="#030712">{score}</text>
      <text x="48" y="57" textAnchor="middle" fontSize="9"  fontWeight="500" fill="#6b7280">/ 100</text>
    </svg>
  )
}

function scoreColor(score: number) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#22c55e'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

// ─── Done Step ────────────────────────────────────────────────────────────────

function DoneStep({
  sections,
  templateName,
  primaryColor,
  secondaryColor,
  exporting,
  exportType,
  onExport,
  onReset,
  initialScore,
}: {
  sections: ReturnType<typeof storeToSections>
  templateName: string
  primaryColor?: string
  secondaryColor?: string
  exporting: boolean
  exportType: 'pdf' | 'docx' | 'png' | null
  onExport: (type: 'pdf' | 'docx' | 'png') => void
  onReset: () => void
  initialScore: ResumeScoreResult | null
}) {
  // ── Store state ──
  const personal   = useBuilderStore(s => s.personal)
  const experience = useBuilderStore(s => s.experience)
  const education  = useBuilderStore(s => s.education)
  const skills     = useBuilderStore(s => s.skills)
  const strengths  = useBuilderStore(s => s.strengths)
  const hobbies    = useBuilderStore(s => s.hobbies)
  const targetJob  = useBuilderStore(s => s.targetJobTitle)

  // ── Store actions ──
  const updatePersonal = useBuilderStore(s => s.updatePersonal)
  const addSkill       = useBuilderStore(s => s.addSkill)
  const addStrength    = useBuilderStore(s => s.addStrength)
  const setHobbies     = useBuilderStore(s => s.setHobbies)

  // ── AI hooks (for fill-sections panel only) ──
  const { mutate: genSummary,   isPending: genSummaryPending }   = useGenerateSummary()
  const { mutate: genInterests, isPending: genInterestsPending } = useAutoGenerateInterests()
  const { mutate: genSkills,    isPending: genSkillsPending }    = useSuggestSkills()

  // ── UI state ──
  const [showBreakdown,   setShowBreakdown]   = useState(false)
  const [filledSections,  setFilledSections]  = useState<string[]>([])

  // Score comes pre-computed from the polish screen — no extra AI call needed
  const scoreResult = initialScore

  // ── Gap detection ──
  const hasSummary   = !!personal.summary?.trim()
  const hasInterests = !!hobbies?.trim()
  const hasSkills    = skills.length >= 5
  const hasStrengths = strengths.length >= 3

  const gaps = [
    !hasSummary   && 'summary',
    !hasInterests && 'interests',
    !hasSkills    && 'skills',
    !hasStrengths && 'strengths',
  ].filter(Boolean) as string[]

  const visibleGaps = gaps.filter(g => !filledSections.includes(g))

  // ── Fill handlers ──
  function fillSummary() {
    genSummary({ personal, experience, education }, {
      onSuccess: (text) => {
        updatePersonal({ summary: text })
        setFilledSections(prev => [...prev, 'summary'])
      },
    })
  }

  function fillInterests() {
    const expStr = experience.map(e => e.position).join(', ')
    genInterests({ jobTitle: targetJob || personal.professionalTitle || '', experience: expStr }, {
      onSuccess: (text) => {
        setHobbies(text)
        setFilledSections(prev => [...prev, 'interests'])
      },
    })
  }

  function fillSkills() {
    genSkills({ personal, experience }, {
      onSuccess: (suggested) => {
        const names = new Set(skills.map(s => s.name.toLowerCase()))
        suggested.filter(s => !names.has(s.name.toLowerCase())).slice(0, 6).forEach(s => addSkill(s))
        setFilledSections(prev => [...prev, 'skills'])
      },
    })
  }

  function fillStrengths() {
    const preset = ['Leadership', 'Problem Solving', 'Adaptability', 'Work Ethic', 'Communication']
    preset.forEach(str => { if (!strengths.includes(str)) addStrength(str) })
    setFilledSections(prev => [...prev, 'strengths'])
  }

  const sc    = scoreResult?.score ?? 0
  const level = scoreResult?.level ?? ''
  const color = scoreColor(sc)

  return (
    <div className="space-y-5">

      {/* ── AI Resume Score card ──────────────────────────────────────────── */}
      <div className="rounded-[3px] border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
          <TrendingUp className="h-4 w-4 text-purple-500" />
          <p className="text-sm font-bold text-gray-800">AI Resume Score</p>
        </div>

        <div className="p-4">
          {scoreResult ? (
            <div className="space-y-4">
              {/* Score + level + feedback */}
              <div className="flex items-start gap-4">
                <ScoreRing score={sc} color={color} />
                <div className="flex-1">
                  <p className="text-base font-bold" style={{ color }}>
                    {level}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    {scoreResult.feedback}
                  </p>
                </div>
              </div>

              {/* Breakdown toggle */}
              <button
                onClick={() => setShowBreakdown(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
              </button>

              {showBreakdown && (
                <div className="space-y-2">
                  {scoreResult.breakdown.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[11px] text-gray-700 font-medium">{item.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: scoreColor(Math.round(item.score / item.max * 100)) }}>
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round(item.score / item.max * 100)}%`,
                            background: scoreColor(Math.round(item.score / item.max * 100)),
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {scoreResult.suggestions.length > 0 && (
                <div className="rounded-[3px] bg-purple-50 border border-purple-100 p-3">
                  <p className="text-[11px] font-bold text-purple-700 mb-1.5">💡 How to improve</p>
                  <ul className="space-y-1">
                    {scoreResult.suggestions.map((tip, i) => (
                      <li key={i} className="text-[11px] text-purple-800 flex gap-1.5">
                        <span className="text-purple-400 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">Score not available</p>
          )}
        </div>
      </div>

      {/* ── Fill empty sections ────────────────────────────────────────────── */}
      {visibleGaps.length > 0 && (
        <div className="rounded-[3px] border border-amber-200 bg-amber-50">
          <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-bold text-amber-800">Make Your Resume Fuller</p>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-xs text-amber-700 mb-3">
              These sections are empty — fill them with AI and boost your score.
            </p>
            {visibleGaps.includes('summary') && (
              <div className="flex items-center justify-between gap-3 py-2 border-b border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Career Summary</p>
                  <p className="text-xs text-gray-500">Missing — recruiters read this first</p>
                </div>
                <button
                  onClick={fillSummary}
                  disabled={genSummaryPending}
                  className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  {genSummaryPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {genSummaryPending ? 'Writing…' : 'Generate'}
                </button>
              </div>
            )}
            {visibleGaps.includes('interests') && (
              <div className="flex items-center justify-between gap-3 py-2 border-b border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Interests</p>
                  <p className="text-xs text-gray-500">Adds personality to your resume</p>
                </div>
                <button
                  onClick={fillInterests}
                  disabled={genInterestsPending}
                  className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  {genInterestsPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {genInterestsPending ? 'Writing…' : 'Generate'}
                </button>
              </div>
            )}
            {visibleGaps.includes('skills') && (
              <div className="flex items-center justify-between gap-3 py-2 border-b border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Skills <span className="text-xs font-normal text-gray-500">(have {skills.length}, aim for 5+)</span></p>
                  <p className="text-xs text-gray-500">More skills = better ATS match</p>
                </div>
                <button
                  onClick={fillSkills}
                  disabled={genSkillsPending}
                  className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  {genSkillsPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {genSkillsPending ? 'Adding…' : 'Suggest'}
                </button>
              </div>
            )}
            {visibleGaps.includes('strengths') && (
              <div className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Personal Strengths <span className="text-xs font-normal text-gray-500">(have {strengths.length}, aim for 3+)</span></p>
                  <p className="text-xs text-gray-500">Shows character beyond skills</p>
                </div>
                <button
                  onClick={fillStrengths}
                  className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: 'var(--melo-gradient)' }}
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Success banner ─────────────────────────────────────────────────── */}
      <div className="rounded-[3px] p-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200">
        <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-100">
          <Check className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">Your resume is ready to download!</p>
          <p className="text-xs mt-0.5 text-gray-500">
            Saved in your browser · Come back any time and your data will still be here
          </p>
        </div>
      </div>

      {/* ── Full resume preview ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5 text-gray-400">
          <Eye className="h-3.5 w-3.5" /> Your Resume ·{' '}
          <span className="brand-gradient-text">{templateName}</span>
        </p>
        <div className="rounded-[3px] overflow-hidden shadow-2xl border border-gray-100">
          <ScaledResumePreview
            sections={sections}
            templateName={templateName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </div>
        {/* Hidden export canvas */}
        <div
          id="resume-export-canvas"
          style={{
            position: 'fixed', top: 0, left: '-9999px',
            width: '794px', height: '1123px', minHeight: '1123px',
            display: 'flex', flexDirection: 'column',
            background: '#ffffff', pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <ResumePreviewPanel
            sections={sections}
            templateName={templateName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </div>
      </div>

      {/* ── Export options ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
          Download as
        </p>
        <button
          onClick={() => onExport('pdf')}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 rounded-[3px] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--melo-gradient)', boxShadow: '0 6px 24px rgba(168,85,247,0.35)' }}
        >
          {exporting && exportType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting && exportType === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
        </button>
        <button
          onClick={() => onExport('png')}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 rounded-[3px] py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          {exporting && exportType === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting && exportType === 'png' ? 'Generating Image…' : 'Download Image (.png)'}
        </button>
        <p className="text-[11px] text-center pt-1 text-gray-400">
          PDF for job applications · PNG for portfolio &amp; social media
        </p>
      </div>

      {/* ── Start over ──────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 rounded-[3px] py-3 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          Start a New Resume
        </button>
      </div>
    </div>
  )
}

// ─── Job Target Step ──────────────────────────────────────────────────────────

async function reverseGeocodeJob(lat: number, lng: number): Promise<{ city: string; country: string }> {
  const res  = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  )
  const data = await res.json() as { city?: string; locality?: string; principalSubdivision?: string; countryName?: string }
  const strip = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, '').trim()
  // Strip ISO "(the)" suffix: "Philippines (the)" → "Philippines"
  const country  = strip((data.countryName || '').replace(/\s*\(the\b[^)]*\)\s*$/i, ''))
  // Format: "Locality, Province" → e.g. "Balayan, Batangas"
  const locality = strip(data.locality || data.city || '')
  const province = strip(data.principalSubdivision || '')
  const city     = [locality, province].filter(Boolean).join(', ')
  return { city, country }
}

function JobTargetStep({
  jobTitle, city, country, onJobChange, onLocationChange,
}: {
  jobTitle: string
  city: string
  country: string
  onJobChange: (title: string) => void
  onLocationChange: (city: string, country: string) => void
}) {
  const [jobQuery, setJobQuery]           = useState(jobTitle)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [locating, setLocating]           = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const experience = useBuilderStore(s => s.experience)
  const education  = useBuilderStore(s => s.education)

  const { mutate: suggestTitles, isPending: suggesting } = useAISuggestJobTitle()

  const dropdownSuggestions = jobQuery.length >= 1
    ? JOB_TITLES.filter(t => t.toLowerCase().includes(jobQuery.toLowerCase())).slice(0, 8)
    : JOB_TITLES.slice(0, 8)

  function selectJob(title: string) {
    setJobQuery(title)
    onJobChange(title)
    setShowSuggestions(false)
    setAiSuggestions([])
  }

  function handleAISuggest() {
    setAiSuggestions([])
    suggestTitles({ experience, education }, {
      onSuccess: (titles) => setAiSuggestions(titles),
    })
  }

  async function detectLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { city: detectedCity, country: detectedCountry } = await reverseGeocodeJob(
        pos.coords.latitude, pos.coords.longitude
      )
      onLocationChange(detectedCity || city, detectedCountry || country)
    } catch {
      /* user denied or error — fail silently */
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Location ── */}
      <div className="bg-white border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-purple-500" />
            Where are you based?
          </label>
          <button
            onClick={detectLocation}
            disabled={locating}
            className="flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {locating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Navigation className="h-3 w-3" />}
            {locating ? 'Detecting…' : 'Use my location'}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={city}
            placeholder="City / Province (e.g. Balayan, Batangas)"
            onChange={e => onLocationChange(e.target.value, country)}
            className="w-full rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <input
            type="text"
            value={country}
            placeholder="Country (e.g. Philippines)"
            onChange={e => onLocationChange(city, e.target.value)}
            className="w-full rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* ── Job title ── */}
      <div className="bg-white border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-purple-500" />
            What job are you applying for? *
          </label>
          <button
            onClick={handleAISuggest}
            disabled={suggesting}
            className="flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: suggesting ? '#a855f7' : 'var(--melo-gradient)' }}
          >
            {suggesting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Sparkles className="h-3 w-3" />}
            {suggesting ? 'Loading…' : 'Suggest for me'}
          </button>
        </div>

        {/* Suggestions chips */}
        {aiSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map(title => (
              <button
                key={title}
                onClick={() => selectJob(title)}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-sm font-medium border transition-all',
                  title === jobTitle
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                )}
              >
                {title}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={jobQuery}
            placeholder="Search or type any job title…"
            onChange={e => { setJobQuery(e.target.value); onJobChange(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full rounded-[3px] pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          {showSuggestions && dropdownSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-200 shadow-lg">
              {dropdownSuggestions.map(title => (
                <button
                  key={title}
                  onMouseDown={() => selectJob(title)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors',
                    title === jobTitle ? 'text-purple-600 font-semibold bg-purple-50' : 'text-gray-700'
                  )}
                >
                  {title}
                </button>
              ))}
              {jobQuery && !JOB_TITLES.includes(jobQuery) && (
                <button
                  onMouseDown={() => selectJob(jobQuery)}
                  className="w-full px-4 py-2.5 text-left text-sm text-purple-600 hover:bg-purple-50 border-t border-gray-100 transition-colors"
                >
                  Use "<strong>{jobQuery}</strong>"
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">You can type any job — e.g. Nurse, Teacher, Barista, Seafarer, BPO Agent</p>
      </div>

      {/* What Melo will customize */}
      {jobTitle && (
        <div className="p-4 space-y-2 bg-white border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">What Melo will customize for you</p>
          <ul className="space-y-1.5">
            {[
              `Summary — written for ${jobTitle}`,
              `Skills — ranked for ${jobTitle} applications`,
              `Bullet points — matched to ${jobTitle} expectations`,
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Template Thumbnail — realistic mini resume preview ─────────────────────

type TemplateType = typeof TEMPLATES[number]

function TemplateThumbnail({ template: t }: { template: TemplateType }) {
  const isModern       = ['modern', 'elegant', 'multimedia'].includes(t.id)
  const isExecutive    = ['executive', 'business', 'finance'].includes(t.id)
  const isAcademic     = ['harvard', 'stanford', 'oxford', 'mit', 'academic'].includes(t.id)
  const isFreshGrad    = ['fresh-grad', 'internship'].includes(t.id)
  const isTech         = ['software-dev', 'data-analyst', 'engineer'].includes(t.id)
  const isClassic      = ['classic', 'professional'].includes(t.id)
  const isSidebarRight = ['designer', 'sidebar-right'].includes(t.id)
  const isSplit        = ['marketing', 'split'].includes(t.id)

  // Row = a simulated line of text
  const Row = ({ w, opacity = 0.3, h = 1.5 }: { w: number; opacity?: number; h?: number }) => (
    <div className="rounded-full" style={{ height: h, backgroundColor: t.accent, opacity, width: `${w}%` }} />
  )
  const Gap = ({ h = 4 }: { h?: number }) => <div style={{ height: h }} />

  return (
    <div className="h-36 w-full overflow-hidden relative" style={{ backgroundColor: t.bg }}>
      {isModern ? (
        // Two-column: dark sidebar + white content area
        <div className="flex h-full">
          <div className="w-14 h-full p-2 flex flex-col gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div className="h-6 w-6 rounded-full mx-auto mb-1.5" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
            <Row w={85} opacity={0.5} />
            <Row w={65} opacity={0.35} />
            <Gap />
            <Row w={70} opacity={0.4} h={1} />
            {[75, 55, 80, 60, 70, 50].map((w, i) => <Row key={i} w={w} opacity={0.25} h={1} />)}
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1">
            <Row w={75} opacity={0.85} h={3} />
            <Row w={50} opacity={0.45} h={1.5} />
            <Gap h={3} />
            <Row w={100} opacity={0.2} h={1} />
            <Gap h={2} />
            {[90, 70, 82, 60, 76, 55, 68, 78].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
          </div>
        </div>
      ) : isExecutive ? (
        // Bold dark header + thin accent bar + clean content
        <div className="h-full flex flex-col">
          <div className="p-2.5 pb-2" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Row w={65} opacity={0.9} h={3.5} />
            <div style={{ height: 3 }} />
            <Row w={42} opacity={0.55} h={1.5} />
            <div style={{ height: 4 }} />
            <Row w={88} opacity={0.3} h={1} />
          </div>
          <div className="h-px" style={{ backgroundColor: t.accent, opacity: 0.8 }} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <Row w={45} opacity={0.6} h={1.5} />
            <Gap h={2} />
            {[88, 68, 80, 58, 74, 50, 65, 72].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
          </div>
        </div>
      ) : isAcademic ? (
        // Centered classic header + ruled sections
        <div className="h-full p-2.5 flex flex-col gap-1">
          <div className="flex flex-col items-center gap-1 mb-1.5">
            <Row w={58} opacity={0.88} h={3.5} />
            <Row w={75} opacity={0.35} h={1} />
          </div>
          <Row w={100} opacity={0.35} h={1} />
          <Gap h={2} />
          <Row w={40} opacity={0.55} h={1.5} />
          {[85, 65, 78, 55, 70, 48, 63].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
        </div>
      ) : isFreshGrad ? (
        // Top accent bar + two panels: left (edu) + right (exp/projects)
        <div className="h-full flex flex-col">
          {/* Top bar */}
          <div style={{ height: 4, backgroundColor: t.accent, opacity: 0.9 }} />
          {/* Header */}
          <div className="px-2 pt-1.5 pb-1">
            <Row w={60} opacity={0.85} h={2.5} />
            <div style={{ height: 2 }} />
            <Row w={40} opacity={0.45} h={1.5} />
          </div>
          {/* Two-panel body */}
          <div className="flex flex-1">
            {/* Left: education blocks */}
            <div className="w-14 px-1.5 flex flex-col gap-1" style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }}>
              <Row w={80} opacity={0.5} h={1} />
              <Gap h={1} />
              <Row w={90} opacity={0.7} h={1.5} />
              <Row w={75} opacity={0.4} h={1} />
              <Row w={55} opacity={0.3} h={1} />
              <Gap h={2} />
              <Row w={60} opacity={0.5} h={1} />
              <Gap h={1} />
              {[70, 55, 65, 50].map((w, i) => <Row key={i} w={w} opacity={0.25} h={1} />)}
            </div>
            {/* Right: experience lines */}
            <div className="flex-1 px-1.5 flex flex-col gap-1">
              <Row w={70} opacity={0.5} h={1} />
              <Gap h={1} />
              <Row w={80} opacity={0.6} h={1.5} />
              <Row w={55} opacity={0.35} h={1} />
              {[88, 70, 82, 65, 76, 58].map((w, i) => <Row key={i} w={w} opacity={0.2} h={1} />)}
            </div>
          </div>
        </div>
      ) : isTech ? (
        // Thin left accent bar + skills row at top + content rows
        <div className="flex h-full">
          {/* Thin left bar */}
          <div style={{ width: 3, backgroundColor: t.accent, opacity: 0.9 }} />
          <div className="flex-1 px-2 py-2 flex flex-col gap-1">
            {/* Name */}
            <Row w={65} opacity={0.85} h={2.5} />
            <Row w={42} opacity={0.45} h={1.5} />
            <Gap h={3} />
            {/* Skills row (chip-like) */}
            <Row w={30} opacity={0.5} h={1} />
            <Gap h={1} />
            <div className="flex gap-1">
              {[22, 18, 25, 20, 16].map((w, i) => (
                <div key={i} style={{ height: 8, width: `${w}%`, borderRadius: 3, backgroundColor: t.accent, opacity: 0.3 }} />
              ))}
            </div>
            <Gap h={3} />
            {/* Section header */}
            <Row w={35} opacity={0.5} h={1} />
            <Gap h={1} />
            {/* Content rows */}
            {[88, 70, 80, 62, 74, 55, 68].map((w, i) => <Row key={i} w={w} opacity={0.2} h={1.5} />)}
          </div>
        </div>
      ) : isClassic ? (
        // Classic: optional photo circle + name + ruled sections
        <div className="h-full p-2.5 flex flex-col gap-1">
          {/* Header: circle photo + name */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
            <div className="flex flex-col gap-0.5 flex-1">
              <Row w={70} opacity={0.9} h={2.5} />
              <Row w={48} opacity={0.5} h={1.5} />
            </div>
          </div>
          {/* Ruled section */}
          <div style={{ height: 1, backgroundColor: t.accent, opacity: 0.6 }} />
          <Gap h={1} />
          <Row w={38} opacity={0.6} h={1.5} />
          {[88, 68, 78, 60].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
          <Gap h={2} />
          <div style={{ height: 1, backgroundColor: t.accent, opacity: 0.4 }} />
          {/* Skills as "Cat: item item" lines */}
          <Gap h={1} />
          <Row w={30} opacity={0.6} h={1.5} />
          {[95, 80, 70].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
        </div>
      ) : isSidebarRight ? (
        // Sidebar-Right: full header + left main + right sidebar
        <div className="h-full flex flex-col">
          {/* Full-width header */}
          <div className="p-2" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Row w={60} opacity={0.9} h={2.5} />
            <div style={{ height: 2 }} />
            <Row w={42} opacity={0.5} h={1.5} />
          </div>
          <div style={{ height: 3, backgroundColor: t.accent, opacity: 0.7 }} />
          {/* Two-col body */}
          <div className="flex flex-1">
            {/* Left main */}
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              {[85, 68, 78, 58, 72, 50, 65, 75, 55].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
            </div>
            {/* Divider */}
            <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            {/* Right sidebar */}
            <div className="w-14 p-1.5 flex flex-col gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Row w={80} opacity={0.5} h={1} />
              {[65, 75, 55, 80, 60, 70, 50].map((w, i) => <Row key={i} w={w} opacity={0.25} h={1} />)}
            </div>
          </div>
        </div>
      ) : isSplit ? (
        // Split: full header + equal 50/50 columns
        <div className="h-full flex flex-col">
          {/* Full-width header with bottom border */}
          <div className="p-2.5 pb-2">
            <Row w={62} opacity={0.9} h={2.5} />
            <div style={{ height: 2 }} />
            <Row w={44} opacity={0.5} h={1.5} />
            <div style={{ height: 2 }} />
            <Row w={88} opacity={0.3} h={1} />
          </div>
          <div style={{ height: 2.5, backgroundColor: t.accent, opacity: 0.7 }} />
          {/* Equal two columns */}
          <div className="flex flex-1">
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <Row w={40} opacity={0.55} h={1} />
              {[82, 62, 75, 55, 70, 48, 63].map((w, i) => <Row key={i} w={w} opacity={0.2} h={1.5} />)}
            </div>
            <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <Row w={35} opacity={0.55} h={1} />
              {[78, 60, 70, 50, 65, 45, 58, 68].map((w, i) => <Row key={i} w={w} opacity={0.2} h={1.5} />)}
            </div>
          </div>
        </div>
      ) : (
        // Minimal: colored left border
        <div className="h-full flex">
          <div className="w-1.5 h-full" style={{ backgroundColor: t.accent, opacity: 0.9 }} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <Row w={70} opacity={0.85} h={3} />
            <Row w={48} opacity={0.55} h={1.5} />
            <Gap h={3} />
            <Row w={100} opacity={0.2} h={1} />
            <Gap h={1} />
            {[88, 68, 80, 58, 74, 52, 66, 76].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
          </div>
        </div>
      )}

      {/* Subtle bottom gradient for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-8"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))' }} />
    </div>
  )
}

