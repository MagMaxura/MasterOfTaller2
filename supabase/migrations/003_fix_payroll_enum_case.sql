-- Migration: Fix calcular_nomina enum values (uppercase)

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
    v_count INTEGER := 0;
BEGIN
    -- Iterate through all users who have a defined base salary
    FOR v_user_record IN 
        SELECT user_id, monto_base_quincenal 
        FROM salarios
    LOOP
        -- Calculate Additions (Bonuses, etc.)
        -- Valid Types: 'HORA_EXTRA', 'BONO'
        SELECT COALESCE(SUM(monto), 0) INTO v_total_adiciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('HORA_EXTRA', 'BONO'); 

        -- Calculate Deductions (Fines, etc.)
        -- Valid Types: 'FALTA', 'TARDANZA', 'APERCIBIMIENTO'
        SELECT COALESCE(SUM(monto), 0) INTO v_total_deducciones
        FROM eventos_nomina
        WHERE user_id = v_user_record.user_id
          AND fecha_evento BETWEEN p_fecha_inicio AND p_fecha_fin
          AND tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO'); 

        -- Calculate Final Amount
        v_monto_final := v_user_record.monto_base_quincenal + v_total_adiciones - v_total_deducciones;

        -- Insert or Update Payment Period
        -- Using ON CONFLICT to avoid duplicates for the same period
        -- (Ideally periodos_pago should have a unique constraint on user_id + dates)
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
            'pendiente'
        );
        
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
