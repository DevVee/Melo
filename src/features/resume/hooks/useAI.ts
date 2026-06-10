import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import { useBuilderStore } from '@/store/builder.store'
import type { WorkEntry, EducationEntry, SkillEntry, PersonalInfo } from '@/store/builder.store'

// ─── Shared system prompts ────────────────────────────────────────────────────

/**
 * Primary persona: an HR manager who has reviewed 10,000+ resumes.
 * This produces honest, concise, un-inflated content that holds up under
 * real recruiter scrutiny — not the bloated buzzword-heavy output that
 * generic AI tools produce.
 */
const RESUME_WRITER_SYSTEM = `You are a senior HR manager who has personally reviewed over 10,000 resumes across many industries.
You write clean, honest, specific resume content that reflects what the candidate actually did.
Core rules:
- Use strong, varied past-tense action verbs (Led, Built, Reduced, Delivered, Launched, Streamlined…)
- Quantify outcomes wherever the data exists — but NEVER invent numbers not supported by the input
- NEVER use first-person pronouns (I, me, my)
- Up to 5 bullet points per role — quality beats quantity every time
- Keep each bullet to ONE clear sentence; no run-ons
- BANNED words/phrases (never use): "Results-driven", "Detail-oriented", "Passionate about", "Hardworking", "Team player", "Go-getter", "Self-motivated", "Dynamic professional", "Highly motivated", "Proven track record", "Synergy", "Leverage", "Best-in-class"
- Do NOT prefix output with labels like "Results:", "Output:", "Here is:", "Summary:", "Response:", "Answer:" — output content directly
- Nothing exaggerated — if the user hasn't provided data to support a claim, don't invent it`

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
            content: `${RESUME_WRITER_SYSTEM}

Rewrite each bullet point to be stronger and more resume-worthy:
- Strengthen the opening action verb if it's weak
- Add specificity, scope, or a measurable outcome if the input is vague (use realistic ranges for the role type — don't invent exact numbers)
- Keep 18–28 words per bullet — detailed enough to convey real scope and impact
- Preserve the candidate's actual work — don't change the role or fabricate responsibilities
- Return ONLY a JSON array of improved bullet strings. Same count as input. No markdown, no labels.`,
          },
          {
            role: 'user',
            content: `Role context: ${context}\n\nOriginal bullets:\n${input}\n\nReturn improved version as JSON array of strings.`,
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
            content: `${RESUME_WRITER_SYSTEM}

Generate exactly 5 strong resume bullet points for the given role.
Each bullet must:
- Start with a different strong past-tense action verb (vary them — no two bullets start the same way)
- Describe a concrete responsibility OR measurable achievement specific to this role
- Sound like what someone in this actual job does day-to-day — realistic, not generic
- Be 18–28 words — detailed enough to clearly convey scope, impact, or results
- If quantifiable results are plausible for this role type (e.g. sales, operations, customer service), include a realistic metric range (e.g. "handled 50+ customer calls daily", "maintained 98% order accuracy")
- For roles where metrics are less natural (teacher, nurse, admin), focus on scope, collaboration, and tangible impact instead
- Vary the structure: mix responsibilities, achievements, and process improvements
Return ONLY a JSON array of exactly 5 strings. No markdown, no numbering, no explanation.`,
          },
          {
            role: 'user',
            content: `Role: ${role}\nCompany: ${company || 'a company'}\nEmployment type: ${employmentType}${location ? `\nMarket: ${location}` : ''}\n\nWrite 5 impactful resume bullets that sound like real, specific accomplishments for this role. Make each one different in structure and focus — mix day-to-day responsibilities, achievements, and process improvements.`,
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
            content: `${JSON_ONLY_SYSTEM}
You are a career expert who builds ATS-optimized skill sections.
Return a JSON array of skill objects, each with:
  name: string (the exact skill name)
  category: string (a descriptive group name — use specific names like "Frontend Development", "Backend Development", "Database", "Cloud & DevOps", "Mobile Development", "UI/UX Design", "Productivity Tools", "Soft Skills", "Languages", "Data Science", "Networking", etc.)
Rules:
- Group related skills together — skills with the same category appear together in the resume
- Use descriptive categories, NOT generic ones like "technical" or "framework"
- For non-tech roles: use categories like "Clinical Skills", "Administrative Skills", "Communication", "Customer Service", "Operations", etc.
- Return 15–20 skills that an ATS scanner for the target role actually looks for`,
          },
          {
            role: 'user',
            content: `Suggest 15–20 highly relevant skills for:\nTarget role: ${title}\n${location ? `Location/Market: ${location}` : ''}\nExperience background: ${positions || 'Entry-level'}\n\nPrioritize ATS-scannable skills. Use specific, descriptive category names.\nReturn JSON array.`,
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
          name: String(s.name || '').trim(),
          category: String(s.category || 'Technical Skills').trim(),
          level: 'intermediate',
        })).filter(s => s.name.length > 0)
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

// ─── Score Resume via AI ──────────────────────────────────────────────────────

export type ResumeScoreResult = {
  score: number                                    // 0–100
  level: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent'
  feedback: string                                 // 1–2 sentence overall verdict
  suggestions: string[]                            // 3–5 actionable tips
  breakdown: { label: string; score: number; max: number; note: string }[]
}

/**
 * Sends the full resume text to AI for a holistic quality analysis.
 * Returns a structured score with breakdown and suggestions.
 */
