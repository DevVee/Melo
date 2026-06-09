import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useCreateResume } from '@/features/resume/hooks/useResumes'
import { TEMPLATE_CATEGORY_LABELS, ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import type { TemplateCategory } from '@/types'

const CATEGORY_TABS: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all',        label: 'All Templates' },
  { value: 'ats',        label: 'ATS Friendly' },
  { value: 'modern',     label: 'Modern' },
  { value: 'corporate',  label: 'Corporate' },
  { value: 'creative',   label: 'Creative' },
  { value: 'student',    label: 'Student' },
  { value: 'technology', label: 'Technology' },
]

// Template colour palettes for visual thumbnails
const TEMPLATE_COLORS: Record<string, { bg: string; accent: string }> = {
  Harvard:          { bg: '#1a1a2e', accent: '#e2e2e2' },
  Stanford:         { bg: '#8c1515', accent: '#ffffff' },
  Oxford:           { bg: '#002147', accent: '#d4b83a' },
  MIT:              { bg: '#750014', accent: '#ffffff' },
  Minimal:          { bg: '#6366f1', accent: '#f8f9fa' },
  Clean:            { bg: '#0f766e', accent: '#f0fdf4' },
  Elegant:          { bg: '#7c3aed', accent: '#faf5ff' },
  Professional:     { bg: '#1e40af', accent: '#eff6ff' },
  Executive:        { bg: '#0f172a', accent: '#c9a84c' },
  Business:         { bg: '#1f2937', accent: '#6b7280' },
  Finance:          { bg: '#14532d', accent: '#bbf7d0' },
  Marketing:        { bg: '#be185d', accent: '#fce7f3' },
  Multimedia:       { bg: '#ea580c', accent: '#fff7ed' },
  Designer:         { bg: '#0e7490', accent: '#ecfeff' },
  Internship:       { bg: '#4338ca', accent: '#e0e7ff' },
  'Fresh Graduate': { bg: '#0369a1', accent: '#e0f2fe' },
  Academic:         { bg: '#374151', accent: '#f9fafb' },
  'Software Developer': { bg: '#065f46', accent: '#d1fae5' },
  Engineer:         { bg: '#1e3a5f', accent: '#dbeafe' },
  'Data Analyst':   { bg: '#6d28d9', accent: '#ede9fe' },
}

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const { data: templates, isLoading } = useTemplates()
  const { mutate: createResume, isPending } = useCreateResume()
  const navigate = useNavigate()

  const filtered = activeCategory === 'all'
    ? templates
    : templates?.filter(t => t.category === activeCategory)

  function handleUseTemplate(_templateId: string, templateName: string) {
    createResume(`My ${templateName} Resume`, {
      onSuccess: (resume) => navigate(ROUTES.RESUME_EDIT(resume.id)),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a template to start building your resume.</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeCategory === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered?.map(template => {
            const colors = TEMPLATE_COLORS[template.name] ?? { bg: '#1a1a2e', accent: '#e2e2e2' }
            return (
              <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                {/* Visual thumbnail */}
                <div className="relative h-44 flex flex-col" style={{ backgroundColor: colors.bg }}>
                  {/* Mini resume preview */}
                  <div className="flex-1 p-3 space-y-2 opacity-90">
                    <div className="h-2.5 rounded w-3/4 mx-auto" style={{ backgroundColor: colors.accent, opacity: 0.8 }} />
                    <div className="h-1.5 rounded w-1/2 mx-auto" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
                    <div className="mt-3 space-y-1">
                      {[0.9, 0.7, 0.6, 0.8, 0.5].map((op, i) => (
                        <div key={i} className="h-1 rounded" style={{ backgroundColor: colors.accent, opacity: op * 0.5, width: `${60 + i * 8}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Button
                      size="sm"
                      className="shadow-lg"
                      disabled={isPending}
                      onClick={() => handleUseTemplate(template.id, template.name)}
                    >
                      {isPending ? <Loader2 className="animate-spin" /> : <Layout className="h-4 w-4" />}
                      Use Template
                    </Button>
                  </div>

                  {template.premium && (
                    <Badge className="absolute top-2 right-2 text-xs">Pro</Badge>
                  )}
                </div>

                <CardContent className="p-3">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{TEMPLATE_CATEGORY_LABELS[template.category]}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
