import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  await client.connect();
  console.log('Connected to PostgreSQL database...');
  try {
    await client.query('BEGIN');

    // 1. Academic Years table
    console.log('Creating academic_years table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.academic_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id UUID NOT NULL REFERENCES public.colleges(college_id) ON DELETE CASCADE,
        year_name TEXT NOT NULL,
        year_number INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_academic_year_per_college UNIQUE (college_id, year_name)
      );
    `);

    // 2. Terms Acceptances table
    console.log('Creating terms_acceptances table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.terms_acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        student_id UUID REFERENCES public.students(student_id) ON DELETE CASCADE,
        college_id UUID REFERENCES public.colleges(college_id) ON DELETE SET NULL,
        terms_version TEXT NOT NULL DEFAULT '1.0',
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 3. Canteen Accounts table
    console.log('Creating canteen_accounts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.canteen_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        canteen_id UUID NOT NULL REFERENCES public.canteens(canteen_id) ON DELETE CASCADE,
        college_id UUID NOT NULL REFERENCES public.colleges(college_id) ON DELETE CASCADE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        user_id UUID,
        contact_person TEXT,
        contact_phone TEXT,
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 4. Update students table columns
    console.log('Updating students columns...');
    await client.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;`);
    await client.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS stay_classification TEXT DEFAULT 'HOSTELLER';`);
    await client.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;`);

    // 5. Update canteens table columns
    console.log('Updating canteens columns...');
    await client.query(`ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS banner_url TEXT;`);
    await client.query(`ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS banner_public_id TEXT;`);
    await client.query(`ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS contact_person TEXT;`);
    await client.query(`ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS operating_hours TEXT;`);

    // 6. Update users table columns
    console.log('Updating users columns...');
    await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;`);
    await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;`);

    // 7. Seed standard Academic Years for all colleges
    console.log('Seeding academic years...');
    const collegesRes = await client.query('SELECT college_id, college_name FROM public.colleges');
    for (const c of collegesRes.rows) {
      const years = [
        { name: 'I Year', num: 1 },
        { name: 'II Year', num: 2 },
        { name: 'III Year', num: 3 },
        { name: 'IV Year', num: 4 }
      ];
      for (const y of years) {
        await client.query(`
          INSERT INTO public.academic_years (college_id, year_name, year_number)
          VALUES ($1, $2, $3)
          ON CONFLICT (college_id, year_name) DO NOTHING;
        `, [c.college_id, y.name, y.num]);
      }
    }

    // 8. Seed departments for colleges that need them
    console.log('Seeding departments...');
    for (const c of collegesRes.rows) {
      const depts = [
        { code: 'BSc-CS', name: 'B.Sc Computer Science' },
        { code: 'BCA', name: 'Bachelor of Computer Applications' },
        { code: 'BSc-IT', name: 'B.Sc Information Technology' },
        { code: 'BCom-CA', name: 'B.Com Computer Applications' },
        { code: 'BBA', name: 'Bachelor of Business Administration' },
        { code: 'BSc-AI', name: 'B.Sc Artificial Intelligence & Data Science' }
      ];
      for (const d of depts) {
        const check = await client.query('SELECT department_id FROM public.departments WHERE college_id = $1 AND department_code = $2', [c.college_id, d.code]);
        if (check.rows.length === 0) {
          await client.query(`
            INSERT INTO public.departments (college_id, department_code, department_name, status)
            VALUES ($1, $2, $3, 'active')
          `, [c.college_id, d.code, d.name]);
        }
      }
    }

    // 9. Sync existing canteen owner into canteen_accounts
    console.log('Syncing canteen accounts...');
    const canteenRes = await client.query('SELECT canteen_id, college_id, name FROM public.canteens LIMIT 1');
    if (canteenRes.rows.length > 0) {
      const cnt = canteenRes.rows[0];
      // Check if canteen account exists for owner@kprcanteen.com
      const userRes = await client.query("SELECT user_id, email, password_hash FROM public.users WHERE email = 'owner@kprcanteen.com'");
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        await client.query(`
          INSERT INTO public.canteen_accounts (canteen_id, college_id, username, email, password_hash, user_id, contact_person, must_change_password, status)
          VALUES ($1, $2, 'kprcanteen', $3, $4, $5, 'Canteen Manager', false, 'active')
          ON CONFLICT (email) DO NOTHING;
        `, [cnt.canteen_id, cnt.college_id, u.email, u.password_hash, u.user_id]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
