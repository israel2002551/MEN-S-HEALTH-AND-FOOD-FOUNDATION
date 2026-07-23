# Men's Health and Food Foundation

Responsive multi-page NGO website template with:

- Public pages for Home, About, Programs, Activities, and Contact
- Admin login, forgot password request, dashboard, and activity publishing
- Volunteer login, registration, forgot password request, dashboard, help requests, and volunteer applications
- Browser-backed demo database using `localStorage`
- Production database blueprint in `database/schema.sql`

## Demo Credentials

Admin:
- Email: `admin@mhff.org`
- Password: `admin123`

Volunteer:
- Email: `volunteer@mhff.org`
- Password: `volunteer123`

## Preview

Open `index.html` in a browser. Admin-published activities are saved in the browser's local storage and reflected on the Home and Activities pages.

For production, replace `assets/js/store.js` with a real backend API and implement secure password hashing, email reset links, file uploads, and server-side authorization.
