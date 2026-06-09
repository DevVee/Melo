/**
 * Harvard — ATS-friendly single-column, classic academic layout.
 * Uses EB Garamond for elegant, print-quality typography.
 */
import type { ResumeData } from '../../types'
import { formatDate } from '@/lib/utils'

type Props = { data: ResumeData }

export function HarvardTemplate({ data }: Props) {
  const { personal_info: p, professional_summary, work_experience, education, skills, projects, certifications } = data
  const fullName = [p?.first_name, p?.middle_name, p?.last_name].filter(Boolean).join(' ')

  return (
    <div
      className="bg-white text-gray-900 p-10 max-w-[800px] mx-auto text-sm leading-relaxed"
      style={{ fontFamily: "'Roboto', 'Inter', Arial, sans-serif" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="text-center mb-6 pb-5 border-b-2 border-gray-900">
        <h1
          className="text-[26px] font-bold tracking-[0.12em] uppercase text-gray-950 mb-1"
          style={{ letterSpacing: '0.12em' }}
        >
          {fullName || 'Your Name'}
        </h1>
        {p?.professional_title && (
          <p className="text-[13px] text-gray-500 italic mt-0.5 tracking-wide">{p.professional_title}</p>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-3 text-[12px] text-gray-600">
          {p?.email        && <span>{p.email}</span>}
          {p?.phone        && <span>{p.phone}</span>}
          {p?.city         && p?.country && <span>{p.city}, {p.country}</span>}
          {p?.linkedin_url && <span>{p.linkedin_url.replace('https://', '')}</span>}
          {p?.github_url   && <span>{p.github_url.replace('https://', '')}</span>}
          {p?.portfolio_url && <span>{p.portfolio_url.replace('https://', '')}</span>}
        </div>
      </header>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {professional_summary && (
        <HSection title="Professional Summary">
          <p className="text-[13.5px] text-gray-700 leading-[1.75]">{professional_summary}</p>
        </HSection>
      )}

      {/* ── Experience ────────────────────────────────────────────────────── */}
      {work_experience?.length > 0 && (
        <HSection title="Work Experience">
          {work_experience.map((exp) => (
            <div key={exp.id} className="mb-5">
              <div className="flex justify-between items-baseline mb-0.5">
                <strong className="text-[14px] font-semibold text-gray-900">{exp.position}</strong>
                <span className="text-[12px] text-gray-500 shrink-0 ml-3">
                  {exp.start_date && formatDate(exp.start_date + '-01')}
                  {' '}–{' '}
                  {exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date + '-01') : ''}
                </span>
              </div>
              <div className="flex justify-between text-[12.5px] text-gray-600 mb-2">
                <span className="italic">{exp.company_name}{exp.location ? `, ${exp.location}` : ''}</span>
                {exp.employment_type && (
                  <span className="capitalize text-gray-400">{exp.employment_type.replace('_', '-')}</span>
                )}
              </div>
              <ul className="space-y-1 ml-4">
                {exp.responsibilities.filter(Boolean).map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] text-gray-800 leading-[1.6]">
                    <span className="mt-[6px] h-1 w-1 rounded-full bg-gray-600 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {exp.technologies?.length > 0 && (
                <p className="text-[12px] text-gray-500 mt-1.5 ml-4">
                  <em>Technologies:</em> {exp.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Education ─────────────────────────────────────────────────────── */}
      {education?.length > 0 && (
        <HSection title="Education">
          {education.map((edu) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <strong className="text-[14px] font-semibold text-gray-900">{edu.school}</strong>
                <span className="text-[12px] text-gray-500">{edu.start_year} – {edu.end_year ?? 'Present'}</span>
              </div>
              <p className="text-[13.5px] text-gray-700 italic">
                {edu.degree}{edu.program ? ` in ${edu.program}` : ''}{edu.major ? `, ${edu.major}` : ''}
              </p>
              {edu.gpa    && <p className="text-[12px] text-gray-500 mt-0.5">GPA: {edu.gpa}</p>}
              {edu.honors && <p className="text-[12px] text-gray-500">{edu.honors}</p>}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Skills ────────────────────────────────────────────────────────── */}
      {skills?.length > 0 && (
        <HSection title="Skills">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {skills.map((s) => (
              <span key={s.id} className="text-[13.5px] text-gray-800">
                {s.name}{s.level && s.level !== 'intermediate' ? <span className="text-gray-400 text-[12px]"> ({s.level})</span> : ''}
              </span>
            ))}
          </div>
        </HSection>
      )}

      {/* ── Projects ──────────────────────────────────────────────────────── */}
      {projects?.length > 0 && (
        <HSection title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex items-baseline gap-2">
                <strong className="text-[14px] font-semibold text-gray-900">{proj.name}</strong>
                {proj.technologies?.length > 0 && (
                  <span className="text-[12px] text-gray-400 italic">({proj.technologies.join(', ')})</span>
                )}
              </div>
              <p className="text-[13.5px] text-gray-700 leading-[1.6]">{proj.description}</p>
              {proj.github_url && (
                <p className="text-[12px] text-gray-500 mt-0.5">{proj.github_url.replace('https://', '')}</p>
              )}
            </div>
          ))}
        </HSection>
      )}

      {/* ── Certifications ────────────────────────────────────────────────── */}
      {certifications?.length > 0 && (
        <HSection title="Certifications">
          {certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between text-[13.5px] mb-1.5">
              <span>
                <strong className="font-semibold">{cert.name}</strong>
                <span className="text-gray-500"> — {cert.issuing_organization}</span>
              </span>
              <span className="text-[12px] text-gray-500 shrink-0 ml-3">
                {cert.issue_date && formatDate(cert.issue_date + '-01')}
              </span>
            </div>
          ))}
        </HSection>
      )}
    </div>
  )
}

function HSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2
        className="text-[11px] font-bold uppercase mb-2 pb-1 tracking-[0.18em] text-gray-900"
        style={{ borderBottom: '1.5px solid #1a1a1a' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
