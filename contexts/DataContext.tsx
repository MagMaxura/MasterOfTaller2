import React, { useState, useCallback, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import { User, Mission, InventoryItem, EquipmentSlot, MissionMilestone, MissionStatus, UserInventoryItem, Supply, MissionSupply, Badge, Salary, PayrollEvent, PaymentPeriod, Role, MissionDifficulty, PayrollEventType, MissionRequirement, Company, AttendanceSummary, UserSchedule, VacationRequest, Reward, UserReward, Holiday, AuthorityRelation, MissionMilestoneType, RecurringIncome } from '../types';
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
  holidays: Holiday[];
  authorityRelations: AuthorityRelation[];
  recurringIncomes: RecurringIncome[];
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
  addMissionMilestone: (
    missionId: string,
    description: string,
    imageFile: File | null,
    milestoneType?: MissionMilestoneType,
    metadata?: {
      capturedAt?: string;
      capturedLat?: number | null;
      capturedLng?: number | null;
      locationAccuracyM?: number | null;
      exifTakenAt?: string | null;
    }
  ) => Promise<void>;
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
  setSalary: (userId: string, amount: number, salaryId?: string, cycle?: string) => Promise<void>;
  addPayrollEvent: (eventData: Omit<PayrollEvent, 'id' | 'created_at' | 'periodo_pago_id' | 'mission_id'>) => Promise<void>;
  updatePayrollEvent: (id: string, eventData: Partial<PayrollEvent>) => Promise<void>;
  deletePayrollEvent: (id: string) => Promise<void>;
  createMissionBonusEvent: (userId: string, mission: Mission) => Promise<void>;
  calculatePayPeriods: () => Promise<void>;
  calculateUserPayroll: (userId: string) => Promise<void>;
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
  addHoliday: (date: string, description: string) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  upsertAuthorityRelation: (managerId: string, subordinateId: string, notes?: string | null) => Promise<void>;
  removeAuthorityRelation: (subordinateId: string) => Promise<void>;
  addRecurringIncome: (data: Omit<RecurringIncome, 'id' | 'created_at'>) => Promise<void>;
  updateRecurringIncome: (id: string, data: Partial<RecurringIncome>) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
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
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [authorityRelations, setAuthorityRelations] = useState<AuthorityRelation[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfileOf, setViewingProfileOf] = useState<User | null>(null);
  const lastReconcileRef = useRef<number>(0);

  const checkAndGenerateDailyAbsences = useCallback(async () => {
    if (!authUser || authUser.id.startsWith('demo-')) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    try {
      await api.generateDailyAbsences(dateStr);
    } catch (e) {
      console.error("Error generating daily absences:", e);
    }
  }, [authUser]);

  const reconcilePeriodAttendance = useCallback(async (currentUsers: User[], currentEvents: PayrollEvent[], startDate: string, endDate: string, currentHolidays: Holiday[], currentVacations: VacationRequest[], currentSchedules: any[]) => {
    if (!authUser || authUser.id.startsWith('demo-')) return false;
    let changed = false;

    // Filter technicians
    const technicians = currentUsers.filter(u => u.role === Role.TECHNICIAN);
    if (technicians.length === 0) return false;

    for (const user of technicians) {
      try {
        const attUser = user.attendance_id
          ? await attendanceService.getUserProfileById(user.attendance_id)
          : (user.email ? await attendanceService.getUserProfileByEmail(user.email) : null);
        
        if (!attUser) continue;

        const logs = await attendanceService.getAccessLogsByRange(attUser.id, startDate, endDate);
        const loggedDates = new Set(logs.map(l => l.timestamp.split('T')[0]));

        for (const date of loggedDates) {
          const dailyLogs = logs.filter(l => l.timestamp.split('T')[0] === date);
          const hasMovement = dailyLogs.some(l => (l.type as string) === 'IN' || (l.type as string) === 'OUT' || (l.type as string) === 'Entrada' || (l.type as string) === 'Salida' || (l.type as string) === 'ENTRADA' || (l.type as string) === 'SALIDA');
          const absenceLog = dailyLogs.find(l => (l.type as string) === 'ABSENCE' || (l.type as string) === 'FALTA');

          // --- 1. HANDLE ABSENCES ---
          const currentAbsenceEvent = currentEvents.find(e => e.user_id === user.id && e.fecha_evento === date && e.tipo === PayrollEventType.ABSENCE);

          if (currentAbsenceEvent && hasMovement) {
            await api.deletePayrollEventByCriteria(user.id, date, PayrollEventType.ABSENCE, '');
            changed = true;
          } else if (currentAbsenceEvent && absenceLog) {
            const isJustified = absenceLog.status === 'JUSTIFIED' || absenceLog.status === 'JUSTIFICADA';
            if (currentAbsenceEvent.justificado !== isJustified) {
              await api.updatePayrollEvent(currentAbsenceEvent.id, { justificado: isJustified, monto: isJustified ? 0 : currentAbsenceEvent.monto });
              changed = true;
            }
          }

          // --- 2. HANDLE TARDINESS & EARLY DEPARTURES ---
          const schedule = currentSchedules.find(s => s.user_id === user.id) || (attUser.start_time ? { start_time: attUser.start_time, end_time: attUser.end_time, tolerance_minutes: 10, exit_tolerance_minutes: 10 } : null);

          if (schedule && schedule.start_time && (schedule.end_time || (schedule as any).end_time)) {
             const checkIn = dailyLogs.filter(l => ['IN', 'Entrada', 'ENTRADA'].includes(l.type as string)).sort((a,b) => a.timestamp.localeCompare(b.timestamp))[0];
             const checkOut = dailyLogs.filter(l => ['OUT', 'Salida', 'SALIDA'].includes(l.type as string)).sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];

             if (checkIn) {
               const checkInDate = new Date(checkIn.timestamp);
               const [stH, stM] = schedule.start_time.split(':').map(Number);
               const diffMinutes = (checkInDate.getHours() * 60 + checkInDate.getMinutes()) - (stH * 60 + stM);
               const currentTardinessEvent = currentEvents.find(e => e.user_id === user.id && e.fecha_evento === date && e.tipo === PayrollEventType.TARDINESS);

               if (diffMinutes > (schedule.tolerance_minutes ?? 10)) {
                 const newDesc = `TARDANZA (Entrada: ${checkInDate.getHours()}:${checkInDate.getMinutes().toString().padStart(2, '0')})`;
                 if (!currentTardinessEvent) {
                   await api.addPayrollEvent({ user_id: user.id, tipo: PayrollEventType.TARDINESS, monto: 0, descripcion: newDesc, fecha_evento: date, justificado: false, notas_justificacion: '' } as any);
                   changed = true;
                 } else if (currentTardinessEvent.descripcion !== newDesc) {
                   await api.updatePayrollEvent(currentTardinessEvent.id, { descripcion: newDesc, monto: 0 });
                   changed = true;
                 }
               } else if (currentTardinessEvent) {
                 await api.deletePayrollEvent(currentTardinessEvent.id);
                 changed = true;
               }
             }

             if (checkOut) {
               const checkOutDate = new Date(checkOut.timestamp);
               const [etH, etM] = (schedule.end_time || (schedule as any).end_time).split(':').map(Number);
               const diffEarlyMinutes = (etH * 60 + etM) - (checkOutDate.getHours() * 60 + checkOutDate.getMinutes());
               const currentEarlyEvent = currentEvents.find(e => e.user_id === user.id && e.fecha_evento === date && e.tipo === PayrollEventType.EARLY_DEPARTURE);

               if (diffEarlyMinutes > (schedule.exit_tolerance_minutes ?? 10)) {
                 const newDesc = `SALIDA TEMPRANA (Salida: ${checkOutDate.getHours()}:${checkOutDate.getMinutes().toString().padStart(2, '0')})`;
                 if (!currentEarlyEvent) {
                   await api.addPayrollEvent({ user_id: user.id, tipo: PayrollEventType.EARLY_DEPARTURE, monto: 0, descripcion: newDesc, fecha_evento: date, justificado: false, notas_justificacion: '' } as any);
                   changed = true;
                 } else if (currentEarlyEvent.descripcion !== newDesc) {
                   await api.updatePayrollEvent(currentEarlyEvent.id, { descripcion: newDesc, monto: 0 });
                   changed = true;
                 }
               } else if (currentEarlyEvent) {
                 await api.deletePayrollEvent(currentEarlyEvent.id);
                 changed = true;
               }
             }
          }
        }

        // --- 3. DENSE ABSENCE GENERATOR (Skip holidays, weekends, vacations) ---
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);
        const iter = new Date(start);
        
        while (iter <= end) {
          const dateStr = iter.toISOString().split('T')[0];
          const isWeekend = iter.getDay() === 0 || iter.getDay() === 6;
          const isHoliday = currentHolidays.some(h => h.date === dateStr);
          const isVacation = currentVacations.some(v => v.user_id === user.id && v.status === 'APROBADA' && dateStr >= v.start_date && dateStr <= v.end_date);
          const alreadyLogged = loggedDates.has(dateStr);
          const alreadyHasAbsence = currentEvents.some(e => e.user_id === user.id && e.fecha_evento === dateStr && e.tipo === PayrollEventType.ABSENCE);

          if (!isWeekend && !isHoliday && !isVacation && !alreadyLogged && !alreadyHasAbsence) {
             await api.addPayrollEvent({ user_id: user.id, tipo: PayrollEventType.ABSENCE, monto: 0, descripcion: 'FALTA INJUSTIFICADA (Sincronización)', fecha_evento: dateStr } as any);
             changed = true;
          }
          iter.setDate(iter.getDate() + 1);
        }
      } catch (err) { console.error(`Error reconciling for ${user.name}:`, err); }
    }
    return changed;
  }, [authUser]);

  const reconcileDailyAttendance = useCallback(async (currentUsers: User[], currentEvents: PayrollEvent[], h: Holiday[], v: VacationRequest[], s: any[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reconcilePeriodAttendance(currentUsers, currentEvents, todayStr, todayStr, h, v, s);
  }, [reconcilePeriodAttendance]);


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

      const [invRes, badgeRes, supRes, mSupRes, reqRes, rewRes, uRewRes, holRes, orgRes, recRes] = await Promise.all(l2Promises);
      const [salRes, payRes, perRes, mileRes] = await Promise.all(l3Promises);

      // Level 2 updates
      if (invRes.data) setAllInventoryItems(invRes.data.map((item: any) => ({ ...item, quantity: item.quantity ?? 0 })));
      if (badgeRes.data) setAllBadges(badgeRes.data as Badge[]);
      if (supRes.data) setSupplies(supRes.data as Supply[]);
      if (mSupRes.data) setMissionSupplies(mSupRes.data as MissionSupply[]);
      if (reqRes.data) setMissionRequirements(reqRes.data as MissionRequirement[]);
      if (rewRes.data) setRewardItems(rewRes.data as Reward[]);
      if (uRewRes.data) setUserRewards(uRewRes.data as UserReward[]);
      if (holRes && (holRes as any).data) setHolidays((holRes as any).data as Holiday[]);
      if (orgRes.data) setAuthorityRelations(orgRes.data as AuthorityRelation[]);
      if (recRes.data) setRecurringIncomes(recRes.data as RecurringIncome[]);

      // Level 3 updates
      if (salRes.data) setSalaries(salRes.data as Salary[]);
      if (perRes.data) {
        const rawPeriods = perRes.data as PaymentPeriod[];
        setPaymentPeriods(rawPeriods); // Initial set, could be enriched later
      }
      if (mileRes.data) {
        setMissionMilestones(
          mileRes.data.map((m: any) => ({
            ...m,
            is_solution: m.is_solution ?? false,
            milestone_type: m.milestone_type ?? MissionMilestoneType.NOTE,
            captured_at: m.captured_at ?? m.created_at,
            captured_lat: m.captured_lat ?? null,
            captured_lng: m.captured_lng ?? null,
            location_accuracy_m: m.location_accuracy_m ?? null,
            exif_taken_at: m.exif_taken_at ?? null
          })) as MissionMilestone[]
        );
      }

      setVacationRequests((vacationsData || []) as any[]);

      // Reconcliation logic (Critical for technician)
      if (foundUser?.role === Role.TECHNICIAN && payRes.data) {
        const now = Date.now();
        // Throttle reconciliation to once every 60 seconds per session
        if (now - lastReconcileRef.current > 60000) {
          const freshHolidays = (holRes && (holRes as any).data) ? (holRes as any).data as Holiday[] : [];
          const freshVacations = vacationsData || [];
          const freshSchedules = schedulesRes.data || [];
          lastReconcileRef.current = now;
          await reconcileDailyAttendance(transformedUsers, payRes.data as PayrollEvent[], freshHolidays, freshVacations as any, freshSchedules as any);
        }
      }
      setPayrollEvents((payRes.data || []) as PayrollEvent[]);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      showToast(error.message || "Error al cargar datos", 'error');
      setLoading(false);
    }
  }, [authUser?.id, showToast, reconcileDailyAttendance]);

  useEffect(() => {
    if (authUser) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!authUser?.id || !supabase || authUser.id.startsWith('demo-')) return;
    
    console.log("[Supabase] Opening consolidated realtime channel...");
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_inventory' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_milestones' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_supplies' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_requirements' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_skills' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salarios' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_nomina' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'periodos_pago' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_schedules' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'authority_relations' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_incomes' }, () => fetchDataRef.current())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log("[Supabase] Channel ready.");
        if (status === 'CLOSED') console.warn("[Supabase] Channel closed.");
        if (status === 'CHANNEL_ERROR') console.error("[Supabase] Channel error.");
      });

    return () => { 
      console.log("[Supabase] Cleaning up channel...");
      supabase.removeChannel(channel); 
    };
  }, [authUser?.id]);


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

  const addMissionMilestone = async (
    missionId: string,
    description: string,
    imageFile: File | null,
    milestoneType: MissionMilestoneType = MissionMilestoneType.NOTE,
    metadata?: {
      capturedAt?: string;
      capturedLat?: number | null;
      capturedLng?: number | null;
      locationAccuracyM?: number | null;
      exifTakenAt?: string | null;
    }
  ) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!currentUser) throw new Error("User not authenticated");
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await api.uploadMilestoneImage(currentUser.id, missionId, imageFile);
    await api.addMissionMilestone({
      mission_id: missionId,
      user_id: currentUser.id,
      description,
      image_url: imageUrl,
      milestone_type: milestoneType,
      captured_at: metadata?.capturedAt ?? new Date().toISOString(),
      captured_lat: metadata?.capturedLat ?? null,
      captured_lng: metadata?.capturedLng ?? null,
      location_accuracy_m: metadata?.locationAccuracyM ?? null,
      exif_taken_at: metadata?.exifTakenAt ?? null
    });
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


  const setSalary = (userId: string, amount: number, salaryId?: string, cycle?: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.upsertSalary({ id: salaryId, user_id: userId, monto_base_quincenal: amount, ciclo_pago: cycle });
  }
  const addPayrollEvent = (data: any) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.addPayrollEvent(data).then(() => fetchData());
  }

  const updatePayrollEvent = (id: string, data: any) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updatePayrollEvent(id, data).then(() => fetchData());
  }

  const deletePayrollEvent = (id: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.deletePayrollEvent(id).then(() => fetchData());
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
    
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const periodsToCalculate: { start: string, end: string }[] = [];

    // --- 1. DEFINIR PERÍODOS SEGÚN FECHA ACTUAL ---
    
    // Ciclo Estándar (1-15 / 16-30)
    if (day <= 10) {
      periodsToCalculate.push({ 
        start: formatDate(new Date(year, month - 1, 16)), 
        end: formatDate(new Date(year, month, 0)) 
      });
    } else if (day >= 1 && day <= 20) {
      periodsToCalculate.push({ 
        start: formatDate(new Date(year, month, 1)), 
        end: formatDate(new Date(year, month, 15)) 
      });
    } else {
      periodsToCalculate.push({ 
        start: formatDate(new Date(year, month, 16)), 
        end: formatDate(new Date(year, month + 1, 0)) 
      });
    }

    // Ciclo Desplazado (6-20 / 21-5)
    if (day >= 11 && day <= 25) {
      periodsToCalculate.push({ 
        start: formatDate(new Date(year, month, 6)), 
        end: formatDate(new Date(year, month, 20)) 
      });
    } else {
      if (day <= 10) {
        periodsToCalculate.push({ 
          start: formatDate(new Date(year, month - 1, 21)), 
          end: formatDate(new Date(year, month, 5)) 
        });
      } else {
        periodsToCalculate.push({ 
          start: formatDate(new Date(year, month, 21)), 
          end: formatDate(new Date(year, month + 1, 5)) 
        });
      }
    }

    try {
      for (const p of periodsToCalculate) {
        // 1. Sincronizar asistencia
        await reconcilePeriodAttendance(users, payrollEvents, p.start, p.end, holidays, vacationRequests, userSchedules);
        // 2. Ejecutar RPC (que ahora filtra por el ciclo correcto internamente)
        await api.calculatePayroll(p.start, p.end);
      }
      
      await fetchData();
      showToast(`Nómina y asistencia calculadas para los períodos vigentes.`, 'success');
    } catch (e) { showToast((e as Error).message, 'error'); }
  };

  const calculateUserPayroll = async (userId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const periodsToCalculate: { start: string, end: string }[] = [];

    // Replicate period logic (Standard + Shifted)
    if (day <= 10) {
      periodsToCalculate.push({ start: formatDate(new Date(year, month - 1, 16)), end: formatDate(new Date(year, month, 0)) });
      periodsToCalculate.push({ start: formatDate(new Date(year, month - 1, 21)), end: formatDate(new Date(year, month, 5)) });
    } else if (day >= 11 && day <= 20) {
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 1)), end: formatDate(new Date(year, month, 15)) });
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 6)), end: formatDate(new Date(year, month, 20)) });
    } else if (day >= 21 && day <= 25) {
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 16)), end: formatDate(new Date(year, month + 1, 0)) });
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 6)), end: formatDate(new Date(year, month, 20)) });
    } else {
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 16)), end: formatDate(new Date(year, month + 1, 0)) });
      periodsToCalculate.push({ start: formatDate(new Date(year, month, 21)), end: formatDate(new Date(year, month + 1, 5)) });
    }

    try {
      for (const p of periodsToCalculate) {
        // Sync ONLY for this user
        await reconcilePeriodAttendance([user], payrollEvents, p.start, p.end, holidays, vacationRequests, userSchedules);
        // Calculate payroll globally (it's safe as it's an UPSERT and fast)
        await api.calculatePayroll(p.start, p.end);
      }
      await fetchData();
      showToast(`Asistencia y nómina actualizadas para ${user.name}.`, 'success');
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

  const addHoliday = async (date: string, description: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.addHoliday({ date, description });
      showToast('Feriado agregado.', 'success');
      fetchData();
    } catch (e) { showToast('Error al agregar feriado.', 'error'); }
  };

  const deleteHoliday = async (id: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.deleteHoliday(id);
      showToast('Feriado eliminado.', 'success');
      fetchData();
    } catch (e) { showToast('Error al eliminar feriado.', 'error'); }
  };

  const addRecurringIncome = async (data: any) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.addRecurringIncome(data);
      showToast('Ingreso recurrente añadido.', 'success');
      fetchData();
    } catch (e) { showToast('Error al añadir ingreso.', 'error'); }
  };

  const updateRecurringIncome = async (id: string, data: any) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.updateRecurringIncome(id, data);
      showToast('Ingreso recurrente actualizado.', 'success');
      fetchData();
    } catch (e) { showToast('Error al actualizar ingreso.', 'error'); }
  };

  const deleteRecurringIncome = async (id: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
        await api.deleteRecurringIncome(id);
        showToast('Ingreso recurrente eliminado.', 'success');
        fetchData();
      }
    } catch (e) { showToast('Error al eliminar ingreso.', 'error'); }
  };

  const upsertAuthorityRelation = async (managerId: string, subordinateId: string, notes?: string | null) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.upsertAuthorityRelation(managerId, subordinateId, notes);
      showToast('Relación de autoridad actualizada.', 'success');
      fetchData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al actualizar relación de autoridad.', 'error');
    }
  };

  const removeAuthorityRelation = async (subordinateId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.removeAuthorityRelation(subordinateId);
      showToast('Relación de autoridad removida.', 'success');
      fetchData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al remover relación de autoridad.', 'error');
    }
  };

  const value: DataContextType = useMemo(() => ({
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
    authorityRelations,
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
    deletePayrollEvent,
    createMissionBonusEvent,
    calculatePayPeriods,
    calculateUserPayroll,
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
    deleteReward,
    holidays,
    addHoliday,
    deleteHoliday,
    upsertAuthorityRelation,
    removeAuthorityRelation
  }), [
    currentUser, users, missions, allInventoryItems, allBadges, missionMilestones, supplies, 
    missionSupplies, missionRequirements, salaries, payrollEvents, paymentPeriods, userSchedules, 
    attendanceUsers, vacationRequests, rewardItems, userRewards, loading, viewingProfileOf, holidays, authorityRelations, recurringIncomes,
    updateMission, updateUser, deactivateUser, updateUserAvatar, addMission, requestMission, 
    technicianRequestMission, requestToJoinMission, approveJoinRequest, rejectJoinRequest, 
    rejectMissionRequest, deleteMission, addMissionMilestone, toggleMilestoneSolution, 
    assignInventoryItem, removeInventoryItem, disposeOfInventoryItem, updateInventoryItemQuantity, 
    updateInventoryVariantQuantity, addInventoryItem, deleteInventoryItem, savePushSubscription, 
    sendNotification, addSupply, updateSupply, deleteSupply, assignSupplyToMission, 
    updateMissionSupply, removeSupplyFromMission, assignBadge, revokeBadge, setSalary, 
    addPayrollEvent, updatePayrollEvent, deletePayrollEvent, createMissionBonusEvent, 
    calculatePayPeriods, calculateUserPayroll, markPeriodAsPaid, registrarPagoParcial, addMissionRequirement, 
    updateMissionRequirement, deleteMissionRequirement, updateUserSchedule, requestVacation, 
    updateVacationStatus, deleteVacationRequest, purchaseReward, addReward, updateReward, 
    deleteReward, addHoliday, deleteHoliday, upsertAuthorityRelation, removeAuthorityRelation,
    addRecurringIncome, updateRecurringIncome, deleteRecurringIncome
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
