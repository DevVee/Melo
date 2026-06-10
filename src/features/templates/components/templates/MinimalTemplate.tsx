/**
 * Minimal — Ultra-clean single-column with vibrant left accent.
 * No emoji — pure typographic hierarchy.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function MinimalTemplate({ data }: Props) {
  const { personal_info: p, professional_summary, work_experience, education, skills, projects, certifications } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary = 'var(--resume-primary, #6366f1)'

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div
      className="bg-white text-gray-800 text-sm flex flex-col"
      style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        height: '100%',
        minHeight: '1123px',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-9 pt-9 pb-6" style={{ borderLeft: `5px solid ${primary}` }}>
        <h1 className="text-[28px] font-bold text-gray-950 tracking-tight leading-none">
          {fullName || 'Your Name'}
        </h1>
        {p?.professional_title && (
          <p className="mt-1.5 text-[14px] font-semibold" style={{ color: primary }}>
            {p.professional_title}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-gray-500">
          {p?.email        && <span>{p.email}</span>}
          {p?.phone        && <span>{p.phone}</span>}
          {p?.city         && p?.country && <span>{p.city}, {p.country}</span>}
          {p?.linkedin_url && <span>{p.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</span>}
          {p?.github_url   && <span>{p.github_url.replace('https://github.com/', 'github.com/')}</span>}
          {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
        </div>
      </header>

      <div className="px-9 pb-9 space-y-5" style={{ flex: '1' }}>
        {/* ── Summary ───────────────────────────────────────────────────────── */}
        {professional_summary && (
          <MSection title="About" primary={primary}>
            <p className="text-[13.5px] text-gray-700 leading-[1.75]">{professional_summary}</p>
          </MSection>
        )}

        {/* ── Experience ────────────────────────────────────────────────────── */}
        {work_experience?.length > 0 && (
          <MSection title="Experience" primary={primary}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-950">{exp.position}</p>
                    <p className="text-[12.5px] font-medium mt-0.5" style={{ color: primary }}>
                      {exp.company_name}{exp.location ? ` · ${exp.location}` : ''}
                    </p>
                  </div>
                  <p className="text-[12px] text-gray-400 shrink-0 ml-3 text-right">
                    {exp.start_date && formatDate(exp.start_date + '-01')}
                    <br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-gray-700 leading-[1.6]">
                      <span className="mt-[6px] h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: primary, opacity: 0.7 }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {exp.technologies.map(t => (
                      <span key={t} className="rounded-md px-2 py-0.5 text-[11px] bg-gray-100 text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* ── Education ─────────────────────────────────────────────────────── */}
        {education?.length > 0 && (
          <MSection title="Education" primary={primary}>
            {education.map(edu => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <p className="text-[14px] font-semibold text-gray-950">{edu.school}</p>
                  <p className="text-[12px] text-gray-400 shrink-0 ml-3">{edu.start_year} – {edu.end_year ?? 'Present'}</p>
                </div>
                <p className="text-[13px] text-gray-600 mt-0.5">
                  {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' · ' : ''}{edu.honors}
                  </p>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* ── Skills ────────────────────────────────────────────────────────── */}
        {skills?.length > 0 && (
          <MSection title="Skills" primary={primary}>
            {skillsByCategory && Object.entries(skillsByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                  <div key={cat} className="flex gap-3 items-start">
                    <span className="text-[11px] font-semibold capitalize text-gray-400 w-20 shrink-0 pt-0.5">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {catSkills.map(s => (
                        <span
                          key={s.id}
                          className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                          style={{ backgroundColor: `${primary}18`, color: primary }}
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
                    className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                    style={{ backgroundColor: `${primary}18`, color: primary }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </MSection>
        )}

        {/* ── Projects ──────────────────────────────────────────────────────── */}
        {projects?.length > 0 && (
          <MSection title="Projects" primary={primary}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-[14px] font-semibold text-gray-950">{proj.name}</p>
                  {proj.role && <span className="text-[12px] text-gray-400">{proj.role}</span>}
                </div>
                <p className="text-[13px] text-gray-700 mt-0.5 leading-[1.6]">{proj.description}</p>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {proj.technologies.map(t => (
                      <span key={t} className="text-[11px] text-gray-500 bg-gray-100 rounded-md px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </MSection>
        )}

        {/* ── Certifications ────────────────────────────────────────────────── */}
        {certifications?.length > 0 && (
          <MSection title="Certifications" primary={primary}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between text-[13px] mb-1.5">
                <span>
                  <span className="font-semibold text-gray-900">{cert.name}</span>
                  <span className="text-gray-500"> · {cert.issuing_organization}</span>
                </span>
                <span className="text-[12px] text-gray-400 shrink-0 ml-3">
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
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
        className="text-[10.5px] font-bold uppercase tracking-[0.2em] mb-3 pb-1.5"
        style={{ color: primary, borderBottom: `1.5px solid ${primary}35` }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
