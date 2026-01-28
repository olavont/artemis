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

    // Special case: allow creating/updating the profile BEFORE enforcing "profile exists".
    // This is required for Keycloak users that don't have a Supabase JWT (RLS blocks direct upserts from the frontend).
    if (action === 'sync_profile') {
      const incoming = params?.profile
      if (!incoming?.id || incoming.id !== userId) {
        throw new Error('Invalid profile payload (missing id or id mismatch)')
      }

      const upsertPayload = {
        id: incoming.id,
        nome: incoming.nome,
        matricula: incoming.matricula ?? null,
        perfil: incoming.perfil ?? 'agente',
        ativo: incoming.ativo ?? true,
        tenant: incoming.tenant ?? null,
        updated_at: incoming.updated_at ?? new Date().toISOString(),
      }

      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(upsertPayload)
        .select('id, nome, perfil, ativo, tenant')
        .single()

      if (upsertError) {
        console.error('sync_profile upsert error:', upsertError)
        throw upsertError
      }

      return new Response(
        JSON.stringify({ success: true, data: upserted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Special case: allow fetching Uranus user data BEFORE enforcing "profile exists".
    // Reason: web browsers can fail with CORS when calling Uranus directly.
    if (action === 'get_uranus_user') {
      const accessToken = params?.access_token
      const username = params?.username

      if (!accessToken || !username) {
        throw new Error('Missing params.access_token or params.username')
      }

      const uranusApiUrl = Deno.env.get('URANUS_API_URL')
      const masterTenant = Deno.env.get('URANUS_TENANT')

      if (!uranusApiUrl || !masterTenant) {
        throw new Error('Uranus configuration missing (URANUS_API_URL / URANUS_TENANT)')
      }

      const url = `${uranusApiUrl.replace(/\/$/, '')}/core/users/${encodeURIComponent(username)}`
      console.log(`[get_uranus_user] Fetching Uranus user: ${username}`)

      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant': masterTenant,
          'Content-Type': 'application/json',
        },
      })

      const json = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        console.error('[get_uranus_user] Uranus error:', resp.status, json)
        throw new Error(`Uranus request failed (${resp.status})`)
      }

      return new Response(
        JSON.stringify({ success: true, data: json }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify user exists and get their role AND tenant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, perfil, ativo, tenant')
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
    const userTenant = profile.tenant
    console.log(`User role: ${profile.perfil}, isGestorOrAdmin: ${isGestorOrAdmin}, tenant: ${userTenant}`)

    let data: any = null
    let error: any = null

    // Helper to add tenant filter when needed
    const addTenantFilter = (query: any) => {
      if (userTenant) {
        return query.eq('tenant', userTenant)
      }
      return query
    }

    switch (action) {
      case 'get_my_profile':
        // Return the current user's profile
        data = {
          id: profile.id,
          nome: profile.nome,
          perfil: profile.perfil,
          ativo: profile.ativo,
          tenant: profile.tenant
        }
        break

      case 'get_viaturas':
        if (isGestorOrAdmin) {
          let query = supabase
            .from('viaturas')
            .select('*')
            .order('prefixo', { ascending: true })
          query = addTenantFilter(query)
          const result = await query
          data = result.data
          error = result.error
        } else {
          throw new Error('Unauthorized: Only gestors and admins can view vehicles')
        }
        break

      case 'get_viatura': {
        // All authenticated users can see vehicle details (filtered by tenant)
        let query = supabase
          .from('viaturas')
          .select('*')
          .eq('id', params.id)
        query = addTenantFilter(query)
        const result = await query.single()
        data = result.data
        error = result.error
        break
      }

      case 'get_itens': {
        // All authenticated users can see items (filtered by tenant)
        let query = supabase
          .from('itens_viatura')
          .select('*')
          .order('nome', { ascending: true })
        query = addTenantFilter(query)
        const itensResult = await query
        data = itensResult.data
        error = itensResult.error
        break
      }

      case 'get_protocolos':
        if (isGestorOrAdmin) {
          // Gestors/admins see all protocols of their tenant
          let query = supabase
            .from('protocolos_empenho')
            .select(`
              *,
              viatura:viaturas(prefixo, placa, modelo),
              agente:profiles!protocolos_empenho_agente_responsavel_id_fkey(nome)
            `)
            .order('created_at', { ascending: false })
          query = addTenantFilter(query)
          const protocolosResult = await query
          data = protocolosResult.data
          error = protocolosResult.error
        } else {
          // Agents see only their own protocols (filtered by tenant)
          let query = supabase
            .from('protocolos_empenho')
            .select(`
              *,
              viatura:viaturas(prefixo, placa, modelo),
              agente:profiles!protocolos_empenho_agente_responsavel_id_fkey(nome)
            `)
            .eq('agente_responsavel_id', userId)
            .order('created_at', { ascending: false })
          query = addTenantFilter(query)
          const protocolosResult = await query
          data = protocolosResult.data
          error = protocolosResult.error
        }
        break

      case 'get_protocolo': {
        if (!params?.id) {
          throw new Error('Missing params.id')
        }

        let query = supabase
          .from('protocolos_empenho')
          .select(`
            *,
            viaturas (id, prefixo, placa, marca, modelo, km_inicial, km_atual),
            profiles!protocolos_empenho_agente_responsavel_id_fkey (nome, matricula),
            checklists_veiculo (
              id,
              tipo_checklist,
              km_atual,
              nivel_combustivel,
              nivel_oleo,
              condicoes_mecanicas,
              estado_geral,
              observacoes,
              created_at,
              checklist_itens (
                id,
                item_viatura_id,
                situacao,
                observacoes,
                itens_viatura (id, nome, categoria)
              )
            ),
            protocolos_devolucao (
              id,
              nome_agente,
              data_hora_devolucao,
              local_devolucao,
              latitude_devolucao,
              longitude_devolucao,
              observacoes,
              agente_responsavel_id,
              profiles:agente_responsavel_id (nome, matricula),
              checklists_veiculo (
                id,
                tipo_checklist,
                km_atual,
                nivel_combustivel,
                nivel_oleo,
                condicoes_mecanicas,
                estado_geral,
                observacoes,
                created_at,
                checklist_itens (
                  id,
                  item_viatura_id,
                  situacao,
                  observacoes,
                  itens_viatura (id, nome, categoria)
                )
              )
            )
          `)
          .eq('id', params.id)
        query = addTenantFilter(query)
        const protocoloResult = await query.maybeSingle()

        if (protocoloResult.error) {
          throw protocoloResult.error
        }

        if (!protocoloResult.data) {
          throw new Error('Protocolo não encontrado')
        }

        // Check access
        if (!isGestorOrAdmin && protocoloResult.data.agente_responsavel_id !== userId) {
          throw new Error('Unauthorized')
        }

        data = protocoloResult.data
        error = null
        break
      }


      case 'get_viatura_itens_config': {
        let query = supabase
          .from('viatura_itens_config')
          .select(`
            *,
            itens_viatura (id, nome, categoria, tipo)
          `)
          .eq('viatura_id', params.viatura_id)
        query = addTenantFilter(query)
        const configResult = await query
        data = configResult.data
        error = configResult.error
        break
      }

      case 'get_fotos_protocolo': {
        if (!params?.protocolo_empenho_id) {
          throw new Error('Missing params.protocolo_empenho_id')
        }

        // Verify access to this protocol (with tenant filter)
        let checkQuery = supabase
          .from('protocolos_empenho')
          .select('id, agente_responsavel_id')
          .eq('id', params.protocolo_empenho_id)
        checkQuery = addTenantFilter(checkQuery)
        const protocoloCheck = await checkQuery.single()

        if (protocoloCheck.error || !protocoloCheck.data) {
          throw new Error('Protocolo não encontrado')
        }

        if (!isGestorOrAdmin && protocoloCheck.data.agente_responsavel_id !== userId) {
          throw new Error('Unauthorized')
        }

        // Get fotos from check-in (filtered by tenant)
        let fotosQuery = supabase
          .from('fotos_checklist')
          .select('*')
          .eq('protocolo_empenho_id', params.protocolo_empenho_id)
        fotosQuery = addTenantFilter(fotosQuery)
        const fotosEmpenhoResult = await fotosQuery

        // Check for return protocol
        let devolucaoQuery = supabase
          .from('protocolos_devolucao')
          .select('id')
          .eq('protocolo_empenho_id', params.protocolo_empenho_id)
        devolucaoQuery = addTenantFilter(devolucaoQuery)
        const devolucaoResult = await devolucaoQuery.maybeSingle()

        let fotosDevolucao: any[] = []
        if (devolucaoResult.data) {
          let fotosDevolucaoQuery = supabase
            .from('fotos_checklist')
            .select('*')
            .eq('protocolo_devolucao_id', devolucaoResult.data.id)
          fotosDevolucaoQuery = addTenantFilter(fotosDevolucaoQuery)
          const fotosDevolucaoResult = await fotosDevolucaoQuery
          fotosDevolucao = fotosDevolucaoResult.data || []
        }

        data = [...(fotosEmpenhoResult.data || []), ...fotosDevolucao]
        error = fotosEmpenhoResult.error
        break
      }

      case 'get_profiles':
        if (isGestorOrAdmin) {
          let query = supabase
            .from('profiles')
            .select('*')
            .order('nome', { ascending: true })
          query = addTenantFilter(query)
          const profilesResult = await query
          data = profilesResult.data
          error = profilesResult.error
        } else {
          throw new Error('Unauthorized')
        }
        break

      case 'get_viaturas_disponiveis': {
        let query = supabase
          .from('viaturas')
          .select('*')
          .eq('status_operacional', 'disponivel')
          .order('prefixo', { ascending: true })
        query = addTenantFilter(query)
        const disponiveisResult = await query
        data = disponiveisResult.data
        error = disponiveisResult.error
        break
      }

      case 'create_viatura':
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can create vehicles')
        }
        // Set tenant on new vehicle
        const viaturaData = { ...params.viatura, tenant: userTenant }
        const createResult = await supabase
          .from('viaturas')
          .insert([viaturaData])
          .select()
          .single()
        data = createResult.data
        error = createResult.error
        break

      case 'update_viatura': {
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can update vehicles')
        }
        let updateQuery = supabase
          .from('viaturas')
          .update(params.viatura)
          .eq('id', params.id)
        updateQuery = addTenantFilter(updateQuery)
        const updateResult = await updateQuery.select().single()
        data = updateResult.data
        error = updateResult.error
        break
      }

      case 'delete_viatura': {
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only admins and gestors can delete vehicles')
        }
        let deleteQuery = supabase
          .from('viaturas')
          .delete()
          .eq('id', params.id)
        deleteQuery = addTenantFilter(deleteQuery)
        const deleteResult = await deleteQuery
        if (deleteResult.error) {
          const errAny: any = deleteResult.error
          // FK constraint: vehicle referenced by protocols
          if (errAny?.code === '23503') {
            throw new Error('Não é possível excluir esta viatura porque existem protocolos vinculados a ela.')
          }
          throw new Error(errAny?.message || 'Erro ao excluir viatura')
        }

        data = { deleted: true }
        error = null
        break
      }

      case 'save_viatura_items': {
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can manage vehicle items')
        }

        // 1. Delete existing items (filtered by tenant)
        let deleteItemsQuery = supabase
          .from('viatura_itens_config')
          .delete()
          .eq('viatura_id', params.viatura_id)
        deleteItemsQuery = addTenantFilter(deleteItemsQuery)
        const deleteItemsResult = await deleteItemsQuery

        if (deleteItemsResult.error) {
          error = deleteItemsResult.error
          break
        }

        // 2. Insert new items if provided (with tenant)
        if (params.items && params.items.length > 0) {
          const itemsWithTenant = params.items.map((item: any) => ({
            ...item,
            tenant: userTenant
          }))
          const insertItemsResult = await supabase
            .from('viatura_itens_config')
            .insert(itemsWithTenant)

          data = insertItemsResult.data
          error = insertItemsResult.error
        } else {
          data = { success: true }
        }
        break
      }

      case 'create_checkin': {
        // Generate protocol number
        const { data: numeroProtocolo, error: numeroError } = await supabase.rpc("gerar_numero_protocolo")
        if (numeroError) throw numeroError

        // Create protocol (with tenant)
        const { data: protocolo, error: protocoloError } = await supabase
          .from("protocolos_empenho")
          .insert({
            numero_protocolo: numeroProtocolo,
            viatura_id: params.viatura_id,
            agente_responsavel_id: userId,
            nome_agente: params.nome_agente,
            observacoes: params.observacoes,
            local_empenho: params.local_empenho,
            latitude_empenho: params.latitude_empenho,
            longitude_empenho: params.longitude_empenho,
            status: 'em_andamento',
            tenant: userTenant
          })
          .select()
          .single()

        if (protocoloError) throw protocoloError

        // Create checklist (with tenant)
        const { data: checklist, error: checklistError } = await supabase
          .from("checklists_veiculo")
          .insert({
            protocolo_empenho_id: protocolo.id,
            tipo_checklist: "empenho",
            km_atual: params.km_atual,
            nivel_oleo: params.nivel_oleo,
            nivel_combustivel: params.nivel_combustivel,
            condicoes_mecanicas: params.condicoes_mecanicas,
            observacoes: params.checklist_observacoes,
            tenant: userTenant
          })
          .select()
          .single()

        if (checklistError) throw checklistError

        // Insert checklist items
        if (params.checklist_items && params.checklist_items.length > 0) {
          const itemsToInsert = params.checklist_items.map((item: any) => ({
            checklist_veiculo_id: checklist.id,
            item_viatura_id: item.item_viatura_id,
            situacao: item.situacao,
            observacoes: item.observacoes
          }))

          const { error: itemsError } = await supabase
            .from("checklist_itens")
            .insert(itemsToInsert)

          if (itemsError) throw itemsError
        }

        // Update vehicle status (filtered by tenant)
        let updateViaturaQuery = supabase
          .from("viaturas")
          .update({
            status_operacional: "empenhada",
            km_atual: params.km_atual
          })
          .eq("id", params.viatura_id)
        updateViaturaQuery = addTenantFilter(updateViaturaQuery)
        const { error: updateError } = await updateViaturaQuery

        if (updateError) throw updateError

        data = { protocolo, checklist }
        break
      }

      case 'save_checkin_photos': {
        if (!params.photos || !Array.isArray(params.photos)) {
          throw new Error("Photos array is required")
        }

        // Add tenant to photos
        const photosWithTenant = params.photos.map((photo: any) => ({
          ...photo,
          tenant: userTenant
        }))

        const { error: photosError } = await supabase
          .from("fotos_checklist")
          .insert(photosWithTenant)

        if (photosError) throw photosError

        data = { success: true }
        break
      }

      case 'get_dashboard_stats': {
        const periodo = params?.periodo || 7
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - periodo)
        dataInicio.setHours(0, 0, 0, 0)
        const dataInicioISO = dataInicio.toISOString()

        // Get vehicle counts by status (filtered by tenant)
        let viaturasQuery = supabase
          .from('viaturas')
          .select('status_operacional')
        viaturasQuery = addTenantFilter(viaturasQuery)
        const viaturasResult = await viaturasQuery

        // Get protocols with completions for time average (filtered by tenant)
        let protocolosCompletosQuery = supabase
          .from('protocolos_empenho')
          .select(`
            id,
            data_hora_empenho,
            protocolos_devolucao(data_hora_devolucao)
          `)
          .gte('data_hora_empenho', dataInicioISO)
        protocolosCompletosQuery = addTenantFilter(protocolosCompletosQuery)
        const protocolosCompletosResult = await protocolosCompletosQuery

        // Get checklists for km average (filtered by tenant)
        let checklistsEmpenhoQuery = supabase
          .from('checklists_veiculo')
          .select(`
            km_atual,
            protocolo_empenho_id
          `)
          .eq('tipo_checklist', 'empenho')
          .not('protocolo_empenho_id', 'is', null)
        checklistsEmpenhoQuery = addTenantFilter(checklistsEmpenhoQuery)
        const checklistsEmpenhoResult = await checklistsEmpenhoQuery

        let checklistsDevolucaoQuery = supabase
          .from('checklists_veiculo')
          .select(`
            km_atual,
            protocolo_devolucao_id,
            protocolos_devolucao(protocolo_empenho_id)
          `)
          .eq('tipo_checklist', 'devolucao')
          .not('protocolo_devolucao_id', 'is', null)
        checklistsDevolucaoQuery = addTenantFilter(checklistsDevolucaoQuery)
        const checklistsDevolucaoResult = await checklistsDevolucaoQuery

        // Get protocols by day for chart (filtered by tenant)
        let protocolosPorDiaQuery = supabase
          .from('protocolos_empenho')
          .select('data_hora_empenho')
          .gte('data_hora_empenho', dataInicioISO)
        protocolosPorDiaQuery = addTenantFilter(protocolosPorDiaQuery)
        const protocolosPorDiaResult = await protocolosPorDiaQuery

        // Calculate time average
        let tempoMedioMinutos = 0
        if (protocolosCompletosResult.data) {
          let totalMinutos = 0
          let count = 0
          protocolosCompletosResult.data.forEach((p: any) => {
            if (p.protocolos_devolucao && p.protocolos_devolucao.length > 0) {
              const empenho = new Date(p.data_hora_empenho)
              const devolucao = new Date(p.protocolos_devolucao[0].data_hora_devolucao)
              const diffMinutos = Math.floor((devolucao.getTime() - empenho.getTime()) / (1000 * 60))
              if (diffMinutos > 0) {
                totalMinutos += diffMinutos
                count++
              }
            }
          })
          if (count > 0) {
            tempoMedioMinutos = Math.floor(totalMinutos / count)
          }
        }

        // Calculate km average
        let mediaKm = 0
        if (checklistsEmpenhoResult.data && checklistsDevolucaoResult.data) {
          let totalKm = 0
          let count = 0
          checklistsEmpenhoResult.data.forEach((empenho: any) => {
            const devolucao = checklistsDevolucaoResult.data.find(
              (d: any) => d.protocolos_devolucao?.protocolo_empenho_id === empenho.protocolo_empenho_id
            )
            if (devolucao && devolucao.km_atual > empenho.km_atual) {
              totalKm += devolucao.km_atual - empenho.km_atual
              count++
            }
          })
          if (count > 0) {
            mediaKm = totalKm / count
          }
        }

        data = {
          viaturas: viaturasResult.data,
          protocolosPorDia: protocolosPorDiaResult.data || [],
          tempoMedioMinutos,
          mediaKm
        }
        error = viaturasResult.error
        break
      }

      case 'create_checkout': {
        // Create return protocol (devolução) with tenant
        const { data: devolucao, error: devolucaoError } = await supabase
          .from("protocolos_devolucao")
          .insert({
            protocolo_empenho_id: params.protocolo_empenho_id,
            agente_responsavel_id: userId,
            nome_agente: params.nome_agente,
            observacoes: params.observacoes,
            local_devolucao: params.local_devolucao,
            latitude_devolucao: params.latitude_devolucao,
            longitude_devolucao: params.longitude_devolucao,
            tenant: userTenant
          })
          .select()
          .single()

        if (devolucaoError) throw devolucaoError

        // Create checklist with tenant
        const { data: checklistDev, error: checklistDevError } = await supabase
          .from("checklists_veiculo")
          .insert({
            protocolo_devolucao_id: devolucao.id,
            tipo_checklist: "devolucao",
            km_atual: params.km_atual,
            nivel_oleo: params.nivel_oleo,
            nivel_combustivel: params.nivel_combustivel,
            condicoes_mecanicas: params.condicoes_mecanicas,
            observacoes: params.checklist_observacoes,
            tenant: userTenant
          })
          .select()
          .single()

        if (checklistDevError) throw checklistDevError

        // Insert checklist items
        if (params.checklist_items && params.checklist_items.length > 0) {
          const itemsToInsertDev = params.checklist_items.map((item: any) => ({
            checklist_veiculo_id: checklistDev.id,
            item_viatura_id: item.item_viatura_id,
            situacao: item.situacao,
            observacoes: item.observacoes
          }))

          const { error: itemsDevError } = await supabase
            .from("checklist_itens")
            .insert(itemsToInsertDev)

          if (itemsDevError) throw itemsDevError
        }

        // Update protocol status (filtered by tenant)
        let updateProtoQuery = supabase
          .from("protocolos_empenho")
          .update({ status: "concluido" })
          .eq("id", params.protocolo_empenho_id)
        updateProtoQuery = addTenantFilter(updateProtoQuery)
        const { error: updateProtoError } = await updateProtoQuery

        if (updateProtoError) throw updateProtoError

        // Update vehicle status and km_atual (filtered by tenant)
        let updateViaturaQuery = supabase
          .from("viaturas")
          .update({ 
            status_operacional: "disponivel",
            km_atual: params.km_atual 
          })
          .eq("id", params.viatura_id)
        updateViaturaQuery = addTenantFilter(updateViaturaQuery)
        const { error: updateViaturaError } = await updateViaturaQuery

        if (updateViaturaError) throw updateViaturaError

        data = { devolucao, checklist: checklistDev }
        break
      }

      case 'save_checkout_photos': {
        if (!params.photos || !Array.isArray(params.photos)) {
          throw new Error("Photos array is required")
        }

        // Add tenant to photos
        const photosWithTenant = params.photos.map((photo: any) => ({
          ...photo,
          tenant: userTenant
        }))

        const { error: checkoutPhotosError } = await supabase
          .from("fotos_checklist")
          .insert(photosWithTenant)

        if (checkoutPhotosError) throw checkoutPhotosError

        data = { success: true }
        break
      }

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

    const errAny: any = error
    const message =
      (errAny instanceof Error && errAny.message) ||
      errAny?.message ||
      errAny?.error_description ||
      (typeof errAny === 'string' ? errAny : null) ||
      'Unknown error'

    return new Response(
      JSON.stringify({
        error: message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
