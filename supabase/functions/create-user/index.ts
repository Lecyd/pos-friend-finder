import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autorisé' }, 401)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) return json({ error: 'Non autorisé' }, 401)

    const { data: callerRole } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (callerRole?.role !== 'admin') {
      return json({ error: 'Accès réservé aux administrateurs' }, 403)
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return json({ error: 'Requête invalide' }, 400)
    const { name, email, password, role } = body as Record<string, unknown>

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return json({ error: 'Nom invalide (2 à 100 caractères)' }, 400)
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof email !== 'string' || !emailRegex.test(email) || email.length > 255) {
      return json({ error: 'Email invalide' }, 400)
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return json({ error: 'Le mot de passe doit contenir entre 8 et 128 caractères' }, 400)
    }
    const validRoles = ['caissiere', 'manager', 'admin']
    if (typeof role !== 'string' || !validRoles.includes(role)) {
      return json({ error: 'Rôle invalide' }, 400)
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    })

    if (createError) {
      return json({ error: createError.message }, 400)
    }

    // Assign role
    await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role })

    return json({ success: true, user_id: newUser.user.id })
  } catch (error) {
    console.error('create-user error:', error)
    return json({ error: 'Erreur serveur' }, 500)
  }
})
