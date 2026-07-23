-- Run this migration on an existing Supabase project that already has the earlier MHFF schema.
-- It lets admins attach image/video URLs to activities and manage public programs.

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'programs' AND policyname = 'Programs are public') THEN
    CREATE POLICY "Programs are public" ON public.programs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'programs' AND policyname = 'Admins can create programs') THEN
    CREATE POLICY "Admins can create programs" ON public.programs FOR INSERT WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'programs' AND policyname = 'Admins can update programs') THEN
    CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'programs' AND policyname = 'Admins can delete programs') THEN
    CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE USING (public.is_admin());
  END IF;
END $$;

INSERT INTO public.programs (title, category, image_url, summary, body)
SELECT title, category, image_url, summary, body
FROM (
  VALUES
    ('Preventive Health Screening', 'Health', 'assets/images/health-screening.png', 'Men''s health awareness, BP checks, glucose checks, mental health conversations, and referral guidance.', 'Screening programs help men and families identify risks early and connect to basic health education.'),
    ('Emergency Food Assistance', 'Food Security', 'assets/images/food-distribution.png', 'Food distribution for vulnerable households, low-income families, and community representatives.', 'Food drives provide immediate relief while reinforcing practical household nutrition education.'),
    ('Community Wellness Workshops', 'Wellness', 'assets/images/volunteer-workshop.png', 'Nutrition, hygiene, chronic illness prevention, volunteer training, and family wellbeing education.', 'Workshops build local knowledge and prepare volunteers for accountable outreach.')
) AS seed(title, category, image_url, summary, body)
WHERE NOT EXISTS (
  SELECT 1 FROM public.programs existing WHERE existing.title = seed.title
);
