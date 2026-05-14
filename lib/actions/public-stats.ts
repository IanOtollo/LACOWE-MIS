'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPublicStats() {
  const supabase = createClient(true) // Using service role to bypass RLS for aggregate counts

  try {
    // 1. Get active members count
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // 2. Get total assets (sum of all account balances)
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance')
    
    const totalAssets = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0

    return {
      memberCount: memberCount || 0,
      totalAssets: totalAssets
    }
  } catch (error) {
    console.error('Error fetching public stats:', error)
    return {
      memberCount: 0,
      totalAssets: 0
    }
  }
}
