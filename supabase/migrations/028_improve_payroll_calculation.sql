
CREATE OR REPLACE FUNCTION public.calcular_nomina(p_fecha_inicio date, p_fecha_fin date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_record RECORD;
    v_total_adiciones NUMERIC;
    v_total_deducciones NUMERIC;
    v_monto_final NUMERIC;
    v_period_id UUID;
    v_count INTEGER := 0;
    v_valor_dia NUMERIC;
    v_valor_hora NUMERIC;
BEGIN
    -- Iterar por todos los usuarios que tienen un salario base definido
    FOR v_user_record IN 
        SELECT user_id, monto_base_quincenal 
        FROM salarios
    LOOP
        -- Calcular valor del día y de la hora (base 10 días hábiles por quincena, 8hs por día)
        v_valor_dia := v_user_record.monto_base_quincenal / 10.0;
        v_valor_hora := v_valor_dia / 8.0;

        -- 1. Actualizar montos automáticos para eventos que están en 0 o son irrisorios
        
        -- FALTAS: Descuentan un día completo
        UPDATE eventos_nomina SET monto = v_valor_dia 
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo = 'FALTA' AND (monto < 0.01 OR monto IS NULL);

        -- TARDANZAS: Mejorar extracción de horas
        -- Soporta "Tardanza: 0.5h", "tardanza (20 hs)", "1 hs", etc.
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * COALESCE((substring(descripcion from '(?i)([0-9.]+)\s?h')::numeric), 0.5), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo = 'TARDANZA' AND (monto < 0.01 OR monto IS NULL);

        -- SALIDAS TEMPRANAS
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * COALESCE((substring(descripcion from '(?i)([0-9.]+)\s?h')::numeric), 0.5), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo = 'SALIDA_TEMPRANA' AND (monto < 0.01 OR monto IS NULL);

        -- HORAS EXTRAS
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * 1.5 * COALESCE((substring(descripcion from '(?i)([0-9.]+)\s?h')::numeric), 1.0), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo = 'HORA_EXTRA' AND (monto < 0.01 OR monto IS NULL);


        -- 2. Calcular Sumatoria de Adiciones
        SELECT COALESCE(SUM(monto), 0) INTO v_total_adiciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo IN ('HORA_EXTRA', 'BONO'); 

        -- 3. Calcular Sumatoria de Deducciones
        SELECT COALESCE(SUM(monto), 0) INTO v_total_deducciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin
          AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA'); 

        -- 4. Calcular Monto Final
        v_monto_final := v_user_record.monto_base_quincenal + v_total_adiciones - v_total_deducciones;

        -- 5. Upsert del Periodo de Pago
        SELECT id INTO v_period_id FROM periodos_pago 
        WHERE user_id = v_user_record.user_id AND fecha_inicio_periodo = p_fecha_inicio;

        IF v_period_id IS NOT NULL THEN
            UPDATE periodos_pago SET
                fecha_fin_periodo = p_fecha_fin,
                salario_base_calculado = v_user_record.monto_base_quincenal,
                total_adiciones = v_total_adiciones,
                total_deducciones = v_total_deducciones,
                monto_final_a_pagar = v_monto_final
            WHERE id = v_period_id AND estado = 'CALCULADO'; -- Solo actualizar si no está pagado aún
        ELSE
            INSERT INTO periodos_pago (
                user_id,
                fecha_inicio_periodo,
                fecha_fin_periodo,
                fecha_pago,
                salario_base_calculado,
                total_adiciones,
                total_deducciones,
                monto_final_a_pagar,
                estado
            ) VALUES (
                v_user_record.user_id,
                p_fecha_inicio,
                p_fecha_fin,
                CURRENT_DATE,
                v_user_record.monto_base_quincenal,
                v_total_adiciones,
                v_total_deducciones,
                v_monto_final,
                'CALCULADO'
            ) RETURNING id INTO v_period_id;
        END IF;

        -- 6. Forzar vinculación de eventos al periodo (incluso los antiguos de este rango)
        UPDATE eventos_nomina
        SET periodo_pago_id = v_period_id
        WHERE user_id = v_user_record.user_id
          AND fecha_evento >= p_fecha_inicio AND fecha_evento <= p_fecha_fin;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;
