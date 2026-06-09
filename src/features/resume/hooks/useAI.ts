import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import { useBuilderStore } from '@/store/builder.store'
import type { WorkEntry, EducationEntry, SkillEntry, PersonalInfo } from '@/store/builder.store'

// ─── Shared system prompts ────────────────────────────────────────────────────

const RESUME_WRITER_SYSTEM = `You are a world-class ATS resume writer and career coach with 20+ years experience.
Rules:
- Use strong, varied action verbs (Led, Built, Reduced, Increased, Delivered, Architected, Launched…)
- Quantify achievements whenever possible (%, $, time, scale)
- Never use first-person pronouns (I, me, my)
- Match keywords naturally — do NOT keyword-stuff
- Be concise and impactful
- BANNED words/phrases (never use these): "Results-driven", "Results:", "Result:", "Driven by", "Detail-oriented", "Passionate about", "Hardworking", "Team player", "Go-getter", "Self-motivated", "Dynamic professional", "Highly motivated", "Proven track record"
- Do NOT prefix output with labels like "Results:", "Output:", "Here is:", "Summary:", "Response:", "Answer:" — output content directly`

const JSON_ONLY_SYSTEM = `You are a structured data extractor. Return ONLY valid JSON, no markdown fences, no explanation.`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useKey()      { return useBuilderStore(s => s.groqApiKey) }
function useJobCtx()   {
  const t = useBuilderStore(s => s.targetJobTitle)
  const city = useBuilderStore(s => s.targetCity)
  const country = useBuilderStore(s => s.targetCountry)
  return { targetJob: t, location: [city, country].filter(Boolean).join(', ') }
}

// ─── Generate Professional Summary ───────────────────────────────────────────

/** Calculate total years of experience from work entries */
function calcYears(experience: WorkEntry[]): number {
  let totalMonths = 0
  const now = new Date()
  for (const e of experience) {
    const start = e.startDate ? new Date(e.startDate + '-01') : null
    const end   = e.isCurrent ? now : e.endDate ? new Date(e.endDate + '-01') : null
    if (start && end && end > start) {
      totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    }
  }
  return Math.round(totalMonths / 12)
}

export function useGenerateSummary() {
  const key = useKey()
  const { targetJob, location } = useJobCtx()
  const skills = useBuilderStore(s => s.skills)

  return useMutation({
    mutationFn: async ({
      personal, experience, education,
    }: {
      personal: PersonalInfo
      experience: WorkEntry[]
      education: EducationEntry[]
      type?: 'summary' | 'objective'
    }) => {
      const name  = `${personal.firstName} ${personal.lastName}`.trim() || 'the candidate'
      const title = targetJob || personal.professionalTitle || ''
      const years = calcYears(experience)
      const edu   = education[0]

      // Build rich experience context from ALL entries
      const expLines = experience.slice(0, 4).map(e => {
        const start = e.startDate || ''
        const end   = e.isCurrent ? 'Present' : (e.endDate || '')
        const dates = [start, end].filter(Boolean).join(' – ')
        return `  - ${e.position} at ${e.company}${dates ? ` (${dates})` : ''}`
      }).join('\n')

      const topSkills = skills.slice(0, 8).map(s => s.name).join(', ')

      const ctx = [
        title    && `Target role: ${title}`,
        location && `Location: ${location}`,
        years > 0 && `Total experience: ${years} year${years !== 1 ? 's' : ''}`,
        expLines  && `Work history:\n${expLines}`,
        edu       && `Education: ${edu.degree} in ${edu.program} from ${edu.school}`,
        topSkills && `Key skills: ${topSkills}`,
      ].filter(Boolean).join('\n')

      // Years label for prompt
      const yearsLabel = years === 0 ? 'entry-level'
                        : years === 1 ? '1 year'
                        : `${years} years`

      const prompt = `Write a sharp 2-sentence professional summary for this resume.

Candidate: ${name}
${ctx}

Rules:
- EXACTLY 2 sentences. No labels. No "Results:". No quotes. No markdown.
- Sentence 1: Mention the ACTUAL job title and REAL years (${yearsLabel}) from the work history above — do NOT invent "5-10 years" if the data shows otherwise.
- Sentence 2: Highlight a specific skill, achievement, or unique value from the experience above${location ? ` relevant to ${location} job market` : ''}.
- Opening examples: "${title} with ${yearsLabel} of experience…", "Dedicated ${title} bringing ${yearsLabel}…", "Proven ${title} with ${yearsLabel}…"
- BANNED openers: "Results-driven", "Dynamic", "Accomplished", "Passionate", "Driven", "Highly motivated", "Detail-oriented"
- NEVER invent years of experience — use exactly ${yearsLabel} as stated above.
- ATS keywords from skills list packed naturally.
- No first-person pronouns. Output directly — no label prefix.`

      return callGroq(
        [
          { role: 'system', content: RESUME_WRITER_SYSTEM },
          { role: 'user', content: prompt },
        ],
        180,
        GROQ_MODELS.FAST,
        key,
      )
    },
  })
}

