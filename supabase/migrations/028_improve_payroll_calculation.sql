
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

        -- 1. Actualizar montos automáticos para eventos que están en 0
        
        -- FALTAS: Descuentan un día completo (Dividido por 10 días hábiles)
        UPDATE eventos_nomina SET monto = v_valor_dia 
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo = 'FALTA' AND (monto = 0 OR monto IS NULL);

        -- TARDANZAS: Intentar extraer horas de la descripción (ej: "Tardanza: 0.5hs")
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * COALESCE((substring(descripcion from '([0-9.]+)\s?hs')::numeric), 0.5), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo = 'TARDANZA' AND (monto = 0 OR monto IS NULL);

        -- SALIDAS TEMPRANAS
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * COALESCE((substring(descripcion from '([0-9.]+)\s?hs')::numeric), 0.5), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo = 'SALIDA_TEMPRANA' AND (monto = 0 OR monto IS NULL);

        -- HORAS EXTRAS: (valor_hora * 1.5 por defecto para el recargo)
        UPDATE eventos_nomina SET monto = ROUND(v_valor_hora * 1.5 * COALESCE((substring(descripcion from '([0-9.]+)\s?hs')::numeric), 1.0), 2)
        WHERE user_id = v_user_record.user_id 
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo = 'HORA_EXTRA' AND (monto = 0 OR monto IS NULL);


        -- 2. Calcular Sumatoria de Adiciones (Horas Extras, Bonos)
        SELECT COALESCE(SUM(monto), 0) INTO v_total_adiciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo IN ('HORA_EXTRA', 'BONO'); 

        -- 3. Calcular Sumatoria de Deducciones
        SELECT COALESCE(SUM(monto), 0) INTO v_total_deducciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD')
          AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA'); 

        -- 4. Calcular Monto Final
        v_monto_final := v_user_record.monto_base_quincenal + v_total_adiciones - v_total_deducciones;

        -- 5. Upsert del Periodo de Pago
        SELECT id INTO v_period_id FROM periodos_pago 
        WHERE user_id = v_user_record.user_id AND fecha_inicio_periodo = to_char(p_fecha_inicio, 'YYYY-MM-DD');

        IF v_period_id IS NOT NULL THEN
            UPDATE periodos_pago SET
                fecha_fin_periodo = to_char(p_fecha_fin, 'YYYY-MM-DD'),
                fecha_pago = CURRENT_DATE,
                salario_base_calculado = v_user_record.monto_base_quincenal,
                total_adiciones = v_total_adiciones,
                total_deducciones = v_total_deducciones,
                monto_final_a_pagar = v_monto_final,
                estado = 'CALCULADO'
            WHERE id = v_period_id;
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
                to_char(p_fecha_inicio, 'YYYY-MM-DD'),
                to_char(p_fecha_fin, 'YYYY-MM-DD'),
                CURRENT_DATE,
                v_user_record.monto_base_quincenal,
                v_total_adiciones,
                v_total_deducciones,
                v_monto_final,
                'CALCULADO'
            ) RETURNING id INTO v_period_id;
        END IF;

        -- 6. Vincular Eventos al Periodo
        UPDATE eventos_nomina
        SET periodo_pago_id = v_period_id
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN to_char(p_fecha_inicio, 'YYYY-MM-DD') AND to_char(p_fecha_fin, 'YYYY-MM-DD');

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$;