export function useScoreResume() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({ resumeText }: { resumeText: string }): Promise<ResumeScoreResult> => {
      const result = await callGroq(
        [
          {
            role: 'system',
            content: `You are a senior HR director and resume expert who has screened thousands of resumes for top companies.
Analyze the provided resume and return a JSON object with this exact shape:
{
  "score": <integer 0-100>,
  "level": <"Weak" | "Fair" | "Good" | "Strong" | "Excellent">,
  "feedback": "<1-2 sentence overall verdict — honest, specific, encouraging>",
  "suggestions": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "breakdown": [
    { "label": "Contact Info",      "score": <0-10>,  "max": 10,  "note": "<short reason>" },
    { "label": "Career Summary",    "score": <0-15>,  "max": 15,  "note": "<short reason>" },
    { "label": "Work Experience",   "score": <0-30>,  "max": 30,  "note": "<short reason>" },
    { "label": "Education",         "score": <0-15>,  "max": 15,  "note": "<short reason>" },
    { "label": "Skills",            "score": <0-15>,  "max": 15,  "note": "<short reason>" },
    { "label": "Extras & Polish",   "score": <0-15>,  "max": 15,  "note": "<short reason>" }
  ]
}

Scoring guidelines:
- Contact Info (max 10): 10 if name+email+phone+location all present; deduct 2 for each missing key field
- Career Summary (max 15): 15 if present and at least 2 strong sentences; 8 if present but weak/generic; 0 if missing
- Work Experience (max 30): 30 for 2+ jobs with 4+ strong specific bullets each; scale down for fewer jobs, vague bullets, or no quantification; 0 if none
- Education (max 15): 15 if present with school + degree; 8 if incomplete; 0 if missing
- Skills (max 15): 15 for 8+ relevant skills in categories; 8 for 3-7 skills; 0 if none
- Extras & Polish (max 15): award points for strengths (3), interests (2), projects (3), certifications (3), links (2), clear job title (2)

Score → Level mapping: 0-39 = Weak, 40-59 = Fair, 60-74 = Good, 75-89 = Strong, 90-100 = Excellent

Return ONLY the JSON object. No markdown, no explanation.`,
          },
          {
            role: 'user',
            content: `Please score this resume:\n\n${resumeText}`,
          },
        ],
        600,
        GROQ_MODELS.FAST,
        key,
      )
      try {
        const start = result.indexOf('{')
        const end   = result.lastIndexOf('}')
        return JSON.parse(result.slice(start, end + 1)) as ResumeScoreResult
      } catch {
        // Fallback minimal result if parsing fails
        return {
          score: 50, level: 'Fair',
          feedback: 'Could not fully analyze — please check your resume content.',
          suggestions: ['Add a career summary', 'Include more work experience details', 'List at least 5 skills'],
          breakdown: [
            { label: 'Contact Info',    score: 7,  max: 10, note: 'Checked' },
            { label: 'Career Summary',  score: 8,  max: 15, note: 'Checked' },
            { label: 'Work Experience', score: 15, max: 30, note: 'Checked' },
            { label: 'Education',       score: 8,  max: 15, note: 'Checked' },
            { label: 'Skills',          score: 7,  max: 15, note: 'Checked' },
            { label: 'Extras & Polish', score: 5,  max: 15, note: 'Checked' },
          ],
        }
      }
    },
  })
}

// ─── Auto-generate interests from profile ─────────────────────────────────────

/**
 * Generates an interests sentence from the user's job title and experience
 * when the user hasn't filled in hobbies yet.
 */
export function useAutoGenerateInterests() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({ jobTitle, experience }: { jobTitle: string; experience: string }): Promise<string> => {
      return callGroq(
        [
          {
            role: 'system',
            content: `You are a resume writer. Based on the person's job and background, write ONE short professional interests sentence (1–2 clauses, max 22 words) that sounds natural and human. No first-person pronouns. Output the sentence only — no labels or quotes.`,
          },
          {
            role: 'user',
            content: `Job: ${jobTitle || 'professional'}\nBackground: ${experience || 'various roles'}`,
          },
        ],
        80,
        GROQ_MODELS.FAST,
        key,
      )
    },
  })
}

// ─── Generate Hobbies / Interests line ───────────────────────────────────────

/**
 * Converts a free-form hobbies description into one professional sentence
 * suitable for the Interests section of a resume.
 */
export function useGenerateHobbies() {
  const key = useKey()

  return useMutation({
    mutationFn: async ({ rawText }: { rawText: string }): Promise<string> => {
      if (!rawText.trim()) throw new Error('Tell us a little about your hobbies first.')
      return callGroq(
        [
          {
            role: 'system',
            content: `You are a career coach helping someone write the Interests section of their resume.
Based on the hobbies the user describes, write ONE short, professional sentence summarising their interests.
Rules:
- Keep it to 1 sentence (max 20 words)
- Sound natural, not robotic
- Do NOT list every individual hobby literally — summarise the theme
- No first-person pronouns
- No output labels or prefixes — sentence only`,
          },
          {
            role: 'user',
            content: `My hobbies/interests: ${rawText}\n\nWrite the resume interests sentence.`,
          },
        ],
        80,
        GROQ_MODELS.FAST,
        key,
      )
    },
  })
}

// ─── Backward-compat alias ────────────────────────────────────────────────────
export const useAtsOptimize = useAtsAnalysis
