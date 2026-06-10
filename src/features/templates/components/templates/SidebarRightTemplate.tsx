/**
 * SidebarRight — Full-width colored header + RIGHT sidebar layout.
 * Structurally opposite of Modern (which has left sidebar).
 * Main left area (65%): Summary → Experience → Projects
 * Right sidebar (35%): Contact, Photo, Skills, Education, Certifications
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

function SLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <p
      style={{
        fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: accent,
        marginBottom: 5, marginTop: 12,
      }}
    >
      {children}
    </p>
  )
}

function MainSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 12, height: 2.5, background: primary, borderRadius: 2, flexShrink: 0 }} />
        <h2
          style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#111827',
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export function SidebarRightTemplate({ data }: Props) {
  const {
    personal_info: p,
    professional_summary,
    career_objective,
    work_experience,
    education,
    skills,
    strengths,
    projects,
    certifications,
    interests,
  } = data

  const fullName = [p?.first_name, p?.middle_name, p?.last_name].filter(Boolean).join(' ')
  const primary  = 'var(--resume-primary, #0f4c81)'
  const accent   = 'var(--resume-secondary, #e3f2fd)'

  const skillsByCategory: Record<string, typeof skills> = {}
  skills?.forEach(s => {
    const cat = s.category ?? 'Technical Skills'
    if (!skillsByCategory[cat]) skillsByCategory[cat] = []
    skillsByCategory[cat].push(s)
  })

  const hasPhoto = !!(p as { photo_url?: string })?.photo_url

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
        fontSize: '10px', color: '#1f2937',
        background: '#ffffff', minHeight: '1123px',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >

      {/* ── Full-width Header ── */}
      <header
        style={{
          background: primary,
          padding: '22px 28px 18px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}
      >
        {/* Photo */}
        {hasPhoto && (
          <div
            style={{
              width: 68, height: 68, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: '2.5px solid rgba(255,255,255,0.4)',
            }}
          >
            <img
              src={(p as { photo_url?: string }).photo_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 22, fontWeight: 800, color: '#ffffff',
              letterSpacing: '0.01em', lineHeight: 1.15, marginBottom: 3,
            }}
          >
            {fullName || 'Your Name'}
          </h1>
          {p?.professional_title && (
            <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
              {p.professional_title}
            </p>
          )}
        </div>
      </header>

      {/* ── Thin accent bar below header ── */}
      <div style={{ height: 4, background: accent, opacity: 0.85 }} />

      {/* ── Body: Left main + Right sidebar ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* LEFT MAIN (65%) */}
        <div style={{ flex: '0 0 65%', padding: '18px 20px 18px 28px', overflowHidden: 'visible' } as React.CSSProperties}>

          {/* Summary */}
          {(professional_summary || career_objective) && (
            <MainSection title="Profile Summary" primary={primary}>
              <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.85 }}>
                {professional_summary || career_objective}
              </p>
            </MainSection>
          )}

          {/* Experience */}
          {work_experience?.length > 0 && (
            <MainSection title="Work Experience" primary={primary}>
              {work_experience.map((exp, idx) => (
                <div key={exp.id} style={{ marginBottom: idx < work_experience.length - 1 ? 11 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: 10.5, fontWeight: 700, color: '#030712' }}>
                      {exp.position}
                    </strong>
                    <span style={{ fontSize: 9.5, color: '#6b7280', flexShrink: 0, marginLeft: 10 }}>
                      {exp.start_date && formatDate(exp.start_date + '-01')}
                      {' – '}
                      {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 9.5, color: '#4b5563', fontStyle: 'italic', marginTop: 1 }}>
                    {exp.company_name}
                    {exp.location ? `, ${exp.location}` : ''}
                  </p>
                  {exp.responsibilities?.filter(Boolean).length > 0 && (
                    <ul style={{ marginTop: 3, paddingLeft: 14 }}>
                      {exp.responsibilities.filter(Boolean).map((r, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 9.5, color: '#1f2937', lineHeight: 1.75,
                            listStyleType: 'disc', marginBottom: 2,
                          }}
                        >
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </MainSection>
          )}

          {/* Projects */}
          {projects?.length > 0 && (
            <MainSection title="Projects" primary={primary}>
              {projects.map((proj, idx) => (
                <div key={proj.id} style={{ marginBottom: idx < projects.length - 1 ? 9 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <strong style={{ fontSize: 10.5, fontWeight: 700, color: '#030712' }}>
                      {proj.name}
                    </strong>
                    {proj.technologies?.length > 0 && (
                      <span style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>
                        {proj.technologies.join(', ')}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.7, marginTop: 2 }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </MainSection>
          )}

          {/* Interests — bottom of main */}
          {interests && (
            <MainSection title="Interests" primary={primary}>
              <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.8 }}>{interests}</p>
            </MainSection>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: '#e5e7eb', flexShrink: 0 }} />

        {/* RIGHT SIDEBAR (35%) */}
        <div
          style={{
            flex: '0 0 35%', padding: '18px 20px 18px 16px',
            background: '#f9fafb',
          }}
        >

          {/* Contact */}
          <SLabel accent={primary}>Contact</SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
            {p?.email && (
              <p style={{ fontSize: 9, color: '#374151', wordBreak: 'break-all' }}>{p.email}</p>
            )}
            {p?.phone && <p style={{ fontSize: 9, color: '#374151' }}>{p.phone}</p>}
            {p?.city && p?.country && (
              <p style={{ fontSize: 9, color: '#374151' }}>{p.city}, {p.country}</p>
            )}
            {p?.linkedin_url && (
              <p style={{ fontSize: 9, color: '#374151', wordBreak: 'break-all' }}>
                {p.linkedin_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </p>
            )}
            {p?.github_url && (
              <p style={{ fontSize: 9, color: '#374151', wordBreak: 'break-all' }}>
                {p.github_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </p>
            )}
          </div>

          {/* Skills */}
          {skills?.length > 0 && (
            <>
              <SLabel accent={primary}>Skills</SLabel>
              {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                <div key={cat} style={{ marginBottom: 6 }}>
                  <p style={{ fontSize: 8.5, fontWeight: 700, color: '#374151', marginBottom: 3 }}>
                    {cat}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 4px' }}>
                    {catSkills.map(s => (
                      <span
                        key={s.id}
                        style={{
                          fontSize: 8.5, background: '#e0e7ff',
                          color: '#3730a3', borderRadius: 3,
                          padding: '1.5px 5px', fontWeight: 500,
                        }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Education */}
          {education?.length > 0 && (
            <>
              <SLabel accent={primary}>Education</SLabel>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: '#030712', lineHeight: 1.4 }}>
                    {edu.degree}{edu.program ? ` in ${edu.program}` : ''}
                  </p>
                  <p style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic' }}>{edu.school}</p>
                  {edu.end_year && (
                    <p style={{ fontSize: 9, color: '#374151' }}>Graduated: {edu.end_year}</p>
                  )}
                  {edu.honors && (
                    <p style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>{edu.honors}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && (
            <>
              <SLabel accent={primary}>Certifications</SLabel>
              {certifications.map(cert => (
                <div key={cert.id} style={{ marginBottom: 6 }}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: '#030712', lineHeight: 1.4 }}>
                    {cert.name}
                  </p>
                  <p style={{ fontSize: 9, color: '#4b5563' }}>{cert.issuing_organization}</p>
                  {cert.issue_date && (
                    <p style={{ fontSize: 9, color: '#374151' }}>
                      {formatDate(cert.issue_date + '-01')}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Personal Strengths */}
          {strengths && strengths.length > 0 && (
            <>
              <SLabel accent={primary}>Strengths</SLabel>
              <ul style={{ paddingLeft: 12, margin: 0 }}>
                {strengths.map(s => (
                  <li
                    key={s.name}
                    style={{
                      fontSize: 9.5, color: '#374151',
                      lineHeight: 1.75, listStyleType: 'disc',
                    }}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
