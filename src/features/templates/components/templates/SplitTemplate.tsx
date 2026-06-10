/**
 * Split — Balanced 50/50 two-column layout with full-width header.
 * No sidebar dominance — both columns carry equal visual weight.
 * Left: Summary + Experience | Right: Skills + Education + Strengths + Certs
 * Photo shown in header when provided.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

function Col2Section({
  title, primary, children,
}: {
  title: string; primary: string; children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 13 }}>
      <h2
        style={{
          fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.11em', color: primary,
          borderBottom: `1.5px solid ${primary}`,
          paddingBottom: 3, marginBottom: 6,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SplitTemplate({ data }: Props) {
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
  const primary  = 'var(--resume-primary, #1d4ed8)'

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

      {/* ── Full-width header ── */}
      <header
        style={{
          padding: '20px 28px',
          borderBottom: `3px solid ${primary}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        {/* Photo */}
        {hasPhoto && (
          <div
            style={{
              width: 68, height: 68, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: `2.5px solid ${primary}`,
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
              fontSize: 24, fontWeight: 800, color: '#030712',
              letterSpacing: '0.01em', lineHeight: 1.15, marginBottom: 2,
            }}
          >
            {fullName || 'Your Name'}
          </h1>
          {p?.professional_title && (
            <p style={{ fontSize: 11, fontWeight: 600, color: primary, marginBottom: 4 }}>
              {p.professional_title}
            </p>
          )}
          {/* Contact — inline */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 8px', fontSize: 9.5, color: '#4b5563' }}>
            {p?.city && p?.country && <span>{p.city}, {p.country}</span>}
            {p?.phone && <span>{p.phone}</span>}
            {p?.email && <span>{p.email}</span>}
            {p?.linkedin_url && (
              <span>
                {p.linkedin_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </span>
            )}
            {p?.github_url && (
              <span>
                {p.github_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* LEFT (50%): Summary + Experience + Projects */}
        <div style={{ flex: '0 0 50%', padding: '16px 14px 16px 28px', borderRight: '1px solid #e5e7eb' }}>

          {(professional_summary || career_objective) && (
            <Col2Section title="Profile" primary={primary}>
              <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.85 }}>
                {professional_summary || career_objective}
              </p>
            </Col2Section>
          )}

          {work_experience?.length > 0 && (
            <Col2Section title="Experience" primary={primary}>
              {work_experience.map((exp, idx) => (
                <div key={exp.id} style={{ marginBottom: idx < work_experience.length - 1 ? 10 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <strong style={{ fontSize: 10, fontWeight: 700, color: '#030712' }}>
                      {exp.position}
                    </strong>
                    <span style={{ fontSize: 9, color: '#374151' }}>
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
                    <ul style={{ marginTop: 3, paddingLeft: 13 }}>
                      {exp.responsibilities.filter(Boolean).map((r, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 9.5, color: '#1f2937',
                            lineHeight: 1.75, listStyleType: 'disc', marginBottom: 2,
                          }}
                        >
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Col2Section>
          )}

          {projects?.length > 0 && (
            <Col2Section title="Projects" primary={primary}>
              {projects.map((proj, idx) => (
                <div key={proj.id} style={{ marginBottom: idx < projects.length - 1 ? 8 : 0 }}>
                  <strong style={{ fontSize: 10, fontWeight: 700, color: '#030712' }}>
                    {proj.name}
                  </strong>
                  {proj.technologies?.length > 0 && (
                    <span style={{ fontSize: 9, color: '#374151', fontStyle: 'italic', marginLeft: 5 }}>
                      {proj.technologies.join(', ')}
                    </span>
                  )}
                  <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.7, marginTop: 2 }}>
                    {proj.description}
                  </p>
                </div>
              ))}
            </Col2Section>
          )}
        </div>

        {/* RIGHT (50%): Skills + Education + Certs + Strengths + Interests */}
        <div style={{ flex: '0 0 50%', padding: '16px 28px 16px 14px' }}>

          {skills?.length > 0 && (
            <Col2Section title="Skills" primary={primary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                  <div key={cat}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#374151', marginBottom: 2 }}>
                      {cat}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 4px' }}>
                      {catSkills.map(s => (
                        <span
                          key={s.id}
                          style={{
                            fontSize: 8.5, padding: '2px 6px',
                            background: '#eff6ff', color: '#1d4ed8',
                            borderRadius: 3, fontWeight: 500,
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Col2Section>
          )}

          {education?.length > 0 && (
            <Col2Section title="Education" primary={primary}>
              {education.map((edu, idx) => (
                <div key={edu.id} style={{ marginBottom: idx < education.length - 1 ? 8 : 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#030712', lineHeight: 1.4 }}>
                    {edu.degree}{edu.program ? ` in ${edu.program}` : ''}
                  </p>
                  <p style={{ fontSize: 9.5, color: '#4b5563', fontStyle: 'italic' }}>{edu.school}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {edu.end_year && (
                      <span style={{ fontSize: 9, color: '#9ca3af' }}>Graduated: {edu.end_year}</span>
                    )}
                    {edu.honors && (
                      <span style={{ fontSize: 9, color: '#374151', fontStyle: 'italic' }}>{edu.honors}</span>
                    )}
                  </div>
                </div>
              ))}
            </Col2Section>
          )}

          {certifications?.length > 0 && (
            <Col2Section title="Certifications" primary={primary}>
              {certifications.map((cert, idx) => (
                <div key={cert.id} style={{ marginBottom: idx < certifications.length - 1 ? 6 : 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#030712', lineHeight: 1.4 }}>
                    {cert.name}
                  </p>
                  <p style={{ fontSize: 9, color: '#4b5563' }}>{cert.issuing_organization}</p>
                </div>
              ))}
            </Col2Section>
          )}

          {strengths && strengths.length > 0 && (
            <Col2Section title="Personal Strengths" primary={primary}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {strengths.map(s => (
                  <li key={s.name} style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.75 }}>
                    • {s.name}
                  </li>
                ))}
              </ul>
            </Col2Section>
          )}

          {interests && (
            <Col2Section title="Interests" primary={primary}>
              <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.8 }}>{interests}</p>
            </Col2Section>
          )}
        </div>
      </div>
    </div>
  )
}
