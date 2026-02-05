import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { User, Mission, InventoryItem, Chat, ChatMessage, EquipmentSlot, MissionMilestone, MissionStatus, UserInventoryItem, Supply, MissionSupply, Badge, Salary, PayrollEvent, PaymentPeriod, Role, MissionDifficulty, PayrollEventType } from '../types';
import { supabase } from '../config';
import { Database } from '../database.types';
import { transformSupabaseProfileToUser } from '../utils/dataTransformers';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../services/api';

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
  salaries: Salary[];
  payrollEvents: PayrollEvent[];
  paymentPeriods: PaymentPeriod[];
  chats: Chat[];
  chatMessages: ChatMessage[];
  loading: boolean;
  unreadMessagesCount: number;
  viewingProfileOf: User | null;
  setViewingProfileOf: (user: User | null) => void;
  updateMission: (updatedMission: Partial<Mission>) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
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
  assignInventoryItem: (userId: string, itemId: string) => Promise<void>;
  removeInventoryItem: (userInventoryId: string) => Promise<void>;
  disposeOfInventoryItem: (userInventoryId: string, itemId: string) => Promise<void>;
  updateInventoryItemQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  addInventoryItem: (data: { name: string; description: string; slot: EquipmentSlot; quantity: number; }, iconFile: File) => Promise<void>;
  deleteInventoryItem: (itemId: string, iconUrl: string) => Promise<void>;
  savePushSubscription: (userId: string, subscription: PushSubscription) => Promise<void>;
  sendNotification: (technicianId: string, title: string, body: string) => Promise<void>;
  handleSelectOrCreateChat: (otherParticipantId: string) => Promise<Chat | null>;
  handleSendMessage: (chatId: string, content: string) => Promise<void>;
  handleMarkAsRead: (chatId: string) => Promise<void>;
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
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [payrollEvents, setPayrollEvents] = useState<PayrollEvent[]>([]);
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfileOf, setViewingProfileOf] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    if (!authUser?.id) return;

    // --- DEMO MODE BYPASS ---
    if (authUser.id.startsWith('demo-')) {
      console.log("Loading Demo Data...");

      const mockAdmin: User = {
        id: 'demo-admin',
        name: 'Admin Demo',
        role: Role.ADMIN,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        xp: 9999,
        level: 100,
        skills: [],
        badges: [],
        inventory: [],
        pushSubscription: null
      };
      const mockTech: User = {
        id: 'demo-technician',
        name: 'Técnico Demo',
        role: Role.TECHNICIAN,
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

      const mockSupplies: Supply[] = [
        { id: 'sup1', created_at: new Date().toISOString(), general_category: 'Lubricantes', specific_category: 'Aceite Motor', type: 'Sintético', model: '5W-30', details: 'Bidón 4L', stock_quantity: 20, photo_url: null },
        { id: 'sup2', created_at: new Date().toISOString(), general_category: 'Filtros', specific_category: 'Aire', type: 'Cartucho', model: 'F-100', details: 'Original', stock_quantity: 5, photo_url: null }
      ];
      setSupplies(mockSupplies);

      // Populate other lists with empty arrays to prevent crashes in UI
      setAllInventoryItems([]);
      setAllBadges([]);
      setMissionMilestones([]);
      setMissionSupplies([]);
      setSalaries([]);
      setPayrollEvents([]);
      setPaymentPeriods([]);
      setChats([]);
      setChatMessages([]);

      setLoading(false);
      return;
    }
    // --- END DEMO MODE ---

    try {
      const results = await api.getInitialData(authUser.id);
      const [
        profilesResult,
        missionsResult,
        inventoryItemsResult,
        badgesResult,
        milestonesResult,
        chatsResult,
        messagesResult,
        suppliesResult,
        missionSuppliesResult,
        salariesResult,
        payrollEventsResult,
        paymentPeriodsResult,
      ] = results;

      if (profilesResult.error) throw new Error(`Al cargar perfiles: ${profilesResult.error.message}`);
      if (missionsResult.error) throw new Error(`Al cargar misiones: ${missionsResult.error.message}`);
      if (inventoryItemsResult.error) throw new Error(`Al cargar inventario: ${inventoryItemsResult.error.message}`);
      if (badgesResult.error) throw new Error(`Al cargar insignias: ${badgesResult.error.message}`);
      if (milestonesResult.error) throw new Error(`Al cargar hitos: ${milestonesResult.error.message}`);
      if (chatsResult.error) throw new Error(`Al cargar chats: ${chatsResult.error.message}`);
      if (messagesResult.error) throw new Error(`Al cargar mensajes: ${messagesResult.error.message}`);
      if (suppliesResult.error) throw new Error(`Al cargar insumos: ${suppliesResult.error.message}`);
      if (missionSuppliesResult.error) throw new Error(`Al cargar insumos de misión: ${missionSuppliesResult.error.message}`);
      if (salariesResult.error) throw new Error(`Al cargar salarios: ${salariesResult.error.message}`);
      if (payrollEventsResult.error) throw new Error(`Al cargar eventos de nómina: ${payrollEventsResult.error.message}`);
      if (paymentPeriodsResult.error) throw new Error(`Al cargar períodos de pago: ${paymentPeriodsResult.error.message}`);


      const profilesData = profilesResult.data || [];
      const combinedUsers = profilesData.map(p => transformSupabaseProfileToUser(p));
      setUsers(combinedUsers);

      const foundUser = combinedUsers.find(u => u.id === authUser.id);
      setCurrentUser(foundUser || null);
      if (!foundUser) {
        console.error("Authenticated user's profile not found in initial data load. Logging out.");
        showToast('Tu perfil no se encontró. Saliendo de la sesión.', 'error');
        supabase.auth.signOut();
      }

      const transformedMissions = (missionsResult.data || []).map((m: any) => ({ ...m, assignedTo: m.assigned_to, startDate: m.start_date, deadline: m.deadline, skills: m.required_skills, progressPhoto: m.progress_photo_url, completedDate: m.completed_date, bonusXp: m.bonus_xp, visibleTo: m.visible_to, }));
      setMissions(transformedMissions);
      setAllInventoryItems((inventoryItemsResult.data || []).map((item: any) => ({ ...item, quantity: item.quantity ?? 0 })));
      setAllBadges((badgesResult.data || []) as Badge[]);
      setMissionMilestones((milestonesResult.data || []).map((m: any) => ({ ...m, is_solution: m.is_solution ?? false })) as MissionMilestone[]);
      setChats((chatsResult.data || []) as Chat[]);
      setChatMessages((messagesResult.data || []) as ChatMessage[]);
      setSupplies((suppliesResult.data || []) as Supply[]);
      setMissionSupplies((missionSuppliesResult.data || []) as MissionSupply[]);
      setSalaries((salariesResult.data || []) as Salary[]);
      setPayrollEvents((payrollEventsResult.data || []) as PayrollEvent[]);
      setPaymentPeriods((paymentPeriodsResult.data || []) as PaymentPeriod[]);

    } catch (error) {
      console.error("Error fetching data:", error);
      showToast(error instanceof Error ? error.message : "Error al cargar datos", 'error');
    }
  }, [authUser, showToast]);

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
      supabase.channel('public:chat_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchData()).subscribe(),
      supabase.channel('public:chats').on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchData()).subscribe(),
      supabase.channel('public:user_badges').on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => fetchData()).subscribe(),
      supabase.channel('public:profile_skills').on('postgres_changes', { event: '*', schema: 'public', table: 'profile_skills' }, () => fetchData()).subscribe(),
      supabase.channel('public:salarios').on('postgres_changes', { event: '*', schema: 'public', table: 'salarios' }, () => fetchData()).subscribe(),
      supabase.channel('public:eventos_nomina').on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_nomina' }, () => fetchData()).subscribe(),
      supabase.channel('public:periodos_pago').on('postgres_changes', { event: '*', schema: 'public', table: 'periodos_pago' }, () => fetchData()).subscribe(),
    ];
    return () => { allChannels.forEach(channel => supabase.removeChannel(channel)); };
  }, [authUser, fetchData]);


  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    const myChatIds = chats.map(c => c.id);
    return chatMessages.filter(msg => myChatIds.includes(msg.chat_id) && msg.sender_id !== currentUser.id && !msg.is_read).length;
  }, [chats, chatMessages, currentUser]);

  // --- MUTATIONS ---
  const updateMission = async (updatedMission: Partial<Mission>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!updatedMission.id) return;
    const { id, assignedTo, startDate, deadline, skills, progressPhoto, completedDate, bonusXp, visibleTo, ...rest } = updatedMission;
    await api.updateMission(id, { ...rest, assigned_to: assignedTo, start_date: startDate, deadline: deadline, required_skills: skills, progress_photo_url: progressPhoto, completed_date: completedDate, bonus_xp: bonusXp, visible_to: visibleTo, });
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    if (!updatedUser.id) return;
    await api.updateUser(updatedUser.id, { name: updatedUser.name, xp: updatedUser.xp, level: updatedUser.level, push_subscription: updatedUser.pushSubscription });
  };

  const deactivateUser = async (userId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    await api.deactivateUser(userId);
    fetchData(); // Refresh data to remove the user from the UI
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
  const updateInventoryItemQuantity = (itemId: string, newQuantity: number) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.updateInventoryItemQuantity(itemId, newQuantity);
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
  const assignInventoryItem = (userId: string, itemId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.assignInventoryItem(userId, itemId);
  }
  const toggleMilestoneSolution = (milestoneId: string, isSolution: boolean) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return Promise.resolve(); }
    return api.toggleMilestoneSolution(milestoneId, isSolution);
  }

  const addMission = async (newMission: Omit<Mission, 'id' | 'status'>) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    // FIX: Manually map camelCase properties from the frontend `Mission` type
    // to the snake_case columns expected by the Supabase database schema (`MissionInsert` type).
    // Spreading `...newMission` was incorrectly sending the `assignedTo` (camelCase)
    // property, which caused the "column not found" error from PostgREST.
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
      status: 'Pendiente', // Set default status here
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
    if (!originalMissionId || !userIdToJoin) { showToast('La solicitud de unión es inválida.', 'error'); await deleteMission(requestMission.id); return; }
    const originalMission = missions.find(m => m.id === originalMissionId);
    if (!originalMission) { showToast('La misión original ya no existe.', 'error'); await deleteMission(requestMission.id); return; }
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

  const handleSelectOrCreateChat = async (otherParticipantId: string): Promise<Chat | null> => {
    if (currentUser?.id.startsWith('demo-')) {
      const existing = chats.find(c => (c.participant_1 === currentUser.id && c.participant_2 === otherParticipantId) || (c.participant_1 === otherParticipantId && c.participant_2 === currentUser.id));
      if (existing) return existing;
      const newChat: Chat = { id: `chat-${Date.now()}`, participant_1: currentUser.id, participant_2: otherParticipantId, created_at: new Date().toISOString() };
      setChats(prev => [...prev, newChat]);
      return newChat;
    }
    if (!currentUser) return null;
    const existingChat = chats.find(c => (c.participant_1 === currentUser.id && c.participant_2 === otherParticipantId) || (c.participant_1 === otherParticipantId && c.participant_2 === currentUser.id));
    if (existingChat) return existingChat;
    const { data, error } = await api.createChat(currentUser.id, otherParticipantId);
    if (error) { showToast(error.message, 'error'); return null; }
    return data as Chat;
  };

  const handleSendMessage = async (chatId: string, content: string) => {
    if (!currentUser) return;
    if (currentUser.id.startsWith('demo-')) {
      const msg: ChatMessage = { id: `msg-${Date.now()}`, chat_id: chatId, sender_id: currentUser.id, content, created_at: new Date().toISOString(), is_read: false };
      setChatMessages(prev => [...prev, msg]);
      return;
    }
    try { await api.sendMessage(chatId, currentUser.id, content); }
    catch (e) { showToast((e as Error).message, 'error'); }
  };

  const handleMarkAsRead = (chatId: string) => {
    if (!currentUser) return Promise.resolve();
    if (currentUser.id.startsWith('demo-')) { return Promise.resolve(); }
    return api.markMessagesAsRead(chatId, currentUser.id);
  };

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

    // Determine current period based on user rule:
    // Period 1: 6th to 20th of current month
    // Period 2: 21st of current month to 5th of NEXT month (or Prev 21 to Curr 5)

    // Logic: calculate the period that covers "Today" or ends "Today".
    let startDate: Date;
    let endDate: Date;

    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    if (day <= 5) {
      // We are in the end of the "21 to 5" period.
      // Start: 21st of PREVIOUS month. End: 5th of CURRENT month.
      startDate = new Date(year, month - 1, 21);
      endDate = new Date(year, month, 5);
    } else if (day <= 20) {
      // We are in the "6 to 20" period.
      // Start: 6th of CURRENT month. End: 20th of CURRENT month.
      startDate = new Date(year, month, 6);
      endDate = new Date(year, month, 20);
    } else {
      // We are in the start of the "21 to 5" period (after the 20th).
      // Start: 21st of CURRENT month. End: 5th of NEXT month.
      startDate = new Date(year, month, 21);
      endDate = new Date(year, month + 1, 5);
    }

    // Format YYYY-MM-DD (local time simple conversion)
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
      showToast(`Nómina calculada para período ${startStr} al ${endStr}`, 'success');

      // Refresh data to show new periods
      fetchData();
    } catch (e) {
      console.error(e);
      showToast((e as Error).message, 'error');
    }
  };
  const markPeriodAsPaid = async (periodId: string) => {
    if (currentUser?.id.startsWith('demo-')) { showToast('Acción simulada en modo demo.', 'success'); return; }
    try {
      await api.updatePaymentPeriod(periodId, { estado: 'PAGADO', fecha_pago: new Date().toISOString() });
      showToast('Nómina marcada como PAGADA.', 'success');
      fetchData();
    } catch (e) {
      console.error(e);
      showToast((e as Error).message, 'error');
    }
  };

  const value = {
    currentUser, users, missions, allInventoryItems, allBadges, missionMilestones, supplies, missionSupplies, salaries, payrollEvents, paymentPeriods, chats, chatMessages, loading, unreadMessagesCount, viewingProfileOf, setViewingProfileOf,
    updateMission, updateUser, deactivateUser, updateUserAvatar, addMission, requestMission, technicianRequestMission, rejectMissionRequest, deleteMission, addMissionMilestone, toggleMilestoneSolution, assignInventoryItem, removeInventoryItem, disposeOfInventoryItem, updateInventoryItemQuantity, addInventoryItem, deleteInventoryItem, savePushSubscription, sendNotification, handleSelectOrCreateChat, handleSendMessage, handleMarkAsRead, requestToJoinMission, approveJoinRequest, rejectJoinRequest,
    addSupply, updateSupply, deleteSupply, assignSupplyToMission, updateMissionSupply, removeSupplyFromMission,
    assignBadge, revokeBadge,
    setSalary, addPayrollEvent, updatePayrollEvent, createMissionBonusEvent, calculatePayPeriods, markPeriodAsPaid
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};