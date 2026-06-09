/**
 * All resume data lives here — persisted to localStorage.
 * No Supabase, no auth, no server needed.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonalInfo = {
  firstName: string
  lastName: string
  professionalTitle: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  linkedin: string
  website: string
  summary: string
}

export type WorkEntry = {
  id: string
  company: string
  position: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  bullets: string[]
}

export type EducationEntry = {
  id: string
  school: string
  degree: string
  program: string
  startDate: string
  endDate: string
  gpa: string
  honors: string
}

export type SkillEntry = {
  id: string
  name: string
  level: string
  category: string
}

export type BuilderState = {
  groqApiKey: string
  templateId: string
  templateName: string
  profilePhoto: string      // base64 data URL — user's photo for the resume
  personal: PersonalInfo
  experience: WorkEntry[]
  education: EducationEntry[]
  skills: SkillEntry[]
  targetJobTitle: string
  targetCountry: string
  targetCity: string

  // Actions
  setGroqApiKey: (key: string) => void
  setTemplate: (id: string, name: string) => void
  setProfilePhoto: (photo: string) => void
  updatePersonal: (data: Partial<PersonalInfo>) => void
  setTargetJob: (title: string) => void
  setTargetLocation: (city: string, country: string) => void
  addExperience: () => void
  updateExperience: (id: string, data: Partial<WorkEntry>) => void
  removeExperience: (id: string) => void
  // Fine-grained bullet actions — always read from fresh store state
  updateBullet: (entryId: string, index: number, value: string) => void
  addBullet: (entryId: string) => void
  removeBullet: (entryId: string, index: number) => void
  setBullets: (entryId: string, bullets: string[]) => void
  addEducation: () => void
  updateEducation: (id: string, data: Partial<EducationEntry>) => void
  removeEducation: (id: string) => void
  addSkill: (skill: Omit<SkillEntry, 'id'>) => void
  removeSkill: (id: string) => void
  reset: () => void
}

// ─── Default values ───────────────────────────────────────────────────────────

const defaultPersonal: PersonalInfo = {
  firstName: '', lastName: '', professionalTitle: '',
  email: '', phone: '', address: '', city: '', country: '',
  linkedin: '', website: '', summary: '',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      groqApiKey: '',
      templateId: '',
      templateName: 'Minimal',
      profilePhoto: '',
      personal: defaultPersonal,
      experience: [],
      education: [],
      skills: [],
      targetJobTitle: '',
      targetCountry: '',
      targetCity: '',

      setGroqApiKey: (groqApiKey) => set({ groqApiKey }),
      setTemplate: (templateId, templateName) => set({ templateId, templateName }),
      setProfilePhoto: (profilePhoto) => set({ profilePhoto }),
      setTargetJob: (targetJobTitle) => set({ targetJobTitle }),
      setTargetLocation: (targetCity, targetCountry) => set({ targetCity, targetCountry }),

      updatePersonal: (data) =>
        set((s) => ({ personal: { ...s.personal, ...data } })),

      addExperience: () =>
        set((s) => ({
          experience: [...s.experience, {
            id: crypto.randomUUID(),
            company: '', position: '', employmentType: 'full_time',
            location: '', startDate: '', endDate: '', isCurrent: false,
            bullets: [''],
          }],
        })),

      updateExperience: (id, data) =>
        set((s) => ({
          experience: s.experience.map(e => e.id === id ? { ...e, ...data } : e),
        })),

      removeExperience: (id) =>
        set((s) => ({ experience: s.experience.filter(e => e.id !== id) })),

      // Bullet actions — always derived from current state to prevent stale closure bugs
      updateBullet: (entryId, index, value) =>
        set(s => ({
          experience: s.experience.map(e =>
            e.id === entryId
              ? { ...e, bullets: e.bullets.map((b, i) => i === index ? value : b) }
              : e
          ),
        })),

      addBullet: (entryId) =>
        set(s => ({
          experience: s.experience.map(e =>
            e.id === entryId ? { ...e, bullets: [...e.bullets, ''] } : e
          ),
        })),

      removeBullet: (entryId, index) =>
        set(s => ({
          experience: s.experience.map(e =>
            e.id === entryId
              ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) }
              : e
          ),
        })),

      setBullets: (entryId, bullets) =>
        set(s => ({
          experience: s.experience.map(e => e.id === entryId ? { ...e, bullets } : e),
        })),

      addEducation: () =>
        set((s) => ({
          education: [...s.education, {
            id: crypto.randomUUID(),
            school: '', degree: '', program: '',
            startDate: '', endDate: '', gpa: '', honors: '',
          }],
        })),

      updateEducation: (id, data) =>
        set((s) => ({
          education: s.education.map(e => e.id === id ? { ...e, ...data } : e),
        })),

      removeEducation: (id) =>
        set((s) => ({ education: s.education.filter(e => e.id !== id) })),

      addSkill: (skill) =>
        set((s) => ({
          skills: [...s.skills, { ...skill, id: crypto.randomUUID() }],
        })),

      removeSkill: (id) =>
        set((s) => ({ skills: s.skills.filter(sk => sk.id !== id) })),

      reset: () => set({
        templateId: '', templateName: 'Minimal', profilePhoto: '',
        personal: defaultPersonal, experience: [], education: [], skills: [],
        targetJobTitle: '', targetCountry: '', targetCity: '',
      }),
    }),
    {
      name: 'melo-resume',
      // Persist everything except actions
      partialize: (s) => ({
        groqApiKey: s.groqApiKey,
        templateId: s.templateId,
        templateName: s.templateName,
        profilePhoto: s.profilePhoto,
        personal: s.personal,
        experience: s.experience,
        education: s.education,
        skills: s.skills,
        targetJobTitle: s.targetJobTitle,
        targetCountry: s.targetCountry,
        targetCity: s.targetCity,
      }),
    }
  )
)

// ─── Convert store → section format for ResumePreviewPanel ───────────────────

export function storeToSections(s: Pick<BuilderState, 'personal' | 'experience' | 'education' | 'skills' | 'profilePhoto'>) {
  return [
    {
      section_type: 'personal_info', sort_order: 0, is_visible: true,
      content: {
        first_name: s.personal.firstName,
        last_name: s.personal.lastName,
        professional_title: s.personal.professionalTitle,
        email: s.personal.email,
        phone: s.personal.phone,
        address: s.personal.address,
        city: s.personal.city,
        country: s.personal.country,
        linkedin: s.personal.linkedin,
        linkedin_url: s.personal.linkedin,
        website: s.personal.website,
        portfolio_url: s.personal.website,
        photo_url: s.profilePhoto || undefined,
      },
    },
    {
      section_type: 'professional_summary', sort_order: 1, is_visible: !!s.personal.summary,
      content: { text: s.personal.summary },
    },
    {
      section_type: 'work_experience', sort_order: 2, is_visible: s.experience.length > 0,
      content: {
        entries: s.experience.map(e => ({
          id: e.id,
          company_name: e.company,
          position: e.position,
          employment_type: e.employmentType,
          location: e.location,
          start_date: e.startDate,
          end_date: e.endDate,
          is_current: e.isCurrent,
          responsibilities: e.bullets,
          achievements: [],
          technologies: [],
        })),
      },
    },
    {
      section_type: 'education', sort_order: 3, is_visible: s.education.length > 0,
      content: {
        entries: s.education.map(e => ({
          id: e.id,
          school: e.school,
          degree: e.degree,
          program: e.program,
          start_date: e.startDate,
          end_date: e.endDate,
          gpa: e.gpa,
          honors: e.honors,
        })),
      },
    },
    {
      section_type: 'skills', sort_order: 4, is_visible: s.skills.length > 0,
      content: {
        items: s.skills.map(sk => ({
          id: sk.id,
          name: sk.name,
          level: sk.level,
          category: sk.category,
        })),
      },
    },
  ]
}