// ─── Suggest Target Job Titles ───────────────────────────────────────────────

/**
 * Suggests 6 specific job titles based on the user's existing experience/education.
 * Used on Step 0 (Goal) so users who don't know exactly what to apply for get help.
 */
export function useAISuggestJobTitle() {
  const key = useKey()
  const { location } = useJobCtx()

  return useMutation({
    mutationFn: async ({
      experience, education,
    }: { experience: WorkEntry[]; education: EducationEntry[] }): Promise<string[]> => {
      const expText = experience.slice(0, 3).map(e => `${e.position} at ${e.company}`).join(', ')
      const eduText = education.slice(0, 2).map(e => [e.degree, e.program, e.school].filter(Boolean).join(' ')).join(', ')

      const result = await callGroq(
        [
          {
            role: 'system',
            content: `${JSON_ONLY_SYSTEM}\nYou are a career advisor. Return ONLY a JSON array of exactly 6 job title strings — specific, realistic, and varied (from entry-level to senior). No explanation.`,
          },
          {
            role: 'user',
            content: `Suggest 6 job titles this person should apply for:
${expText ? `Work history: ${expText}` : 'No work history yet — suggest entry-level or general roles'}
${eduText ? `Education: ${eduText}` : ''}
${location ? `Target market: ${location}` : ''}
Return JSON array of 6 strings.`,
          },
        ],
        200,
        GROQ_MODELS.FAST,
        key,
      )
      try {
        const parsed = JSON.parse(result) as string[]
        return Array.isArray(parsed) ? parsed.slice(0, 6) : []
      } catch {
        return result.split('\n').map(l => l.replace(/^[-•*"\d.]+\s*/, '').replace(/[",]$/, '')).filter(Boolean).slice(0, 6)
      }
    },
  })
}

// ─── Generate Professional Title ─────────────────────────────────────────────

/**
 * Auto-generates a professional resume headline from their background + target job.
 * Called in SummaryForm so users don't need to think of one themselves.
 */
export function useGenerateProfessionalTitle() {
  const key = useKey()
  const { targetJob } = useJobCtx()

  return useMutation({
    mutationFn: async ({
      experience, education,
    }: { experience: WorkEntry[]; education: EducationEntry[] }): Promise<string> => {
      const recentRole  = experience[0]?.position
      const recentCo    = experience[0]?.company
      const target      = targetJob || recentRole || ''
      const eduNote     = education[0] ? `${education[0].degree} ${education[0].program}` : ''
      const years       = calcYears(experience)
      const yearsNote   = years > 0 ? `${years} year${years > 1 ? 's' : ''} experience` : 'entry-level'

      return callGroq(
        [
          {
            role: 'system',
            content: 'You are a resume expert. Output ONLY a short, professional resume headline/title. Max 5 words. No quotes, no punctuation at end, no explanation.',
          },
          {
            role: 'user',
            content: `Write a professional title for someone applying for "${target}".
Recent role: ${recentRole ? `${recentRole}${recentCo ? ` at ${recentCo}` : ''}` : 'none'}
Education: ${eduNote || 'not specified'}
Experience level: ${yearsNote}
Output: one concise professional title only.`,
          },
        ],
        25,
        GROQ_MODELS.ULTRAFAST,
        key,
      )
    },
  })
}

// ─── Improve Bullet Points ────────────────────────────────────────────────────

