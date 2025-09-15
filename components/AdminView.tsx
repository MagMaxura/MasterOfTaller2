import React, { useState, useMemo } from 'react';
import { User, Mission, MissionStatus } from '../types';
import { useAppContext } from '../contexts/AppContext';

import UserManagement from './admin/UserManagement';
import MissionCreator from './admin/MissionCreator';
import StockManagement from './admin/stock/StockManagement';
import CreateItemModal from './admin/stock/CreateItemModal';
import InventoryManagementModal from './admin/modals/InventoryManagementModal';
import NotificationModal from './admin/modals/NotificationModal';
import MissionCalendar from './MissionCalendar';
import LiveLocationMap from './LiveLocationMap';
import ChatView from './ChatView';
import MissionRequests from './admin/MissionRequests';
import ApproveMissionModal from './admin/modals/ApproveMissionModal';
import MissionsManager from './admin/MissionsManager';
import MissionDetailsModal from './technician/missions/MissionDetailsModal';
import KnowledgeBase from './knowledge/KnowledgeBase';
import SuppliesManagement from './admin/supplies/SuppliesManagement';

import { PlusIcon, BoxIcon, CalendarIcon, MapPinIcon, UserIcon, ChatIcon, TasksIcon, BookOpenIcon, LogoutIcon, MenuIcon } from './Icons';

// --- MAIN COMPONENT ---
const AdminView: React.FC = () => {
    const { currentUser, missions, users, unreadMessagesCount, handleLogout } = useAppContext();
    const [activeTab, setActiveTab] = useState('manage');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [managingInventoryFor, setManagingInventoryFor] = useState<User | null>(null);
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [notifyingUser, setNotifyingUser] = useState<User | null>(null);
    const [missionToApprove, setMissionToApprove] = useState<Mission | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    
    const missionRequestsCount = useMemo(() => missions.filter(m => m.status === MissionStatus.REQUESTED).length, [missions]);

    const TABS = [
        { id: 'manage', label: 'Gestionar', icon: <UserIcon /> },
        { id: 'missions', label: 'Misiones', icon: <TasksIcon /> },
        { id: 'requests', label: 'Solicitudes', icon: <TasksIcon />, notification: missionRequestsCount > 0 },
        { id: 'create', label: 'Crear Misión', icon: <PlusIcon /> },
        { id: 'stock', label: 'Stock (Equipo)', icon: <BoxIcon /> },
        { id: 'supplies', label: 'Insumos', icon: <BoxIcon /> },
        { id: 'knowledge', label: 'Conocimiento', icon: <BookOpenIcon /> },
        { id: 'chat', label: 'Chat', icon: <ChatIcon />, notification: unreadMessagesCount > 0 },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon /> },
        { id: 'live_map', label: 'Mapa', icon: <MapPinIcon /> },
    ];
    
    const activeTabLabel = useMemo(() => TABS.find(tab => tab.id === activeTab)?.label || 'Panel de Administrador', [activeTab]);

    if (!currentUser) return null;

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 mb-8 p-2">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full border-2 border-brand-orange" />
                <div>
                    <h2 className="font-bold text-lg">{currentUser.name}</h2>
                    <p className="text-sm text-brand-light">General Supremo</p>
                </div>
            </div>
            <nav className="flex-grow flex flex-col space-y-2">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => {
                            setActiveTab(tab.id);
                            setIsSidebarOpen(false); // Close on mobile
                        }} 
                        className={`relative flex items-center gap-4 w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-brand-blue text-white' : 'text-brand-light hover:bg-brand-accent hover:text-white'}`}
                    >
                        {React.cloneElement(tab.icon, { className: "w-5 h-5 flex-shrink-0" })}
                        <span>{tab.label}</span>
                        {tab.id === 'requests' && tab.notification && missionRequestsCount > 0 && 
                            <span className="ml-auto h-5 min-w-[1.25rem] px-1.5 text-xs flex items-center justify-center rounded-full bg-brand-red text-white font-bold">{missionRequestsCount}</span>}
                        {tab.id === 'chat' && tab.notification && unreadMessagesCount > 0 && 
                            <span className="ml-auto block h-2.5 w-2.5 rounded-full bg-brand-red ring-2 ring-brand-secondary" />}
                    </button>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-brand-accent/20">
                <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-brand-light hover:bg-brand-red hover:text-white">
                    <LogoutIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Salir</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="relative min-h-screen bg-brand-primary md:flex">
             {/* Mobile header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-brand-secondary p-4 text-white md:hidden">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold">{activeTabLabel}</h1>
                <div className="w-6"></div> {/* Spacer */}
            </header>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-brand-secondary p-4 flex flex-col text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </aside>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {activeTab === 'manage' && <UserManagement onManageInventory={setManagingInventoryFor} onNotifyUser={setNotifyingUser} />}
                    {activeTab === 'missions' && <MissionsManager onOpenMission={setSelectedMission} />}
                    {activeTab === 'requests' && <MissionRequests onApprove={setMissionToApprove} />}
                    {activeTab === 'create' && <MissionCreator users={users} />}
                    {activeTab === 'chat' && <ChatView currentUser={currentUser} />}
                    {activeTab === 'stock' && <StockManagement onOpenCreateModal={() => setIsCreateItemModalOpen(true)} />}
                    {activeTab === 'supplies' && <SuppliesManagement />}
                    {activeTab === 'knowledge' && <KnowledgeBase />}
                    {activeTab === 'calendar' && <MissionCalendar missions={missions} users={users} onOpenMission={setSelectedMission} />}
                    {activeTab === 'live_map' && <LiveLocationMap users={users} />}
                </main>
            </div>
            
            {isCreateItemModalOpen && <CreateItemModal onClose={() => setIsCreateItemModalOpen(false)} />}
            {managingInventoryFor && <InventoryManagementModal user={managingInventoryFor} onClose={() => setManagingInventoryFor(null)} />}
            {notifyingUser && <NotificationModal user={notifyingUser} onClose={() => setNotifyingUser(null)} />}
            {missionToApprove && <ApproveMissionModal mission={missionToApprove} onClose={() => setMissionToApprove(null)} />}
            {selectedMission && <MissionDetailsModal mission={selectedMission} user={currentUser} onClose={() => setSelectedMission(null)} isAdminViewing={true} />}
        </div>
    );
};

export default AdminView;