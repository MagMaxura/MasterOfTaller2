import { User } from '../types';

export const SUPPLY_ADMIN_BADGE_NAME = 'Administrador de Insumos';

/**
 * Checks if a user has the specific "Administrador de Insumos" badge.
 * @param user The user object.
 * @returns True if the user has the badge, false otherwise.
 */
export const hasSupplyAdminBadge = (user: User): boolean => {
    return user.badges.some(badge => badge.name === SUPPLY_ADMIN_BADGE_NAME);
};

/**
 * Determines the user's rank based on their role and level.
 * @param user The user object.
 * @returns The rank as a string.
 */
export const getRank = (user: User): string => {
    if (user.role === 'administrador') {
        return 'General Supremo del Ejército';
    }
    
    // Default to technician ranks
    if (user.level < 10) {
        return 'Técnico Novato';
    }
    
    return 'Técnico Especialista';
};
