import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { User, Mission, InventoryItem, Chat, ChatMessage, EquipmentSlot, MissionMilestone, MissionStatus, UserInventoryItem, Supply, MissionSupply, Badge } from '../types';
import { supabase } from '../config';
import { Database } from '../database.types';
import { transformSupabaseProfileToUser } from '../utils/dataTransformers';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../services/api';

// --- CONTEXT INTERFACE ---
interface DataContextType {
  users: User[];
  missions: Mission[];
  allInventoryItems: InventoryItem[];
  allBadges: Badge[];
  missionMilestones: MissionMilestone[];
  supplies: Supply[];
  missionSupplies: MissionSupply[];
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
  const { currentUser, session } = useAuth();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [missionMilestones, setMissionMilestones] = useState<MissionMilestone[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [missionSupplies, setMissionSupplies] = useState<MissionSupply[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfileOf, setViewingProfileOf] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const results = await api.getInitialData(session.user.id);
      const [
        profilesResult,
        profileSkillsResult,
        userBadgesResult,
        userInventoryResult,
        missionsResult,
        inventoryItemsResult,
        badgesResult,
        milestonesResult,
        chatsResult,
        messagesResult,
        suppliesResult,
        missionSuppliesResult,
      ] = results;

      if (profilesResult.error) throw new Error(`Al cargar perfiles: ${profilesResult.error.message}`);
      if (profileSkillsResult.error) throw new Error(`Al cargar habilidades de perfil: ${profileSkillsResult.error.message}`);
      if (userBadgesResult.error) throw new Error(`Al cargar insignias de usuario: ${userBadgesResult.error.message}`);
      if (userInventoryResult.error) throw new Error(`Al cargar inventario de usuario: ${userInventoryResult.error.message}`);
      if (missionsResult.error) throw new Error(`Al cargar misiones: ${missionsResult.error.message}`);
      if (inventoryItemsResult.error) throw new Error(`Al cargar inventario: ${inventoryItemsResult.error.message}`);
      if (badgesResult.error) throw new Error(`Al cargar insignias: ${badgesResult.error.message}`);
      if (milestonesResult.error) throw new Error(`Al cargar hitos: ${milestonesResult.error.message}`);
      if (chatsResult.error) throw new Error(`Al cargar chats: ${chatsResult.error.message}`);
      if (messagesResult.error) throw new Error(`Al cargar mensajes: ${messagesResult.error.message}`);
      if (suppliesResult.error) throw new Error(`Al cargar insumos: ${suppliesResult.error.message}`);
      if (missionSuppliesResult.error) throw new Error(`Al cargar insumos de misión: ${missionSuppliesResult.error.message}`);

      // Reconstruct user objects on the client side
      const profilesData = profilesResult.data || [];
      const profileSkillsData = profileSkillsResult.data || [];
      const userBadgesData = userBadgesResult.data || [];
      const userInventoryData = userInventoryResult.data || [];

      const combinedUsers = profilesData.map(p => {
        const userSpecificSkills = profileSkillsData.filter(ps => ps.user_id === p.id);
        const userSpecificBadges = userBadgesData.filter(ub => ub.user_id === p.id);
        const userSpecificInventory = userInventoryData.filter(ui => ui.user_id === p.id);
        
        // This simulates the shape that the old join query returned for the transformer
        return transformSupabaseProfileToUser({
          ...p,
          profile_skills: userSpecificSkills,
          user_badges: userSpecificBadges,
          user_inventory: userSpecificInventory,
        });
      });
      setUsers(combinedUsers);
      
      const transformedMissions = missionsResult.data.map((m: any) => ({ ...m, assignedTo: m.assigned_to, startDate: m.start_date, deadline: m.deadline, skills: m.required_skills, progressPhoto: m.progress_photo_url, completedDate: m.completed_date, bonusXp: m.bonus_xp, visibleTo: m.visible_to, }));
      setMissions(transformedMissions);
      setAllInventoryItems(inventoryItemsResult.data.map((item: any) => ({ ...item, quantity: item.quantity ?? 0 })));
      setAllBadges(badgesResult.data as Badge[]);
      setMissionMilestones(milestonesResult.data.map((m: any) => ({ ...m, is_solution: m.is_solution ?? false })) as MissionMilestone[]);
      setChats(chatsResult.data as Chat[]);
      setChatMessages(messagesResult.data as ChatMessage[]);
      setSupplies(suppliesResult.data as Supply[]);
      setMissionSupplies(missionSuppliesResult.data as MissionSupply[]);

    } catch (error) {
      console.error("Error fetching data:", error);
      showToast(error instanceof Error ? error.message : "Error al cargar datos", 'error');
    }
  }, [session, showToast]);

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }
  }, [session, fetchData]);
  
  // Realtime subscriptions
  useEffect(() => {
    if (!session || !supabase) return;
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
    ];
    return () => { allChannels.forEach(channel => supabase.removeChannel(channel)); };
  }, [session, fetchData]);


  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    const myChatIds = chats.map(c => c.id);
    return chatMessages.filter(msg => myChatIds.includes(msg.chat_id) && msg.sender_id !== currentUser.id && !msg.is_read).length;
  }, [chats, chatMessages, currentUser]);

  // --- MUTATIONS ---
  const updateMission = async (updatedMission: Partial<Mission>) => {
    if (!updatedMission.id) return;
    const { id, assignedTo, startDate, deadline, skills, progressPhoto, completedDate, bonusXp, visibleTo, ...rest } = updatedMission;
    await api.updateMission(id, { ...rest, assigned_to: assignedTo, start_date: startDate, deadline: deadline, required_skills: skills, progress_photo_url: progressPhoto, completed_date: completedDate, bonus_xp: bonusXp, visible_to: visibleTo, });
  };

  const updateUser = async (updatedUser: Partial<User>) => {
      if (!updatedUser.id) return;
      await api.updateUser(updatedUser.id, { name: updatedUser.name, xp: updatedUser.xp, level: updatedUser.level, push_subscription: updatedUser.pushSubscription });
  };

  const deactivateUser = async (userId: string) => {
    await api.deactivateUser(userId);
    fetchData(); // Refresh data to remove the user from the UI
  };
  
  const updateUserAvatar = (userId: string, file: File) => api.updateUserAvatar(userId, file);
  const deleteMission = (missionId: string) => api.deleteMission(missionId);
  const removeInventoryItem = (userInventoryId: string) => api.removeInventoryItem(userInventoryId);
  const disposeOfInventoryItem = (userInventoryId: string, itemId: string) => api.disposeOfInventoryItem(userInventoryId, itemId);
  const updateInventoryItemQuantity = (itemId: string, newQuantity: number) => api.updateInventoryItemQuantity(itemId, newQuantity);
  const deleteInventoryItem = (itemId: string, iconUrl: string) => api.deleteInventoryItem(itemId, iconUrl);
  const sendNotification = (technicianId: string, title: string, body: string) => api.sendNotification(technicianId, title, body);
  const savePushSubscription = async (userId: string, subscription: PushSubscription) => {
    try { await api.updateUser(userId, { push_subscription: subscription }); } 
    catch(e) { console.error("Error saving push subscription:", e); }
  }
  const addInventoryItem = (data: { name: string; description: string; slot: EquipmentSlot; quantity: number; }, iconFile: File) => api.addInventoryItem(data, iconFile);
  const assignInventoryItem = (userId: string, itemId: string) => api.assignInventoryItem(userId, itemId);
  const toggleMilestoneSolution = (milestoneId: string, isSolution: boolean) => api.toggleMilestoneSolution(milestoneId, isSolution);

  const addMission = async (newMission: Omit<Mission, 'id' | 'status'>) => {
    await api.addMission({ ...newMission, status: 'Pendiente', assigned_to: newMission.assignedTo || null, start_date: newMission.startDate, deadline: newMission.deadline, required_skills: newMission.skills, visible_to: newMission.visibleTo || null, });
  };
  
  const requestMission = async (title: string, description: string) => {
    if (!currentUser) return;
    await api.addMission({ title: `[PROPUESTA] ${title}`, description, status: 'Solicitada', assigned_to: [currentUser.id], difficulty: 'Medio', xp: 0, start_date: new Date().toISOString().split('T')[0], deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], required_skills: [], visible_to: null });
    showToast('Solicitud de misión enviada para revisión.', 'success');
  };

  const technicianRequestMission = async (missionId: string) => {
    if (!currentUser) return;
    await api.updateMission(missionId, { assigned_to: [currentUser.id], status: 'Solicitada' });
    showToast('Misión solicitada. Esperando aprobación del administrador.', 'success');
  };

  const requestToJoinMission = async (missionId: string) => {
    if (!currentUser) return;
    const originalMission = missions.find(m => m.id === missionId);
    if (!originalMission) { showToast("La misión original no fue encontrada.", 'error'); return; }
    await api.addMission({ title: `[UNIRSE] ${originalMission.title}`, description: `Solicitud para unirse a la misión original ID: ${missionId}.`, difficulty: originalMission.difficulty, xp: originalMission.xp, status: 'Solicitada', assigned_to: [currentUser.id], start_date: originalMission.startDate, deadline: originalMission.deadline, required_skills: originalMission.skills, visible_to: null, });
    showToast('Solicitud para unirse enviada.', 'success');
  };

  const approveJoinRequest = async (requestMission: Mission) => {
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
    await deleteMission(requestMissionId);
    showToast('Solicitud para unirse rechazada.', 'info');
  };

  const rejectMissionRequest = async (missionId: string) => {
    await api.updateMission(missionId, { assigned_to: [], status: 'Pendiente' });
  };
  
  const addMissionMilestone = async (missionId: string, description: string, imageFile: File | null) => {
    if (!currentUser) throw new Error("User not authenticated");
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await api.uploadMilestoneImage(currentUser.id, missionId, imageFile);
    await api.addMissionMilestone({ mission_id: missionId, user_id: currentUser.id, description, image_url: imageUrl });
  };
  
  const addSupply = (data: Omit<Supply, 'id' | 'created_at' | 'stock_quantity'>, photoFile: File | null) => api.addSupply(data, photoFile);
  const updateSupply = (supplyId: string, data: Partial<Supply>, photoFile: File | null) => api.updateSupply(supplyId, data, photoFile);
  const deleteSupply = (supply: Supply) => api.deleteSupply(supply);
  const assignSupplyToMission = (missionId: string, supplyId: string, quantity: number) => api.assignSupplyToMission(missionId, supplyId, quantity);
  const updateMissionSupply = (missionSupplyId: string, data: Partial<Pick<MissionSupply, 'quantity_assigned' | 'quantity_used'>>) => api.updateMissionSupply(missionSupplyId, data);
  const removeSupplyFromMission = (missionSupplyId: string) => api.removeSupplyFromMission(missionSupplyId);
  const assignBadge = (userId: string, badgeId: string) => api.assignBadge(userId, badgeId);
  const revokeBadge = (userId: string, badgeId: string) => api.revokeBadge(userId, badgeId);

  const handleSelectOrCreateChat = async (otherParticipantId: string): Promise<Chat | null> => {
      if (!currentUser) return null;
      const existingChat = chats.find(c => (c.participant_1 === currentUser.id && c.participant_2 === otherParticipantId) || (c.participant_1 === otherParticipantId && c.participant_2 === currentUser.id));
      if (existingChat) return existingChat;
      const { data, error } = await api.createChat(currentUser.id, otherParticipantId);
      if (error) { showToast(error.message, 'error'); return null; }
      return data as Chat;
  };
  
  const handleSendMessage = async (chatId: string, content: string) => {
    if (!currentUser) return;
    try { await api.sendMessage(chatId, currentUser.id, content); } 
    catch (e) { showToast((e as Error).message, 'error'); }
  };
  
  const handleMarkAsRead = (chatId: string) => {
    if (!currentUser) return Promise.resolve();
    return api.markMessagesAsRead(chatId, currentUser.id);
  };

  const value = {
    users, missions, allInventoryItems, allBadges, missionMilestones, supplies, missionSupplies, chats, chatMessages, loading, unreadMessagesCount, viewingProfileOf, setViewingProfileOf,
    updateMission, updateUser, deactivateUser, updateUserAvatar, addMission, requestMission, technicianRequestMission, rejectMissionRequest, deleteMission, addMissionMilestone, toggleMilestoneSolution, assignInventoryItem, removeInventoryItem, disposeOfInventoryItem, updateInventoryItemQuantity, addInventoryItem, deleteInventoryItem, savePushSubscription, sendNotification, handleSelectOrCreateChat, handleSendMessage, handleMarkAsRead, requestToJoinMission, approveJoinRequest, rejectJoinRequest,
    addSupply, updateSupply, deleteSupply, assignSupplyToMission, updateMissionSupply, removeSupplyFromMission,
    assignBadge, revokeBadge,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};