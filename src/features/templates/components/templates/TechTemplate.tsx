/**
 * Tech — Skills-first layout for developers, engineers & data analysts.
 * Thin left primary accent bar (4px). Skills at top. Projects prominent.
 * Education + Certifications in a two-column block at the bottom.
 * Typography: section headers 11px / body 10px.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function TechTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, projects, certifications, interests,
  } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary  = 'var(--resume-primary, #0ea5e9)'
  const photoUrl = (p as { photo_url?: string })?.photo_url
  const hasPhoto = !!photoUrl

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'skills'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const hasEdOrCerts = (education?.length ?? 0) > 0 || (certifications?.length ?? 0) > 0

  return (
    <div
      className="bg-white text-gray-800 flex"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontSize: '10px',
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Left accent bar (full height) ── */}
      <div style={{ width: 4, backgroundColor: primary, flexShrink: 0, alignSelf: 'stretch' }} />

      {/* ── Main content ── */}
      <div className="flex-1 px-8 py-7 space-y-5 overflow-hidden">

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 22, fontWeight: 700, color: '#030712', lineHeight: 1.1,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              }}
            >
              {fullName || 'Your Name'}
            </h1>
            {p?.professional_title && (
              <p style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: primary }}>
                {p.professional_title}
              </p>
            )}
            <div
              className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2.5"
              style={{ fontSize: 10, color: '#374151' }}
            >
              {p?.email         && <span>{p.email}</span>}
              {p?.phone         && <span>{p.phone}</span>}
              {p?.city          && <span>{p.city}{p.country ? `, ${p.country}` : ''}</span>}
              {p?.github_url    && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
              {p?.linkedin_url  && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
              {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
            </div>
          </div>
          {hasPhoto && (
            <div
              style={{
                width: 68, height: 68, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${primary}`,
              }}
            >
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </header>

        {/* ── Summary ── */}
        {professional_summary && (
          <TSection title="About" primary={primary}>
            <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.8 }}>{professional_summary}</p>
          </TSection>
        )}

        {/* ── Technical Skills (full width, prominent, at top) ── */}
        {(skills?.length ?? 0) > 0 && (
          <TSection title="Technical Skills" primary={primary}>
            {skillsByCategory && Object.entries(skillsByCategory).length > 1 ? (
              <div className="space-y-2">
                {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                  <div key={cat} className="flex gap-3 items-start">
                    <span
                      style={{
                        fontSize: 9, fontWeight: 600, textTransform: 'capitalize',
                        color: '#4b5563', width: 68, flexShrink: 0, paddingTop: 2,
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      }}
                    >
                      {cat}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {catSkills.map(s => (
                        <span
                          key={s.id}
                          style={{
                            fontSize: 9, fontWeight: 500, borderRadius: 3,
                            padding: '2px 6px', backgroundColor: '#f3f4f6',
                            color: '#374151', border: '1px solid #e5e7eb',
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
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 9, fontWeight: 500, borderRadius: 3,
                      padding: '2px 6px', backgroundColor: '#f3f4f6',
                      color: '#374151', border: '1px solid #e5e7eb',
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </TSection>
        )}

        {/* ── Experience ── */}
        {(work_experience?.length ?? 0) > 0 && (
          <TSection title="Experience" primary={primary}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#030712' }}>{exp.position}</p>
                    <p style={{ fontSize: 10, fontWeight: 500, marginTop: 1, color: primary }}>
                      {exp.company_name}{exp.location ? ` · ${exp.location}` : ''}
                      {exp.employment_type && (
                        <span style={{ color: '#4b5563', fontWeight: 400 }}>
                          {' '}· {exp.employment_type.replace('_', '-')}
                        </span>
                      )}
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
                        flexShrink: 0, marginTop: 5, height: 4, width: 4, borderRadius: '50%',
                        backgroundColor: primary, opacity: 0.55, display: 'inline-block',
                      }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {exp.technologies.map(t => (
                      <span
                        key={t}
                        style={{
                          fontSize: 9, color: '#374151', background: '#f9fafb',
                          borderRadius: 3, padding: '1px 5px', border: '1px solid #e5e7eb',
                          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TSection>
        )}

        {/* ── Projects (featured with tech stack tags) ── */}
        {(projects?.length ?? 0) > 0 && (
          <TSection title="Projects" primary={primary}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#030712' }}>
                    <span style={{ color: primary, fontFamily: "'JetBrains Mono', monospace" }}>▸ </span>
                    {proj.name}
                  </p>
                  {proj.technologies?.map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: 8, color: '#374151', background: '#f3f4f6',
                        borderRadius: 3, padding: '1px 5px', border: '1px solid #e5e7eb',
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#374151', marginTop: 3, lineHeight: 1.65 }}>
                  {proj.description}
                </p>
                {(proj.github_url || proj.project_url) && (
                  <p style={{ fontSize: 9, color: '#4b5563', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    {(proj.github_url ?? proj.project_url)!.replace('https://', '')}
                  </p>
                )}
              </div>
            ))}
          </TSection>
        )}

        {/* ── Education + Certifications (two-column at bottom) ── */}
        {hasEdOrCerts && (
          <div
            className="grid grid-cols-2 gap-8 pt-4"
            style={{ borderTop: '1px solid #f3f4f6' }}
          >
            {(education?.length ?? 0) > 0 && (
              <TSection title="Education" primary={primary}>
                {education.map(edu => (
                  <div key={edu.id} className="mb-3">
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#030712' }}>{edu.school}</p>
                    <p style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>
                      {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                    </p>
                    <p style={{ fontSize: 10, color: '#4b5563' }}>
                      {edu.start_year} – {edu.end_year ?? 'Present'}
                      {edu.honors ? ` · ${edu.honors}` : ''}
                    </p>
                  </div>
                ))}
              </TSection>
            )}

            {(certifications?.length ?? 0) > 0 && (
              <TSection title="Certifications" primary={primary}>
                {certifications.map(cert => (
                  <div key={cert.id} className="mb-2.5">
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#111827' }}>{cert.name}</p>
                    <p style={{ fontSize: 10, color: '#374151' }}>
                      {cert.issuing_organization}
                      {cert.issue_date ? ` · ${formatDate(cert.issue_date + '-01')}` : ''}
                    </p>
                  </div>
                ))}
              </TSection>
            )}
          </div>
        )}

        {/* ── Strengths + Interests (compact, bottom) ── */}
        {((strengths?.length ?? 0) > 0 || interests) && (
          <div
            className="flex gap-8 flex-wrap pt-3"
            style={{ borderTop: '1px solid #f3f4f6' }}
          >
            {(strengths?.length ?? 0) > 0 && (
              <div>
                <p
                  style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.15em', color: '#4b5563', marginBottom: 4,
                  }}
                >
                  Strengths
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {strengths!.map(s => (
                    <li key={s.name} style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>
                      • {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {interests && (
              <div>
                <p
                  style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.15em', color: '#4b5563', marginBottom: 4,
                  }}
                >
                  Interests
                </p>
                <p style={{ fontSize: 10, color: '#374151' }}>{interests}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Section heading with ▸ glyph + bottom border ────────────────────────────

function TSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.16em', marginBottom: 8, paddingBottom: 5,
          color: primary, borderBottom: `1.5px solid ${primary}28`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            color: `${primary}70`, fontWeight: 400,
          }}
        >
          ▸
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}
