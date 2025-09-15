import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import { User, Mission, Role, InventoryItem, Chat, ChatMessage, Toast, EquipmentSlot, MissionMilestone, MissionStatus, UserInventoryItem, Supply, MissionSupply } from '../types';
import { supabase } from '../config';
import { Database } from '../database.types';
import { transformSupabaseProfileToUser } from '../utils/dataTransformers';
import ToastComponent from '../components/common/ToastComponent';
import { LEVEL_THRESHOLDS, EARLY_COMPLETION_BONUS_XP } from '../config';

// --- APP CONTEXT INTERFACE ---
export interface AppContextType {
  currentUser: User | null;
  users: User[];
  missions: Mission[];
  allInventoryItems: InventoryItem[];
  missionMilestones: MissionMilestone[];
  supplies: Supply[];
  missionSupplies: MissionSupply[];
  chats: Chat[];
  chatMessages: ChatMessage[];
  loading: boolean;
  unreadMessagesCount: number;
  viewingProfileOf: User | null;
  setViewingProfileOf: (user: User | null) => void;
  showToast: (message: string, type: Toast['type']) => void;
  handleLogout: () => Promise<void>;
  updateMission: (updatedMission: Partial<Mission>) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
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
}

// --- CONTEXT CREATION ---
const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};


// --- MAIN APP PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ session: any; children: React.ReactNode }> = ({ session, children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const [missionMilestones, setMissionMilestones] = useState<MissionMilestone[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [missionSupplies, setMissionSupplies] = useState<MissionSupply[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfileOf, setViewingProfileOf] = useState<User | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      const [profilesResult, missionsResult, inventoryItemsResult, milestonesResult, chatsResult, messagesResult, suppliesResult, missionSuppliesResult] = await Promise.all([
         supabase.from('profiles').select(`*, profile_skills(level, skills(*)), user_badges(badges(*)), user_inventory(id, assigned_at, inventory_items(*))`),
         supabase.from('missions').select('*').order('created_at', { ascending: false }),
         supabase.from('inventory_items').select('*'),
         supabase.from('mission_milestones').select('*, mission:missions(title, required_skills)').order('created_at', { ascending: true }),
         supabase.from('chats').select('*').or(`participant_1.eq.${session.user.id},participant_2.eq.${session.user.id}`),
         supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
         supabase.from('supplies').select('*').order('general_category').order('specific_category'),
         supabase.from('mission_supplies').select('*, supplies(*)'),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (missionsResult.error) throw missionsResult.error;
      if (inventoryItemsResult.error) throw inventoryItemsResult.error;
      if (milestonesResult.error) throw milestonesResult.error;
      if (chatsResult.error) throw chatsResult.error;
      if (messagesResult.error) throw messagesResult.error;
      if (suppliesResult.error) throw suppliesResult.error;
      if (missionSuppliesResult.error) throw missionSuppliesResult.error;

      setUsers(profilesResult.data.map(transformSupabaseProfileToUser));
      
      const transformedMissions = missionsResult.data.map((m: any) => {
        const safeAssignedTo = Array.isArray(m.assigned_to) ? m.assigned_to : null;
        return { 
          ...m, 
          assignedTo: safeAssignedTo, 
          startDate: m.start_date, 
          deadline: m.deadline, 
          skills: m.required_skills, 
          progressPhoto: m.progress_photo_url, 
          completedDate: m.completed_date, 
          bonusXp: m.bonus_xp 
        };
      });
      setMissions(transformedMissions);

      setAllInventoryItems(inventoryItemsResult.data.map((item: any) => ({ ...item, quantity: item.quantity ?? 0 })));
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
    } else {
      setLoading(false);
    }
  }, [session, fetchData]);
  
  // Realtime subscriptions
  useEffect(() => {
    if (!session || !supabase) return;
    
    const handleProfileChange = async (payload: any) => {
        const profileId = payload.new?.id || payload.old?.id || payload.new?.user_id || payload.old?.user_id;
        if (!profileId) return;

        if (payload.eventType === 'DELETE' && payload.table !== 'user_inventory') {
            setUsers(prevUsers => prevUsers.filter(u => u.id !== profileId));
            return;
        }

        const { data: updatedProfileData, error } = await supabase.from('profiles').select(`*, profile_skills(level, skills(*)), user_badges(badges(*)), user_inventory(id, assigned_at, inventory_items(*))`).eq('id', profileId).single();
        if (error || !updatedProfileData) {
            console.error("Error re-fetching profile:", error); return;
        }
        const transformedUser = transformSupabaseProfileToUser(updatedProfileData);
        setUsers(prev => {
            const exists = prev.some(u => u.id === transformedUser.id);
            return exists ? prev.map(u => u.id === transformedUser.id ? transformedUser : u) : [...prev, transformedUser];
        });
    };
    
    const missionsChannel = supabase.channel('public:missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => fetchData()).subscribe();
    const profilesChannel = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleProfileChange).subscribe();
    const userInventoryChannel = supabase.channel('public:user_inventory').on('postgres_changes', { event: '*', schema: 'public', table: 'user_inventory' }, handleProfileChange).subscribe();
    const inventoryItemsChannel = supabase.channel('public:inventory_items').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchData()).subscribe();
    const milestonesChannel = supabase.channel('public:mission_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_milestones' }, () => fetchData()).subscribe();
    const chatMessagesChannel = supabase.channel('public:chat_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchData()).subscribe();
    const chatsChannel = supabase.channel('public:chats').on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchData()).subscribe();
    const suppliesChannel = supabase.channel('public:supplies').on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, () => fetchData()).subscribe();
    const missionSuppliesChannel = supabase.channel('public:mission_supplies').on('postgres_changes', { event: '*', schema: 'public', table: 'mission_supplies' }, () => fetchData()).subscribe();


    return () => {
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(userInventoryChannel);
      supabase.removeChannel(inventoryItemsChannel);
      supabase.removeChannel(milestonesChannel);
      supabase.removeChannel(chatMessagesChannel);
      supabase.removeChannel(chatsChannel);
      supabase.removeChannel(suppliesChannel);
      supabase.removeChannel(missionSuppliesChannel);
    };
  }, [session, fetchData]);

  useEffect(() => {
    setCurrentUser(session?.user ? users.find(u => u.id === session.user.id) || null : null);
  }, [session, users]);

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    const myChatIds = chats.map(c => c.id);
    return chatMessages.filter(msg => myChatIds.includes(msg.chat_id) && msg.sender_id !== currentUser.id && !msg.is_read).length;
  }, [chats, chatMessages, currentUser]);

  // --- MUTATIONS ---
  const handleLogout = async () => { if(supabase) { setViewingProfileOf(null); await supabase.auth.signOut(); } };
  
  const updateMission = async (updatedMission: Partial<Mission>) => {
    if (!supabase || !updatedMission.id) return;
    const { id, assignedTo, startDate, deadline, skills, progressPhoto, completedDate, bonusXp, ...rest } = updatedMission;
    const updateData: Database['public']['Tables']['missions']['Update'] = {
        ...rest,
        assigned_to: assignedTo,
        start_date: startDate,
        deadline: deadline,
        required_skills: skills,
        progress_photo_url: progressPhoto,
        completed_date: completedDate,
        bonus_xp: bonusXp,
    };
    const { error } = await supabase.from('missions').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
  };

  const updateUser = async (updatedUser: Partial<User>) => {
      if (!supabase || !updatedUser.id) return;
      const { id, name, xp, level, pushSubscription } = updatedUser;
      const { error } = await supabase.from('profiles').update({ name, xp, level, push_subscription: pushSubscription }).eq('id', id);
      if (error) throw new Error(error.message);
  };
  
  const updateUserAvatar = async (userId: string, file: File) => {
      if (!supabase) return;
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw new Error(`Error al subir avatar: ${uploadError.message}`);

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!data.publicUrl) throw new Error("No se pudo obtener la URL pública del avatar.");

      const uniqueUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
      const { error: dbError } = await supabase.from('profiles').update({ avatar: uniqueUrl }).eq('id', userId);
      if (dbError) throw new Error(`Error al actualizar la base de datos: ${dbError.message}`);
  };

  const addMission = async (newMission: Omit<Mission, 'id' | 'status'>) => {
      if (!supabase) return;
      const { assignedTo, startDate, deadline, skills, ...rest } = newMission;
      const insertData: Database['public']['Tables']['missions']['Insert'] = {
          ...rest,
          status: 'Pendiente',
          assigned_to: assignedTo || null,
          start_date: startDate,
          deadline: deadline,
          required_skills: skills,
      };
      const { error } = await supabase.from('missions').insert(insertData);
      if (error) throw new Error(error.message);
  };
  
  const requestMission = async (title: string, description: string) => {
      if (!supabase || !currentUser) return;
      const insertData: Database['public']['Tables']['missions']['Insert'] = {
          title: `[PROPUESTA] ${title}`,
          description,
          status: 'Solicitada',
          assigned_to: [currentUser.id],
          difficulty: 'Medio',
          xp: 0,
          start_date: new Date().toISOString().split('T')[0],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default deadline 1 week
          required_skills: [],
      };
      const { error } = await supabase.from('missions').insert(insertData);
      if (error) throw new Error(error.message);
      showToast('Solicitud de misión enviada para revisión.', 'success');
  };

  const technicianRequestMission = async (missionId: string) => {
      if (!supabase || !currentUser) return;
      const { error } = await supabase.from('missions').update({
          assigned_to: [currentUser.id],
          status: 'Solicitada'
      }).eq('id', missionId);
      if (error) throw new Error(error.message);
      showToast('Misión solicitada. Esperando aprobación del administrador.', 'success');
  };

  const requestToJoinMission = async (missionId: string) => {
    if (!supabase || !currentUser) return;
    const originalMission = missions.find(m => m.id === missionId);
    if (!originalMission) {
      showToast("La misión original no fue encontrada.", 'error');
      return;
    }
    const insertData: Database['public']['Tables']['missions']['Insert'] = {
        title: `[UNIRSE] ${originalMission.title}`,
        description: `Solicitud para unirse a la misión original ID: ${missionId}.`,
        difficulty: originalMission.difficulty,
        xp: originalMission.xp,
        status: 'Solicitada',
        assigned_to: [currentUser.id],
        start_date: originalMission.startDate,
        deadline: originalMission.deadline,
        required_skills: originalMission.skills,
    };
    const { error } = await supabase.from('missions').insert(insertData);
    if (error) throw new Error(error.message);
    showToast('Solicitud para unirse enviada.', 'success');
  };

  const approveJoinRequest = async (requestMission: Mission) => {
    if (!supabase) return;
    const originalMissionId = requestMission.description.split('ID: ')[1]?.split('.')[0];
    const userIdToJoin = requestMission.assignedTo?.[0];
    if (!originalMissionId || !userIdToJoin) {
      showToast('La solicitud de unión es inválida.', 'error');
      await deleteMission(requestMission.id); // Clean up invalid request
      return;
    }

    const originalMission = missions.find(m => m.id === originalMissionId);
    if (!originalMission) {
      showToast('La misión original ya no existe.', 'error');
      await deleteMission(requestMission.id);
      return;
    }
    
    const newAssignees = [...new Set([...(originalMission.assignedTo || []), userIdToJoin])];
    
    const { error: updateError } = await supabase.from('missions').update({ assigned_to: newAssignees }).eq('id', originalMissionId);
    if (updateError) throw new Error(updateError.message);
    
    // Clean up the request mission
    await deleteMission(requestMission.id);
    showToast('Técnico añadido a la misión.', 'success');
  };
  
  const rejectJoinRequest = async (requestMissionId: string) => {
    await deleteMission(requestMissionId);
    showToast('Solicitud para unirse rechazada.', 'info');
  };

  const rejectMissionRequest = async (missionId: string) => {
      if (!supabase) return;
      const { error } = await supabase.from('missions').update({
          assigned_to: [],
          status: 'Pendiente'
      }).eq('id', missionId);
      if (error) throw new Error(error.message);
  };

  const deleteMission = async (missionId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('missions').delete().eq('id', missionId);
    if (error) throw new Error(error.message);
  };

  const addMissionMilestone = async (missionId: string, description: string, imageFile: File | null) => {
    if (!supabase || !currentUser) throw new Error("User not authenticated");
    
    let imageUrl: string | null = null;
    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${currentUser.id}/${missionId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('milestone_photos').upload(filePath, imageFile);
        if (uploadError) throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        
        const { data } = supabase.storage.from('milestone_photos').getPublicUrl(filePath);
        if (!data.publicUrl) throw new Error("No se pudo obtener la URL pública de la imagen.");
        imageUrl = data.publicUrl;
    }

    const newMilestone: Database['public']['Tables']['mission_milestones']['Insert'] = {
        mission_id: missionId,
        user_id: currentUser.id,
        description,
        image_url: imageUrl
    };

    const { error: insertError } = await supabase.from('mission_milestones').insert(newMilestone);
    if (insertError) throw new Error(`Error al guardar el hito: ${insertError.message}`);
  };

  const toggleMilestoneSolution = async (milestoneId: string, isSolution: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('mission_milestones').update({ is_solution: isSolution }).eq('id', milestoneId);
    if (error) {
        throw new Error(error.message);
    }
    showToast(`Hito ${isSolution ? 'añadido a' : 'quitado de'} la Base de Conocimiento.`, 'success');
  };
  
  const assignInventoryItem = async (userId: string, itemId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('user_inventory').insert({ user_id: userId, item_id: itemId });
    if (error) throw new Error(error.message);
  };

  const removeInventoryItem = async (userInventoryId: string) => {
      if (!supabase) return;
      const { error } = await supabase.from('user_inventory').delete().eq('id', userInventoryId);
      if (error) throw new Error(error.message);
  };

  const disposeOfInventoryItem = async (userInventoryId: string, itemId: string) => {
    if (!supabase) return;
    const { error } = await supabase.rpc('dispose_inventory_item', {
        p_user_inventory_id: userInventoryId,
        p_item_id: itemId
    });
    if (error) {
        throw new Error(`Error al tirar insumo: ${error.message}`);
    }
};
  
  const updateInventoryItemQuantity = async (itemId: string, newQuantity: number) => {
        if (!supabase) return;
        const { error } = await supabase.from('inventory_items').update({ quantity: Math.max(0, newQuantity) }).eq('id', itemId);
        if (error) throw new Error(error.message);
    };

  const addInventoryItem = async (data: { name: string; description: string; slot: EquipmentSlot; quantity: number; }, iconFile: File) => {
    if (!supabase) return;
    const fileExt = iconFile.name.split('.').pop();
    const filePath = `public/${data.name.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('inventory_icons').upload(filePath, iconFile);
    if (uploadError) throw new Error(`Error subiendo ícono: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('inventory_icons').getPublicUrl(filePath);
    if (!urlData.publicUrl) throw new Error("No se pudo obtener la URL del ícono.");

    const { error: dbError } = await supabase.from('inventory_items').insert({ ...data, icon_url: urlData.publicUrl });
    if (dbError) throw new Error(`Error creando insumo: ${dbError.message}`);
  };

  const deleteInventoryItem = async (itemId: string, iconUrl: string) => {
    if (!supabase) return;
    const { error: dbError } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (dbError) throw new Error(dbError.message);
    
    try {
        const filePath = new URL(iconUrl).pathname.split('/inventory_icons/')[1];
        if (filePath) await supabase.storage.from('inventory_icons').remove([filePath]);
    } catch (e) { console.warn("Could not delete storage item, it might not exist:", e); }
  };

  // --- Supply Management ---
  const addSupply = async (data: Omit<Supply, 'id' | 'created_at' | 'stock_quantity'>, photoFile: File | null) => {
    if (!supabase) return;
    let photoUrl: string | null = null;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `supply_photos/${data.model.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, photoFile);
      if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('supplies').insert({ ...data, photo_url: photoUrl });
    if (error) throw new Error(error.message);
  };

  const updateSupply = async (supplyId: string, data: Partial<Supply>, photoFile: File | null) => {
    if (!supabase) return;
    let photoUrl = data.photo_url;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `supply_photos/${data.model?.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, photoFile, { upsert: true });
      if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('supplies').update({ ...data, photo_url: photoUrl }).eq('id', supplyId);
    if (error) throw new Error(error.message);
  };

  const deleteSupply = async (supply: Supply) => {
    if (!supabase) return;
    const { error } = await supabase.from('supplies').delete().eq('id', supply.id);
    if (error) throw new Error(`No se pudo eliminar el insumo. Es posible que esté asignado a una misión. Detalle: ${error.message}`);
    
    if (supply.photo_url) {
      try {
        const filePath = new URL(supply.photo_url).pathname.split('/public-assets/')[1];
        if (filePath) await supabase.storage.from('public-assets').remove([filePath]);
      } catch (e) { console.warn("No se pudo eliminar la foto del insumo:", e); }
    }
  };

  const assignSupplyToMission = async (missionId: string, supplyId: string, quantity: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('mission_supplies').insert({ mission_id: missionId, supply_id: supplyId, quantity_assigned: quantity });
    if (error) throw new Error(error.message);
  };
  
  const updateMissionSupply = async (missionSupplyId: string, data: Partial<Pick<MissionSupply, 'quantity_assigned' | 'quantity_used'>>) => {
      if (!supabase) return;
      const { error } = await supabase.from('mission_supplies').update(data).eq('id', missionSupplyId);
      if (error) throw new Error(error.message);
  };

  const removeSupplyFromMission = async (missionSupplyId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('mission_supplies').delete().eq('id', missionSupplyId);
    if (error) throw new Error(error.message);
  };

  const savePushSubscription = async (userId: string, subscription: PushSubscription) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ push_subscription: subscription }).eq('id', userId);
    if (error) console.error("Error saving push subscription:", error.message);
  };
  
  const sendNotification = async (technicianId: string, title: string, body: string) => {
    if (!supabase) return;
    const { error } = await supabase.functions.invoke('send-notification', {
        body: { technician_id: technicianId, title, body }
    });
    if (error) throw new Error(error.message);
  };

  const handleSelectOrCreateChat = async (otherParticipantId: string): Promise<Chat | null> => {
      if (!currentUser || !supabase) return null;
      const existingChat = chats.find(c => (c.participant_1 === currentUser.id && c.participant_2 === otherParticipantId) || (c.participant_1 === otherParticipantId && c.participant_2 === currentUser.id));
      if (existingChat) return existingChat;

      const { data, error } = await supabase.from('chats').insert({ participant_1: currentUser.id, participant_2: otherParticipantId }).select().single();
      if (error) { showToast(error.message, 'error'); return null; }
      return data as Chat;
  };
  
  const handleSendMessage = async (chatId: string, content: string) => {
    if (!supabase || !currentUser) return;
    const { error } = await supabase.from('chat_messages').insert({ chat_id: chatId, sender_id: currentUser.id, content });
    if (error) showToast(error.message, 'error');
  };
  
  const handleMarkAsRead = async (chatId: string) => {
    if (!supabase || !currentUser) return;
    const { error } = await supabase.from('chat_messages').update({ is_read: true }).eq('chat_id', chatId).neq('sender_id', currentUser.id);
    if (error) console.error("Error marking messages as read:", error);
  };


  const value: AppContextType = {
    currentUser, users, missions, allInventoryItems, missionMilestones, supplies, missionSupplies, chats, chatMessages, loading, unreadMessagesCount, viewingProfileOf, setViewingProfileOf, showToast,
    handleLogout, updateMission, updateUser, updateUserAvatar, addMission, requestMission, technicianRequestMission, rejectMissionRequest, deleteMission, addMissionMilestone, toggleMilestoneSolution, assignInventoryItem, removeInventoryItem, disposeOfInventoryItem, updateInventoryItemQuantity, addInventoryItem, deleteInventoryItem, savePushSubscription, sendNotification, handleSelectOrCreateChat, handleSendMessage, handleMarkAsRead, requestToJoinMission, approveJoinRequest, rejectJoinRequest,
    addSupply, updateSupply, deleteSupply, assignSupplyToMission, updateMissionSupply, removeSupplyFromMission,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={() => setToasts(ts => ts.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </AppContext.Provider>
  );
};
