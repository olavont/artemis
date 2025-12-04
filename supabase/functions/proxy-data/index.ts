import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, userId, params } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log(`Proxy request: action=${action}, userId=${userId}`)

    // Verify user exists and get their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, perfil, ativo')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found:', profileError)
      throw new Error('User not found or inactive')
    }

    if (!profile.ativo) {
      throw new Error('User is inactive')
    }

    const isGestorOrAdmin = profile.perfil === 'gestor' || profile.perfil === 'admin'
    console.log(`User role: ${profile.perfil}, isGestorOrAdmin: ${isGestorOrAdmin}`)

    let data: any = null
    let error: any = null

    switch (action) {
      case 'get_my_profile':
        // Return the current user's profile
        data = {
          id: profile.id,
          nome: profile.nome,
          perfil: profile.perfil,
          ativo: profile.ativo
        }
        break

      case 'get_viaturas':
        if (isGestorOrAdmin) {
          const result = await supabase
            .from('viaturas')
            .select('*')
            .order('prefixo', { ascending: true })
          data = result.data
          error = result.error
        } else {
          throw new Error('Unauthorized: Only gestors and admins can view vehicles')
        }
        break

      case 'get_viatura':
        if (isGestorOrAdmin) {
          const result = await supabase
            .from('viaturas')
            .select('*')
            .eq('id', params.id)
            .single()
          data = result.data
          error = result.error
        } else {
          throw new Error('Unauthorized')
        }
        break

      case 'get_itens':
        // All authenticated users can see items
        const itensResult = await supabase
          .from('itens_viatura')
          .select('*')
          .order('nome', { ascending: true })
        data = itensResult.data
        error = itensResult.error
        break

      case 'get_protocolos':
        if (isGestorOrAdmin) {
          // Gestors/admins see all protocols
          const protocolosResult = await supabase
            .from('protocolos_empenho')
            .select(`
              *,
              viatura:viaturas(prefixo, placa, modelo),
              agente:profiles!protocolos_empenho_agente_responsavel_id_fkey(nome)
            `)
            .order('created_at', { ascending: false })
          data = protocolosResult.data
          error = protocolosResult.error
        } else {
          // Agents see only their own protocols
          const protocolosResult = await supabase
            .from('protocolos_empenho')
            .select(`
              *,
              viatura:viaturas(prefixo, placa, modelo),
              agente:profiles!protocolos_empenho_agente_responsavel_id_fkey(nome)
            `)
            .eq('agente_responsavel_id', userId)
            .order('created_at', { ascending: false })
          data = protocolosResult.data
          error = protocolosResult.error
        }
        break

      case 'get_protocolo':
        const protocoloResult = await supabase
          .from('protocolos_empenho')
          .select(`
            *,
            viatura:viaturas(*),
            agente:profiles!protocolos_empenho_agente_responsavel_id_fkey(nome, matricula),
            devolucao:protocolos_devolucao(*),
            checklist_empenho:checklists_veiculo!checklists_veiculo_protocolo_empenho_id_fkey(*)
          `)
          .eq('id', params.id)
          .single()

        // Check access
        if (!isGestorOrAdmin && protocoloResult.data?.agente_responsavel_id !== userId) {
          throw new Error('Unauthorized')
        }
        data = protocoloResult.data
        error = protocoloResult.error
        break

      case 'get_viatura_itens_config':
        const configResult = await supabase
          .from('viatura_itens_config')
          .select(`
            *,
            item:itens_viatura(*)
          `)
          .eq('viatura_id', params.viatura_id)
        data = configResult.data
        error = configResult.error
        break

      case 'get_profiles':
        if (isGestorOrAdmin) {
          const profilesResult = await supabase
            .from('profiles')
            .select('*')
            .order('nome', { ascending: true })
          data = profilesResult.data
          error = profilesResult.error
        } else {
          throw new Error('Unauthorized')
        }
        break

      case 'get_viaturas_disponiveis':
        const disponiveisResult = await supabase
          .from('viaturas')
          .select('*')
          .eq('status_operacional', 'disponivel')
          .order('prefixo', { ascending: true })
        data = disponiveisResult.data
        error = disponiveisResult.error
        break

      case 'get_dashboard_stats':
        if (isGestorOrAdmin) {
          // Get vehicle counts by status
          const viaturasResult = await supabase
            .from('viaturas')
            .select('status_operacional')

          const protocolosAtivosResult = await supabase
            .from('protocolos_empenho')
            .select('id')
            .eq('status', 'em_andamento')

          data = {
            viaturas: viaturasResult.data,
            protocolosAtivos: protocolosAtivosResult.data?.length || 0
          }
          error = viaturasResult.error || protocolosAtivosResult.error
        } else {
          // Agent sees only their active protocols
          const meusProtocolosResult = await supabase
            .from('protocolos_empenho')
            .select('id')
            .eq('agente_responsavel_id', userId)
            .eq('status', 'em_andamento')

          data = {
            meusProtocolosAtivos: meusProtocolosResult.data?.length || 0
          }
          error = meusProtocolosResult.error
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    if (error) {
      console.error('Query error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ data, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in proxy-data:', error)
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
