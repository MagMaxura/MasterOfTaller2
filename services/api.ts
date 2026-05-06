import { supabase } from '../config';
import { User, Mission, EquipmentSlot, Supply, MissionSupply, MissionRequirement, Reward } from '../types';
import { Database } from '../database.types';

type RequirementInsert = Database['public']['Tables']['mission_requirements']['Insert'];
type RequirementUpdate = Database['public']['Tables']['mission_requirements']['Update'];

type MissionInsert = Database['public']['Tables']['missions']['Insert'];
type MissionUpdate = Database['public']['Tables']['missions']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type MilestoneInsert = Database['public']['Tables']['mission_milestones']['Insert'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type SupplyInsert = Database['public']['Tables']['supplies']['Insert'];
type SupplyUpdate = Database['public']['Tables']['supplies']['Update'];
type SalaryInsert = Database['public']['Tables']['salarios']['Insert'];
type SalaryUpdate = Database['public']['Tables']['salarios']['Update'];
type HolidayInsert = { date: string; description: string };
type PayrollEventInsert = Database['public']['Tables']['eventos_nomina']['Insert'];
type PaymentPeriodInsert = Database['public']['Tables']['periodos_pago']['Insert'];
type PaymentPeriodUpdate = Database['public']['Tables']['periodos_pago']['Update'];
type UserScheduleUpdate = any; 
type UserScheduleInsert = any;


export const api = {
  // --- FETCH ---
  async getInitialData(userId: string) {
    return Promise.all([
      ...(await this.getLevel1Data(userId)),
      ...(await this.getLevel2Data(userId)),
      ...(await this.getLevel3Data(userId)),
      this.getVacationRequests()
    ]);
  },

  async getLevel1Data(userId: string) {
    const profileColumns = 'avatar, id, email, is_active, lat, level, lng, location_last_update, name, push_subscription, role, company, xp, attendance_id, joining_date, vacation_total_days, vacation_remaining_days, success_points';
    const missionColumns = 'id, created_at, title, description, status, difficulty, xp, bonus_monetario, assigned_to, start_date, deadline, required_skills, progress_photo_url, completed_date, bonus_xp, visible_to, company, role, success_points';
    const inventoryItemColumns = 'id, name, description, icon_url, slot, quantity';
    const badgeColumns = 'id, name, icon, description';

    return [
      supabase.from('profiles').select(`
          ${profileColumns},
          profile_skills ( level, skills ( id, name ) ),
          user_badges ( badges ( ${badgeColumns} ) ),
          user_inventory ( id, assigned_at, variant_id, inventory_items ( ${inventoryItemColumns} ), variant:inventory_variants ( id, size, quantity ) )
      `).eq('is_active', true),
      supabase.from('missions').select(missionColumns).order('created_at', { ascending: false }),
      (supabase as any).from('user_schedules').select('*')
    ];
  },

  async getLevel2Data(userId: string) {
    const inventoryItemColumns = 'id, name, description, icon_url, slot, quantity';
    const supplyColumns = 'id, created_at, general_category, specific_category, type, model, details, stock_quantity, photo_url';

    return [
      supabase.from('inventory_items').select(`${inventoryItemColumns}, variants:inventory_variants(id, item_id, size, quantity)`),
      supabase.from('badges').select('id, name, icon, description'),
      supabase.from('supplies').select(supplyColumns).order('general_category').order('specific_category'),
      supabase.from('mission_supplies').select(`id, created_at, mission_id, supply_id, quantity_assigned, quantity_used, supplies(${supplyColumns})`),
      supabase.from('mission_requirements').select('id, mission_id, description, quantity, is_purchased, created_at'),
      supabase.from('reward_items').select('*'),
      supabase.from('user_rewards').select('*, reward:reward_items(*)'),
      supabase.from('holidays').select('*').order('date', { ascending: true }),
      supabase.from('authority_relations').select('*').eq('active', true),
      supabase.from('recurring_incomes').select('*').order('created_at', { ascending: false }),
      supabase.from('customer_tracking').select('*').order('created_at', { ascending: false }),
      supabase.from('module_permissions').select('*'),
    ];
  },

  async getLevel3Data(userId: string) {
    const salaryColumns = 'id, user_id, monto_base_quincenal, ciclo_pago, created_at';
    const payrollEventColumns = 'id, user_id, tipo, descripcion, monto, fecha_evento, periodo_pago_id, mission_id, justificado, notas_justificacion, created_at';
    const paymentPeriodColumns = 'id, user_id, fecha_inicio_periodo, fecha_fin_periodo, fecha_pago, salario_base_calculado, total_adiciones, total_deducciones, monto_final_a_pagar, estado, created_at';

    return [
      supabase.from('salarios').select(salaryColumns),
      supabase.from('eventos_nomina').select(payrollEventColumns).order('fecha_evento', { ascending: false }),
      supabase.from('periodos_pago').select(`${paymentPeriodColumns}, events:eventos_nomina(*)`).order('fecha_pago', { ascending: false }),
      supabase.from('mission_milestones').select('id, mission_id, user_id, description, image_url, milestone_type, captured_at, captured_lat, captured_lng, location_accuracy_m, exif_taken_at, created_at, is_solution, mission:missions(title, required_skills)').order('created_at', { ascending: true }),
    ];
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
    const { error: eventsError } = await supabase.from('eventos_nomina').delete().eq('mission_id', missionId);
    if (eventsError) throw new Error(`Error deleting associated payroll events: ${eventsError.message}`);
    const { error: suppliesError } = await supabase.from('mission_supplies').delete().eq('mission_id', missionId);
    if (suppliesError) throw new Error(`Error deleting associated mission supplies: ${suppliesError.message}`);
    const { error: milestonesError } = await supabase.from('mission_milestones').delete().eq('mission_id', missionId);
    if (milestonesError) throw new Error(`Error deleting associated milestones: ${milestonesError.message}`);
    const { error } = await supabase.from('missions').delete().eq('id', missionId);
    if (error) throw new Error(error.message);
  },
  async createProfile(insertData: { id: string, name: string, avatar: string, role: Database['public']['Enums']['role'] }) {
    const { error } = await supabase.from('profiles').upsert({ ...insertData, is_active: true });
    if (error) throw new Error(error.message);
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
  async validateMissionEvidence(missionId: string, endAt?: string) {
    const { data, error } = await (supabase as any).rpc('validate_mission_evidence', {
      p_mission_id: missionId,
      p_end_at: endAt ?? new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    const result = Array.isArray(data) ? data[0] : data;
    return { is_valid: Boolean(result?.is_valid), message: String(result?.message || 'Validación incompleta') };
  },
  async assignInventoryItem(userId: string, itemId: string, assignedAt?: string, variantId?: string) {
    const { data, error } = await supabase.from('user_inventory').insert({
      user_id: userId, item_id: itemId, assigned_at: assignedAt || new Date().toISOString(), variant_id: variantId || null
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
    const filePath = `${itemData.name.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('iconos-equipamiento').upload(filePath, iconFile);
    if (uploadError) throw new Error(`Error subiendo ícono: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from('iconos-equipamiento').getPublicUrl(filePath);
    const { error: dbError } = await supabase.from('inventory_items').insert({ ...itemData, icon_url: urlData.publicUrl });
    if (dbError) throw new Error(`Error creando insumo: ${dbError.message}`);
  },
  async deleteInventoryItem(itemId: string, iconUrl: string) {
    const { error: dbError } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (dbError) throw new Error(dbError.message);
    try {
      const filePath = new URL(iconUrl).pathname.split('/iconos-equipamiento/')[1];
      if (filePath) await supabase.storage.from('iconos-equipamiento').remove([filePath]);
    } catch (e) { console.warn("Could not delete storage item:", e); }
  },
  async addSupply(supplyData: Omit<SupplyInsert, 'photo_url'>, photoFile: File | null) {
    let photoUrl: string | null = null;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `supply_photos/${supplyData.model.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
      await supabase.storage.from('public-assets').upload(filePath, photoFile);
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
      await supabase.storage.from('public-assets').upload(filePath, photoFile, { upsert: true });
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('supplies').update({ ...supplyData, photo_url: photoUrl }).eq('id', supplyId);
    if (error) throw new Error(error.message);
  },
  async deleteSupply(supply: Supply) {
    const { error } = await supabase.from('supplies').delete().eq('id', supply.id);
    if (error) throw new Error(error.message);
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
  async updateUserAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const uniqueUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
    const { error } = await supabase.from('profiles').update({ avatar: uniqueUrl }).eq('id', userId);
    if (error) throw new Error(error.message);
  },
  async uploadMilestoneImage(userId: string, missionId: string, imageFile: File) {
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `${userId}/${missionId}-${Date.now()}.${fileExt}`;
    await supabase.storage.from('milestone_photos').upload(filePath, imageFile);
    const { data } = supabase.storage.from('milestone_photos').getPublicUrl(filePath);
    return data.publicUrl;
  },
  async sendNotification(technicianId: string, title: string, body: string) {
    const { error } = await supabase.functions.invoke('send-notification', { body: { technician_id: technicianId, title, body } });
    if (error) throw new Error(error.message);
  },
  async assignBadge(userId: string, badgeId: string) {
    const { error } = await supabase.from('user_badges').insert({ user_id: userId, badge_id: badgeId });
    if (error) throw new Error(error.message);
  },
  async revokeBadge(userId: string, badgeId: string) {
    const { error } = await supabase.from('user_badges').delete().eq('user_id', userId).eq('badge_id', badgeId);
    if (error) throw new Error(error.message);
  },
  async upsertSalary(data: any) {
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
  async deletePayrollEventByCriteria(userId: string, date: string, type: string, descriptionLike: string) {
    // @ts-ignore
    const { error } = await supabase.from('eventos_nomina').delete().eq('user_id', userId).eq('fecha_evento', date).eq('tipo', type).ilike('descripcion', `%${descriptionLike}%`);
    if (error) throw new Error(error.message);
  },
  async deletePayrollEvent(id: string) {
    const { error } = await supabase.from('eventos_nomina').delete().eq('id', id);
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
  async calculatePayroll(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('calcular_nomina', { p_fecha_inicio: startDate, p_fecha_fin: endDate });
    if (error) throw new Error(error.message);
    return data;
  },
  async addMissionRequirement(data: RequirementInsert) {
    const { error } = await supabase.from('mission_requirements').insert(data);
    if (error) throw new Error(error.message);
  },
  async updateMissionRequirement(id: string, data: RequirementUpdate) {
    const { error } = await supabase.from('mission_requirements').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteMissionRequirement(id: string) {
    const { error } = await supabase.from('mission_requirements').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async updateUserSchedule(userId: string, data: any) {
    const { error } = await (supabase as any).from('user_schedules').update(data).eq('user_id', userId);
    if (error) throw new Error(error.message);
  },
  async getVacationRequests(userId?: string) {
    let query = supabase.from('vacation_requests').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },
  async createVacationRequest(data: any) {
    const { error } = await supabase.from('vacation_requests').insert(data);
    if (error) throw new Error(error.message);
  },
  async updateVacationStatus(id: string, status: string, reviewerId: string) {
    const { error } = await supabase.from('vacation_requests').update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteVacationRequest(id: string) {
    const { error } = await supabase.from('vacation_requests').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async generateDailyAbsences(date: string) {
    // @ts-ignore
    const { error } = await supabase.rpc('generate_daily_absences', { p_date: date });
    if (error) throw new Error(error.message);
  },
  async confirmLunch(userId: string, date: string, confirmed: boolean) {
    const { error } = await supabase.from('lunch_confirmations').upsert({ user_id: userId, date, confirmed });
    if (error) throw new Error(error.message);
  },
  async purchaseReward(userId: string, rewardId: string, cost: number) {
    const { error } = await supabase.from('user_rewards').insert({ user_id: userId, reward_id: rewardId, status: 'ACTIVE' });
    if (error) throw new Error(error.message);
  },
  async addReward(reward: any) {
    const { error } = await supabase.from('reward_items').insert(reward);
    if (error) throw new Error(error.message);
  },
  async updateReward(id: string, reward: any) {
    const { error } = await supabase.from('reward_items').update(reward).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteReward(id: string) {
    const { error } = await supabase.from('reward_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async addHoliday(data: any) {
    const { error } = await supabase.from('holidays').insert(data);
    if (error) throw new Error(error.message);
  },
  async deleteHoliday(id: string) {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async upsertAuthorityRelation(managerId: string, subordinateId: string, notes?: string | null) {
    const { error } = await supabase.from('authority_relations').upsert({ manager_id: managerId, subordinate_id: subordinateId, active: true, notes: notes ?? null });
    if (error) throw new Error(error.message);
  },
  async removeAuthorityRelation(subordinateId: string) {
    const { error } = await supabase.from('authority_relations').update({ active: false }).eq('subordinate_id', subordinateId);
    if (error) throw new Error(error.message);
  },
  // --- RECURRING INCOMES ---
  async getRecurringIncomes() {
    const { data, error } = await supabase.from('recurring_incomes').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  async addRecurringIncome(data: any) {
    const { error } = await supabase.from('recurring_incomes').insert(data);
    if (error) throw new Error(error.message);
  },
  async updateRecurringIncome(id: string, data: any) {
    const { error } = await supabase.from('recurring_incomes').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteRecurringIncome(id: string) {
    const { error } = await supabase.from('recurring_incomes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  // --- CUSTOMER TRACKING ---
  async getCustomerProjects() {
    const { data, error } = await supabase.from('customer_tracking').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  async addCustomerProject(data: any) {
    const { error } = await supabase.from('customer_tracking').insert(data);
    if (error) throw new Error(error.message);
  },
  async updateCustomerProject(id: string, data: any) {
    const { error } = await supabase.from('customer_tracking').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async deleteCustomerProject(id: string) {
    const { error } = await supabase.from('customer_tracking').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  // --- MODULE PERMISSIONS ---
  async getModulePermissions() {
    const { data, error } = await supabase.from('module_permissions').select('*');
    if (error) throw new Error(error.message);
    return data;
  },
  async upsertModulePermission(data: any) {
    const { error } = await supabase.from('module_permissions').upsert(data, {
      onConflict: data.user_id ? 'user_id, module_id' : data.role ? 'role, module_id' : 'company, module_id'
    });
    if (error) throw new Error(error.message);
  },
  async deleteModulePermission(id: string) {
    const { error } = await supabase.from('module_permissions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};
