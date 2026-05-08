DO $$
DECLARE
  r RECORD;
  v_servico_id UUID;
  v_taxa_percentual NUMERIC;
  v_taxa_fixa NUMERIC;
  v_taxa_aplicada NUMERIC;
  v_valor_total NUMERIC;
  v_cesta_id UUID;
  v_item_percentual NUMERIC;
  v_item_fixa NUMERIC;
BEGIN
  FOR r IN SELECT * FROM public.requisicoes WHERE taxa_aplicada = 0 LOOP
    -- Encontrar o serviço pelo nome que corresponda ao tipo (ex: 'pix', 'ted', 'boleto', 'carga_usdt')
    SELECT id INTO v_servico_id FROM public.servicos WHERE nome ILIKE '%' || r.tipo || '%';
    
    IF v_servico_id IS NOT NULL THEN
      v_taxa_percentual := 0;
      v_taxa_fixa := 0;
      
      -- 1. Buscar taxa global em taxas_servicos
      SELECT percentual, valor_fixo INTO v_taxa_percentual, v_taxa_fixa 
      FROM public.taxas_servicos 
      WHERE servico_id = v_servico_id
      LIMIT 1;
      
      v_taxa_percentual := COALESCE(v_taxa_percentual, 0);
      v_taxa_fixa := COALESCE(v_taxa_fixa, 0);
      
      -- 2. Sobrescrever com taxa personalizada se existir
      SELECT id INTO v_cesta_id FROM public.cestas_clientes WHERE user_id = r.user_id AND ativo = true LIMIT 1;
      IF v_cesta_id IS NOT NULL THEN
        SELECT taxa_percentual, taxa_fixa INTO v_item_percentual, v_item_fixa 
        FROM public.cestas_itens 
        WHERE cesta_id = v_cesta_id AND servico_id = v_servico_id AND ativo = true
        LIMIT 1;
        
        IF v_item_percentual IS NOT NULL AND v_item_fixa IS NOT NULL THEN
          v_taxa_percentual := v_item_percentual;
          v_taxa_fixa := v_item_fixa;
        END IF;
      END IF;
      
      -- Se a taxa agora for maior que zero, recalcular e atualizar
      IF v_taxa_percentual > 0 OR v_taxa_fixa > 0 THEN
        v_taxa_aplicada := (r.valor * (v_taxa_percentual / 100.0)) + v_taxa_fixa;
        v_valor_total := r.valor + v_taxa_aplicada;
        
        UPDATE public.requisicoes 
        SET taxa_aplicada = v_taxa_aplicada, valor_total = v_valor_total
        WHERE id = r.id;
      END IF;
    END IF;
  END LOOP;
END $$;
