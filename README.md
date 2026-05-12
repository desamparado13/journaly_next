# Journaly Next

This repo is the migration workspace for moving the existing `journaly_v2` PHP/MySQL app from XAMPP/InfinityFree into a Vercel + Supabase setup.

The migration rule is: preserve first, port second. The legacy export is kept locally under `legacy-php/`, the original database dump is kept locally under `database/source/`, and uploaded files are copied locally to `public/legacy-uploads/` so screenshots and report paths can be verified before any production cutover.

Those local migration assets are intentionally ignored by Git because they contain live database credentials, password hashes, access tokens, and private trading screenshots.

## What is included

- `legacy-php/` contains the extracted PHP app from `journalyv2.zip` locally.
- `database/source/if0_41403040_journaly_v2.sql` is the local phpMyAdmin dump from InfinityFree.
- `public/legacy-uploads/` contains the uploaded avatars, backtests, research images, trade captures, reports, trade screenshots, and trial images locally.
- `scripts/convert-mysql-dump-to-supabase.mjs` converts the MariaDB/phpMyAdmin dump into a Supabase/Postgres migration without changing table names, primary IDs, or stored path values.
- `scripts/upload-legacy-assets-to-supabase.mjs` uploads the copied `uploads/` files into a Supabase Storage bucket named `legacy-uploads`.
- `scripts/verify-legacy-export.mjs` writes `database/manifest.json` with source row counts and SHA-256 hashes for every legacy asset.

## Local setup

```bash
npm install
npm run migration:build
npm run migration:verify
npm run dev
```

On this machine, npm may need to be called directly from Laragon:

```powershell
& "C:\laragon\bin\nodejs\node-v22\npm.cmd" install
```

## Supabase setup

1. Create a fresh Supabase project.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Generate the migration:

```bash
npm run migration:build
```

4. Apply the generated local file `supabase/migrations/001_legacy_schema_and_data.sql` to the fresh Supabase database, either with Supabase CLI or the SQL editor.
5. Upload legacy assets:

```bash
npm run storage:upload
```

6. Run verification:

```bash
npm run migration:verify
```

Compare `database/manifest.json` row counts against Supabase table counts before switching traffic away from InfinityFree/XAMPP.

## Data safety notes

- Legacy numeric IDs are inserted as-is, then Postgres sequences are moved forward so new rows continue after the imported IDs.
- Stored image paths such as `uploads/backtests/...` are not rewritten in the database migration. This avoids silently breaking existing records.
- The local app also serves the copied uploads from `public/legacy-uploads/` for inspection. The Next app can later map legacy `uploads/...` paths to Supabase Storage URLs.
- Existing PHP password hashes are preserved. A Next/Supabase auth implementation still needs either PHP hash verification during login or a controlled password reset flow.

## Deployment outline

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add Supabase environment variables in Vercel.
4. Deploy a preview.
5. Verify the preview against migrated Supabase rows and Storage files.
6. Only then point production traffic at Vercel.
