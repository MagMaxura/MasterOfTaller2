import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { User, Mission, InventoryItem, EquipmentSlot, MissionMilestone, MissionStatus, UserInventoryItem, Supply, MissionSupply, Badge, Salary, PayrollEvent, PaymentPeriod, Role, MissionDifficulty, PayrollEventType, MissionRequirement, Company, AttendanceSummary, UserSchedule, VacationRequest, Reward, UserReward } from '../types';
import { supabase } from '../config';
import { transformSupabaseProfileToUser } from '../utils/dataTransformers';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../services/api';
import { attendanceService, AttendanceUser } from '../services/attendanceService';
import { Database } from '../database.types';

// --- CONTEXT INTERFACE ---
interface DataContextType {
  currentUser: User | null;
  users: User[];
  missions: Mission[];
  allInventoryItems: InventoryItem[];
  allBadges: Badge[];
  missionMilestones: MissionMilestone[];
  supplies: Supply[];
  missionSupplies: MissionSupply[];
  missionRequirements: MissionRequirement[];
  salaries: Salary[];
  payrollEvents: PayrollEvent[];
  paymentPeriods: PaymentPeriod[];
  userSchedules: UserSchedule[];
  attendanceUsers: AttendanceUser[];
  vacationRequests: VacationRequest[];
  rewardItems: Reward[];
  userRewards: UserReward[];
  loading: boolean;
  viewingProfileOf: User | null;
  setViewingProfileOf: (user: User | null) => void;
  updateMission: (updatedMission: Partial<Mission>) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  updateUserAvatar: (userId: string, file: File) => Promise<void>;
  addMission: (newMission: Omit<Mission, 'id' | 'status'>) => Promise<void>;
  requestMission: (title: string, description: string) => Promise<void>;
  technicianRequestMission: (missionId: string) => Promise<void>;
  requestToJoinMission: (missionId: string) => Promise<void>;
  approveJoinRequest: (requestMission: Mission) => Promise<void>;
  rejectJoinRequest: (requestMissionId: string) => Promise<void>;
  rejectMissionRequest: (missionId: string) => Promise<void>;
  deleteMission: (missionId: string) => Promise<void>;
  addMissionMilestone: (missionId: string, description: string, imageFile: File | null) => Promise<void>;
  toggleMilestoneSolution: (milestoneId: string, isSolution: boolean) => Promise<void>;
  assignInventoryItem: (userId: string, itemId: string, variantId?: string) => Promise<void>;
  removeInventoryItem: (userInventoryId: string) => Promise<void>;
  disposeOfInventoryItem: (userInventoryId: string, itemId: string) => Promise<void>;
  updateInventoryItemQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  updateInventoryVariantQuantity: (variantId: string, newQuantity: number) => Promise<void>;
  addInventoryItem: (data: { name: string; description: string; slot: EquipmentSlot; quantity: number; }, iconFile: File) => Promise<void>;
  deleteInventoryItem: (itemId: string, iconUrl: string) => Promise<void>;
  savePushSubscription: (userId: string, subscription: PushSubscription) => Promise<void>;
  sendNotification: (technicianId: string, title: string, body: string) => Promise<void>;
  addSupply: (data: Omit<Supply, 'id' | 'created_at' | 'stock_quantity'>, photoFile: File | null) => Promise<void>;
  updateSupply: (supplyId: string, data: Partial<Supply>, photoFile: File | null) => Promise<void>;
  deleteSupply: (supply: Supply) => Promise<void>;
  assignSupplyToMission: (missionId: string, supplyId: string, quantity: number) => Promise<void>;
  updateMissionSupply: (missionSupplyId: string, data: Partial<Pick<MissionSupply, 'quantity_assigned' | 'quantity_used'>>) => Promise<void>;
  removeSupplyFromMission: (missionSupplyId: string) => Promise<void>;
  assignBadge: (userId: string, badgeId: string) => Promise<void>;
  revokeBadge: (userId: string, badgeId: string) => Promise<void>;
  setSalary: (userId: string, amount: number, salaryId?: string) => Promise<void>;
  addPayrollEvent: (eventData: Omit<PayrollEvent, 'id' | 'created_at' | 'periodo_pago_id' | 'mission_id'>) => Promise<void>;
  updatePayrollEvent: (id: string, eventData: Partial<PayrollEvent>) => Promise<void>;
  createMissionBonusEvent: (userId: string, mission: Mission) => Promise<void>;
  calculatePayPeriods: () => Promise<void>;
  markPeriodAsPaid: (periodId: string) => Promise<void>;
  registrarPagoParcial: (periodId: string, monto: number) => Promise<void>;
  addMissionRequirement: (missionId: string, description: string, quantity: number) => Promise<void>;
  updateMissionRequirement: (id: string, data: Partial<MissionRequirement>) => Promise<void>;
  deleteMissionRequirement: (id: string) => Promise<void>;
  updateUserSchedule: (userId: string, data: Partial<UserSchedule>) => Promise<void>;
  requestVacation: (data: Omit<VacationRequest, 'id' | 'status' | 'created_at'> & { status?: VacationRequest['status'] }) => Promise<void>;
  updateVacationStatus: (requestId: string, status: VacationRequest['status'], reason?: string) => Promise<void>;
  deleteVacationRequest: (requestId: string) => Promise<void>;
  purchaseReward: (reward: Reward) => Promise<void>;
  addReward: (reward: Omit<Reward, 'id' | 'created_at'>) => Promise<void>;
  updateReward: (id: string, reward: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
}

// --- CONTEXT CREATION ---
const DataContext = createContext<DataContextType | null>(null);
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};


