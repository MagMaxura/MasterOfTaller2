-- Migration: Improve Payroll Calculation (UPSERT + Link Events)

CREATE OR REPLACE FUNCTION calcular_nomina(
    p_fecha_inicio DATE, 
    p_fecha_fin DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_record RECORD;
    v_total_adiciones NUMERIC;
    v_total_deducciones NUMERIC;
    v_monto_final NUMERIC;
    v_period_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Iterate through all users who have a defined base salary
    FOR v_user_record IN 
        SELECT user_id, monto_base_quincenal 
        FROM salarios
    LOOP
        -- 1. Calculate Additions
        SELECT COALESCE(SUM(monto), 0) INTO v_total_adiciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('HORA_EXTRA', 'BONO'); 

        -- 2. Calculate Deductions (Added VACATION, SICK_LEAVE, PERMITTED_LEAVE as neutral/informational for now, or deductible if needed. 
        -- Based on current requirements, they seem to be just informational or handled separately. 
        -- For now, we only deduct specific negative types.)
        SELECT COALESCE(SUM(monto), 0) INTO v_total_deducciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA'); 

        -- 3. Calculate Final Amount
        v_monto_final := v_user_record.monto_base_quincenal + v_total_adiciones - v_total_deducciones;

        -- 4. Upsert Payment Period
        -- We assume a unique constraint on (user_id, fecha_inicio_periodo) exists or we handle logic to find it.
        -- If no unique constraint exists, we should check if it exists first.
        -- Ideally, add: ALTER TABLE periodos_pago ADD CONSTRAINT periodos_pago_user_start_key UNIQUE (user_id, fecha_inicio_periodo);
        -- For this function, we will try to INSERT, if it fails (or we can checks), we UPDATE.
        -- Using ON CONFLICT requires a unique constraint. Let's try to find existing first to be safe without altering constraints blindly.
        
        SELECT id INTO v_period_id FROM periodos_pago 
        WHERE user_id = v_user_record.user_id AND fecha_inicio_periodo = p_fecha_inicio;

        IF v_period_id IS NOT NULL THEN
            -- Update existing
            UPDATE periodos_pago SET
                fecha_fin_periodo = p_fecha_fin,
                fecha_pago = CURRENT_DATE,
                salario_base_calculado = v_user_record.monto_base_quincenal,
                total_adiciones = v_total_adiciones,
                total_deducciones = v_total_deducciones,
                monto_final_a_pagar = v_monto_final,
                estado = 'CALCULADO'
            WHERE id = v_period_id;
        ELSE
            -- Insert new
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

        -- 5. LINK Events to this Period
        UPDATE eventos_nomina
        SET periodo_pago_id = v_period_id
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
