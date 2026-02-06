
import React, { useState, useMemo, useEffect } from 'react';
import { User, Mission } from '../types';
import { supabase } from '../config';
import { useData } from '../contexts/DataContext';

import Header from './technician/Header';
import ProfileView from './technician/profile/ProfileView';
import MissionsDashboard from './technician/missions/MissionsDashboard';
import MissionDetailsModal from './technician/missions/MissionDetailsModal';
import PermissionsGuard from './technician/PermissionsGuard';
import Leaderboard from './common/Leaderboard';
import HallOfFame from './common/HallOfFame';
import MissionCalendar from './MissionCalendar';
import ChatView from './ChatView';
import KnowledgeBase from './knowledge/KnowledgeBase';
import TechnicianSuppliesView from './technician/TechnicianSuppliesView';
import PaymentsView from './technician/payments/PaymentsView';
import { hasSupplyAdminBadge, hasEquipmentAdminBadge } from '../utils/ranks';
import StockManagement from './admin/stock/StockManagement';
import CreateItemModal from './admin/stock/CreateItemModal';


import { TasksIcon, UserIcon, ChartIcon, HallOfFameIcon, CalendarIcon, ChatIcon, BookOpenIcon, BoxIcon, CurrencyDollarIcon } from './Icons';


// --- MAIN UI COMPONENT ---
interface TechnicianUIProps {
    user: User;
    isAdminViewing?: boolean;
    onBackToAdmin?: () => void;
}