// --- MAIN DATA PROVIDER COMPONENT ---
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [missionMilestones, setMissionMilestones] = useState<MissionMilestone[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [missionSupplies, setMissionSupplies] = useState<MissionSupply[]>([]);
  const [missionRequirements, setMissionRequirements] = useState<MissionRequirement[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [payrollEvents, setPayrollEvents] = useState<PayrollEvent[]>([]);
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([]);
  const [userSchedules, setUserSchedules] = useState<UserSchedule[]>([]);
  const [attendanceUsers, setAttendanceUsers] = useState<AttendanceUser[]>([]);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [rewardItems, setRewardItems] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfileOf, setViewingProfileOf] = useState<User | null>(null);

  const checkAndGenerateDailyAbsences = useCallback(async () => {
    if (!authUser || authUser.id.startsWith('demo-')) return;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await api.generateDailyAbsences(todayStr);
    } catch (e) {
      console.error("Error generating daily absences:", e);
    }
  }, [authUser]);

  const reconcileDailyAttendance = useCallback(async (currentUsers: User[], currentEvents: PayrollEvent[]) => {
    if (!authUser || authUser.id.startsWith('demo-')) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;

    for (const user of currentUsers) {
      if (user.role !== Role.TECHNICIAN) continue;
      try {
        const attUser = user.attendance_id
          ? await attendanceService.getUserProfileById(user.attendance_id)
          : (user.email ? await attendanceService.getUserProfileByEmail(user.email) : null);
        if (!attUser) continue;

        const logs = await attendanceService.getAccessLogsByRange(attUser.id, todayStr, todayStr);
        const hasIn = logs.some(l => l.type.toUpperCase() === 'IN' || l.type.toUpperCase() === 'ENTRADA');

        if (hasIn) {
          const autoAbsence = currentEvents.find(e =>
            e.user_id === user.id &&
            e.fecha_evento === todayStr &&
            e.tipo === PayrollEventType.ABSENCE &&
            e.descripcion.includes('Auto-generada')
          );
          if (autoAbsence) {
            await api.deletePayrollEventByCriteria(user.id, todayStr, PayrollEventType.ABSENCE, 'Auto-generada');
            changed = true;
          }
        }
      } catch (e) { console.warn("Reconciliation error:", e); }
    }
    return changed;
  }, [authUser]);

  const fetchData = useCallback(async () => {
    if (!authUser?.id) return;

    // --- DEMO MODE BYPASS ---
    if (authUser.id.startsWith('demo-')) {
      console.log("Loading Demo Data...");

      const mockAdmin: User = {
        id: 'demo-admin',
        name: 'Admin Demo',
        email: 'admin@demo.com',
        role: Role.ADMIN,
        company: Company.POTABILIZAR,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        xp: 9999,
        level: 100,
        skills: [],
        badges: [],
        inventory: [],
        pushSubscription: null,
        is_active: true
      };
      const mockTech: User = {
        id: 'demo-technician',
        name: 'Técnico Demo',
        email: 'tech@demo.com',
        role: Role.TECHNICIAN,
        company: Company.GREEN_HABITAT,
        is_active: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        xp: 2450,
        level: 8,
        skills: [{ id: 's1', name: 'Mecánica', level: 75 }, { id: 's2', name: 'Electrónica', level: 40 }],
        badges: [],
        inventory: [],
        pushSubscription: null,
        location: { lat: -34.6037, lng: -58.3816, lastUpdate: new Date().toISOString() }
      };

      const current = authUser.id === 'demo-admin' ? mockAdmin : mockTech;
      setCurrentUser(current);
      setUsers([mockAdmin, mockTech]);

      const mockMissions: Mission[] = [
        {
          id: 'm1',
          title: 'Reparación Motor V8',
          description: 'Desarmar y rectificar culata de Ford Mustang.',
          status: MissionStatus.IN_PROGRESS,
          difficulty: MissionDifficulty.HIGH,
          xp: 500,
          assignedTo: ['demo-technician'],
          startDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000).toISOString(),
          skills: ['Mecánica'],
          visibleTo: ['demo-technician'],
          created_at: new Date().toISOString(),
          bonusMonetario: 50000
        },
        {
          id: 'm2',
          title: 'Cambio de Aceite',
          description: 'Mantenimiento de rutina Ford Ranger.',
          status: MissionStatus.PENDING,
          difficulty: MissionDifficulty.LOW,
          xp: 100,
          assignedTo: ['demo-technician'],
          startDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
          skills: [],
          visibleTo: ['demo-technician'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'm3',
          title: 'Diagnóstico Electrónico',
          description: 'Escanear fallas en ECU de Toyota Hilux.',
          status: MissionStatus.COMPLETED,
          difficulty: MissionDifficulty.MEDIUM,
          xp: 250,
          assignedTo: ['demo-technician'],
          startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          deadline: new Date(Date.now() - 86400000 * 4).toISOString(),
          completedDate: new Date(Date.now() - 86400000 * 4).toISOString(),
          skills: ['Electrónica'],
          visibleTo: ['demo-technician'],
          created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
          progressPhoto: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=300&h=200'
        }
      ];
      setMissions(mockMissions);
      setLoading(false);
      return;
    }
    // --- END DEMO MODE ---

    try {
      // --- STAGE 1: CRITICAL DATA (Level 1) ---
      const level1Promises = await api.getLevel1Data(authUser.id);
      const [profilesRes, missionsRes, schedulesRes] = await Promise.all(level1Promises);

      if (profilesRes.error) throw new Error(`Perfiles: ${profilesRes.error.message}`);
      const rawProfiles = (profilesRes.data || []) as any[];
      const transformedUsers = rawProfiles.map(transformSupabaseProfileToUser);
      setUsers(transformedUsers);

      let foundUser = transformedUsers.find(u => u.id === authUser.id);

      // AUTO-REGISTRATION logic (simplified)
      if (!foundUser) {
        const { data: existing } = await supabase.from('profiles').select('id, is_active').eq('id', authUser.id).maybeSingle();
        if (!existing) {
          const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Nuevo';
          await api.createProfile({ id: authUser.id, name, avatar: '', role: 'tecnico' });
          // Fetch again Level 1 for complete profile
          const [p2] = await Promise.all(await api.getLevel1Data(authUser.id));
          if (p2.data) {
            foundUser = transformSupabaseProfileToUser(p2.data[0]);
            setUsers(prev => [...prev, foundUser!]);
          }
        }
      }
      setCurrentUser(foundUser || null);

      if (missionsRes.error) throw new Error(`Misiones: ${missionsRes.error.message}`);
      const initialMissions = (missionsRes.data || []).map((m: any) => ({
        ...m,
        assignedTo: m.assigned_to,
        startDate: m.start_date,
        deadline: m.deadline,
        skills: m.required_skills,
        progressPhoto: m.progress_photo_url,
        completedDate: m.completed_date,
        bonusXp: m.bonus_xp,
        visibleTo: m.visible_to,
      }));
      setMissions(initialMissions);

      if (schedulesRes.error) console.warn("Schedules error:", schedulesRes.error);
      setUserSchedules((schedulesRes.data || []) as any[]);

      try {
        const extAttendanceUsers = await attendanceService.getAllUsers();
        setAttendanceUsers(extAttendanceUsers);
      } catch (err) {
        console.error("Error fetching attendance users:", err);
      }

      // --- UNLOCK UI ---
      setLoading(false);

      // --- STAGE 2: BACKGROUND DATA (Level 2 & 3) ---
      const [l2Promises, l3Promises, vacationsData] = await Promise.all([
        api.getLevel2Data(authUser.id),
        api.getLevel3Data(authUser.id),
        api.getVacationRequests()
      ]);

      const [invRes, badgeRes, supRes, mSupRes, reqRes, rewRes, uRewRes] = await Promise.all(l2Promises);
      const [salRes, payRes, perRes, mileRes] = await Promise.all(l3Promises);

      // Level 2 updates
      if (invRes.data) setAllInventoryItems(invRes.data.map((item: any) => ({ ...item, quantity: item.quantity ?? 0 })));
      if (badgeRes.data) setAllBadges(badgeRes.data as Badge[]);
      if (supRes.data) setSupplies(supRes.data as Supply[]);
      if (mSupRes.data) setMissionSupplies(mSupRes.data as MissionSupply[]);
      if (reqRes.data) setMissionRequirements(reqRes.data as MissionRequirement[]);
      if (rewRes.data) setRewardItems(rewRes.data as Reward[]);
      if (uRewRes.data) setUserRewards(uRewRes.data as UserReward[]);

      // Level 3 updates
      if (salRes.data) setSalaries(salRes.data as Salary[]);
      if (perRes.data) {
        const rawPeriods = perRes.data as PaymentPeriod[];
        setPaymentPeriods(rawPeriods); // Initial set, could be enriched later
      }
      if (mileRes.data) setMissionMilestones(mileRes.data.map((m: any) => ({ ...m, is_solution: m.is_solution ?? false })) as MissionMilestone[]);

      setVacationRequests((vacationsData || []) as any[]);

      // Reconcliation logic (Critical for technician)
      if (foundUser?.role === Role.TECHNICIAN && payRes.data) {
        await reconcileDailyAttendance(transformedUsers, payRes.data as PayrollEvent[]);
      }
      setPayrollEvents((payRes.data || []) as PayrollEvent[]);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      showToast(error.message || "Error al cargar datos", 'error');
      setLoading(false);
    }
  }, [authUser, showToast, reconcileDailyAttendance]);

  useEffect(() => {
    if (authUser) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser, fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!authUser || !supabase || authUser.id.startsWith('demo-')) return;
    const allChannels = [
      supabase.channel('public:missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => fetchData()).subscribe(),
      supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData()).subscribe(),
      supabase.channel('public:user_inventory').on('postgres_changes', { event: '*', schema: 'public', table: 'user_inventory' }, () => fetchData()).subscribe(),
      supabase.channel('public:inventory_items').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchData()).subscribe(),
      supabase.channel('public:mission_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_milestones' }, () => fetchData()).subscribe(),
      supabase.channel('public:supplies').on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, () => fetchData()).subscribe(),
      supabase.channel('public:mission_supplies').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_supplies' }, () => fetchData()).subscribe(),
      supabase.channel('public:mission_requirements').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_requirements' }, () => fetchData()).subscribe(),
      supabase.channel('public:user_badges').on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => fetchData()).subscribe(),
      supabase.channel('public:profile_skills').on('postgres_changes', { event: '*', schema: 'public', table: 'profile_skills' }, () => fetchData()).subscribe(),
      supabase.channel('public:salarios').on('postgres_changes', { event: '*', schema: 'public', table: 'salarios' }, () => fetchData()).subscribe(),
      supabase.channel('public:eventos_nomina').on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_nomina' }, () => fetchData()).subscribe(),
      supabase.channel('public:periodos_pago').on('postgres_changes', { event: '*', schema: 'public', table: 'periodos_pago' }, () => fetchData()).subscribe(),
      supabase.channel('public:user_schedules').on('postgres_changes', { event: '*', schema: 'public', table: 'user_schedules' }, () => fetchData()).subscribe(),
      supabase.channel('public:vacation_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' }, () => fetchData()).subscribe(),
    ];
    return () => { allChannels.forEach(channel => supabase.removeChannel(channel)); };
  }, [authUser, fetchData]);


  // --- MUTATIONS ---
  const updateMission = async (updatedMission: Partial<Mission>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!updatedMission.id) return;
    const { id, assignedTo, startDate, deadline, skills, progressPhoto, completedDate, bonusXp, bonusMonetario, visibleTo, ...rest } = updatedMission;

    await api.updateMission(id, {
      ...(rest as any),
      assigned_to: assignedTo,
      start_date: startDate,
      deadline: deadline,
      required_skills: skills,
      progress_photo_url: progressPhoto,
      completed_date: completedDate,
      bonus_xp: bonusXp,
      bonus_monetario: bonusMonetario,
      visible_to: visibleTo,
    });
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.xp !== undefined) updateData.xp = data.xp;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.pushSubscription !== undefined) updateData.push_subscription = data.pushSubscription;
    if (data.attendance_id !== undefined) updateData.attendance_id = data.attendance_id;
    if (data.joining_date !== undefined) updateData.joining_date = data.joining_date;
    if (data.vacation_total_days !== undefined) updateData.vacation_total_days = data.vacation_total_days;
    if (data.vacation_remaining_days !== undefined) updateData.vacation_remaining_days = data.vacation_remaining_days;

    await api.updateUser(userId, updateData);

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    if (viewingProfileOf?.id === userId) setViewingProfileOf(prev => prev ? { ...prev, ...data } : null);
  };

  const deactivateUser = async (userId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.deactivateUser(userId);
    fetchData();
  };

  const updateUserAvatar = (userId: string, file: File) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateUserAvatar(userId, file);
  }
  const deleteMission = (missionId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.deleteMission(missionId);
  }
  const removeInventoryItem = (userInventoryId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.removeInventoryItem(userInventoryId);
  }
  const disposeOfInventoryItem = (userInventoryId: string, itemId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.disposeOfInventoryItem(userInventoryId, itemId);
  }
  const updateInventoryItemQuantity = async (itemId: string, newQuantity: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }

    // Optimistic update
    setAllInventoryItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

    try {
      await api.updateInventoryItemQuantity(itemId, newQuantity);
    } catch (error) {
      // Revert if error (fetchData will eventually sync it anyway, but this is cleaner)
      fetchData();
      throw error;
    }
  }
  const updateInventoryVariantQuantity = (variantId: string, newQuantity: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateInventoryVariantQuantity(variantId, newQuantity);
  }
  const deleteInventoryItem = (itemId: string, iconUrl: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.deleteInventoryItem(itemId, iconUrl);
  }
  const sendNotification = (technicianId: string, title: string, body: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.sendNotification(technicianId, title, body);
  }
  const savePushSubscription = async (userId: string, subscription: PushSubscription) => {
    if (currentUser?.id.startsWith('demo-')) { console.log('Simulating push sub save'); return; }
    try { await api.updateUser(userId, { push_subscription: subscription }); }
    catch (e) { console.error("Error saving push subscription:", e); }
  }
  const addInventoryItem = (data: { name: string; description: string; slot: EquipmentSlot; quantity: number; }, iconFile: File) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.addInventoryItem(data, iconFile);
  }
  const assignInventoryItem = async (userId: string, itemId: string, variantId?: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    const inventoryItem = allInventoryItems.find(i => i.id === itemId);
    if (!inventoryItem) { showToast('Ítem de inventario no encontrado.', 'error'); return; }
    try {
      const assignedAt = new Date().toISOString();
      const newDbRow = await api.assignInventoryItem(userId, itemId, assignedAt, variantId);
      const newUserInventoryItem: UserInventoryItem = {
        id: newDbRow?.id || `temp-${Date.now()}`,
        assigned_at: assignedAt,
        item: inventoryItem,
        variant_id: variantId,
        variant: variantId ? inventoryItem.variants?.find(v => v.id === variantId) : undefined
      };
      const updateUserState = (u: User) => {
        if (u.id !== userId) return u;
        return { ...u, inventory: [...u.inventory, newUserInventoryItem] };
      };
      setUsers(prev => prev.map(updateUserState));
      if (currentUser?.id === userId) setCurrentUser(prev => prev ? updateUserState(prev) : null);
      if (viewingProfileOf?.id === userId) setViewingProfileOf(prev => prev ? updateUserState(prev) : null);
    } catch (error) { throw error; }
  };
  const toggleMilestoneSolution = (milestoneId: string, isSolution: boolean) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.toggleMilestoneSolution(milestoneId, isSolution);
  }

  const addMission = async (newMission: Omit<Mission, 'id' | 'status'>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    const missionDataForDb: Database['public']['Tables']['missions']['Insert'] = {
      title: newMission.title,
      description: newMission.description,
      difficulty: newMission.difficulty,
      xp: newMission.xp,
      bonus_monetario: newMission.bonusMonetario,
      assigned_to: newMission.assignedTo || null,
      start_date: newMission.startDate,
      deadline: newMission.deadline,
      required_skills: newMission.skills,
      visible_to: newMission.visibleTo || null,
      company: newMission.company as any,
      role: newMission.role as any,
      status: 'Pendiente',
    };
    await api.addMission(missionDataForDb);
  };

  const requestMission = async (title: string, description: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) return;
    await api.addMission({ title: `[PROPUESTA] ${title}`, description, status: 'Solicitada', assigned_to: [currentUser.id], difficulty: 'Medio', xp: 0, bonus_monetario: 0, start_date: new Date().toISOString().split('T')[0], deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], required_skills: [], visible_to: null });
    showToast('Solicitud de misión enviada para revisión.', 'success');
  };

  const technicianRequestMission = async (missionId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) return;
    await api.updateMission(missionId, { assigned_to: [currentUser.id], status: 'Solicitada' });
    showToast('Misión solicitada. Esperando aprobación del administrador.', 'success');
  };

  const requestToJoinMission = async (missionId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) return;
    const originalMission = missions.find(m => m.id === missionId);
    if (!originalMission) { showToast("La misión original no fue encontrada.", 'error'); return; }
    await api.addMission({ title: `[UNIRSE] ${originalMission.title}`, description: `Solicitud para unirse a la misión original ID: ${missionId}.`, difficulty: originalMission.difficulty, xp: originalMission.xp, status: 'Solicitada', assigned_to: [currentUser.id], start_date: originalMission.startDate, deadline: originalMission.deadline, required_skills: originalMission.skills, visible_to: null, });
    showToast('Solicitud para unirse enviada.', 'success');
  };

  const approveJoinRequest = async (requestMission: Mission) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    const originalMissionId = requestMission.description.split('ID: ')[1]?.split('.')[0];
    const userIdToJoin = requestMission.assignedTo?.[0];
    if (!originalMissionId || !userIdToJoin) { await deleteMission(requestMission.id); return; }
    const originalMission = missions.find(m => m.id === originalMissionId);
    if (!originalMission) { await deleteMission(requestMission.id); return; }
    const newAssignees = [...new Set([...(originalMission.assignedTo || []), userIdToJoin])];
    await api.updateMission(originalMissionId, { assigned_to: newAssignees });
    await deleteMission(requestMission.id);
    showToast('Técnico añadido a la misión.', 'success');
  };

  const rejectJoinRequest = async (requestMissionId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await deleteMission(requestMissionId);
    showToast('Solicitud para unirse rechazada.', 'info');
  };

  const rejectMissionRequest = async (missionId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.updateMission(missionId, { assigned_to: [], status: 'Pendiente' });
  };

  const addMissionMilestone = async (missionId: string, description: string, imageFile: File | null) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) throw new Error("User not authenticated");
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await api.uploadMilestoneImage(currentUser.id, missionId, imageFile);
    await api.addMissionMilestone({ mission_id: missionId, user_id: currentUser.id, description, image_url: imageUrl });
  };

  const addSupply = (data: Omit<Supply, 'id' | 'created_at' | 'stock_quantity'>, photoFile: File | null) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.addSupply(data, photoFile);
  }
  const updateSupply = (supplyId: string, data: Partial<Supply>, photoFile: File | null) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateSupply(supplyId, data, photoFile);
  }
  const deleteSupply = (supply: Supply) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.deleteSupply(supply);
  }
  const assignSupplyToMission = (missionId: string, supplyId: string, quantity: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.assignSupplyToMission(missionId, supplyId, quantity);
  }
  const updateMissionSupply = (missionSupplyId: string, data: Partial<Pick<MissionSupply, 'quantity_assigned' | 'quantity_used'>>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateMissionSupply(missionSupplyId, data);
  }
  const removeSupplyFromMission = (missionSupplyId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.removeSupplyFromMission(missionSupplyId);
  }
  const assignBadge = (userId: string, badgeId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.assignBadge(userId, badgeId);
  }
  const revokeBadge = (userId: string, badgeId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.revokeBadge(userId, badgeId);
  }


  const setSalary = (userId: string, amount: number, salaryId?: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.upsertSalary({ id: salaryId, user_id: userId, monto_base_quincenal: amount });
  }
  const addPayrollEvent = (eventData: Omit<PayrollEvent, 'id' | 'created_at' | 'periodo_pago_id' | 'mission_id'>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.addPayrollEvent(eventData as any);
  }
  const updatePayrollEvent = (id: string, eventData: Partial<PayrollEvent>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updatePayrollEvent(id, eventData as any);
  }
  const createMissionBonusEvent = (userId: string, mission: Mission) => {
    if (currentUser?.id.startsWith('demo-')) { return Promise.resolve(); }
    if (!mission.bonusMonetario || mission.bonusMonetario <= 0) return Promise.resolve();
    return api.addPayrollEvent({
      user_id: userId,
      tipo: 'BONO',
      monto: mission.bonusMonetario,
      descripcion: `Bono por misión: ${mission.title}`,
      fecha_evento: new Date().toISOString().split('T')[0],
      mission_id: mission.id
    });
  }

  const calculatePayPeriods = async () => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    let startDate: Date;
    let endDate: Date;
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();
    if (day <= 5) { startDate = new Date(year, month - 1, 21); endDate = new Date(year, month, 5); }
    else if (day <= 20) { startDate = new Date(year, month, 6); endDate = new Date(year, month, 20); }
    else { startDate = new Date(year, month, 21); endDate = new Date(year, month + 1, 5); }

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    try {
      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);
      await api.calculatePayroll(startStr, endStr);
      await fetchData();
      showToast(`Nómina y asistencia calculadas para el período ${startStr} al ${endStr}`, 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
  };
  const markPeriodAsPaid = async (periodId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.updatePaymentPeriod(periodId, { estado: 'PAGADO', fecha_pago: new Date().toISOString() });
      showToast('Nómina marcada como PAGADA.', 'success');
      fetchData();
    } catch (e) { showToast((e as Error).message, 'error'); }
  };

  const registrarPagoParcial = async (periodId: string, monto: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      const period = paymentPeriods.find(p => p.id === periodId);
      if (!period) return;
      const nuevoAcumulado = (period.monto_pagado_acumulado || 0) + monto;
      const updates: any = { monto_pagado_acumulado: nuevoAcumulado };
      if (nuevoAcumulado >= period.monto_final_a_pagar) {
        updates.estado = 'PAGADO';
        updates.fecha_pago = new Date().toISOString();
      }
      await api.updatePaymentPeriod(periodId, updates);
      showToast(`Pago parcial de $${monto} registrado.`, 'success');
      fetchData();
    } catch (e) { showToast((e as Error).message, 'error'); }
  };


  const updateUserSchedule = (userId: string, data: Partial<UserSchedule>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateUserSchedule(userId, data);
  }

  const requestVacation = async (data: Omit<VacationRequest, 'id' | 'status' | 'created_at'> & { status?: VacationRequest['status'] }) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.createVacationRequest(data);
      if (data.status === 'APROBADA') {
        const user = users.find(u => u.id === data.user_id);
        if (user) {
          const newRemaining = (user.vacation_remaining_days || 0) - data.days_count;
          await updateUser(user.id, { vacation_remaining_days: newRemaining });
        }
      } else {
        // Notify admins about the new request
        const requester = users.find(u => u.id === data.user_id);
        const admins = users.filter(u => u.role === Role.ADMIN);
        await Promise.all(admins.map(admin =>
          api.sendNotification(
            admin.id,
            "🏝 Nueva Solicitud de Vacaciones",
            `${requester?.name || 'Un técnico'} ha solicitado ${data.days_count} días de vacaciones.`
          )
        ));
      }
      showToast('Solicitud procesada correctamente.', 'success');
      fetchData();
    } catch (e) { showToast('Error al solicitar vacaciones.', 'error'); }
  };

  const updateVacationStatus = async (requestId: string, status: VacationRequest['status'], reason?: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) return;
    try {
      const request = vacationRequests.find(r => r.id === requestId);
      if (!request) return;
      await api.updateVacationStatus(requestId, status, currentUser.id);
      if (status === 'APROBADA') {
        const user = users.find(u => u.id === request.user_id);
        if (user) {
          const newRemaining = (user.vacation_remaining_days || 0) - request.days_count;
          await updateUser(user.id, { vacation_remaining_days: newRemaining });
        }
      }
      showToast(`Solicitud ${status.toLowerCase()}.`, 'success');
      fetchData();
    } catch (e) { showToast('Error al actualizar solicitud.', 'error'); }
  };

  const deleteVacationRequest = async (requestId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.deleteVacationRequest(requestId);
      showToast('Solicitud eliminada.', 'success');
      fetchData();
    } catch (e) { showToast('Error al eliminar solicitud.', 'error'); }
  };

  const purchaseReward = async (reward: Reward) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) return;
    try {
      await api.purchaseReward(currentUser.id, reward.id, reward.cost);
      showToast(`¡Has canjeado ${reward.name}!`, 'success');
      fetchData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al procesar el canje', 'error');
    }
  };

  const addReward = async (reward: Omit<Reward, 'id' | 'created_at'>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.addReward(reward);
      showToast('Recompensa añadida con éxito.', 'success');
      fetchData();
    } catch (e) { showToast('Error al añadir recompensa.', 'error'); }
  };

  const updateReward = async (id: string, reward: Partial<Reward>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.updateReward(id, reward);
      showToast('Recompensa actualizada con éxito.', 'success');
      fetchData();
    } catch (e) { showToast('Error al actualizar recompensa.', 'error'); }
  };

  const deleteReward = async (id: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta recompensa?')) {
        await api.deleteReward(id);
        showToast('Recompensa eliminada con éxito.', 'success');
        fetchData();
      }
    } catch (e) { showToast('Error al eliminar recompensa.', 'error'); }
  };

  const addMissionRequirement = async (missionId: string, description: string, quantity: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.addMissionRequirement({ mission_id: missionId, description, quantity });
  };
  const updateMissionRequirement = async (id: string, data: Partial<MissionRequirement>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.updateMissionRequirement(id, data);
  };
  const deleteMissionRequirement = async (id: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.deleteMissionRequirement(id);
  };

  const value: DataContextType = {
    currentUser,
    users,
    missions,
    allInventoryItems,
    allBadges,
    missionMilestones,
    supplies,
    missionSupplies,
    missionRequirements,
    salaries,
    payrollEvents,
    paymentPeriods,
    userSchedules,
    attendanceUsers,
    vacationRequests,
    rewardItems,
    userRewards,
    loading,
    viewingProfileOf,
    setViewingProfileOf,
    updateMission,
    updateUser,
    deactivateUser,
    updateUserAvatar,
    addMission,
    requestMission,
    technicianRequestMission,
    requestToJoinMission,
    approveJoinRequest,
    rejectJoinRequest,
    rejectMissionRequest,
    deleteMission,
    addMissionMilestone,
    toggleMilestoneSolution,
    assignInventoryItem,
    removeInventoryItem,
    disposeOfInventoryItem,
    updateInventoryItemQuantity,
    updateInventoryVariantQuantity,
    addInventoryItem,
    deleteInventoryItem,
    savePushSubscription,
    sendNotification,
    addSupply,
    updateSupply,
    deleteSupply,
    assignSupplyToMission,
    updateMissionSupply,
    removeSupplyFromMission,
    assignBadge,
    revokeBadge,
    setSalary,
    addPayrollEvent,
    updatePayrollEvent,
    createMissionBonusEvent,
    calculatePayPeriods,
    markPeriodAsPaid,
    registrarPagoParcial,
    addMissionRequirement,
    updateMissionRequirement,
    deleteMissionRequirement,
    updateUserSchedule,
    requestVacation,
    updateVacationStatus,
    deleteVacationRequest,
    purchaseReward,
    addReward,
    updateReward,
    deleteReward
  };


  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};