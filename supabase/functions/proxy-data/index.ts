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
        // All authenticated users can see vehicle details
        const result = await supabase
          .from('viaturas')
          .select('*')
          .eq('id', params.id)
          .single()
        data = result.data
        error = result.error
        break
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

      case 'get_protocolo': {
        if (!params?.id) {
          throw new Error('Missing params.id')
        }

        const protocoloResult = await supabase
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
          .maybeSingle()

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


      case 'get_viatura_itens_config':
        const configResult = await supabase
          .from('viatura_itens_config')
          .select(`
            *,
            itens_viatura (id, nome, categoria, tipo)
          `)
          .eq('viatura_id', params.viatura_id)
        data = configResult.data
        error = configResult.error
        break

      case 'get_fotos_protocolo': {
        if (!params?.protocolo_empenho_id) {
          throw new Error('Missing params.protocolo_empenho_id')
        }

        // Verify access to this protocol
        const protocoloCheck = await supabase
          .from('protocolos_empenho')
          .select('id, agente_responsavel_id')
          .eq('id', params.protocolo_empenho_id)
          .single()

        if (protocoloCheck.error || !protocoloCheck.data) {
          throw new Error('Protocolo não encontrado')
        }

        if (!isGestorOrAdmin && protocoloCheck.data.agente_responsavel_id !== userId) {
          throw new Error('Unauthorized')
        }

        // Get fotos from check-in
        const fotosEmpenhoResult = await supabase
          .from('fotos_checklist')
          .select('*')
          .eq('protocolo_empenho_id', params.protocolo_empenho_id)

        // Check for return protocol
        const devolucaoResult = await supabase
          .from('protocolos_devolucao')
          .select('id')
          .eq('protocolo_empenho_id', params.protocolo_empenho_id)
          .maybeSingle()

        let fotosDevolucao: any[] = []
        if (devolucaoResult.data) {
          const fotosDevolucaoResult = await supabase
            .from('fotos_checklist')
            .select('*')
            .eq('protocolo_devolucao_id', devolucaoResult.data.id)
          fotosDevolucao = fotosDevolucaoResult.data || []
        }

        data = [...(fotosEmpenhoResult.data || []), ...fotosDevolucao]
        error = fotosEmpenhoResult.error
        break
      }

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

      case 'create_viatura':
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can create vehicles')
        }
        const createResult = await supabase
          .from('viaturas')
          .insert([params.viatura])
          .select()
          .single()
        data = createResult.data
        error = createResult.error
        break

      case 'update_viatura':
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can update vehicles')
        }
        const updateResult = await supabase
          .from('viaturas')
          .update(params.viatura)
          .eq('id', params.id)
          .select()
          .single()
        data = updateResult.data
        error = updateResult.error
        break

      case 'delete_viatura':
        if (profile.perfil !== 'admin') {
          throw new Error('Unauthorized: Only admins can delete vehicles')
        }
        const deleteResult = await supabase
          .from('viaturas')
          .delete()
          .eq('id', params.id)
        data = { deleted: true }
        error = deleteResult.error
        break

      case 'save_viatura_items':
        if (!isGestorOrAdmin) {
          throw new Error('Unauthorized: Only gestors and admins can manage vehicle items')
        }

        // 1. Delete existing items
        const deleteItemsResult = await supabase
          .from('viatura_itens_config')
          .delete()
          .eq('viatura_id', params.viatura_id)

        if (deleteItemsResult.error) {
          error = deleteItemsResult.error
          break
        }

        // 2. Insert new items if provided
        if (params.items && params.items.length > 0) {
          const insertItemsResult = await supabase
            .from('viatura_itens_config')
            .insert(params.items)

          data = insertItemsResult.data
          error = insertItemsResult.error
        } else {
          data = { success: true }
        }
        break

      case 'create_checkin':
        // Generate protocol number
        const { data: numeroProtocolo, error: numeroError } = await supabase.rpc("gerar_numero_protocolo")
        if (numeroError) throw numeroError

        // Create protocol
        const { data: protocolo, error: protocoloError } = await supabase
          .from("protocolos_empenho")
          .insert({
            numero_protocolo: numeroProtocolo,
            viatura_id: params.viatura_id,
            agente_responsavel_id: userId, // Use authenticated user ID
            nome_agente: params.nome_agente,
            observacoes: params.observacoes,
            local_empenho: params.local_empenho,
            latitude_empenho: params.latitude_empenho,
            longitude_empenho: params.longitude_empenho,
            status: 'em_andamento'
          })
          .select()
          .single()

        if (protocoloError) throw protocoloError

        // Create checklist
        const { data: checklist, error: checklistError } = await supabase
          .from("checklists_veiculo")
          .insert({
            protocolo_empenho_id: protocolo.id,
            tipo_checklist: "empenho",
            km_atual: params.km_atual,
            nivel_oleo: params.nivel_oleo,
            nivel_combustivel: params.nivel_combustivel,
            condicoes_mecanicas: params.condicoes_mecanicas,
            observacoes: params.checklist_observacoes
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

        // Update vehicle status
        const { error: updateError } = await supabase
          .from("viaturas")
          .update({
            status_operacional: "empenhada",
            km_atual: params.km_atual
          })
          .eq("id", params.viatura_id)

        if (updateError) throw updateError

        data = { protocolo, checklist }
        break

      case 'save_checkin_photos':
        if (!params.photos || !Array.isArray(params.photos)) {
          throw new Error("Photos array is required")
        }

        const { error: photosError } = await supabase
          .from("fotos_checklist")
          .insert(params.photos)

        if (photosError) throw photosError

        data = { success: true }
        break

      case 'get_dashboard_stats': {
        const periodo = params?.periodo || 7
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - periodo)
        dataInicio.setHours(0, 0, 0, 0)
        const dataInicioISO = dataInicio.toISOString()

        // Get vehicle counts by status
        const viaturasResult = await supabase
          .from('viaturas')
          .select('status_operacional')

        // Get protocols with completions for time average
        const protocolosCompletosResult = await supabase
          .from('protocolos_empenho')
          .select(`
            id,
            data_hora_empenho,
            protocolos_devolucao(data_hora_devolucao)
          `)
          .gte('data_hora_empenho', dataInicioISO)

        // Get checklists for km average
        const checklistsEmpenhoResult = await supabase
          .from('checklists_veiculo')
          .select(`
            km_atual,
            protocolo_empenho_id
          `)
          .eq('tipo_checklist', 'empenho')
          .not('protocolo_empenho_id', 'is', null)

        const checklistsDevolucaoResult = await supabase
          .from('checklists_veiculo')
          .select(`
            km_atual,
            protocolo_devolucao_id,
            protocolos_devolucao(protocolo_empenho_id)
          `)
          .eq('tipo_checklist', 'devolucao')
          .not('protocolo_devolucao_id', 'is', null)

        // Get protocols by day for chart
        const protocolosPorDiaResult = await supabase
          .from('protocolos_empenho')
          .select('data_hora_empenho')
          .gte('data_hora_empenho', dataInicioISO)

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

      case 'create_checkout':
        // Create return protocol (devolução)
        const { data: devolucao, error: devolucaoError } = await supabase
          .from("protocolos_devolucao")
          .insert({
            protocolo_empenho_id: params.protocolo_empenho_id,
            agente_responsavel_id: userId,
            nome_agente: params.nome_agente,
            observacoes: params.observacoes,
            local_devolucao: params.local_devolucao,
            latitude_devolucao: params.latitude_devolucao,
            longitude_devolucao: params.longitude_devolucao
          })
          .select()
          .single()

        if (devolucaoError) throw devolucaoError

        // Create checklist
        const { data: checklistDev, error: checklistDevError } = await supabase
          .from("checklists_veiculo")
          .insert({
            protocolo_devolucao_id: devolucao.id,
            tipo_checklist: "devolucao",
            km_atual: params.km_atual,
            nivel_oleo: params.nivel_oleo,
            nivel_combustivel: params.nivel_combustivel,
            condicoes_mecanicas: params.condicoes_mecanicas,
            observacoes: params.checklist_observacoes
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

        // Update protocol status
        const { error: updateProtoError } = await supabase
          .from("protocolos_empenho")
          .update({ status: "concluido" })
          .eq("id", params.protocolo_empenho_id)

        if (updateProtoError) throw updateProtoError

        // Update vehicle status and km_atual
        const { error: updateViaturaError } = await supabase
          .from("viaturas")
          .update({ 
            status_operacional: "disponivel",
            km_atual: params.km_atual 
          })
          .eq("id", params.viatura_id)

        if (updateViaturaError) throw updateViaturaError

        data = { devolucao, checklist: checklistDev }
        break

      case 'save_checkout_photos':
        if (!params.photos || !Array.isArray(params.photos)) {
          throw new Error("Photos array is required")
        }

        const { error: checkoutPhotosError } = await supabase
          .from("fotos_checklist")
          .insert(params.photos)

        if (checkoutPhotosError) throw checkoutPhotosError

        data = { success: true }
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
        status: 200,
      }
    )
  }
})
