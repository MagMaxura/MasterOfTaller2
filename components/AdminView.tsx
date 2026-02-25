
import React, { useState, useMemo, useEffect } from 'react';
import { User, Mission, MissionStatus } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

import UserManagement from './admin/UserManagement';
import MissionCreator from './admin/MissionCreator';
import StockManagement from './admin/stock/StockManagement';
import CreateItemModal from './admin/stock/CreateItemModal';
import InventoryManagementModal from './admin/modals/InventoryManagementModal';
import BadgeManagementModal from './admin/modals/BadgeManagementModal';
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
import Leaderboard from './common/Leaderboard';
import HallOfFame from './common/HallOfFame';
import PayrollManagement from './admin/payroll/PayrollManagement';
import SetSalaryModal from './admin/payroll/SetSalaryModal';
import AddPayrollEventModal from './admin/payroll/AddPayrollEventModal';
import AttendanceModal from './admin/modals/AttendanceModal';

import { PlusIcon, BoxIcon, CalendarIcon, MapPinIcon, UserIcon, ChatIcon, TasksIcon, BookOpenIcon, LogoutIcon, MenuIcon, ChartIcon, HallOfFameIcon, CurrencyDollarIcon } from './Icons';

// --- MAIN COMPONENT ---
const AdminView: React.FC = () => {
    const { handleLogout } = useAuth();
    const { currentUser, missions, users, unreadMessagesCount } = useData();
    const [activeTab, setActiveTab] = useState('manage');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [managingInventoryFor, setManagingInventoryFor] = useState<User | null>(null);
    const [managingBadgesFor, setManagingBadgesFor] = useState<User | null>(null);
    const [settingSalaryFor, setSettingSalaryFor] = useState<User | null>(null);
    const [addingPayrollEventFor, setAddingPayrollEventFor] = useState<User | null>(null);
    const [viewingAttendanceFor, setViewingAttendanceFor] = useState<User | null>(null);
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [notifyingUser, setNotifyingUser] = useState<User | null>(null);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    // Removed package.json fetch to avoid 404 errors in production

    const missionRequestsCount = useMemo(() => missions.filter(m => m.status === MissionStatus.REQUESTED).length, [missions]);

    const TABS = [
        { id: 'manage', label: 'Gestionar', icon: <UserIcon /> },
        { id: 'payroll', label: 'Nómina', icon: <CurrencyDollarIcon /> },
        { id: 'missions', label: 'Misiones', icon: <TasksIcon /> },
        { id: 'requests', label: 'Solicitudes', icon: <TasksIcon />, notification: missionRequestsCount > 0 },
        { id: 'leaderboard', label: 'Clasificación', icon: <ChartIcon /> },
        { id: 'hall_of_fame', label: 'Muro de la Fama', icon: <HallOfFameIcon /> },
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
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <div className="flex items-center gap-4 mb-8 p-6 bg-white/5 border-b border-white/5">
                <div className="relative">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-14 h-14 rounded-2xl border-2 border-brand-blue shadow-lg object-cover" />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-brand-green border-2 border-slate-900"></span>
                </div>
                <div className="overflow-hidden">
                    <h2 className="font-black text-xl truncate tracking-tight">{currentUser.name}</h2>
                    <p className="text-[10px] text-brand-blue uppercase font-black tracking-widest opacity-80">Administrador</p>
                </div>
            </div>

            <nav className="flex-grow flex flex-col space-y-1.5 overflow-y-auto px-4 custom-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setIsSidebarOpen(false);
                        }}
                        className={`relative flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${activeTab === tab.id ? 'bg-brand-blue text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            {React.cloneElement(tab.icon as React.ReactElement, { className: "w-5 h-5 flex-shrink-0" })}
                        </div>
                        <span className="truncate">{tab.label}</span>

                        {tab.id === 'requests' && tab.notification && missionRequestsCount > 0 &&
                            <span className="ml-auto h-6 min-w-[1.5rem] px-2 text-[10px] flex items-center justify-center rounded-full bg-brand-red text-white font-black shadow-lg animate-pulse">{missionRequestsCount}</span>}

                        {tab.id === 'chat' && tab.notification && unreadMessagesCount > 0 &&
                            <span className="ml-auto block h-3 w-3 rounded-full bg-brand-red ring-2 ring-slate-900" />}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 p-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-sm font-black transition-all bg-white/5 text-slate-400 hover:bg-brand-red hover:text-white group"
                >
                    <LogoutIcon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen bg-brand-secondary md:flex overflow-hidden">
            {/* Mobile header - Glassmorphism */}
            <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-brand-accent px-6 py-4 md:hidden shadow-sm">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 -ml-3 bg-brand-secondary/50 rounded-xl text-brand-light hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-light leading-none">Admin</span>
                    <h1 className="text-sm font-black text-brand-highlight">{activeTabLabel}</h1>
                </div>
                <img src={currentUser.avatar} alt="Avatar" className="w-9 h-9 rounded-xl border border-brand-accent shadow-sm" />
            </header>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-md transition-opacity md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - Dark Premium */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-80 transform bg-slate-900 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                {sidebarContent}
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
                <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto animate-fadeIn">
                        <div className={activeTab === 'manage' ? 'block' : 'hidden'}>
                            <UserManagement
                                onManageInventory={setManagingInventoryFor}
                                onManageBadges={setManagingBadgesFor}
                                onNotifyUser={setNotifyingUser}
                                onSetSalary={setSettingSalaryFor}
                                onShowAttendance={setViewingAttendanceFor}
                            />
                        </div>
                        <div className={activeTab === 'payroll' ? 'block' : 'hidden'}>
                            <PayrollManagement onAddEvent={setAddingPayrollEventFor} />
                        </div>
                        <div className={activeTab === 'missions' ? 'block' : 'hidden'}>
                            <MissionsManager onOpenMission={setSelectedMission} onEditMission={setEditingMission} />
                        </div>
                        <div className={activeTab === 'requests' ? 'block' : 'hidden'}>
                            <MissionRequests onReview={setEditingMission} />
                        </div>
                        <div className={activeTab === 'leaderboard' ? 'block' : 'hidden'}>
                            <Leaderboard users={users} />
                        </div>
                        <div className={activeTab === 'hall_of_fame' ? 'block' : 'hidden'}>
                            <HallOfFame missions={missions} users={users} />
                        </div>
                        <div className={activeTab === 'create' ? 'block' : 'hidden'}>
                            <MissionCreator users={users} />
                        </div>
                        <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
                            <ChatView currentUser={currentUser} />
                        </div>
                        <div className={activeTab === 'stock' ? 'block' : 'hidden'}>
                            <StockManagement onOpenCreateModal={() => setIsCreateItemModalOpen(true)} />
                        </div>
                        <div className={activeTab === 'supplies' ? 'block' : 'hidden'}>
                            <SuppliesManagement />
                        </div>
                        <div className={activeTab === 'knowledge' ? 'block' : 'hidden'}>
                            <KnowledgeBase />
                        </div>
                        <div className={activeTab === 'calendar' ? 'block' : 'hidden'}>
                            <MissionCalendar missions={missions} users={users} onOpenMission={setSelectedMission} />
                        </div>
                        <div className={activeTab === 'live_map' ? 'block' : 'hidden'}>
                            <LiveLocationMap users={users} isVisible={activeTab === 'live_map'} />
                        </div>
                    </div>
                </main>
                <footer className="flex-shrink-0 bg-white border-t border-brand-accent p-3 text-center text-xs text-brand-light">
                    Herramienta de Proyecto y Gestion Gamificada
                </footer>
            </div>

            {isCreateItemModalOpen && <CreateItemModal onClose={() => setIsCreateItemModalOpen(false)} />}
            {managingInventoryFor && <InventoryManagementModal user={managingInventoryFor} onClose={() => setManagingInventoryFor(null)} />}
            {managingBadgesFor && <BadgeManagementModal user={managingBadgesFor} onClose={() => setManagingBadgesFor(null)} />}
            {settingSalaryFor && <SetSalaryModal user={settingSalaryFor} onClose={() => setSettingSalaryFor(null)} />}
            {addingPayrollEventFor && <AddPayrollEventModal user={addingPayrollEventFor} onClose={() => setAddingPayrollEventFor(null)} />}
            {viewingAttendanceFor && <AttendanceModal user={viewingAttendanceFor} onClose={() => setViewingAttendanceFor(null)} />}
            {notifyingUser && <NotificationModal user={notifyingUser} onClose={() => setNotifyingUser(null)} />}
            {editingMission && <ApproveMissionModal mission={editingMission} onClose={() => setEditingMission(null)} />}
            {selectedMission && <MissionDetailsModal mission={selectedMission} user={currentUser} onClose={() => setSelectedMission(null)} isAdminViewing={true} />}
        </div>
    );
};

export default AdminView;
