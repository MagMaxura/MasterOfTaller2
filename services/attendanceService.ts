import { supabaseAttendance } from '../config';

export interface AttendanceRecord {
    id: string;
    user_id: string;
    user_name: string;
    type: 'IN' | 'OUT' | 'Entrada' | 'Salida' | 'ENTRADA' | 'SALIDA';
    timestamp: string;
    tardiness_hours?: number;
    hours_worked?: number;
    overtime_hours?: number;
    early_departure_hours?: number;
    status?: string;
    notes?: string;
}

export interface AttendanceUser {
    id: string;
    name: string;
    email: string;
    role: string;
    schedule_type: string;
    start_time: string;
    end_time: string;
    daily_hours: number;
    vacation_start_date?: string;
    vacation_end_date?: string;
}

export interface Holiday {
    id: string;
    date: string;
    description: string;
}

export const attendanceService = {
    /**
     * Obtiene el perfil de un usuario en la base de asistencia por su email.
     */
    async getUserProfileByEmail(email: string): Promise<AttendanceUser | null> {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabaseAttendance
            .from('users')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

        if (error) {
            console.error('Error fetching attendance user:', error);
            return null;
        }

        return data;
    },

    /**
     * Obtiene los registros de acceso de un usuario por su ID de asistencia en un rango de fechas.
     */
    async getAccessLogsByRange(attendanceUserId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
        const { data, error } = await supabaseAttendance
            .from('access_logs')
            .select('*')
            .eq('user_id', attendanceUserId)
            .gte('timestamp', `${startDate}T00:00:00`)
            .lte('timestamp', `${endDate}T23:59:59`)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching access logs by range:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Obtiene el calendario de feriados.
     */
    async getHolidays(): Promise<Holiday[]> {
        const { data, error } = await supabaseAttendance
            .from('holidays')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching holidays:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Helper para obtener todo el resumen de asistencia de un usuario de MasterOfTaller.
     */
    async getFullAttendanceSummary(email: string) {
        const user = await this.getUserProfileByEmail(email);
        if (!user) return null;

        const [logs, holidays] = await Promise.all([
            this.getAccessLogs(user.id),
            this.getHolidays()
        ]);

        return {
            user,
            logs,
            holidays
        };
    }
};
