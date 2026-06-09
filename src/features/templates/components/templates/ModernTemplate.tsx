/**
 * Modern — Premium two-column with rich dark sidebar.
 * Sidebar: contact + skills. Main: experience, education, projects.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function ModernTemplate({ data }: Props) {
  const { personal_info: p, professional_summary, work_experience, education, skills, projects, certifications } = data
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  const primary = 'var(--resume-primary, #1a1a2e)'

  const skillsByCategory = skills?.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div
      className="bg-white text-gray-800 max-w-200 mx-auto text-sm flex min-h-full"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div
        className="w-56 shrink-0 text-white p-7 space-y-6"
        style={{ backgroundColor: primary }}
      >
        {/* Photo / Avatar */}
        <div className="flex flex-col items-center text-center">
          <div
            className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)' }}
          >
            {(p as { photo_url?: string })?.photo_url
              ? <img src={(p as { photo_url?: string }).photo_url} alt="" className="h-full w-full object-cover" />
              : <span className="text-white/80">{p?.first_name?.[0]}{p?.last_name?.[0]}</span>
            }
          </div>
          <h1 className="text-[15px] font-bold text-white leading-tight">{fullName || 'Your Name'}</h1>
          {p?.professional_title && (
            <p className="text-[11px] mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {p.professional_title}
            </p>
          )}
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <SidebarHeading label="Contact" />
          {p?.email    && <SidebarItem text={p.email} wrap />}
          {p?.phone    && <SidebarItem text={p.phone} />}
          {p?.city     && <SidebarItem text={`${p.city}${p.country ? `, ${p.country}` : ''}`} />}
          {p?.linkedin_url && <SidebarItem text={p.linkedin_url.replace('https://', '')} wrap />}
          {p?.github_url   && <SidebarItem text={p.github_url.replace('https://', '')} wrap />}
        </div>

        {/* Skills */}
        {skills?.length > 0 && (
          <div className="space-y-3">
            <SidebarHeading label="Skills" />
            {skillsByCategory && Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <div key={cat}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {cat}
                </p>
                <div className="flex flex-wrap gap-1">
                  {catSkills.map(s => (
                    <span
                      key={s.id}
                      className="rounded px-1.5 py-0.5 text-[11px]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 p-7 space-y-5">

        {/* Summary */}
        {professional_summary && (
          <ModSection title="Summary" primary={primary}>
            <p className="text-[13.5px] text-gray-600 leading-[1.75]">{professional_summary}</p>
          </ModSection>
        )}

        {/* Experience */}
        {work_experience?.length > 0 && (
          <ModSection title="Experience" primary={primary}>
            {work_experience.map(exp => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-950">{exp.position}</p>
                    <p className="text-[12.5px] font-medium mt-0.5" style={{ color: primary }}>{exp.company_name}</p>
                  </div>
                  <p className="text-[11.5px] text-gray-400 shrink-0 ml-3 text-right leading-snug">
                    {exp.start_date && formatDate(exp.start_date + '-01')}<br />
                    {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {exp.responsibilities.filter(Boolean).map((r, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-gray-700 leading-[1.6]">
                      <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: primary, opacity: 0.6 }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {exp.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologies.map(t => (
                      <span key={t} className="text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Education */}
        {education?.length > 0 && (
          <ModSection title="Education" primary={primary}>
            {education.map(edu => (
              <div key={edu.id} className="mb-3">
                <div className="flex justify-between items-start">
                  <p className="text-[14px] font-semibold text-gray-950">{edu.school}</p>
                  <p className="text-[12px] text-gray-400 shrink-0 ml-3">{edu.start_year} – {edu.end_year ?? 'Present'}</p>
                </div>
                <p className="text-[13px] text-gray-600">
                  {edu.degree}{edu.program ? ` · ${edu.program}` : ''}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' · ' : ''}{edu.honors}
                  </p>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <ModSection title="Projects" primary={primary}>
            {projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <p className="text-[14px] font-semibold text-gray-950">{proj.name}</p>
                <p className="text-[13px] text-gray-600 mt-0.5 leading-[1.6]">{proj.description}</p>
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {proj.technologies.map(t => (
                      <span key={t} className="text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ModSection>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && (
          <ModSection title="Certifications" primary={primary}>
            {certifications.map(cert => (
              <div key={cert.id} className="flex justify-between text-[13px] mb-1.5">
                <span>
                  <span className="font-semibold">{cert.name}</span>
                  <span className="text-gray-500"> — {cert.issuing_organization}</span>
                </span>
                <span className="text-[12px] text-gray-400 shrink-0 ml-3">
                  {cert.issue_date && formatDate(cert.issue_date + '-01')}
                </span>
              </div>
            ))}
          </ModSection>
        )}
      </div>
    </div>
  )
}

function SidebarHeading({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
      {label}
    </p>
  )
}

function SidebarItem({ text, wrap }: { text: string; wrap?: boolean }) {
  return (
    <p className={`text-[11.5px] ${wrap ? 'break-all' : ''}`} style={{ color: 'rgba(255,255,255,0.7)' }}>
      {text}
    </p>
  )
}

function ModSection({ title, primary, children }: { title: string; primary: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3 pb-1.5"
        style={{ color: primary, borderBottom: `2px solid ${primary}` }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
