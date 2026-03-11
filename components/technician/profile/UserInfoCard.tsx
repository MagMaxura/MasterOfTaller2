import React, { useState, useRef, ChangeEvent } from 'react';
import { User, Role } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { getRank } from '../../../utils/ranks';
import { calculateTotalVacationDays, formatSeniority } from '../../../utils/vacation';
import { CameraIcon, BoxIcon, CalendarIcon, EditIcon, CheckIcon } from '../../Icons';
import InventoryManagementModal from '../../admin/modals/InventoryManagementModal';

const UserInfoCard: React.FC<{ user: User; isAdminViewing?: boolean; }> = ({ user, isAdminViewing }) => {
    const { updateUserAvatar, updateUser, currentUser } = useData();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

    // Name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [isSavingName, setIsSavingName] = useState(false);

    const handleAvatarClick = () => {
        if (isAdminViewing) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (isAdminViewing) return;
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            await updateUserAvatar(user.id, file);
            showToast("Avatar actualizado con éxito", 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar avatar", 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (!newName.trim() || newName === user.name) {
            setIsEditingName(false);
            setNewName(user.name);
            return;
        }
        setIsSavingName(true);
        try {
            await updateUser(user.id, { name: newName.trim() });
            showToast("Nombre actualizado con éxito", 'success');
            setIsEditingName(false);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar nombre", 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const rank = getRank(user);

    const canManageInventory = currentUser && (
        currentUser.role === Role.ADMIN ||
        currentUser.badges?.some(b => b.name?.toLowerCase().includes('administrativo de epp'))
    );

    return (
        <div className="bg-brand-secondary p-8 rounded-[32px] border border-brand-accent shadow-premium relative overflow-hidden group/main">
            {/* Background Accent */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl group-hover/main:bg-brand-blue/10 transition-colors" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Avatar Section */}
                <div
                    className={`relative group mb-6 ${!isAdminViewing ? 'cursor-pointer' : ''}`}
                    onClick={handleAvatarClick}
                >
                    <div className="relative">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-28 h-28 rounded-3xl border-4 border-white shadow-premium object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                        <div className="absolute -top-2 -right-2 bg-brand-blue text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border-2 border-white shadow-lg">
                            {user.level}
                        </div>
                    </div>

                    {!isAdminViewing && (
                        <div className="absolute inset-0 bg-brand-highlight/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-3xl flex items-center justify-center">
                            {isUploading ? (
                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <CameraIcon className="w-8 h-8 text-white" />
                            )}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>

                {/* Info Section */}
                <div className="text-center space-y-1 w-full flex flex-col items-center">
                    {isEditingName ? (
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-brand-primary border border-brand-accent rounded p-1 text-center font-bold text-white focus:outline-none focus:border-brand-blue"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            />
                            <button
                                onClick={handleSaveName}
                                disabled={isSavingName}
                                className="p-1.5 bg-brand-green/20 text-brand-green rounded-lg hover:bg-brand-green hover:text-white transition-all disabled:opacity-50"
                            >
                                {isSavingName ? (
                                    <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                                ) : (
                                    <CheckIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-center group/name">
                            <h3 className="text-2xl font-black text-brand-highlight tracking-tight leading-none">{user.name}</h3>
                            {!isAdminViewing && (
                                <button
                                    onClick={() => {
                                        setNewName(user.name);
                                        setIsEditingName(true);
                                    }}
                                    className="opacity-0 group-hover/name:opacity-100 p-1 text-brand-light hover:text-brand-highlight transition-all"
                                    title="Editar nombre"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                    <p className="text-xs font-black text-brand-blue uppercase tracking-[0.2em] opacity-80">{rank}</p>
                </div>

                {/* Seniority / Joining Date */}
                <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[200px]">
                    <div className="w-full bg-white/50 border border-brand-accent rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-brand-blue" />
                        <div className="text-left">
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-widest leading-none">Ingreso</p>
                            <p className="font-bold text-brand-highlight text-xs mt-0.5">
                                {user.joining_date ? new Date(user.joining_date).toLocaleDateString() : 'No reg.'}
                            </p>
                        </div>
                    </div>
                    {user.joining_date && (
                        <span className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest">
                            {formatSeniority(user.joining_date)}
                        </span>
                    )}
                </div>

                {/* Vacation Balance */}
                <div className="mt-6 w-full space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">Vacaciones</span>
                        <span className="text-xs font-black text-brand-green">
                            {user.vacation_remaining_days || 0} / {user.vacation_total_days || 0}
                        </span>
                    </div>
                    <div className="h-2.5 bg-brand-accent rounded-full overflow-hidden shadow-inner p-0.5">
                        <div
                            className="h-full bg-brand-green rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, ((user.vacation_remaining_days || 0) / (user.vacation_total_days || 0.1)) * 100)}%` }}
                        />
                    </div>
                    <p className="text-[9px] font-bold text-brand-light/60 uppercase tracking-tighter text-center">Días Disponibles</p>
                </div>

                {/* Inventory Management */}
                {canManageInventory && (
                    <button
                        onClick={() => setIsInventoryModalOpen(true)}
                        className="mt-8 w-full bg-white border border-brand-accent text-brand-highlight py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-premium hover:bg-brand-secondary transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        <BoxIcon className="w-4 h-4 text-brand-blue transition-transform group-hover/btn:scale-110" />
                        <span>Gestionar Stock</span>
                    </button>
                )}
            </div>

            {isInventoryModalOpen && (
                <InventoryManagementModal
                    user={user}
                    onClose={() => setIsInventoryModalOpen(false)}
                />
            )}
        </div>
    );
};

export default UserInfoCard;