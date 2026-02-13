import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: callerRole } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (callerRole?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès réservé aux administrateurs' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { name, email, password, role } = await req.json()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Assign role
    await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role })

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
