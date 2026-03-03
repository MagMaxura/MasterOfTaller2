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
     * Obtiene el perfil de un usuario en la base de asistencia por su ID.
     */
    async getUserProfileById(id: string): Promise<AttendanceUser | null> {
        if (!id) return null;
        const { data, error } = await supabaseAttendance
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching attendance user by id:', error);
            return null;
        }

        return data;
    },

    /**
     * Obtiene el perfil de un usuario en la base de asistencia por su email.
     * (Mantener para compatibilidad con lógica de sincronización histórica)
     */
    async getUserProfileByEmail(email: string): Promise<AttendanceUser | null> {
        if (!email) return null;
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabaseAttendance
            .from('users')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

        if (error) {
            console.error('Error fetching attendance user by email:', error);
            return null;
        }

        return data;
    },

    /**
     * Obtiene todos los usuarios registrados en el sistema de asistencia.
     */
    async getAllUsers(): Promise<AttendanceUser[]> {
        const { data, error } = await supabaseAttendance
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching all attendance users:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Obtiene los registros de acceso de un usuario en un rango de fechas.
     */
    async getAccessLogsByRange(attendanceUserId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
        if (!attendanceUserId) return [];
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
     * Obtiene todos los registros de acceso de un usuario.
     */
    async getAccessLogs(attendanceUserId: string): Promise<AttendanceRecord[]> {
        if (!attendanceUserId) return [];
        const { data, error } = await supabaseAttendance
            .from('access_logs')
            .select('*')
            .eq('user_id', attendanceUserId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching access logs:', error);
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
     * Helper para obtener todo el resumen de asistencia por ID de asistencia.
     */
    async getFullAttendanceSummary(attendanceId: string) {
        if (!attendanceId) return null;

        const user = await this.getUserProfileById(attendanceId);
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
