/**
 * Minimal — Ultra-clean single-column with vibrant left accent.
 * Typography: section headers 12px / body 10px (2-px hierarchy rule).
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function MinimalTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, projects, certifications, interests,
  } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary  = 'var(--resume-primary, #6366f1)'
  const photoUrl = (p as { photo_url?: string })?.photo_url
  const hasPhoto = !!photoUrl

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div
      className="bg-white text-gray-800 flex flex-col"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontSize: '11px',
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Header ── */}
      <header className="px-9 pt-9 pb-6" style={{ borderLeft: `6px solid ${primary}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#030712', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fullName || 'Your Name'}
            </h1>
            {p?.professional_title && (
              <p style={{ marginTop: 5, fontSize: 13, fontWeight: 600, color: primary }}>
                {p.professional_title}
              </p>
            )}
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3"
              style={{ fontSize: 10, color: '#374151', borderTop: `1.5px solid ${primary}` }}
            >
              {p?.email        && <span>{p.email}</span>}
              {p?.phone        && <span>{p.phone}</span>}
              {p?.city         && p?.country && <span>{p.city}, {p.country}</span>}
              {p?.linkedin_url && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
              {p?.github_url   && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
              {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
            </div>
          </div>
          {hasPhoto && (
            <div
              style={{
                width: 76, height: 76, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `2.5px solid ${primary}`,
              }}
            >
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </header>

      <div className="px-9 pb-9 space-y-5" style={{ flex: '1' }}>

        {/* Summary */}
        {professional_summary && (
          <MSection title="About" primary={primary}>
            <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>{professional_summary}</p>
          </MSection>
        )}

        {/* Experience */}
        {work_experience?.length > 0 && (
          <MSection title="Experience" primary={primary}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{exp.position}</p>
                    <p style={{ fontSize: 10, fontWeight: 500, marginTop: 1, color: primary }}>
                      {exp.company_name}{exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8, textAlign: 'right', lineHeight: 1.4 }}>
                    {exp.start_date && formatDate(exp.start_date + '-01')}
                    <br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="mt-2 space-y-0.5">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2" style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>
                      <span style={{ marginTop: 5, height: 4, width: 4, borderRadius: '50%', flexShrink: 0, backgroundColor: primary, display: 'inline-block' }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologies.map(t => (
                      <span key={t} style={{ borderRadius: 6, padding: '1px 7px', fontSize: 9, background: '#f3f4f6', color: '#6b7280' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* Education */}
        {education?.length > 0 && (
          <MSection title="Education" primary={primary}>
            {education.map(edu => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{edu.school}</p>
                  <p style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>{edu.start_year} – {edu.end_year ?? 'Present'}</p>
                </div>
                <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                  {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                    {edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' · ' : ''}{edu.honors}
                  </p>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* Skills */}
        {skills?.length > 0 && (
          <MSection title="Skills" primary={primary}>
            {skillsByCategory && Object.entries(skillsByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                  <div key={cat} className="flex gap-3 items-start">
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'capitalize', color: '#4b5563', width: 72, flexShrink: 0, paddingTop: 2 }}>{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {catSkills.map(s => (
                        <span
                          key={s.id}
                          style={{ borderRadius: 99, padding: '1px 9px', fontSize: 9, fontWeight: 500, backgroundColor: `${primary}18`, color: primary }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span
                    key={s.id}
                    style={{ borderRadius: 99, padding: '1px 9px', fontSize: 9, fontWeight: 500, backgroundColor: `${primary}18`, color: primary }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </MSection>
        )}

        {/* Personal Strengths */}
        {strengths && strengths.length > 0 && (
          <MSection title="Strengths" primary={primary}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {strengths.map(s => (
                <li key={s.name} style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>
                  • {s.name}
                </li>
              ))}
            </ul>
          </MSection>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <MSection title="Projects" primary={primary}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <div className="flex items-baseline gap-2">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{proj.name}</p>
                  {proj.role && <span style={{ fontSize: 10, color: '#4b5563' }}>{proj.role}</span>}
                </div>
                <p style={{ fontSize: 10, color: '#374151', marginTop: 2, lineHeight: 1.6 }}>{proj.description}</p>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {proj.technologies.map(t => (
                      <span key={t} style={{ fontSize: 9, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '1px 5px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && (
          <MSection title="Certifications" primary={primary}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between mb-1.5" style={{ fontSize: 10 }}>
                <span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{cert.name}</span>
                  <span style={{ color: '#6b7280' }}> · {cert.issuing_organization}</span>
                </span>
                <span style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
          </MSection>
        )}

        {/* Interests / Hobbies */}
        {interests && (
          <MSection title="Interests" primary={primary}>
            <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>{interests}</p>
          </MSection>
        )}
      </div>
    </div>
  )
}

function MSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.2em', marginBottom: 10, paddingBottom: 5,
          color: primary, borderBottom: `1.5px solid ${primary}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
