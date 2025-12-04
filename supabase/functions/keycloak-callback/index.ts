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
}

interface UranusGroup {
  id: string
  name: string
  alias: string
  active: boolean
}

interface UranusUserResponse {
  groups?: UranusGroup[]
  [key: string]: unknown
}

// Fetch user groups from Uranus API
async function fetchUranusGroups(accessToken: string, username: string): Promise<UranusGroup[]> {
  const uranusApiUrl = Deno.env.get('URANUS_API_URL')
  const uranusTenant = Deno.env.get('URANUS_TENANT')

  if (!uranusApiUrl || !uranusTenant) {
    console.error('Missing URANUS_API_URL or URANUS_TENANT environment variables')
    return []
  }

  try {
    const url = `${uranusApiUrl}/core/users/${username}`
    console.log('Fetching Uranus user data from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant': uranusTenant,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch Uranus user data:', response.status, errorText)
      return []
    }

    const userData: UranusUserResponse = await response.json()
    console.log('Uranus user data received:', JSON.stringify(userData, null, 2))

    return userData.groups || []
  } catch (error) {
    console.error('Error fetching Uranus user data:', error)
    return []
  }
}

// Map Uranus groups to app roles
function mapUranusGroupsToAppRole(groups: UranusGroup[]): 'admin' | 'gestor' | 'agente' {
  console.log('Mapping Uranus groups:', groups.map(g => ({ name: g.name, alias: g.alias, active: g.active })))

  // Only consider active groups
  const activeGroups = groups.filter(g => g.active)
  
  // Normalize group names and aliases for comparison
  const groupIdentifiers = activeGroups.flatMap(g => [
    g.name.toLowerCase(),
    g.alias.toLowerCase()
  ])

  console.log('Active group identifiers:', groupIdentifiers)

  // Check for Administrador or Supervisor groups - maps to gestor in the app
  const isGestorOrAdmin = groupIdentifiers.some(identifier => 
    identifier.includes('administrador') || 
    identifier.includes('supervisor') || 
    identifier.includes('admin') ||
    identifier.includes('gestor')
  )

  if (isGestorOrAdmin) {
    console.log('User has admin/gestor privileges based on Uranus groups')
    return 'gestor'
  }

  // All other users are agentes
  console.log('User assigned agente role (no admin/gestor groups found)')
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
      preferred_username: idTokenPayload.preferred_username
    })

    // Get username for Uranus API call
    const username = idTokenPayload.preferred_username || idTokenPayload.email?.split('@')[0]
    
    if (!username) {
      throw new Error('Could not determine username from token')
    }

    console.log('Fetching user groups from Uranus API for username:', username)

    // Fetch user groups from Uranus API using the access token
    const uranusGroups = await fetchUranusGroups(tokens.access_token, username)
    
    // Determine role based on Uranus groups
    const appRole = mapUranusGroupsToAppRole(uranusGroups)
    console.log('Final mapped app role:', appRole)

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

      // Update role if needed (sync with Uranus on each login)
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ perfil: appRole })
        .eq('id', userId)

      if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError)
      } else {
        console.log('User profile updated with role:', appRole)
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
