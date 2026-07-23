-- Supabase schema for Men's Health and Food Foundation.
-- Run this in Supabase SQL Editor after creating your project.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('admin', 'volunteer')),
  name TEXT NOT NULL,
  phone TEXT,
  skill TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT NOT NULL,
  image_url TEXT,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  availability TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  community TEXT NOT NULL,
  request_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, phone, skill)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'skill'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles can update own volunteer details"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'volunteer');

CREATE POLICY "Activities are public"
ON public.activities FOR SELECT
USING (true);

CREATE POLICY "Admins can create activities"
ON public.activities FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update activities"
ON public.activities FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete activities"
ON public.activities FOR DELETE
USING (public.is_admin());

CREATE POLICY "Volunteers can create applications"
ON public.volunteer_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers can read own applications and admins can read all"
ON public.volunteer_applications FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update applications"
ON public.volunteer_applications FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Volunteers can create help requests"
ON public.help_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers can read own help requests and admins can read all"
ON public.help_requests FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update help requests"
ON public.help_requests FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO public.activities (title, category, activity_date, location, image_url, summary, body)
VALUES
  ('Men''s Preventive Health Screening Camp', 'Health Screening', '2026-07-20', 'Ovia, Edo State', 'assets/images/health-screening.png', 'Free blood pressure checks, glucose screening, and health education for adult men and families.', 'Volunteers supported a community screening exercise focused on early detection, health literacy, and practical referral guidance.'),
  ('Emergency Food Assistance Outreach', 'Food Drive', '2026-07-14', 'Benin City, Edo State', 'assets/images/food-distribution.png', 'Food packs were distributed to vulnerable households with nutrition education support.', 'The outreach connected food staples with household nutrition conversations so families received immediate relief and practical guidance.'),
  ('Volunteer Wellness Planning Workshop', 'Workshop', '2026-07-05', 'Foundation office', 'assets/images/volunteer-workshop.png', 'Healthcare volunteers and community workers planned upcoming food and health outreach activities.', 'The session prepared teams for registration, beneficiary handling, health messaging, and transparent reporting.')
ON CONFLICT DO NOTHING;

-- To make an existing Supabase Auth user an admin, run this after signing up:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<AUTH_USER_UUID>';
