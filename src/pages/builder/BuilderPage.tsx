import { useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Layout, User, FileText, Briefcase, GraduationCap, Star,
  ChevronLeft, ChevronRight, Eye, Check,
  Sparkles, Download, Settings, X, KeyRound, Loader2,
  Target, MapPin, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore, storeToSections } from '@/store/builder.store'
import { ResumePreviewPanel } from '@/features/resume/components/ResumePreviewPanel'
import { ScaledResumePreview } from '@/features/resume/components/ScaledResumePreview'
import { PersonalInfoForm } from '@/features/resume/components/forms/PersonalInfoForm'
import { SummaryForm } from '@/features/resume/components/forms/SummaryForm'
import { WorkExperienceForm } from '@/features/resume/components/forms/WorkExperienceForm'
import { EducationForm } from '@/features/resume/components/forms/EducationForm'
import { SkillsForm } from '@/features/resume/components/forms/SkillsForm'
import { exportToPDF, exportToPNG, exportToDOCX } from '@/lib/export'
import { JOB_TITLES } from '@/data/job-titles'

// ─── Static template list — no DB needed ─────────────────────────────────────

const TEMPLATES = [
  { id: 'minimal',      name: 'Minimal',          category: 'general',    bg: '#6366f1', accent: '#f8f9fa' },
  { id: 'clean',        name: 'Clean',             category: 'general',    bg: '#0f766e', accent: '#f0fdf4' },
  { id: 'professional', name: 'Professional',      category: 'corporate',  bg: '#1e40af', accent: '#eff6ff' },
  { id: 'executive',    name: 'Executive',         category: 'corporate',  bg: '#0f172a', accent: '#c9a84c' },
  { id: 'elegant',      name: 'Elegant',           category: 'creative',   bg: '#7c3aed', accent: '#faf5ff' },
  { id: 'harvard',      name: 'Harvard',           category: 'academic',   bg: '#1a1a2e', accent: '#e2e2e2' },
  { id: 'stanford',     name: 'Stanford',          category: 'academic',   bg: '#8c1515', accent: '#ffffff' },
  { id: 'oxford',       name: 'Oxford',            category: 'academic',   bg: '#002147', accent: '#d4b83a' },
  { id: 'software-dev', name: 'Software Dev',      category: 'tech',       bg: '#065f46', accent: '#d1fae5' },
  { id: 'data-analyst', name: 'Data Analyst',      category: 'tech',       bg: '#6d28d9', accent: '#ede9fe' },
  { id: 'designer',     name: 'Designer',          category: 'creative',   bg: '#0e7490', accent: '#ecfeff' },
  { id: 'marketing',    name: 'Marketing',         category: 'creative',   bg: '#be185d', accent: '#fce7f3' },
  { id: 'finance',      name: 'Finance',           category: 'corporate',  bg: '#14532d', accent: '#bbf7d0' },
  { id: 'fresh-grad',   name: 'Fresh Graduate',    category: 'general',    bg: '#0369a1', accent: '#e0f2fe' },
  { id: 'internship',   name: 'Internship',        category: 'general',    bg: '#4338ca', accent: '#e0e7ff' },
  { id: 'academic',     name: 'Academic',          category: 'academic',   bg: '#374151', accent: '#f9fafb' },
  { id: 'engineer',     name: 'Engineer',          category: 'tech',       bg: '#1e3a5f', accent: '#dbeafe' },
  { id: 'business',     name: 'Business',          category: 'corporate',  bg: '#1f2937', accent: '#6b7280' },
  { id: 'multimedia',   name: 'Multimedia',        category: 'creative',   bg: '#ea580c', accent: '#fff7ed' },
  { id: 'mit',          name: 'MIT',               category: 'academic',   bg: '#750014', accent: '#ffffff' },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'target',     label: 'Your Goal',  icon: Target,        hint: 'What job and location? AI uses this to tailor everything.' },
  { id: 'personal',   label: 'About You',  icon: User,          hint: 'Your name, contact info, and professional title.' },
  { id: 'experience', label: 'Experience', icon: Briefcase,     hint: 'Your work history, most recent first.' },
  { id: 'education',  label: 'Education',  icon: GraduationCap, hint: 'Schools, degrees, and programs.' },
  { id: 'skills',     label: 'Skills',     icon: Star,          hint: 'What you are great at — AI suggests from your background.' },
  { id: 'summary',    label: 'Summary',    icon: FileText,      hint: 'AI reads all your details and writes a sharp 2-sentence summary.' },
  { id: 'design',     label: 'Design',     icon: Layout,        hint: 'Pick your template — preview it here before downloading.' },
  { id: 'done',       label: 'Done',       icon: Check,         hint: 'Your resume is ready. Download PDF, Word, or Image.' },
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

  // Store
  const templateId       = useBuilderStore(s => s.templateId)
  const profilePhoto     = useBuilderStore(s => s.profilePhoto)
  const personal         = useBuilderStore(s => s.personal)
  const experience       = useBuilderStore(s => s.experience)
  const education        = useBuilderStore(s => s.education)
  const skills           = useBuilderStore(s => s.skills)
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
  const sections = storeToSections({ personal, experience, education, skills, profilePhoto })
  const currentTemplate = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0]

  const setStep = useCallback((n: number) => {
    setStepRaw(n)
    setSearchParams({ step: String(n) }, { replace: true })
  }, [setSearchParams])

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
  const noApiKey = !groqApiKey && !import.meta.env.VITE_GROQ_API_KEY

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
            icon={noApiKey ? <KeyRound className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
            label={noApiKey ? 'Add Key' : 'Settings'}
            onClick={() => setShowSettings(true)}
            warn={noApiKey}
          />
        </div>
      </header>

      {/* ── API key warning banner ──────────────────────────────────────────── */}
      {noApiKey && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            <strong>AI features need a Groq API key.</strong>{' '}It's free —{' '}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline font-semibold">
              get one at console.groq.com
            </a>{' '}
            then click Settings above.
          </span>
        </div>
      )}

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

            {/* ── Steps 1-5: Form steps wrapped in card ────────────────── */}
            {step >= 1 && step <= 5 && (
              <div
                key={`step-${step}`}
                className="animate-slide-up-sm rounded-2xl p-5 bg-white border border-gray-100 shadow-sm"
              >
                {step === 1 && <PersonalInfoForm />}
                {step === 2 && <WorkExperienceForm />}
                {step === 3 && <EducationForm />}
                {step === 4 && <SkillsForm />}
                {step === 5 && <SummaryForm />}
              </div>
            )}

            {/* ── Step 6: Design / Template selection ─────────────────────── */}
            {step === 6 && (
              <div key="step-6" className="animate-slide-up-sm space-y-4">
                {/* Live preview of current choice */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-purple-500" />
                      Preview — <span className="brand-gradient-text">{currentTemplate.name}</span>
                    </p>
                    <span className="text-xs text-gray-400">This is how your resume will look</span>
                  </div>
                  <div id="resume-preview-target" className="bg-gray-50 p-3">
                    <div className="shadow-lg rounded-lg overflow-hidden">
                      <ScaledResumePreview sections={sections} templateName={currentTemplate.name} />
                    </div>
                  </div>
                </div>

                {/* Change template CTA */}
                <div className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Current: <span className="brand-gradient-text">{currentTemplate.name}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{currentTemplate.category} · switch any time</p>
                  </div>
                  <button
                    onClick={() => setShowTemplatePanel(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'var(--melo-gradient)' }}
                  >
                    <Layout className="h-4 w-4" />
                    Change Template
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 7: Done ─────────────────────────────────────────────── */}
            {step === 7 && (
              <DoneStep
                sections={sections}
                templateName={currentTemplate.name}
                exporting={exporting}
                exportType={exportType}
                onExport={handleExport}
                onReset={() => { resetResume(); setStep(0) }}
              />
            )}
          </div>

          {/* Navigation */}
          {step < STEPS.length - 1 && (
            <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : <div />}
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{
                  background: 'var(--melo-gradient)',
                  boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
                }}
              >
                {step === STEPS.length - 2 ? 'Finish & Preview' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </button>
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
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Groq API Key */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-500" />
                  AI Engine (Groq)
                </h3>

                {import.meta.env.VITE_GROQ_API_KEY ? (
                  <div className="rounded-xl p-3.5 bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> AI features are active
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      Powered by Groq · llama-3.3-70b-versatile
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Paste your Groq key to enable AI. Stays in your browser only.
                    </p>
                    <input
                      type="password"
                      value={groqApiKey}
                      onChange={e => setGroqApiKey(e.target.value)}
                      placeholder="gsk_…"
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {groqApiKey ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Key saved — AI features active
                      </p>
                    ) : (
                      <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                        className="text-xs text-purple-600 underline">
                        Get your free key at console.groq.com →
                      </a>
                    )}
                  </>
                )}
              </div>

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
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
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
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
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
                        'group relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
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
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
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

// ─── Done Step ────────────────────────────────────────────────────────────────

function DoneStep({
  sections,
  templateName,
  exporting,
  exportType,
  onExport,
  onReset,
}: {
  sections: ReturnType<typeof storeToSections>
  templateName: string
  exporting: boolean
  exportType: 'pdf' | 'docx' | 'png' | null
  onExport: (type: 'pdf' | 'docx' | 'png') => void
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="rounded-2xl p-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200">
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

      {/* Full resume preview */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5 text-gray-400">
          <Eye className="h-3.5 w-3.5" /> Your Resume ·{' '}
          <span className="brand-gradient-text">{templateName}</span>
        </p>
        {/* Visible preview — always exact A4 layout, scaled to fit screen */}
        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-100">
          <ScaledResumePreview sections={sections} templateName={templateName} />
        </div>
        {/* Hidden export target — position: fixed behind page content, captureElement() moves it into viewport */}
        <div
          id="resume-export-canvas"
          style={{ position: 'fixed', top: 0, left: 0, width: '794px', background: '#fff', zIndex: -999, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <ResumePreviewPanel sections={sections} templateName={templateName} />
        </div>
      </div>

      {/* Export options */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
          Download as
        </p>

        {/* PDF — primary */}
        <button
          onClick={() => onExport('pdf')}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--melo-gradient)', boxShadow: '0 6px 24px rgba(168,85,247,0.35)' }}
        >
          {exporting && exportType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting && exportType === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
        </button>

        {/* PNG */}
        <button
          onClick={() => onExport('png')}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          {exporting && exportType === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting && exportType === 'png' ? 'Generating Image…' : 'Download Image (.png)'}
        </button>

        <p className="text-[11px] text-center pt-1 text-gray-400">
          PDF for job applications · PNG for portfolio &amp; social media
        </p>
      </div>

      {/* Start over */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          Start a New Resume
        </button>
      </div>
    </div>
  )
}

// ─── Job Target Step ──────────────────────────────────────────────────────────

function JobTargetStep({
  jobTitle, city, country, onJobChange, onLocationChange,
}: {
  jobTitle: string
  city: string
  country: string
  onJobChange: (title: string) => void
  onLocationChange: (city: string, country: string) => void
}) {
  const [jobQuery, setJobQuery] = useState(jobTitle)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = jobQuery.length >= 1
    ? JOB_TITLES.filter(t => t.toLowerCase().includes(jobQuery.toLowerCase())).slice(0, 8)
    : JOB_TITLES.slice(0, 8)

  function selectJob(title: string) {
    setJobQuery(title)
    onJobChange(title)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ background: 'var(--melo-gradient-soft)', borderColor: 'rgba(244,114,182,0.3)' }}>
        <div className="rounded-xl p-2 shrink-0 text-white" style={{ background: 'var(--melo-gradient)' }}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-900">AI-Powered Resume Builder</h3>
          <p className="text-xs mt-1 leading-relaxed text-gray-500">
            Tell us where you're based and the job you want. Melo's AI tailors every section
            — summaries, bullets, and skills — for your exact role and market.
          </p>
        </div>
      </div>

      {/* ── Location FIRST ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-purple-500" />
          Where are you based?
          <span className="font-normal text-gray-400 text-xs ml-1">helps AI match local market</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={city}
            placeholder="City (e.g. Metro Manila)"
            onChange={e => onLocationChange(e.target.value, country)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <input
            type="text"
            value={country}
            placeholder="Country (e.g. Philippines)"
            onChange={e => onLocationChange(city, e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* ── Job title ── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Target className="h-4 w-4 text-purple-500" />
          What job are you applying for? *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={jobQuery}
            placeholder="e.g. Barista, Software Engineer, Nurse…"
            onChange={e => { setJobQuery(e.target.value); onJobChange(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-52 overflow-y-auto rounded-xl shadow-xl bg-white border border-gray-200">
              {suggestions.map(title => (
                <button
                  key={title}
                  onMouseDown={() => selectJob(title)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors',
                    title === jobTitle ? 'text-purple-600 font-semibold bg-purple-50' : 'text-gray-700'
                  )}
                >
                  {title === jobTitle ? <strong>{title}</strong> : title}
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
        <p className="text-xs text-gray-400">From barista to CEO — type anything or pick from the list.</p>
      </div>

      {/* What AI will do */}
      {jobTitle && (
        <div className="rounded-2xl p-4 space-y-2 bg-white border border-gray-100 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">AI will tailor</p>
          <ul className="space-y-1.5">
            {[
              `Professional summary for ${jobTitle}`,
              `Skills ranked by ${jobTitle} ATS relevance`,
              `Bullet points matching ${jobTitle} expectations`,
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">{item}</span>
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
  const isModern    = ['elegant', 'professional', 'marketing', 'multimedia', 'designer', 'software-dev', 'data-analyst', 'engineer'].includes(t.id)
  const isExecutive = ['executive', 'business', 'finance'].includes(t.id)
  const isAcademic  = ['harvard', 'stanford', 'oxford', 'mit', 'academic'].includes(t.id)

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
          {/* Sidebar */}
          <div className="w-14 h-full p-2 flex flex-col gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <div className="h-6 w-6 rounded-full mx-auto mb-1.5" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
            <Row w={85} opacity={0.5} />
            <Row w={65} opacity={0.35} />
            <Gap />
            <Row w={70} opacity={0.4} h={1} />
            {[75, 55, 80, 60, 70, 50].map((w, i) => <Row key={i} w={w} opacity={0.25} h={1} />)}
          </div>
          {/* Main */}
          <div className="flex-1 p-2 flex flex-col gap-1">
            {/* Name */}
            <Row w={75} opacity={0.85} h={3} />
            <Row w={50} opacity={0.45} h={1.5} />
            <Gap h={3} />
            {/* Section header line */}
            <Row w={100} opacity={0.2} h={1} />
            <Gap h={2} />
            {/* Content lines */}
            {[90, 70, 82, 60, 76, 55, 68, 78].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
          </div>
        </div>
      ) : isExecutive ? (
        // Bold dark header + gold accent bar + clean content
        <div className="h-full flex flex-col">
          <div className="p-2.5 pb-2" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Row w={65} opacity={0.9} h={3.5} />
            <div style={{ height: 3 }} />
            <Row w={42} opacity={0.55} h={1.5} />
            <div style={{ height: 4 }} />
            <Row w={88} opacity={0.3} h={1} />
          </div>
          {/* Gold bar */}
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
          {/* Section blocks */}
          <Row w={100} opacity={0.35} h={1} />
          <Gap h={2} />
          <Row w={40} opacity={0.55} h={1.5} />
          {[85, 65, 78, 55, 70, 48, 63].map((w, i) => <Row key={i} w={w} opacity={0.22} h={1.5} />)}
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