const TechnicianUI: React.FC<TechnicianUIProps> = ({ user, isAdminViewing = false, onBackToAdmin }) => {
    const { missions, users, unreadMessagesCount } = useData();
    const [activeTab, setActiveTab] = useState('missions');
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [isCreateStockItemModalOpen, setIsCreateStockItemModalOpen] = useState(false);
    const userHasSupplyBadge = useMemo(() => hasSupplyAdminBadge(user), [user]);
    const userHasEquipmentBadge = useMemo(() => hasEquipmentAdminBadge(user), [user]);

    // Removed package.json fetch to avoid 404 errors

    // Geolocation tracking
    useEffect(() => {
        if (isAdminViewing || !navigator.geolocation) return;
        let intervalId: number | undefined;
        const updateLocation = () => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    if (supabase) {
                        const { error } = await supabase.from('profiles').update({ lat: latitude, lng: longitude, location_last_update: new Date().toISOString() }).eq('id', user.id);
                        if (error) console.error('Error al actualizar la ubicación:', error.message);
                    }
                },
                (error) => {
                    console.error(`Error de geolocalización: ${error.message}`);
                    if (error.code === error.PERMISSION_DENIED && intervalId) clearInterval(intervalId);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };
        updateLocation();
        intervalId = window.setInterval(updateLocation, 30000);
        return () => { if (intervalId) clearInterval(intervalId); };

    }, [user.id, isAdminViewing]);


    const userMissions = useMemo(() => missions.filter(m => m.visibleTo?.includes(user.id)), [missions, user.id]);

    const TABS = useMemo(() => {
        const baseTabs = [
            { id: 'missions', label: 'Misiones', icon: <TasksIcon /> },
            { id: 'profile', label: 'Perfil', icon: <UserIcon /> },
            { id: 'payments', label: 'Pagos', icon: <CurrencyDollarIcon /> },
            { id: 'knowledge', label: 'Saber', icon: <BookOpenIcon /> },
            { id: 'chat', label: 'Chat', icon: <ChatIcon />, notification: unreadMessagesCount > 0 },
            { id: 'leaderboard', label: 'Top', icon: <ChartIcon /> },
        ];

        if (userHasSupplyBadge && !isAdminViewing) {
            baseTabs.splice(3, 0, { id: 'supplies', label: 'Insumos', icon: <BoxIcon />, notification: false });
        }
        if (userHasEquipmentBadge && !isAdminViewing) {
            baseTabs.splice(3, 0, { id: 'stock', label: 'Stock EPP', icon: <BoxIcon />, notification: false });
        }

        // Add less critical tabs for larger screens
        const desktopTabs = [
            ...baseTabs,
            { id: 'hall_of_fame', label: 'Fama', icon: <HallOfFameIcon /> },
            { id: 'calendar', label: 'Calendario', icon: <CalendarIcon /> }
        ];

        // Mobile tabs are more selective - keep max 5-6 items for mobile nav
        const mobileTabs = baseTabs.slice(0, 5); // Show first 5 for better fit, user can access others via specific logic if needed, or scroll

        return { mobile: baseTabs, desktop: desktopTabs }; // Using baseTabs for mobile to ensure all are accessible with scroll

    }, [userHasSupplyBadge, userHasEquipmentBadge, unreadMessagesCount, isAdminViewing]);

    const renderContent = () => {
        switch (activeTab) {
            case 'missions': return <MissionsDashboard user={user} onOpenMission={setSelectedMission} />;
            case 'profile': return <ProfileView user={user} isAdminViewing={isAdminViewing} />;
            case 'payments': return <PaymentsView />;
            case 'supplies': return <TechnicianSuppliesView />;
            case 'stock': return <StockManagement onOpenCreateModal={() => setIsCreateStockItemModalOpen(true)} />;
            case 'knowledge': return <KnowledgeBase />;
            case 'chat': return <ChatView currentUser={user} />;
            case 'leaderboard': return <Leaderboard users={users} />;
            case 'hall_of_fame': return <HallOfFame missions={missions} users={users} />;
            case 'calendar': return <MissionCalendar missions={userMissions} users={users} onOpenMission={setSelectedMission} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-brand-secondary pb-24 md:pb-0 overflow-x-hidden">
            <Header user={user} isAdminViewing={isAdminViewing} onBack={onBackToAdmin} />

            {/* Desktop Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-brand-accent hidden md:block sticky top-16 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-center h-14">
                        <div className="flex items-center space-x-1">
                            {TABS.desktop.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-brand-blue text-white shadow-lg scale-105' : 'text-brand-light hover:bg-brand-accent hover:text-brand-highlight'}`}
                                >
                                    {React.cloneElement(tab.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                    <span>{tab.label}</span>
                                    {tab.notification && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-brand-red border-2 border-white animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fadeIn">
                {renderContent()}
                <footer className="text-center text-[10px] font-bold text-brand-light/50 uppercase tracking-[0.2em] pt-12 pb-6">
                    Maestros del Taller &copy; 2026
                </footer>
            </main>

            {/* Mobile Bottom Tab Navigation - FIXED PREMIUM VERSION */}
            <nav className="fixed bottom-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/20 shadow-premium rounded-2xl md:hidden z-30 pb-safe px-2">
                <div className="flex justify-between items-center h-full overflow-x-auto no-scrollbar gap-1">
                    {TABS.mobile.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`relative flex flex-col items-center justify-center min-w-[4.5rem] flex-1 h-[85%] rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-brand-blue text-white shadow-lg active:scale-95' : 'text-brand-light hover:text-brand-highlight hover:bg-black/5'}`}
                        >
                            <div className="relative">
                                {React.cloneElement(tab.icon as React.ReactElement, { className: activeTab === tab.id ? 'w-6 h-6' : 'w-5 h-5' })}
                                {tab.notification && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-brand-red ring-2 ring-white animate-pulse" />}
                            </div>
                            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter leading-none">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {selectedMission && <MissionDetailsModal mission={selectedMission} user={user} onClose={() => setSelectedMission(null)} isAdminViewing={isAdminViewing} />}
            {isCreateStockItemModalOpen && <CreateItemModal onClose={() => setIsCreateStockItemModalOpen(false)} />}
        </div>
    );
};


// --- MAIN TECHNICIAN VIEW COMPONENT WRAPPER ---
interface TechnicianViewProps {
    user: User;
    isAdminViewing?: boolean;
    onBackToAdmin?: () => void;
}

const TechnicianView: React.FC<TechnicianViewProps> = (props) => {
    if (props.isAdminViewing) {
        return <TechnicianUI {...props} />;
    }

    return (
        <PermissionsGuard user={props.user}>
            <TechnicianUI {...props} />
        </PermissionsGuard>
    );
};


export default TechnicianView;
