# Supabase setup

## Apply schema + RLS

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste the migration file contents from:
   - `supabase/migrations/0001_lacowe_mis_schema.sql`
4. Run it.

## Admin bootstrap

After creating an auth user for `admin@lacowe.co.ke` in Supabase Auth, insert the matching row into `profiles` with role `admin` (member_number example: `LCW-ADMIN`), as described in your original instructions.

