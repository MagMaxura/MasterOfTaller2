-- Migration: Self-healing payroll calculation
-- This updates the function to automatically fix negative deduction amounts before calculating.

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
    -- 0. SELF-HEALING: Fix any negative deduction amounts in the range
    -- We ensure they are positive so we can safely subtract them.
    UPDATE eventos_nomina
    SET monto = ABS(monto)
    WHERE fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
      AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA')
      AND monto < 0;

    -- Iterate through all users who have a defined base salary
    FOR v_user_record IN 
        SELECT user_id, monto_base_quincenal 
        FROM salarios
    LOOP
        -- 1. Calculate Additions
        SELECT COALESCE(SUM(ABS(monto)), 0) INTO v_total_adiciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('HORA_EXTRA', 'BONO'); 

        -- 2. Calculate Deductions
        -- We sum the ABS value just in case, but step 0 should have fixed it.
        SELECT COALESCE(SUM(ABS(monto)), 0) INTO v_total_deducciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA'); 

        -- 3. Calculate Final Amount
        v_monto_final := v_user_record.monto_base_quincenal + v_total_adiciones - v_total_deducciones;

        -- 4. Upsert Payment Period using ON CONFLICT logic
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
        )
        ON CONFLICT (user_id, fecha_inicio_periodo) DO UPDATE
        SET
            fecha_fin_periodo = EXCLUDED.fecha_fin_periodo,
            fecha_pago = EXCLUDED.fecha_pago,
            salario_base_calculado = EXCLUDED.salario_base_calculado,
            total_adiciones = EXCLUDED.total_adiciones,
            total_deducciones = EXCLUDED.total_deducciones,
            monto_final_a_pagar = EXCLUDED.monto_final_a_pagar,
            estado = 'CALCULADO'
        RETURNING id INTO v_period_id;

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
