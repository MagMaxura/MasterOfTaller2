

import { supabase } from '../config';
import { Database } from '../database.types';
import { User, Mission, EquipmentSlot, Supply, MissionSupply } from '../types';

type MissionInsert = Database['public']['Tables']['missions']['Insert'];
type MissionUpdate = Database['public']['Tables']['missions']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type MilestoneInsert = Database['public']['Tables']['mission_milestones']['Insert'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type SupplyInsert = Database['public']['Tables']['supplies']['Insert'];
type SupplyUpdate = Database['public']['Tables']['supplies']['Update'];
type SalaryInsert = Database['public']['Tables']['salarios']['Insert'];
type SalaryUpdate = Database['public']['Tables']['salarios']['Update'];
type PayrollEventInsert = Database['public']['Tables']['eventos_nomina']['Insert'];
type PaymentPeriodInsert = Database['public']['Tables']['periodos_pago']['Insert'];
type PaymentPeriodUpdate = Database['public']['Tables']['periodos_pago']['Update'];


export const api = {
  // --- FETCH ---
  async getInitialData(userId: string) {
    const profileColumns = 'avatar, id, is_active, lat, level, lng, location_last_update, name, push_subscription, role, xp';
    const missionColumns = 'id, created_at, title, description, status, difficulty, xp, bonus_monetario, assigned_to, start_date, deadline, required_skills, progress_photo_url, completed_date, bonus_xp, visible_to';
    const inventoryItemColumns = 'id, name, description, icon_url, slot, quantity';
    const badgeColumns = 'id, name, icon, description';
    const supplyColumns = 'id, created_at, general_category, specific_category, type, model, details, stock_quantity, photo_url';
    const salaryColumns = 'id, user_id, monto_base_quincenal, created_at';
    const payrollEventColumns = 'id, user_id, tipo, descripcion, monto, fecha_evento, periodo_pago_id, mission_id, created_at';
    const paymentPeriodColumns = 'id, user_id, fecha_inicio_periodo, fecha_fin_periodo, fecha_pago, salario_base_calculado, total_adiciones, total_deducciones, monto_final_a_pagar, estado, created_at';

    // NEW: Combined query for profiles using relationships. This is more efficient and robust.
    // NEW: Combined query for profiles using relationships. This is more efficient and robust.
    const profilesQuery = supabase.from('profiles').select(`
        ${profileColumns},
        profile_skills ( level, skills ( id, name ) ),
        user_badges ( badges ( ${badgeColumns} ) ),
        user_inventory ( id, assigned_at, variant_id, inventory_items ( ${inventoryItemColumns} ), variant:inventory_variants ( id, size, quantity ) )
    `).eq('is_active', true);

    return Promise.all([
      profilesQuery, // Replaces separate fetches for profiles, skills, badges, inventory
      supabase.from('missions').select(missionColumns).order('created_at', { ascending: false }),
      supabase.from('inventory_items').select(`${inventoryItemColumns}, variants:inventory_variants(id, item_id, size, quantity)`),
      supabase.from('badges').select(badgeColumns),
      supabase.from('mission_milestones').select('id, mission_id, user_id, description, image_url, created_at, is_solution, mission:missions(title, required_skills)').order('created_at', { ascending: true }),
      supabase.from('chats').select('id, created_at, participant_1, participant_2').or(`participant_1.eq.${userId},participant_2.eq.${userId}`),
      supabase.from('chat_messages').select('id, chat_id, sender_id, content, created_at, is_read').order('created_at', { ascending: true }),
      supabase.from('supplies').select(supplyColumns).order('general_category').order('specific_category'),
      supabase.from('mission_supplies').select(`id, created_at, mission_id, supply_id, quantity_assigned, quantity_used, supplies(${supplyColumns})`),
      supabase.from('salarios').select(salaryColumns),
      supabase.from('eventos_nomina').select(payrollEventColumns).order('fecha_evento', { ascending: false }),
      supabase.from('periodos_pago').select(`${paymentPeriodColumns}, events:eventos_nomina(*)`).order('fecha_pago', { ascending: false }),
    ]);
  },

  // --- MUTATIONS ---
  async updateMission(id: string, updateData: MissionUpdate) {
    const { error } = await supabase.from('missions').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async addMission(insertData: MissionInsert) {
    const { error } = await supabase.from('missions').insert(insertData);
    if (error) throw new Error(error.message);
  },
  async deleteMission(missionId: string) {
    // First, delete dependencies to ensure referential integrity
    // if ON DELETE CASCADE is not configured.
    const { error: eventsError } = await supabase.from('eventos_nomina').delete().eq('mission_id', missionId);
    if (eventsError) throw new Error(`Error deleting associated payroll events: ${eventsError.message}`);

    const { error: suppliesError } = await supabase.from('mission_supplies').delete().eq('mission_id', missionId);
    if (suppliesError) throw new Error(`Error deleting associated mission supplies: ${suppliesError.message}`);

    const { error: milestonesError } = await supabase.from('mission_milestones').delete().eq('mission_id', missionId);
    if (milestonesError) throw new Error(`Error deleting associated milestones: ${milestonesError.message}`);

    const { error } = await supabase.from('missions').delete().eq('id', missionId);
    if (error) {
      const isRlsError = error.message.includes("violates row-level security policy") || error.code === '42501';
      const errorMessage = isRlsError
        ? "Error de Permisos: Para eliminar misiones, el rol 'administrador' debe tener permisos de 'DELETE' en las políticas de seguridad (RLS) de Supabase para las tablas: 'missions', 'mission_supplies' y 'mission_milestones'."
        : `Error final al eliminar la misión: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
  async updateUser(id: string, updateData: ProfileUpdate) {
    const { error } = await supabase.from('profiles').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deactivateUser(userId: string) {
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', userId);
    if (error) throw new Error(error.message);
  },
  async addMissionMilestone(insertData: MilestoneInsert) {
    const { error } = await supabase.from('mission_milestones').insert(insertData);
    if (error) throw new Error(`Error al guardar el hito: ${error.message}`);
  },
  async toggleMilestoneSolution(milestoneId: string, isSolution: boolean) {
    const { error } = await supabase.from('mission_milestones').update({ is_solution: isSolution }).eq('id', milestoneId);
    if (error) throw new Error(error.message);
  },
  async assignInventoryItem(userId: string, itemId: string, assignedAt?: string, variantId?: string) {
    const { data, error } = await supabase.from('user_inventory').insert({
      user_id: userId,
      item_id: itemId,
      assigned_at: assignedAt || new Date().toISOString(),
      variant_id: variantId || null
    }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  async removeInventoryItem(userInventoryId: string) {
    const { error } = await supabase.from('user_inventory').delete().eq('id', userInventoryId);
    if (error) throw new Error(error.message);
  },
  async disposeOfInventoryItem(userInventoryId: string, itemId: string) {
    const { error } = await supabase.rpc('dispose_inventory_item', { p_user_inventory_id: userInventoryId, p_item_id: itemId });
    if (error) throw new Error(`Error al tirar insumo: ${error.message}`);
  },
  async updateInventoryItemQuantity(itemId: string, newQuantity: number) {
    const { error } = await supabase.from('inventory_items').update({ quantity: Math.max(0, newQuantity) }).eq('id', itemId);
    if (error) throw new Error(error.message);
  },
  async updateInventoryVariantQuantity(variantId: string, newQuantity: number) {
    const { error } = await supabase.from('inventory_variants').update({ quantity: Math.max(0, newQuantity) }).eq('id', variantId);
    if (error) throw new Error(error.message);
  },
  async addInventoryItem(itemData: Omit<InventoryItemInsert, 'icon_url'>, iconFile: File) {
    const fileExt = iconFile.name.split('.').pop();
    const filePath = `public/${itemData.name.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('inventory_icons').upload(filePath, iconFile);
    if (uploadError) throw new Error(`Error subiendo ícono: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('inventory_icons').getPublicUrl(filePath);
    if (!urlData.publicUrl) throw new Error("No se pudo obtener la URL del ícono.");

    const { error: dbError } = await supabase.from('inventory_items').insert({ ...itemData, icon_url: urlData.publicUrl });
    if (dbError) throw new Error(`Error creando insumo: ${dbError.message}`);
  },
  async deleteInventoryItem(itemId: string, iconUrl: string) {
    const { error: dbError } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (dbError) throw new Error(dbError.message);

    try {
      const filePath = new URL(iconUrl).pathname.split('/inventory_icons/')[1];
      if (filePath) await supabase.storage.from('inventory_icons').remove([filePath]);
    } catch (e) { console.warn("Could not delete storage item, it might not exist:", e); }
  },
  async addSupply(supplyData: Omit<SupplyInsert, 'photo_url'>, photoFile: File | null) {
    let photoUrl: string | null = null;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `supply_photos/${supplyData.model.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, photoFile);
      if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('supplies').insert({ ...supplyData, photo_url: photoUrl });
    if (error) throw new Error(error.message);
  },
  async updateSupply(supplyId: string, supplyData: SupplyUpdate, photoFile: File | null) {
    let photoUrl = supplyData.photo_url;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `supply_photos/${supplyData.model?.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, photoFile, { upsert: true });
      if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('supplies').update({ ...supplyData, photo_url: photoUrl }).eq('id', supplyId);
    if (error) throw new Error(error.message);
  },
  async deleteSupply(supply: Supply) {
    const { error } = await supabase.from('supplies').delete().eq('id', supply.id);
    if (error) throw new Error(`No se pudo eliminar el insumo. Es posible que esté asignado a una misión. Detalle: ${error.message}`);
    if (supply.photo_url) {
      try {
        const filePath = new URL(supply.photo_url).pathname.split('/public-assets/')[1];
        if (filePath) await supabase.storage.from('public-assets').remove([filePath]);
      } catch (e) { console.warn("No se pudo eliminar la foto del insumo:", e); }
    }
  },
  async assignSupplyToMission(missionId: string, supplyId: string, quantity: number) {
    const { error } = await supabase.from('mission_supplies').insert({ mission_id: missionId, supply_id: supplyId, quantity_assigned: quantity });
    if (error) throw new Error(error.message);
  },
  async updateMissionSupply(missionSupplyId: string, data: Partial<Pick<MissionSupply, 'quantity_assigned' | 'quantity_used'>>) {
    const { error } = await supabase.from('mission_supplies').update(data).eq('id', missionSupplyId);
    if (error) throw new Error(error.message);
  },
  async removeSupplyFromMission(missionSupplyId: string) {
    const { error } = await supabase.from('mission_supplies').delete().eq('id', missionSupplyId);
    if (error) throw new Error(error.message);
  },
  async createChat(participant_1: string, participant_2: string) {
    return supabase.from('chats').insert({ participant_1, participant_2 }).select().single();
  },
  async sendMessage(chatId: string, senderId: string, content: string) {
    const { error } = await supabase.from('chat_messages').insert({ chat_id: chatId, sender_id: senderId, content });
    if (error) throw new Error(error.message);
  },
  async markMessagesAsRead(chatId: string, currentUserId: string) {
    const { error } = await supabase.from('chat_messages').update({ is_read: true }).eq('chat_id', chatId).neq('sender_id', currentUserId);
    if (error) console.error("Error marking messages as read:", error);
  },

  // --- STORAGE ---
  async updateUserAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) throw new Error(`Error al subir avatar: ${uploadError.message}`);

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!data.publicUrl) throw new Error("No se pudo obtener la URL pública del avatar.");

    const uniqueUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
    const { error: dbError } = await supabase.from('profiles').update({ avatar: uniqueUrl }).eq('id', userId);
    if (dbError) throw new Error(`Error al actualizar la base de datos: ${dbError.message}`);
  },
  async uploadMilestoneImage(userId: string, missionId: string, imageFile: File) {
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `${userId}/${missionId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('milestone_photos').upload(filePath, imageFile);
    if (uploadError) throw new Error(`Error al subir la imagen: ${uploadError.message}`);

    const { data } = supabase.storage.from('milestone_photos').getPublicUrl(filePath);
    if (!data.publicUrl) throw new Error("No se pudo obtener la URL pública de la imagen.");
    return data.publicUrl;
  },

  // --- FUNCTIONS ---
  async sendNotification(technicianId: string, title: string, body: string) {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { technician_id: technicianId, title, body }
    });
    if (error) throw new Error(error.message);
  },

  // --- BADGES ---
  async assignBadge(userId: string, badgeId: string) {
    const { error } = await supabase.from('user_badges').insert({ user_id: userId, badge_id: badgeId });
    if (error) throw new Error(error.message);
  },
  async revokeBadge(userId: string, badgeId: string) {
    const { error } = await supabase.from('user_badges').delete().eq('user_id', userId).eq('badge_id', badgeId);
    if (error) throw new Error(error.message);
  },

  // --- PAYROLL ---
  async upsertSalary(data: SalaryInsert) {
    const { error } = await supabase.from('salarios').upsert(data, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
  },
  async addPayrollEvent(data: PayrollEventInsert) {
    const { error } = await supabase.from('eventos_nomina').insert(data);
    if (error) throw new Error(error.message);
  },
  async updatePayrollEvent(id: string, data: Partial<PayrollEventInsert>) {
    const { error } = await supabase.from('eventos_nomina').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async addPaymentPeriod(data: PaymentPeriodInsert) {
    const { data: newPeriod, error } = await supabase.from('periodos_pago').insert(data).select().single();
    if (error) throw new Error(error.message);
    return newPeriod;
  },
  async updatePaymentPeriod(id: string, data: PaymentPeriodUpdate) {
    const { error } = await supabase.from('periodos_pago').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async linkEventsToPeriod(eventIds: string[], periodId: string) {
    const { error } = await supabase.from('eventos_nomina').update({ periodo_pago_id: periodId }).in('id', eventIds);
    if (error) throw new Error(error.message);
  },
  async calculatePayroll(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('calcular_nomina', { p_fecha_inicio: startDate, p_fecha_fin: endDate });
    if (error) throw new Error(`Error al calcular nómina: ${error.message}`);
    return data; // Returns the count of processed users
  }
};