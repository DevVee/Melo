/**
 * Harvard — ATS-friendly single-column, classic academic layout.
 * Typography: section headers 12px / body 10px (2-px hierarchy rule).
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function HarvardTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, projects, certifications, interests,
  } = data
  const fullName = [p?.first_name, p?.middle_name, p?.last_name].filter(Boolean).join(' ')
  const photoUrl = (p as { photo_url?: string })?.photo_url
  const hasPhoto = !!photoUrl

  return (
    <div
      className="bg-white text-gray-900 p-10"
      style={{
        fontFamily: "'Roboto', 'Inter', Arial, sans-serif",
        fontSize: '10px',
        letterSpacing: '0.01em',
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Header ── */}
      <header className="text-center mb-6 pb-5" style={{ borderBottom: '2px solid #111827' }}>
        {/* Photo — centered above name when provided */}
        {hasPhoto && (
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              overflow: 'hidden', margin: '0 auto 12px',
              border: '2.5px solid #111827',
            }}
          >
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <h1
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#030712', marginBottom: 3 }}
        >
          {fullName || 'Your Name'}
        </h1>
        {p?.professional_title && (
          <p style={{ fontSize: 11, color: '#374151', fontStyle: 'italic', letterSpacing: '0.04em' }}>{p.professional_title}</p>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-3" style={{ fontSize: 10, color: '#374151' }}>
          {p?.email        && <span>{p.email}</span>}
          {p?.phone        && <span>{p.phone}</span>}
          {p?.city         && p?.country && <span>{p.city}, {p.country}</span>}
          {p?.linkedin_url && <span>{p.linkedin_url.replace('https://', '')}</span>}
          {p?.github_url   && <span>{p.github_url.replace('https://', '')}</span>}
          {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
        </div>
      </header>

      {/* ── Summary ── */}
      {professional_summary && (
        <HSection title="Professional Summary">
          <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>{professional_summary}</p>
        </HSection>
      )}

      {/* ── Experience ── */}
      {work_experience?.length > 0 && (
        <HSection title="Work Experience">
          {work_experience.map((exp) => (
            <div key={exp.id} className="mb-5">
              <div className="flex justify-between items-baseline mb-0.5">
                <strong style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{exp.position}</strong>
                <span style={{ fontSize: 10, color: '#374151', flexShrink: 0, marginLeft: 8 }}>
                  {exp.start_date && formatDate(exp.start_date + '-01')}
                  {' '}–{' '}
                  {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                </span>
              </div>
              <div className="flex justify-between mb-2" style={{ fontSize: 10, color: '#4b5563' }}>
                <span style={{ fontStyle: 'italic' }}>{exp.company_name}{exp.location ? `, ${exp.location}` : ''}</span>
                {exp.employment_type && (
                  <span style={{ textTransform: 'capitalize', color: '#4b5563' }}>{exp.employment_type.replace('_', '-')}</span>
                )}
              </div>
              <ul className="space-y-0.5 ml-4">
                {exp.responsibilities.filter(Boolean).map((r, i) => (
                  <li key={i} className="flex gap-2" style={{ fontSize: 10, color: '#1f2937', lineHeight: 1.6 }}>
                    <span style={{ marginTop: 5, height: 4, width: 4, borderRadius: '50%', background: '#4b5563', flexShrink: 0, display: 'inline-block' }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {exp.technologies?.length > 0 && (
                <p style={{ fontSize: 10, color: '#374151', marginTop: 5, marginLeft: 16 }}>
                  <em>Technologies:</em> {exp.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Education ── */}
      {education?.length > 0 && (
        <HSection title="Education">
          {education.map((edu) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <strong style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{edu.school}</strong>
                <span style={{ fontSize: 10, color: '#374151' }}>{edu.start_year} – {edu.end_year ?? 'Present'}</span>
              </div>
              <p style={{ fontSize: 10, color: '#374151', fontStyle: 'italic' }}>
                {edu.degree}{edu.program ? ` in ${edu.program}` : ''}{edu.major ? `, ${edu.major}` : ''}
              </p>
              {edu.gpa    && <p style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>GPA: {edu.gpa}</p>}
              {edu.honors && <p style={{ fontSize: 10, color: '#374151' }}>{edu.honors}</p>}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Skills ── */}
      {skills?.length > 0 && (
        <HSection title="Skills">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {skills.map((s) => (
              <span key={s.id} style={{ fontSize: 10, color: '#1f2937' }}>
                {s.name}{s.level && s.level !== 'intermediate' ? <span style={{ color: '#4b5563', fontSize: 9 }}> ({s.level})</span> : ''}
              </span>
            ))}
          </div>
        </HSection>
      )}

      {/* ── Personal Strengths ── */}
      {strengths && strengths.length > 0 && (
        <HSection title="Personal Strengths">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {strengths.map((s) => (
              <li key={s.name} style={{ fontSize: 10, color: '#1f2937', lineHeight: 1.75 }}>
                • {s.name}
              </li>
            ))}
          </ul>
        </HSection>
      )}

      {/* ── Projects ── */}
      {projects?.length > 0 && (
        <HSection title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex items-baseline gap-2">
                <strong style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{proj.name}</strong>
                {proj.technologies?.length > 0 && (
                  <span style={{ fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>({proj.technologies.join(', ')})</span>
                )}
              </div>
              <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>{proj.description}</p>
              {proj.github_url && (
                <p style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{proj.github_url.replace('https://', '')}</p>
              )}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Certifications ── */}
      {certifications?.length > 0 && (
        <HSection title="Certifications">
          {certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between mb-1.5" style={{ fontSize: 10 }}>
              <span>
                <strong style={{ fontWeight: 600 }}>{cert.name}</strong>
                <span style={{ color: '#374151' }}> — {cert.issuing_organization}</span>
              </span>
              <span style={{ fontSize: 10, color: '#374151', flexShrink: 0, marginLeft: 8 }}>
                {cert.issue_date && formatDate(cert.issue_date + '-01')}
              </span>
            </div>
          ))}
        </HSection>
      )}

      {/* ── Interests / Hobbies ── */}
      {interests && (
        <HSection title="Interests">
          <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.75 }}>{interests}</p>
        </HSection>
      )}
    </div>
  )
}

function HSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2
        style={{
          fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
          marginBottom: 8, paddingBottom: 5, letterSpacing: '0.18em', color: '#111827',
          borderBottom: '1.5px solid #1a1a1a',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
