# Prosenjit Premium — Free Hosting Edition

This edition is prepared for **mobile-friendly free deployment** using:
- Render Free Web Service (Node.js + Express)
- Supabase Free Postgres database
- Admin Panel + API + multi-page website

The database is no longer local SQLite, so the website data does not depend on Render's temporary filesystem.

## Local run (optional)
1. Install Node.js 18+
2. Create a Supabase/Postgres database and copy its connection string into `DATABASE_URL`.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
4. Run `npm install`
5. Run `npm start`

## Free online deployment from mobile
### A. Create Supabase database
1. Open Supabase and create a free project.
2. Open Project Settings → Database.
3. Copy the connection string/URI for the database.
4. Keep it private. Never post it publicly.

### B. Put this project on GitHub
1. Create a GitHub account if needed.
2. Create a new repository, for example `prosenjit-premium`.
3. Upload all files from this folder, including `server.js`, `package.json`, `render.yaml`, and the `public` folder.

### C. Deploy on Render
1. Open Render and sign in with GitHub.
2. New → Web Service.
3. Select the `prosenjit-premium` repository.
4. Runtime: Node.
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Plan: Free.
8. Add environment variables:
   - `DATABASE_URL` = your Supabase Postgres connection string
   - `ADMIN_USERNAME` = your chosen admin username
   - `ADMIN_PASSWORD` = your strong admin password
   - `SESSION_SECRET` = a long random secret
   - `NODE_ENV` = `production`
9. Create Web Service.

Render provides an `onrender.com` URL after deployment.
Admin page: `https://YOUR-SITE.onrender.com/admin`

## Important
- Do not use `admin123` in production; set your own strong password.
- Keep `DATABASE_URL` and `SESSION_SECRET` private.
- Render Free Web Services can sleep after inactivity; the first request after sleep may take around a minute.
- Supabase Free projects can pause after inactivity, depending on current plan rules.
- Your admin edits are stored in Postgres, not in the Render local filesystem.

## Admin features
- Edit site content
- Add/edit/delete buttons
- Change button labels, URLs, icons, locations and order
- Add/edit/delete diary chapters
- Change Facebook/X/WhatsApp/mobile/Gmail values
