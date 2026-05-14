const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listRoles() {
  const { data: roles, error } = await supabase.from('roles').select('*');
  if (error) {
    console.error('Error listing roles:', error);
    return;
  }
  console.log('--- Roles ---');
  console.log(roles);
}

listRoles();
