/**
 * FreshGrad — Education-first two-column layout for graduates & interns.
 * Left panel (38%): Education → Skills → Strengths.
 * Right panel (62%): Experience → Projects → Certifications.
 * Typography: section headers 11px uppercase + accent bar / body 10px.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function FreshGradTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, projects, certifications, interests,
  } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary  = 'var(--resume-primary, #0369a1)'
  const photoUrl = (p as { photo_url?: string })?.photo_url
  const hasPhoto = !!photoUrl

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const hasExperience = (work_experience?.length ?? 0) > 0
  const hasProjects   = (projects?.length ?? 0) > 0

  return (
    <div
      className="bg-white text-gray-800 flex flex-col"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontSize: '10px',
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Top accent bar ── */}
      <div style={{ height: 4, backgroundColor: primary, flexShrink: 0 }} />

      {/* ── Header ── */}
      <header className="px-8 pt-6 pb-5">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {hasPhoto && (
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `2.5px solid ${primary}`,
              }}
            >
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1
              style={{ fontSize: 24, fontWeight: 700, color: '#030712', letterSpacing: '-0.01em', lineHeight: 1.15 }}
            >
              {fullName || 'Your Name'}
            </h1>
            {p?.professional_title && (
              <p style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: primary }}>
                {p.professional_title}
              </p>
            )}
            <div
              className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2.5 pt-2.5"
              style={{ fontSize: 10, color: '#374151', borderTop: `1.5px solid ${primary}` }}
            >
              {p?.email         && <span>{p.email}</span>}
              {p?.phone         && <span>{p.phone}</span>}
              {p?.city          && <span>{p.city}{p.country ? `, ${p.country}` : ''}</span>}
              {p?.linkedin_url  && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
              {p?.github_url    && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
              {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* ── Summary (full width) ── */}
      {professional_summary && (
        <div className="px-8 pb-3">
          <FSection title="About Me" primary={primary}>
            <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.8 }}>{professional_summary}</p>
          </FSection>
        </div>
      )}

      {/* ── Separator ── */}
      <div style={{ height: 1, margin: '0 32px', backgroundColor: '#e5e7eb', flexShrink: 0 }} />

      {/* ── Two-column body ── */}
      <div className="flex flex-1" style={{ gap: 0 }}>

        {/* LEFT: Education → Skills → Strengths (38%) */}
        <div
          className="flex flex-col gap-5 px-8 py-5"
          style={{
            width: '38%',
            flexShrink: 0,
            borderRight: `1.5px solid ${primary}14`,
          }}
        >
          {/* Education — prominent, top of left panel */}
          {(education?.length ?? 0) > 0 && (
            <FSection title="Education" primary={primary}>
              {education.map(edu => (
                <div key={edu.id} className="mb-4">
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#030712', lineHeight: 1.3 }}>
                    {edu.school}
                  </p>
                  {(edu.degree || edu.program) && (
                    <p style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>
                      {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                    </p>
                  )}
                  <p style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>
                    {edu.start_year} – {edu.end_year ?? 'Present'}
                  </p>
                  {edu.gpa    && <p style={{ fontSize: 10, color: '#4b5563' }}>GPA: {edu.gpa}</p>}
                  {edu.honors && (
                    <p style={{ fontSize: 10, fontWeight: 500, color: primary, marginTop: 2 }}>
                      {edu.honors}
                    </p>
                  )}
                </div>
              ))}
            </FSection>
          )}

          {/* Skills */}
          {(skills?.length ?? 0) > 0 && (
            <FSection title="Skills" primary={primary}>
              {skillsByCategory && Object.entries(skillsByCategory).length > 1 ? (
                <div className="space-y-2.5">
                  {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                    <div key={cat}>
                      <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'capitalize', color: '#4b5563', marginBottom: 4 }}>
                        {cat}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {catSkills.map(s => (
                          <span
                            key={s.id}
                            style={{
                              fontSize: 9, fontWeight: 500, borderRadius: 3,
                              padding: '2px 7px',
                              backgroundColor: `${primary}12`,
                              color: primary,
                              border: `1px solid ${primary}28`,
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {skills.map(s => (
                    <span
                      key={s.id}
                      style={{
                        fontSize: 9, fontWeight: 500, borderRadius: 3,
                        padding: '2px 7px',
                        backgroundColor: `${primary}12`,
                        color: primary,
                        border: `1px solid ${primary}28`,
                      }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </FSection>
          )}

          {/* Strengths */}
          {(strengths?.length ?? 0) > 0 && (
            <FSection title="Strengths" primary={primary}>
              <div className="space-y-0.5">
                {strengths!.map(s => (
                  <p key={s.name} style={{ fontSize: 10, color: '#374151', lineHeight: 1.65 }}>
                    • {s.name}
                  </p>
                ))}
              </div>
            </FSection>
          )}
        </div>

        {/* RIGHT: Experience → Projects → Certifications (62%) */}
        <div className="flex-1 flex flex-col gap-5 px-6 py-5">

          {/* Experience */}
          {hasExperience && (
            <FSection title="Experience" primary={primary}>
              {work_experience.map(exp => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#030712' }}>{exp.position}</p>
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
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.responsibilities.filter(Boolean).map((r, i) => (
                      <li key={i} className="flex gap-2" style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>
                        <span style={{
                          marginTop: 5, height: 3, width: 3, borderRadius: '50%',
                          flexShrink: 0, backgroundColor: primary, display: 'inline-block',
                        }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </FSection>
          )}

          {/* Projects (primary content if no experience) */}
          {hasProjects && (
            <FSection title={hasExperience ? 'Projects' : 'Projects & Activities'} primary={primary}>
              {projects.map(proj => (
                <div key={proj.id} className="mb-3">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#030712' }}>{proj.name}</p>
                    {proj.technologies?.length > 0 && (
                      <span style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic' }}>
                        ({proj.technologies.slice(0, 3).join(', ')})
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: '#374151', marginTop: 2, lineHeight: 1.65 }}>
                    {proj.description}
                  </p>
                  {(proj.github_url || proj.project_url) && (
                    <p style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>
                      {(proj.github_url ?? proj.project_url)!.replace('https://', '')}
                    </p>
                  )}
                </div>
              ))}
            </FSection>
          )}

          {/* Certifications */}
          {(certifications?.length ?? 0) > 0 && (
            <FSection title="Certifications & Training" primary={primary}>
              {certifications.map(cert => (
                <div key={cert.id} className="flex justify-between mb-2" style={{ fontSize: 10 }}>
                  <span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{cert.name}</span>
                    {cert.issuing_organization && (
                      <span style={{ color: '#6b7280' }}> · {cert.issuing_organization}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>
                    {cert.issue_date && formatDate(cert.issue_date + '-01')}
                  </span>
                </div>
              ))}
            </FSection>
          )}

          {/* Placeholder if right panel is completely empty */}
          {!hasExperience && !hasProjects && (certifications?.length ?? 0) === 0 && (
            <div style={{ paddingTop: 20, color: '#d1d5db', fontSize: 10, textAlign: 'center' }}>
              Add experience or projects to fill this section
            </div>
          )}
        </div>
      </div>

      {/* ── Interests (full width, bottom) ── */}
      {interests && (
        <div
          className="px-8 py-4"
          style={{ borderTop: `1px solid ${primary}14` }}
        >
          <FSection title="Interests" primary={primary}>
            <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>{interests}</p>
          </FSection>
        </div>
      )}
    </div>
  )
}

// ─── Section heading: small colored accent bar + uppercase label ──────────────

function FSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.16em', marginBottom: 8,
          color: primary,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span
          style={{
            height: 9, width: 3, borderRadius: 2,
            backgroundColor: primary, display: 'inline-block', flexShrink: 0,
          }}
        />
        {title}
      </h2>
      {children}
    </section>
  )
}
