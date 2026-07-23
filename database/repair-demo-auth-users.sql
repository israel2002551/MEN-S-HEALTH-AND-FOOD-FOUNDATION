-- Repairs demo Supabase Auth accounts created by SQL.
-- Run this in Supabase SQL Editor if auth.users/profiles exist but login still fails.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  admin_id UUID;
  volunteer_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'gojariafe@gmail.com' LIMIT 1;

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'gojariafe@gmail.com',
      crypt('admin123', gen_salt('bf')),
      NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Site Administrator","role":"admin","phone":"+2347044250591","skill":"Administration"}'::jsonb,
      NOW(), NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"name":"Site Administrator","role":"admin","phone":"+2347044250591","skill":"Administration"}'::jsonb,
        updated_at = NOW()
    WHERE id = admin_id;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', 'gojariafe@gmail.com', 'email_verified', true),
    'email', admin_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();

  INSERT INTO public.profiles (id, role, name, phone, skill)
  VALUES (admin_id, 'admin', 'Site Administrator', '+2347044250591', 'Administration')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      skill = EXCLUDED.skill;

  SELECT id INTO volunteer_id FROM auth.users WHERE email = 'israelefe093@gmail.com' LIMIT 1;

  IF volunteer_id IS NULL THEN
    volunteer_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      volunteer_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'israelefe093@gmail.com',
      crypt('volunteer123', gen_salt('bf')),
      NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Demo Volunteer","role":"volunteer","phone":"+2347000000000","skill":"Community worker"}'::jsonb,
      NOW(), NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('volunteer123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"name":"Demo Volunteer","role":"volunteer","phone":"+2347000000000","skill":"Community worker"}'::jsonb,
        updated_at = NOW()
    WHERE id = volunteer_id;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), volunteer_id,
    jsonb_build_object('sub', volunteer_id::text, 'email', 'israelefe093@gmail.com', 'email_verified', true),
    'email', volunteer_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();

  INSERT INTO public.profiles (id, role, name, phone, skill)
  VALUES (volunteer_id, 'volunteer', 'Demo Volunteer', '+2347000000000', 'Community worker')
  ON CONFLICT (id) DO UPDATE
  SET role = 'volunteer',
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      skill = EXCLUDED.skill;
END $$;
