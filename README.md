# Men's Health and Food Foundation

Responsive multi-page NGO website template with Supabase-ready data:

- Public pages for Home, About, Programs, Activities, and Contact
- Admin login, forgot password request, dashboard, and activity publishing
- Volunteer login, registration, forgot password request, dashboard, help requests, and volunteer applications
- Supabase Auth for admin/volunteer login, registration, and password reset
- Supabase tables for activities, volunteer applications, and help requests
- Admin-managed activity/program image URLs and video URLs
- Browser-backed demo fallback using `localStorage` when Supabase config is empty
- Supabase schema and RLS policies in `database/schema.sql`

## Demo Credentials

Admin fallback:
- Email: `admin@mhff.org`
- Password: `admin123`

Volunteer fallback:
- Email: `volunteer@mhff.org`
- Password: `volunteer123`

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor and run `database/schema.sql`.
3. Copy `assets/js/supabase-config.example.js` values into `assets/js/supabase-config.js`.
4. Add your project URL and anon key:

```js
window.MHFF_SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-SUPABASE-ANON-KEY"
};
```

5. Create an admin account through Supabase Auth or the site register flow, then run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<AUTH_USER_UUID>';
```

## Preview

Open `index.html` in a browser. If Supabase config is empty, the site uses local demo data. If configured, admin-published activities are saved in Supabase and reflected on the Home and Activities pages.

For production, configure Supabase Auth email settings and consider adding Supabase Storage for image uploads.

## Existing Supabase Projects

If you already ran the older schema, run this migration in Supabase SQL Editor:

```sql
-- see database/add-media-and-programs.sql
```

This adds activity videos and the admin-managed `programs` table without deleting existing data.
