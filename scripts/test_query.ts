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

async function testQuery() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users.users[0]?.id;

  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', userId)
      .single();
    
    console.log('Query result:', { data, error });
  } else {
    console.log('No user found to test with.');
  }
}

testQuery();