export function useImproveBullets() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({ bullets, context }: { bullets: string[]; context: string }): Promise<string[]> => {
      const input = bullets.filter(Boolean).join('\n')
      if (!input.trim()) throw new Error('Add at least one bullet point first.')

      const result = await callGroq(
        [
          {
            role: 'system',
            content: `${RESUME_WRITER_SYSTEM}\n\nReturn ONLY a JSON array of improved bullet strings. No markdown.`,
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nBullets to improve:\n${input}\n\nReturn improved bullets as JSON array of strings.`,
          },
        ],
        600,
        GROQ_MODELS.FAST,
        key,
      )

      try {
        const parsed = JSON.parse(result) as string[]
        return Array.isArray(parsed) ? parsed : [result]
      } catch {
        // If the model returned plain text instead of JSON, split by newline
        return result.split('\n').filter(Boolean)
      }
    },
  })
}

// ─── Generate Bullets From Role (write from scratch) ─────────────────────────

export function useGenerateBulletsFromRole() {
  const key = useKey()
  const { targetJob, location } = useJobCtx()

  return useMutation({
    mutationFn: async ({
      position, company, employmentType,
    }: { position: string; company: string; employmentType: string }): Promise<string[]> => {
      const role = position || targetJob || 'professional'
      const result = await callGroq(
        [
          {
            role: 'system',
            content: `${RESUME_WRITER_SYSTEM}\n\nGenerate 4-5 impactful resume bullet points for the given role. Each bullet must:\n- Start with a strong past-tense action verb\n- Include a measurable outcome or specific impact where possible\n- Be 1-2 lines max\n- Be realistic for the role level\nReturn ONLY a JSON array of strings. No markdown, no numbering, no explanation.`,
          },
          {
            role: 'user',
            content: `Role: ${role}\nCompany: ${company || 'a company'}\nType: ${employmentType}${location ? `\nMarket: ${location}` : ''}\n\nGenerate bullet points for this resume experience. Make them varied and impactful.`,
          },
        ],
        600,
        GROQ_MODELS.FAST,
        key,
      )
      try {
        const parsed = JSON.parse(result) as string[]
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : result.split('\n').filter(Boolean)
      } catch {
        return result.split('\n').map(l => l.replace(/^[-•*\d.]+\s*/, '')).filter(Boolean)
      }
    },
  })
}

// ─── Suggest Skills ───────────────────────────────────────────────────────────

export function useSuggestSkills() {
  const key = useKey()
  const { targetJob, location } = useJobCtx()

  return useMutation({
    mutationFn: async ({
      personal, experience,
    }: {
      personal: PersonalInfo
      experience: WorkEntry[]
    }): Promise<SkillEntry[]> => {
      const title = targetJob || personal.professionalTitle
      const positions = experience.map(e => `${e.position} at ${e.company}`).join(', ')

      const result = await callGroq(
        [
          {
            role: 'system',
            content: `${JSON_ONLY_SYSTEM}\nYou are a career expert. Suggest skills that will maximize ATS match rate for the given role and location. Return a JSON array of objects with keys: name (string), category (one of: technical|soft|language|framework|platform|tool).`,
          },
          {
            role: 'user',
            content: `Suggest 15-20 highly relevant skills for:\nTarget role: ${title}\n${location ? `Location/Market: ${location}` : ''}\nExperience background: ${positions || 'Entry-level'}\n\nPrioritize skills that ATS systems for "${title}" roles actually scan for.\nReturn JSON array.`,
          },
        ],
        600,
        GROQ_MODELS.POWERFUL,
        key,
      )

      try {
        const parsed = JSON.parse(result) as { name: string; category: string }[]
        return (Array.isArray(parsed) ? parsed : []).map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          category: s.category as SkillEntry['category'] ?? 'technical',
          level: 'intermediate',
        }))
      } catch {
        return []
      }
    },
  })
}

// ─── ATS Analysis ─────────────────────────────────────────────────────────────

export function useAtsAnalysis() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({
      resumeText, jobDescription,
    }: { resumeText: string; jobDescription: string }) => {
      const result = await callGroq(
        [
          {
            role: 'system',
            content: `${JSON_ONLY_SYSTEM}
You are an ATS expert. Analyze a resume against a job description.
Return JSON with keys:
  matchScore: number 0-100
  missingKeywords: string[]
  missingSkills: string[]
  recommendations: string[]  (actionable, specific)`,
          },
          {
            role: 'user',
            content: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}\n\nAnalyze and return JSON.`,
          },
        ],
        800,
        GROQ_MODELS.POWERFUL,  // best model for analysis
        key,
      )
      return JSON.parse(result) as {
        matchScore: number
        missingKeywords: string[]
        missingSkills: string[]
        recommendations: string[]
      }
    },
  })
}

// ─── Generate Project Description ────────────────────────────────────────────

export function useGenerateProjectDescription() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({ name, role, technologies }: { name: string; role: string; technologies: string[] }): Promise<string> => {
      if (!name.trim()) throw new Error('Add a project name first.')
      return callGroq(
        [
          { role: 'system', content: `${RESUME_WRITER_SYSTEM}\nWrite a concise 2-3 sentence project description for a resume. Focus on impact, technologies, and outcomes. No first-person.` },
          { role: 'user', content: `Project: ${name}\nRole: ${role}\nTechnologies: ${technologies.join(', ')}\n\nWrite the description.` },
        ],
        200,
        GROQ_MODELS.FAST,
        key,
      )
    },
  })
}

// ─── Generate Cover Letter ────────────────────────────────────────────────────

export function useGenerateCoverLetter() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({
      resumeText, jobTitle, companyName, jobDescription,
    }: { resumeText: string; jobTitle: string; companyName: string; jobDescription?: string }) => {
      return callGroq(
        [
          {
            role: 'system',
            content: `${RESUME_WRITER_SYSTEM}\n\nWrite professional, persuasive cover letters. 3-4 tight paragraphs. End with a confident call to action.`,
          },
          {
            role: 'user',
            content: `Write a compelling cover letter for ${jobTitle} at ${companyName}.

Resume highlights:
${resumeText}
${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}

Write the full cover letter.`,
          },
        ],
        800,
        GROQ_MODELS.FAST,
        key,
      )
    },
  })
}

// ─── Backward-compat alias ────────────────────────────────────────────────────
export const useAtsOptimize = useAtsAnalysis
