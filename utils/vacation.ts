
/**
 * Calcula los días de vacaciones según la antigüedad en la empresa.
 * Reglas:
 * - < 6 meses: 1 día por cada 20 días de trabajo.
 * - 6 meses - 5 años: 14 días.
 * - 5 - 10 años: 21 días.
 * - 10 - 20 años: 28 días.
 * - > 20 años: 35 días.
 */
export const calculateTotalVacationDays = (joiningDate: string | null | undefined): number => {
    if (!joiningDate) return 0;

    const joining = new Date(joiningDate);
    const now = new Date();

    // Calcular diferencia en milisegundos
    const diffTime = now.getTime() - joining.getTime();
    if (diffTime < 0) return 0;

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44; // Promedio de días por mes
    const diffYears = diffDays / 365.25;

    if (diffMonths < 6) {
        // Regla: 1 día por cada 20 días de trabajo efectivo
        // Simplificamos "trabajo efectivo" a días totales desde el ingreso
        return Math.floor(diffDays / 20);
    }

    if (diffYears < 5) {
        return 14;
    }

    if (diffYears < 10) {
        return 21;
    }

    if (diffYears < 20) {
        return 28;
    }

    return 35;
};

/**
 * Formatea la antigüedad en una cadena legible (ej: "2 años y 3 meses")
 */
export const formatSeniority = (joiningDate: string | null | undefined): string => {
    if (!joiningDate) return "N/A";

    const joining = new Date(joiningDate);
    const now = new Date();

    let years = now.getFullYear() - joining.getFullYear();
    let months = now.getMonth() - joining.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);

    if (parts.length === 0) return "Menos de un mes";

    return parts.join(' y ');
};
