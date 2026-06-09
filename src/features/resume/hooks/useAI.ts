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

export function useGenerateSummary() {
  const key = useKey()
  const { targetJob, location } = useJobCtx()

  return useMutation({
    mutationFn: async ({
      personal, experience, education,
    }: {
      personal: PersonalInfo
      experience: WorkEntry[]
      education: EducationEntry[]
      type?: 'summary' | 'objective'
    }) => {
      const name = `${personal.firstName} ${personal.lastName}`.trim() || 'the candidate'
      const title = targetJob || personal.professionalTitle || ''
      const recent = experience[0]
      const edu = education[0]

      const ctx = [
        title && `Target role: ${title}`,
        location && `Location: ${location}`,
        recent && `Most recent role: ${recent.position} at ${recent.company}`,
        edu && `Education: ${edu.degree} in ${edu.program} from ${edu.school}`,
      ].filter(Boolean).join('\n')

      const prompt = `Write a sharp 2-sentence professional summary for this resume.

Candidate: ${name}
${ctx}

Rules:
- EXACTLY 2 sentences. No labels. No "Results:". No quotes. No markdown.
- Sentence 1: Professional title + level/years + core expertise for "${title}"
- Sentence 2: Key quantified achievement or unique value proposition${location ? ` relevant to ${location}` : ''}
- Opening examples (pick a fresh, varied one): "${title} with X years…", "Seasoned ${title} who…", "Senior ${title} known for…", "Award-winning ${title} with…"
- BANNED openers: "Results-driven", "Dynamic", "Accomplished", "Passionate", "Driven", "Highly motivated", "Detail-oriented"
- ATS keywords packed naturally — not stuffed
- No first-person pronouns. Output the 2-sentence summary directly — no prefix, no label.`

      return callGroq(
        [
          { role: 'system', content: RESUME_WRITER_SYSTEM },
          { role: 'user', content: prompt },
        ],
        160,
        GROQ_MODELS.FAST,
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
