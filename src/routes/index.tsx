import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactElement } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/common/PageLoader'
import { ROUTES } from '@/constants'

// ─── Lazy Page Imports ────────────────────────────────────────────────────────

// Public / Builder (no sidebar)
const LandingPage      = lazy(() => import('@/pages/LandingPage'))
const BuilderPage      = lazy(() => import('@/pages/builder/BuilderPage'))
const ResumePreview    = lazy(() => import('@/pages/resume/ResumePreviewPage'))
const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage'))

// Advanced / tool pages (with sidebar — accessible but not primary flow)
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ResumesPage      = lazy(() => import('@/pages/resume/ResumesPage'))
const ResumeNewPage    = lazy(() => import('@/pages/resume/ResumeNewPage'))
const ResumeEditPage   = lazy(() => import('@/pages/resume/ResumeEditPage'))
const TemplatesPage    = lazy(() => import('@/pages/templates/TemplatesPage'))
const AtsReportsPage   = lazy(() => import('@/pages/ats/AtsReportsPage'))
const CoverLettersPage = lazy(() => import('@/pages/resume/CoverLettersPage'))
const AdminPage        = lazy(() => import('@/pages/admin/AdminPage'))

// ─── Router ───────────────────────────────────────────────────────────────────

function wrap(element: ReactElement) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  // ── Landing ──────────────────────────────────────────────────────────────
  { path: '/', element: wrap(<LandingPage />) },

  // ── Builder wizard (no sidebar) ──────────────────────────────────────────
  { path: '/build',     element: wrap(<BuilderPage />) },
  { path: '/build/:id', element: wrap(<BuilderPage />) },

  // ── Resume preview (no sidebar — final export screen) ────────────────────
  { path: '/resumes/:id/preview', element: wrap(<ResumePreview />) },

  // ── Advanced pages (sidebar) ─────────────────────────────────────────────
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.DASHBOARD,   element: wrap(<DashboardPage />) },
      { path: ROUTES.RESUMES,     element: wrap(<ResumesPage />) },
      { path: ROUTES.RESUME_NEW,  element: wrap(<ResumeNewPage />) },
      { path: '/resumes/:id/edit', element: wrap(<ResumeEditPage />) },
      { path: ROUTES.TEMPLATES,   element: wrap(<TemplatesPage />) },
      { path: ROUTES.ATS_REPORTS, element: wrap(<AtsReportsPage />) },
      { path: ROUTES.COVER_LETTERS, element: wrap(<CoverLettersPage />) },
      { path: '/admin/*',         element: wrap(<AdminPage />) },
    ],
  },

  // Catch-all
  { path: '/404', element: wrap(<NotFoundPage />) },
  { path: '*',    element: <Navigate to="/404" replace /> },
])
