'use server'

import { createClient } from '@/lib/supabase/server'
import { generateAccountNumber, generateMemberNumber } from '@/lib/utils/reference-generator'
import { logAudit } from './audit'

export async function createMember(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId: string
  employmentNumber: string
  department: string
  nextOfKinName: string
  nextOfKinPhone: string
  nextOfKinRelationship: string
}) {
  try {
    const serviceSupabase = createClient(true)

    const { count } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const memberNumber = generateMemberNumber(count || 0)
    const email = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@lacowe.co.ke`
    const tempPassword = `Lacowe@${memberNumber}`

    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)

    const { data: memberRole } = await serviceSupabase
      .from('roles')
      .select('id')
      .eq('name', 'member')
      .single()

    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: `${data.firstName} ${data.lastName}`,
        first_name: data.firstName,
        last_name: data.lastName,
        email,
        phone: data.phone,
        national_id: data.nationalId,
        role_id: memberRole?.id,
        member_number: memberNumber,
        employment_number: data.employmentNumber,
        department: data.department,
        next_of_kin_name: data.nextOfKinName,
        next_of_kin_phone: data.nextOfKinPhone,
        next_of_kin_relationship: data.nextOfKinRelationship,
        is_first_login: true,
      })

    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`)

    await serviceSupabase.from('accounts').insert([
      {
        member_id: authUser.user.id,
        account_number: generateAccountNumber(memberNumber, 'savings'),
        account_type: 'savings',
        account_name: 'Main Savings Account',
        balance: 0.0,
      },
      {
        member_id: authUser.user.id,
        account_number: generateAccountNumber(memberNumber, 'shares'),
        account_type: 'shares',
        account_name: 'Shares Account',
        balance: 0.0,
      },
    ])

    await serviceSupabase.from('notifications').insert({
      user_id: authUser.user.id,
      title: 'Welcome to LACOWE Welfare Group',
      message: `Your membership has been registered. Your member number is ${memberNumber}. Your login email is ${email} and your temporary password is ${tempPassword}. Please change your password upon first login.`,
      type: 'info',
    })

    await logAudit({
      action: 'CREATE_MEMBER',
      module: 'Members',
      tableName: 'profiles',
      recordId: authUser.user.id,
      newData: { memberNumber, email },
    })

    return { success: true, memberNumber, email, tempPassword }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create member')
  }
}

