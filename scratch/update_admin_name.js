const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAdminName() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users.users.find(u => u.email === 'admin@lacowe.co.ke');
  
  if (adminUser) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: 'Lacowe Admin',
        first_name: 'Lacowe',
        last_name: 'Admin'
      })
      .eq('id', adminUser.id);
    
    if (error) {
      console.error('Error updating admin name:', error);
    } else {
      console.log('Admin name updated to Lacowe Admin');
    }
  } else {
    console.log('Admin user not found.');
  }
}

updateAdminName();
