/**
 * Executive — Luxury corporate design. Playfair Display name header,
 * bold gold accents, premium spacing. No emoji.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function ExecutiveTemplate({ data }: Props) {
  const { personal_info: p, professional_summary, work_experience, education, skills, certifications, projects } = data
  const fullName  = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary   = 'var(--resume-primary, #0f172a)'
  const accent    = 'var(--resume-secondary, #b8922a)'

  return (
    <div
      className="bg-white text-gray-800 max-w-200 mx-auto text-sm"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ── Premium Header ────────────────────────────────────────────────── */}
      <header className="px-12 pt-10 pb-8 text-white relative overflow-hidden" style={{ backgroundColor: primary }}>
        {/* Subtle background texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,1) 0, rgba(255,255,255,1) 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}
        />
        <div className="relative">
          <h1
            className="text-[30px] font-light tracking-[0.06em] uppercase text-white leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {fullName || 'Your Name'}
          </h1>
          {p?.professional_title && (
            <p className="mt-2 text-[12.5px] font-semibold tracking-[0.25em] uppercase" style={{ color: accent }}>
              {p.professional_title}
            </p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-0.5 mt-5 text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {p?.email        && <span>{p.email}</span>}
            {p?.phone        && <span>{p.phone}</span>}
            {p?.city         && <span>{p.city}{p.country ? `, ${p.country}` : ''}</span>}
            {p?.linkedin_url && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
            {p?.github_url   && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
          </div>
        </div>
      </header>

      {/* Gold accent bar */}
      <div className="h-[3px]" style={{ backgroundColor: accent }} />

      <div className="px-12 py-8 space-y-7">

        {/* Summary */}
        {professional_summary && (
          <ESection title="Executive Summary" accent={accent}>
            <p className="text-[13.5px] text-gray-600 leading-[1.85] italic">{professional_summary}</p>
          </ESection>
        )}

        {/* Experience */}
        {work_experience?.length > 0 && (
          <ESection title="Professional Experience" accent={accent}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-6">
                <div className="flex justify-between items-start pb-1.5 mb-2.5"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-950">{exp.position}</p>
                    <p className="text-[13px] font-medium mt-0.5" style={{ color: accent }}>
                      {exp.company_name}{exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <p className="text-[12px] text-gray-400 text-right shrink-0 ml-4 leading-snug">
                    {exp.start_date && formatDate(exp.start_date + '-01')}
                    <br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] text-gray-700 leading-[1.65]">
                      <span className="shrink-0 mt-[7px] h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <p className="text-[12px] text-gray-400 mt-2">
                    {exp.technologies.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </ESection>
        )}

        {/* Two-column: Education + Competencies */}
        <div className="grid grid-cols-2 gap-10">
          {education?.length > 0 && (
            <ESection title="Education" accent={accent}>
              {education.map(edu => (
                <div key={edu.id} className="mb-3">
                  <p className="text-[14px] font-semibold text-gray-950">{edu.school}</p>
                  <p className="text-[13px] text-gray-600">{edu.degree}{edu.program ? `, ${edu.program}` : ''}</p>
                  <p className="text-[12px] text-gray-400">
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
                  <div key={s.id} className="flex items-center gap-2 text-[13px] text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </ESection>
          )}
        </div>

        {/* Projects */}
        {projects?.length > 0 && (
          <ESection title="Key Projects" accent={accent}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <p className="text-[14px] font-semibold text-gray-950">{proj.name}</p>
                <p className="text-[13.5px] text-gray-600 mt-0.5 leading-[1.65]">{proj.description}</p>
              </div>
            ))}
          </ESection>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && (
          <ESection title="Certifications" accent={accent}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between text-[13.5px] mb-1.5">
                <span>
                  <span className="font-semibold">{cert.name}</span>
                  <span className="text-gray-500"> · {cert.issuing_organization}</span>
                </span>
                <span className="text-[12px] text-gray-400 shrink-0 ml-3">
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
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
        className="text-[11px] font-black uppercase tracking-[0.2em] mb-4"
        style={{ color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
