import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate secure password
function generateSecurePassword(length: number = 24): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Generate unique admin ID
function generateAdminId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `admin_${timestamp}${randomStr}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Generate credentials
    const adminEmail = `${generateAdminId()}@admin.local`
    const adminPassword = generateSecurePassword(24)

    // Create admin user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        is_admin: true
      }
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create admin user')
    }

    // Assign admin role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: 'admin'
      })

    if (roleError) {
      // Delete user if role assignment fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw roleError
    }

    // Update profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        full_name: 'System Administrator',
        status: 'active'
      })
      .eq('user_id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Log the action
    await supabaseClient.from('system_logs').insert({
      user_id: authData.user.id,
      action: 'admin_account_created',
      resource_type: 'user',
      resource_id: authData.user.id,
      details: {
        email: adminEmail,
        created_at: new Date().toISOString()
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    })

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email: adminEmail,
          password: adminPassword,
          userId: authData.user.id
        },
        message: '⚠️ CONSERVEZ CES IDENTIFIANTS DE MANIÈRE SÉCURISÉE ⚠️',
        warning: 'Ces identifiants ne seront affichés qu\'une seule fois'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})