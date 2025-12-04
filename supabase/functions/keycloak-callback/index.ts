import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenResponse {
  access_token: string
  id_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface IDTokenPayload {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
  groups?: string[]
  realm_access?: {
    roles?: string[]
  }
  resource_access?: {
    [key: string]: {
      roles?: string[]
    }
  }
}

// Map Keycloak groups/roles to app roles
function mapKeycloakRoleToAppRole(idToken: IDTokenPayload, clientId: string): 'admin' | 'gestor' | 'agente' {
  const groups = idToken.groups || []
  const realmRoles = idToken.realm_access?.roles || []
  const clientRoles = idToken.resource_access?.[clientId]?.roles || []

  // Normalize all roles/groups to lowercase for comparison
  const allRoles = [...groups, ...realmRoles, ...clientRoles].map(r => r.toLowerCase())

  console.log('Keycloak roles/groups:', { groups, realmRoles, clientRoles, allRoles })

  // Check for Administrador or Supervisor groups - maps to gestor in the app
  if (allRoles.some(r => 
    r.includes('administrador') || 
    r.includes('supervisor') || 
    r.includes('admin') || 
    r.includes('gestor')
  )) {
    return 'gestor'
  }

  // All other users are agentes
  return 'agente'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const keycloakBaseUrl = Deno.env.get('KEYCLOAK_BASE_URL')!
    const realm = Deno.env.get('KEYCLOAK_REALM')!
    const clientId = Deno.env.get('KEYCLOAK_CLIENT_ID')!
    const clientSecret = Deno.env.get('KEYCLOAK_CLIENT_SECRET')

    const { code, redirectUri } = await req.json()

    if (!code || !redirectUri) {
      throw new Error('Missing code or redirectUri')
    }

    console.log('Exchanging code for tokens with Keycloak...')

    // Exchange code for tokens
    const tokenUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
    })

    if (clientSecret) {
      tokenParams.append('client_secret', clientSecret)
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for tokens: ${errorText}`)
    }

    const tokens: TokenResponse = await tokenResponse.json()
    console.log('Tokens received from Keycloak')

    // Decode ID token (simple base64 decode)
    const idTokenParts = tokens.id_token.split('.')
    const idTokenPayload: IDTokenPayload = JSON.parse(atob(idTokenParts[1]))

    console.log('ID Token payload:', {
      sub: idTokenPayload.sub,
      email: idTokenPayload.email,
      name: idTokenPayload.name,
      groups: idTokenPayload.groups,
      realm_access: idTokenPayload.realm_access,
      resource_access: idTokenPayload.resource_access
    })

    // Determine role based on Keycloak groups
    const appRole = mapKeycloakRoleToAppRole(idTokenPayload, clientId)
    console.log('Mapped app role:', appRole)

    // Check if user exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', idTokenPayload.sub)
      .single()

    const userId = idTokenPayload.sub

    if (!existingProfile) {
      console.log('Creating new user profile...')

      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: idTokenPayload.sub,
          nome: idTokenPayload.name || idTokenPayload.preferred_username || idTokenPayload.email || 'Usuário',
          matricula: idTokenPayload.preferred_username || null,
          perfil: appRole,
          ativo: true,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        throw profileError
      }

      console.log('User profile created successfully with role:', appRole)
    } else {
      console.log('User already exists:', userId)

      // Update role if needed (sync with Keycloak on each login)
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ perfil: appRole })
        .eq('id', userId)

      if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: idTokenPayload.sub,
          email: idTokenPayload.email,
          name: idTokenPayload.name || idTokenPayload.preferred_username,
          role: appRole,
        },
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in keycloak-callback:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
