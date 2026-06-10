/**
 * Modern — Premium two-column with rich dark sidebar.
 * Sidebar: contact + skills + strengths. Main: summary, experience, education, projects.
 * Typography: section headers 12px / body 10px (2-px hierarchy rule).
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function ModernTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, projects, certifications, interests,
  } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary = 'var(--resume-primary, #1a1a2e)'

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div
      className="bg-white text-gray-800 flex"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontSize: '11px',
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Sidebar ── */}
      <div
        className="w-52 shrink-0 text-white p-6 space-y-5"
        style={{ backgroundColor: primary, alignSelf: 'stretch' }}
      >
        {/* Photo / Avatar */}
        <div className="flex flex-col items-center text-center">
          <div
            className="h-18 w-18 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2.5px solid #ffffff', height: 72, width: 72 }}
          >
            {(p as { photo_url?: string })?.photo_url
              ? <img src={(p as { photo_url?: string }).photo_url} alt="" className="h-full w-full object-cover" />
              : <span className="text-white/80" style={{ fontSize: 24 }}>{p?.first_name?.[0]}{p?.last_name?.[0]}</span>
            }
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.25 }}>
            {fullName || 'Your Name'}
          </p>
          {p?.professional_title && (
            <p style={{ fontSize: 10, marginTop: 3, color: '#ffffff', lineHeight: 1.4 }}>
              {p.professional_title}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="space-y-2" style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
          <SidebarHeading label="Contact" />
          {p?.email    && <SidebarItem text={p.email} wrap />}
          {p?.phone    && <SidebarItem text={p.phone} />}
          {p?.city     && <SidebarItem text={`${p.city}${p.country ? `, ${p.country}` : ''}`} />}
          {p?.linkedin_url && <SidebarItem text={p.linkedin_url.replace('https://', '')} wrap />}
          {p?.github_url   && <SidebarItem text={p.github_url.replace('https://', '')} wrap />}
        </div>

        {/* Skills */}
        {skills?.length > 0 && (
          <div className="space-y-2.5" style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
            <SidebarHeading label="Skills" />
            {skillsByCategory && Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <div key={cat}>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4, color: '#ffffff' }}>
                  {cat}
                </p>
                <div className="flex flex-wrap gap-1">
                  {catSkills.map(s => (
                    <span
                      key={s.id}
                      className="rounded px-1.5 py-0.5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 9 }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Personal Strengths — separate from skills */}
        {strengths && strengths.length > 0 && (
          <div className="space-y-1.5">
            <SidebarHeading label="Strengths" />
            <div className="space-y-0.5">
              {strengths.map(s => (
                <p key={s.name} style={{ fontSize: 10, color: '#ffffff', lineHeight: 1.5 }}>
                  • {s.name}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-7 space-y-6">

        {/* Summary */}
        {professional_summary && (
          <ModSection title="Summary" primary={primary}>
            <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.75 }}>{professional_summary}</p>
          </ModSection>
        )}

        {/* Experience */}
        {work_experience?.length > 0 && (
          <ModSection title="Experience" primary={primary}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{exp.position}</p>
                    <p style={{ fontSize: 10, fontWeight: 500, marginTop: 1, color: primary }}>{exp.company_name}</p>
                  </div>
                  <p style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8, textAlign: 'right', lineHeight: 1.4 }}>
                    {exp.start_date && formatDate(exp.start_date + '-01')}<br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2" style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>
                      <span className="mt-1 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: primary, marginTop: 5 }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {exp.technologies.map(t => (
                      <span key={t} style={{ fontSize: 9, background: '#f3f4f6', color: '#6b7280', borderRadius: 3, padding: '1px 5px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Education */}
        {education?.length > 0 && (
          <ModSection title="Education" primary={primary}>
            {education.map(edu => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{edu.school}</p>
                  <p style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>{edu.start_year} – {edu.end_year ?? 'Present'}</p>
                </div>
                <p style={{ fontSize: 10, color: '#4b5563' }}>
                  {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                    {edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' · ' : ''}{edu.honors}
                  </p>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <ModSection title="Projects" primary={primary}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{proj.name}</p>
                <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2, lineHeight: 1.6 }}>{proj.description}</p>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {proj.technologies.map(t => (
                      <span key={t} style={{ fontSize: 9, background: '#f3f4f6', color: '#6b7280', borderRadius: 3, padding: '1px 5px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && (
          <ModSection title="Certifications" primary={primary}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between mb-1.5" style={{ fontSize: 10 }}>
                <span>
                  <span style={{ fontWeight: 600 }}>{cert.name}</span>
                  <span style={{ color: '#6b7280' }}> — {cert.issuing_organization}</span>
                </span>
                <span style={{ color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
          </ModSection>
        )}

        {/* Interests / Hobbies */}
        {interests && (
          <ModSection title="Interests" primary={primary}>
            <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.75 }}>{interests}</p>
          </ModSection>
        )}
      </div>
    </div>
  )
}

function SidebarHeading({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6, color: '#ffffff' }}>
      {label}
    </p>
  )
}

function SidebarItem({ text, wrap }: { text: string; wrap?: boolean }) {
  return (
    <p style={{ fontSize: 10, color: '#ffffff', wordBreak: wrap ? 'break-all' : 'normal', lineHeight: 1.5 }}>
      {text}
    </p>
  )
}

function ModSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.18em', marginBottom: 10, paddingBottom: 5,
          color: primary, borderBottom: `2px solid ${primary}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
