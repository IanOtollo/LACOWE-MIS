const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('--- DIAGNOSING DATABASE ---');
  
  const { data: products, error: pError } = await supabase.from('loan_products').select('*');
  if (pError) console.error('Product Error:', pError);
  console.log('Loan Products Count:', products?.length || 0);
  console.log('Active Products:', products?.filter(p => p.is_active).length || 0);
  
  const { data: profiles, error: prError } = await supabase.from('profiles').select('id, full_name, email, member_number');
  if (prError) console.error('Profile Error:', prError);
  console.log('Profiles Count:', profiles?.length || 0);
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
  
  console.log('--- END DIAGNOSIS ---');
}

diagnose();
