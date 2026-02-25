import { User, InventoryItem, Role, Skill, Badge, UserInventoryItem, Company } from '../types';

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
    company: p.company as Company,
    avatar: p.avatar,
    xp: p.xp,
    level: p.level,
    skills: (p.profile_skills || [])
      .filter((ps: any) => ps && ps.skills && typeof ps.skills === 'object') // Ensure junction and target objects exist and are objects
      .map((ps: any): Skill => ({
        id: ps.skills.id,
        name: ps.skills.name,
        level: ps.level
      })),
    badges: (p.user_badges || [])
      .filter((ub: any) => ub && ub.badges && typeof ub.badges === 'object') // Ensure junction and target objects exist and are objects
      .map((ub: any): Badge => ub.badges),
    inventory: (p.user_inventory || [])
      .filter((ui: any) => ui && ui.inventory_items && typeof ui.inventory_items === 'object') // Ensure junction and target objects exist and are objects
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