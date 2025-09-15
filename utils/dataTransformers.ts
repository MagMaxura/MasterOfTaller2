import { User, InventoryItem, Role, Skill, Badge, UserInventoryItem } from '../types';

/**
 * Centralizes the transformation of a raw Supabase profile object (with joins)
 * into the clean, typed User object used throughout the application.
 * @param p - The raw profile data from Supabase.
 * @returns A fully typed User object.
 */
export const transformSupabaseProfileToUser = (p: any): User => {
  return {
    id: p.id,
    name: p.name,
    role: p.role as Role,
    avatar: p.avatar,
    xp: p.xp,
    level: p.level,
    skills: (p.profile_skills || []).map((ps: any): Skill => ({ 
        id: ps.skills.id,
        name: ps.skills.name,
        level: ps.level 
    })),
    badges: (p.user_badges || []).map((ub: any): Badge => ub.badges),
    inventory: (p.user_inventory || [])
      .filter((ui: any) => ui.inventory_items) // Filter out items where the joined item is null
      .map((ui: any): UserInventoryItem => ({
          id: ui.id,
          assigned_at: ui.assigned_at,
          item: {
            ...ui.inventory_items,
            quantity: ui.inventory_items.quantity ?? 0,
          } as InventoryItem
    })),
    location: p.lat && p.lng ? { lat: p.lat, lng: p.lng, lastUpdate: p.location_last_update } : undefined,
    pushSubscription: p.push_subscription
  };
};
