/**
 * HobbiesForm — optional step to add a Hobbies & Interests section.
 * Two large toggle cards (Yes / Skip) → textarea → AI generates one sentence.
 */
import { useState } from 'react'
import { Sparkles, Loader2, Edit3, Check, Heart, X } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useGenerateHobbies } from '@/features/resume/hooks/useAI'

export function HobbiesForm() {
  const hobbies    = useBuilderStore(s => s.hobbies)
  const setHobbies = useBuilderStore(s => s.setHobbies)

  // null = not yet chosen; true = opted in; false = skipped
  const [choice, setChoice] = useState<boolean | null>(hobbies ? true : null)
  const [rawInput, setRawInput] = useState('')
  const [editing, setEditing]  = useState(false)

  const { mutate: generate, isPending, error } = useGenerateHobbies()

  function handleGenerate() {
    const text = rawInput.trim() || hobbies
    if (!text) return
    generate(
      { rawText: text },
      { onSuccess: (result) => { setHobbies(result.trim()); setEditing(false) } },
    )
  }

  function handleChoose(yes: boolean) {
    setChoice(yes)
    if (!yes) {
      setHobbies('')
      setRawInput('')
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Two big option cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Yes */}
        <button
          type="button"
          onClick={() => handleChoose(true)}
          className="relative rounded-[3px] border-2 p-4 text-left transition-all duration-150 focus:outline-none active:scale-[0.98]"
          style={
            choice === true
              ? { borderColor: '#7c3aed', backgroundColor: '#faf5ff', boxShadow: '0 0 0 3px rgba(124,58,237,0.12)' }
              : { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }
          }
        >
          {choice === true && (
            <span
              className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full text-white"
              style={{ background: 'var(--melo-gradient)' }}
            >
              <Check className="h-3 w-3" />
            </span>
          )}
          <Heart
            className="h-5 w-5 mb-2"
            style={{ color: choice === true ? '#7c3aed' : '#9ca3af' }}
            fill={choice === true ? '#7c3aed' : 'none'}
          />
          <p className="text-sm font-semibold" style={{ color: choice === true ? '#5b21b6' : '#374151' }}>
            Yes, add it
          </p>
          <p className="text-xs mt-0.5" style={{ color: choice === true ? '#7c3aed' : '#9ca3af' }}>
            Adds personality to your resume
          </p>
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={() => handleChoose(false)}
          className="relative rounded-[3px] border-2 p-4 text-left transition-all duration-150 focus:outline-none active:scale-[0.98]"
          style={
            choice === false
              ? { borderColor: '#9ca3af', backgroundColor: '#f9fafb' }
              : { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }
          }
        >
          {choice === false && (
            <span className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-200">
              <X className="h-3 w-3 text-gray-500" />
            </span>
          )}
          <div className="h-5 w-5 mb-2 flex items-center justify-center text-gray-300 text-base select-none">—</div>
          <p className="text-sm font-semibold text-gray-600">Skip for now</p>
          <p className="text-xs mt-0.5 text-gray-400">Resume won't include this</p>
        </button>
      </div>

      {/* ── Input + generate — only shown when opted in ───────────────────── */}
      {choice === true && (
        <div className="space-y-4 animate-fade-in">

          {/* Describe hobbies */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              What do you enjoy doing in your free time?
            </label>
            <p className="text-xs text-gray-400">
              Anything at all — travel, basketball, cooking, reading, gaming, volunteering… just be yourself!
            </p>
            <textarea
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="e.g. I enjoy playing basketball on weekends, cooking Filipino dishes, and watching sci-fi movies."
              rows={3}
              className="w-full rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
            />
          </div>

          {/* AI generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending || (!rawInput.trim() && !hobbies)}
            className="w-full flex items-center justify-center gap-2 rounded-[3px] py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--melo-gradient)' }}
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Sparkles className="h-4 w-4" />}
            {isPending ? 'Writing your interests line…' : 'Write it for me'}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[3px] px-3 py-2">
              {(error as Error).message}
            </p>
          )}

          {/* Generated / edited result */}
          {hobbies && (
            <div className="rounded-[3px] border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                  Your interests line
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(e => !e)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors rounded-[3px] px-2 py-1 hover:bg-purple-100"
                >
                  {editing ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                  {editing ? 'Done' : 'Edit'}
                </button>
              </div>
              {editing ? (
                <textarea
                  value={hobbies}
                  onChange={e => setHobbies(e.target.value)}
                  rows={2}
                  className="w-full rounded-[3px] px-3 py-2 text-sm text-gray-900 border border-purple-300 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-none bg-white"
                />
              ) : (
                <p className="text-sm text-gray-800 leading-relaxed">{hobbies}</p>
              )}
              <p className="text-[11px] text-purple-500">
                This will appear as the last section on your resume.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Not yet chosen — gentle prompt ───────────────────────────────── */}
      {choice === null && (
        <p className="text-xs text-center text-gray-400 py-2">
          Choose an option above to continue.
        </p>
      )}
    </div>
  )
}
