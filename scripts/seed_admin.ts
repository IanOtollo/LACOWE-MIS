import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  console.log('Seeding admin user...');
  
  const email = 'admin@lacowe.co.ke';
  const password = 'Password123!';

  // 1. Create user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists in auth.users. Resetting password just in case...');
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === email);
      
      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, { password });
        console.log('Password reset to Password123!');
        await ensureProfile(existingUser.id);
      }
    } else {
      console.error('Error creating user:', authError);
    }
    return;
  }

  if (authData?.user) {
    console.log('User created in auth.users');
    await ensureProfile(authData.user.id);
  }
}

async function ensureProfile(userId: string) {
  // 2. Get admin role id
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .single();

  if (roleError || !roleData) {
    console.error('Error fetching admin role. Ensure migrations have run.', roleError);
    return;
  }

  // 3. Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Lacowe Admin',
      first_name: 'Lacowe',
      last_name: 'Admin',
      email: 'admin@lacowe.co.ke',
      role_id: roleData.id,
      status: 'active',
      is_first_login: false,
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Admin profile ensured.');
    console.log('----------------------------------------------------');
    console.log('SUCCESS! You can now log in with:');
    console.log('Email: admin@lacowe.co.ke');
    console.log('Password: Password123!');
    console.log('----------------------------------------------------');
  }
}

seedAdmin();
