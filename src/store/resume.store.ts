import { create } from 'zustand'
import type { TemplateCustomization } from '@/types'

type ResumeState = {
  activeResumeId: string | null
  activeTemplateId: string | null
  customization: TemplateCustomization
  isDirty: boolean

  setActiveResume: (id: string | null) => void
  setActiveTemplate: (id: string | null) => void
  setCustomization: (customization: Partial<TemplateCustomization>) => void
  setDirty: (dirty: boolean) => void
  reset: () => void
}

const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  font_family: 'Inter',
  font_size: 11,
  primary_color: '#1a1a2e',
  secondary_color: '#6366f1',
  margins: 40,
  line_height: 1.5,
  show_photo: false,
}

export const useResumeStore = create<ResumeState>()((set) => ({
  activeResumeId: null,
  activeTemplateId: null,
  customization: DEFAULT_CUSTOMIZATION,
  isDirty: false,

  setActiveResume: (activeResumeId) => set({ activeResumeId }),
  setActiveTemplate: (activeTemplateId) => set({ activeTemplateId }),
  setCustomization: (partial) =>
    set((state) => ({ customization: { ...state.customization, ...partial } })),
  setDirty: (isDirty) => set({ isDirty }),
  reset: () =>
    set({ activeResumeId: null, activeTemplateId: null, customization: DEFAULT_CUSTOMIZATION, isDirty: false }),
}))
