/**
 * Executive — Luxury corporate design. Poppins uppercase name, gold accents.
 * Typography: section headers 12px / body 10px (2-px hierarchy rule).
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function ExecutiveTemplate({ data }: Props) {
  const {
    personal_info: p, professional_summary, work_experience,
    education, skills, strengths, certifications, projects, interests,
  } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary  = 'var(--resume-primary, #0f172a)'
  const accent   = 'var(--resume-secondary, #b8922a)'
  const photoUrl = (p as { photo_url?: string })?.photo_url
  const hasPhoto = !!photoUrl

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
      {/* ── Premium Header ── */}
      <header className="px-12 pt-10 pb-8 text-white relative overflow-hidden" style={{ backgroundColor: primary }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,1) 0, rgba(255,255,255,1) 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}
        />
        <div className="relative flex items-start gap-5">
          <div style={{ flex: 1 }}>
            <h1
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 1, fontFamily: "'Poppins', 'Roboto', Arial, sans-serif" }}
            >
              {fullName || 'Your Name'}
            </h1>
            {p?.professional_title && (
              <p style={{ marginTop: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent }}>
                {p.professional_title}
              </p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 mt-5" style={{ fontSize: 10, color: '#ffffff' }}>
              {p?.email        && <span>{p.email}</span>}
              {p?.phone        && <span>{p.phone}</span>}
              {p?.city         && <span>{p.city}{p.country ? `, ${p.country}` : ''}</span>}
              {p?.linkedin_url && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
              {p?.github_url   && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
            </div>
          </div>
          {hasPhoto && (
            <div
              style={{
                width: 76, height: 76, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: '2.5px solid #ffffff',
              }}
            >
              <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </header>

      {/* Gold accent bar */}
      <div style={{ height: 4, backgroundColor: accent }} />

      <div className="px-12 py-8 space-y-7" style={{ flex: '1' }}>

        {/* Summary */}
        {professional_summary && (
          <ESection title="Executive Summary" accent={accent}>
            <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.85, fontStyle: 'italic' }}>{professional_summary}</p>
          </ESection>
        )}

        {/* Experience */}
        {work_experience?.length > 0 && (
          <ESection title="Professional Experience" accent={accent}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-6">
                <div className="flex justify-between items-start pb-1.5 mb-2.5"
                  style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{exp.position}</p>
                    <p style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: accent }}>
                      {exp.company_name}{exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, color: '#4b5563', textAlign: 'right', flexShrink: 0, marginLeft: 12, lineHeight: 1.4 }}>
                    {exp.start_date && formatDate(exp.start_date + '-01')}
                    <br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="space-y-1">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2" style={{ fontSize: 10, color: '#374151', lineHeight: 1.65 }}>
                      <span style={{ flexShrink: 0, marginTop: 5, height: 4, width: 4, borderRadius: '50%', backgroundColor: accent, display: 'inline-block' }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <p style={{ fontSize: 10, color: '#4b5563', marginTop: 6 }}>
                    {exp.technologies.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </ESection>
        )}

        {/* Two-column: Education + Skills/Competencies */}
        <div className="grid grid-cols-2 gap-10" style={{ borderTop: `1px solid ${accent}20`, paddingTop: 8 }}>
          {education?.length > 0 && (
            <ESection title="Education" accent={accent}>
              {education.map(edu => (
                <div key={edu.id} className="mb-3">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{edu.school}</p>
                  <p style={{ fontSize: 10, color: '#4b5563' }}>{edu.degree}{edu.program ? `, ${edu.program}` : ''}</p>
                  <p style={{ fontSize: 10, color: '#4b5563' }}>
                    {edu.start_year} – {edu.end_year ?? 'Present'}{edu.honors ? ` · ${edu.honors}` : ''}
                  </p>
                </div>
              ))}
            </ESection>
          )}

          {skills?.length > 0 && (
            <ESection title="Core Competencies" accent={accent}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {skills.map(s => (
                  <div key={s.id} className="flex items-center gap-2" style={{ fontSize: 10, color: '#374151' }}>
                    <span style={{ height: 5, width: 5, borderRadius: '50%', flexShrink: 0, backgroundColor: accent, display: 'inline-block' }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </ESection>
          )}
        </div>

        {/* Personal Strengths */}
        {strengths && strengths.length > 0 && (
          <ESection title="Personal Strengths" accent={accent}>
            <div className="flex flex-wrap gap-2">
              {strengths.map(s => (
                <span
                  key={s.name}
                  style={{ fontSize: 9, border: `1px solid ${accent}55`, color: '#374151', borderRadius: 3, padding: '2px 8px', backgroundColor: `${accent}0a` }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </ESection>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <ESection title="Key Projects" accent={accent}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <p style={{ fontSize: 12, fontWeight: 600, color: '#030712' }}>{proj.name}</p>
                <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2, lineHeight: 1.65 }}>{proj.description}</p>
              </div>
            ))}
          </ESection>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && (
          <ESection title="Certifications" accent={accent}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between mb-1.5" style={{ fontSize: 10 }}>
                <span>
                  <span style={{ fontWeight: 600 }}>{cert.name}</span>
                  <span style={{ color: '#6b7280' }}> · {cert.issuing_organization}</span>
                </span>
                <span style={{ fontSize: 10, color: '#4b5563', flexShrink: 0, marginLeft: 8 }}>
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
          </ESection>
        )}

        {/* Interests / Hobbies */}
        {interests && (
          <ESection title="Interests" accent={accent}>
            <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.75 }}>{interests}</p>
          </ESection>
        )}
      </div>
    </div>
  )
}

function ESection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.2em', marginBottom: 12, color: accent,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
