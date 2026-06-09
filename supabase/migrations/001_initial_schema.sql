-- =============================================================================
-- Melo — Initial Schema Migration
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TEMPLATES
-- =============================================================================
CREATE TABLE public.templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('ats', 'modern', 'corporate', 'creative', 'student', 'technology')),
  thumbnail   TEXT,
  premium     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- RESUMES
-- =============================================================================
CREATE TABLE public.resumes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL DEFAULT 'Untitled Resume',
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- RESUME SECTIONS
-- =============================================================================
CREATE TABLE public.resume_sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id    UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'personal_info','professional_summary','career_objective',
    'work_experience','education','skills','projects','certifications',
    'awards','languages','references','volunteer_experience',
    'trainings','seminars','organizations','publications',
    'research','achievements','interests','custom'
  )),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  content      JSONB NOT NULL DEFAULT '{}',
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX resume_sections_resume_id_idx ON public.resume_sections(resume_id);
CREATE INDEX resume_sections_sort_order_idx ON public.resume_sections(resume_id, sort_order);

CREATE TRIGGER resume_sections_updated_at
  BEFORE UPDATE ON public.resume_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ATS REPORTS
-- =============================================================================
CREATE TABLE public.ats_reports (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  score     INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  report    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- COVER LETTERS
-- =============================================================================
CREATE TABLE public.cover_letters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id    UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  job_title    TEXT,
  company_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates       ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update only their own
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  USING (auth.uid() = user_id);

-- Resumes: full CRUD on own rows
CREATE POLICY "resumes_select_own"   ON public.resumes  FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "resumes_insert_own"   ON public.resumes  FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_update_own"   ON public.resumes  FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "resumes_delete_own"   ON public.resumes  FOR DELETE  USING (auth.uid() = user_id);

-- Resume sections: scoped via resume ownership
CREATE POLICY "sections_select_own" ON public.resume_sections FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "sections_insert_own" ON public.resume_sections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "sections_update_own" ON public.resume_sections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "sections_delete_own" ON public.resume_sections FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));

-- ATS reports
CREATE POLICY "ats_select_own" ON public.ats_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "ats_insert_own" ON public.ats_reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));

-- Cover letters
CREATE POLICY "cover_select_own" ON public.cover_letters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "cover_insert_own" ON public.cover_letters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "cover_update_own" ON public.cover_letters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "cover_delete_own" ON public.cover_letters FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));

-- Templates: everyone can read, only admins can modify
CREATE POLICY "templates_select_all"   ON public.templates FOR SELECT  USING (TRUE);
CREATE POLICY "templates_admin_insert" ON public.templates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "templates_admin_update" ON public.templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- =============================================================================
-- SEED TEMPLATES
-- =============================================================================
INSERT INTO public.templates (name, category, premium) VALUES
  ('Harvard', 'ats', FALSE),
  ('Stanford', 'ats', FALSE),
  ('Oxford', 'ats', TRUE),
  ('MIT', 'ats', TRUE),
  ('Minimal', 'modern', FALSE),
  ('Clean', 'modern', FALSE),
  ('Elegant', 'modern', TRUE),
  ('Professional', 'modern', FALSE),
  ('Executive', 'corporate', TRUE),
  ('Business', 'corporate', FALSE),
  ('Finance', 'corporate', TRUE),
  ('Marketing', 'creative', TRUE),
  ('Multimedia', 'creative', TRUE),
  ('Designer', 'creative', TRUE),
  ('Internship', 'student', FALSE),
  ('Fresh Graduate', 'student', FALSE),
  ('Academic', 'student', FALSE),
  ('Software Developer', 'technology', FALSE),
  ('Engineer', 'technology', TRUE),
  ('Data Analyst', 'technology', TRUE);
