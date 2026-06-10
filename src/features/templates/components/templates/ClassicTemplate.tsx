/**
 * Classic — Photo-optional header + bold ruled sections + skills as "Category: items".
 * Matches a traditional professional resume (clean, ATS-friendly, hirable).
 * Single column, horizontal rule dividers, skills grouped by category inline.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

// Map legacy short-key categories → display labels
const CAT_DISPLAY: Record<string, string> = {
  technical:  'Technical Skills',
  framework:  'Frameworks & Libraries',
  platform:   'Platforms & Cloud',
  tool:       'Tools & Software',
  soft:       'Soft Skills',
  language:   'Languages',
  certification: 'Certifications',
}

function getCatLabel(cat: string): string {
  return CAT_DISPLAY[cat] ?? cat  // descriptive names pass through as-is
}

function CSection({
  title, primary, children,
}: {
  title: string
  primary: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 16 }}>
      <h2
        style={{
          fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#111827',
          marginBottom: 3,
        }}
      >
        {title}
      </h2>
      <div style={{ height: 1.5, background: `linear-gradient(to right, ${primary}, ${primary}40)`, marginBottom: 8 }} />
      {children}
    </section>
  )
}

export function ClassicTemplate({ data }: Props) {
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
  const primary  = 'var(--resume-primary, #1e293b)'

  // Group skills by category preserving insertion order
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
        fontFamily: "'Roboto', 'Inter', Arial, sans-serif",
        fontSize: '10px',
        color: '#1f2937',
        background: '#ffffff',
        minHeight: '1123px',
        padding: '36px 44px',
        boxSizing: 'border-box',
      }}
    >

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>

        {/* Photo — shown only if provided */}
        {hasPhoto && (
          <div
            style={{
              width: 76, height: 76, borderRadius: '50%',
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

        {/* Name + title + contact */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: hasPhoto ? 22 : 26,
              fontWeight: 800,
              color: '#030712',
              letterSpacing: '0.01em',
              lineHeight: 1.15,
              marginBottom: 3,
            }}
          >
            {fullName || 'Your Name'}
          </h1>

          {p?.professional_title && (
            <p
              style={{
                fontSize: 11, fontWeight: 600, color: primary,
                marginBottom: 5,
              }}
            >
              {p.professional_title}
            </p>
          )}

          {/* Contact line */}
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: '0 10px',
              fontSize: 9.5, color: '#4b5563',
            }}
          >
            {p?.city && p?.country && (
              <span>{p.city}, {p.country}</span>
            )}
            {p?.phone && <span>{p.phone}</span>}
            {p?.email && <span>{p.email}</span>}
            {p?.linkedin_url && (
              <span>
                {p.linkedin_url
                  .replace(/^https?:\/\/(www\.)?/, '')
                  .replace(/\/$/, '')}
              </span>
            )}
            {p?.github_url && (
              <span>
                {p.github_url
                  .replace(/^https?:\/\/(www\.)?/, '')
                  .replace(/\/$/, '')}
              </span>
            )}
            {p?.portfolio_url && (
              <span>
                {p.portfolio_url
                  .replace(/^https?:\/\//, '')
                  .replace(/\/$/, '')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Career Objective / Summary ── */}
      {(professional_summary || career_objective) && (
        <CSection title="Career Objective" primary={primary}>
          <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.85 }}>
            {professional_summary || career_objective}
          </p>
        </CSection>
      )}

      {/* ── Experience ── */}
      {work_experience?.length > 0 && (
        <CSection title="Work Experience" primary={primary}>
          {work_experience.map((exp, idx) => (
            <div key={exp.id} style={{ marginBottom: idx < work_experience.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 10.5, fontWeight: 700, color: '#030712' }}>
                  {exp.position}
                </strong>
                <span style={{ fontSize: 9.5, color: '#374151', flexShrink: 0, marginLeft: 12 }}>
                  {exp.start_date && formatDate(exp.start_date + '-01')}
                  {' – '}
                  {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                </span>
              </div>
              <p style={{ fontSize: 10, color: '#4b5563', fontStyle: 'italic', marginTop: 1 }}>
                {exp.company_name}
                {exp.location ? `, ${exp.location}` : ''}
                {exp.employment_type
                  ? ` · ${String(exp.employment_type).replace(/_/g, '-')}`
                  : ''}
              </p>
              {exp.responsibilities?.filter(Boolean).length > 0 && (
                <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 10, color: '#1f2937',
                        lineHeight: 1.75, listStyleType: 'disc',
                        marginBottom: 2,
                      }}
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CSection>
      )}

      {/* ── Education ── */}
      {education?.length > 0 && (
        <CSection title="Education" primary={primary}>
          {education.map((edu, idx) => (
            <div key={edu.id} style={{ marginBottom: idx < education.length - 1 ? 10 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 10.5, fontWeight: 700, color: '#030712' }}>
                  {edu.degree}{edu.program ? ` in ${edu.program}` : ''}
                </strong>
                {edu.end_year && (
                  <span style={{ fontSize: 9.5, color: '#374151', fontStyle: 'italic', flexShrink: 0, marginLeft: 12 }}>
                    Graduated: {edu.end_year}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>
                  {edu.school}
                </span>
                {edu.honors && (
                  <span style={{ fontSize: 9.5, color: '#374151', fontStyle: 'italic', flexShrink: 0, marginLeft: 12 }}>
                    {edu.honors}
                  </span>
                )}
              </div>
              {edu.gpa && (
                <span style={{ fontSize: 9.5, color: '#4b5563' }}>GPA: {edu.gpa}</span>
              )}
            </div>
          ))}
        </CSection>
      )}

      {/* ── Skills — "Category: skill1, skill2, skill3" format ── */}
      {skills?.length > 0 && (
        <CSection title="Skills" primary={primary}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <p key={cat} style={{ fontSize: 10, color: '#1f2937', lineHeight: 1.8 }}>
                <strong style={{ fontWeight: 700 }}>{getCatLabel(cat)}:</strong>
                {' '}{catSkills.map(s => s.name).join(', ')}
              </p>
            ))}
          </div>
        </CSection>
      )}

      {/* ── Personal Strengths ── */}
      {strengths && strengths.length > 0 && (
        <CSection title="Personal Strengths" primary={primary}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {strengths.map(s => (
              <li key={s.name} style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>
                • {s.name}
              </li>
            ))}
          </ul>
        </CSection>
      )}

      {/* ── Projects ── */}
      {projects?.length > 0 && (
        <CSection title="Projects" primary={primary}>
          {projects.map((proj, idx) => (
            <div key={proj.id} style={{ marginBottom: idx < projects.length - 1 ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <strong style={{ fontSize: 10.5, fontWeight: 700, color: '#030712' }}>
                  {proj.name}
                </strong>
                {proj.technologies?.length > 0 && (
                  <span style={{ fontSize: 9.5, color: '#374151', fontStyle: 'italic' }}>
                    ({proj.technologies.join(', ')})
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75, marginTop: 2 }}>
                {proj.description}
              </p>
              {(proj as { github_url?: string }).github_url && (
                <span style={{ fontSize: 9.5, color: '#374151' }}>
                  {(proj as { github_url?: string }).github_url}
                </span>
              )}
            </div>
          ))}
        </CSection>
      )}

      {/* ── Certifications ── */}
      {certifications?.length > 0 && (
        <CSection title="Certifications" primary={primary}>
          {certifications.map((cert, idx) => (
            <div
              key={cert.id}
              style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', fontSize: 10,
                marginBottom: idx < certifications.length - 1 ? 4 : 0,
              }}
            >
              <span>
                <strong style={{ fontWeight: 700 }}>{cert.name}</strong>
                <span style={{ color: '#374151' }}> — {cert.issuing_organization}</span>
              </span>
              <span style={{ color: '#4b5563', flexShrink: 0, marginLeft: 12 }}>
                {cert.issue_date && formatDate(cert.issue_date + '-01')}
              </span>
            </div>
          ))}
        </CSection>
      )}

      {/* ── Interests ── */}
      {interests && (
        <CSection title="Interests" primary={primary}>
          <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.8 }}>{interests}</p>
        </CSection>
      )}

    </div>
  )
}
