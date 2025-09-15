import React, { useState, useRef, ChangeEvent } from 'react';
import { User } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';
import { getRank } from '../../../utils/ranks';
import { CameraIcon } from '../../Icons';

const UserInfoCard: React.FC<{ user: User; isAdminViewing?: boolean; }> = ({ user, isAdminViewing }) => {
    const { updateUserAvatar, showToast } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

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
    
    const rank = getRank(user);
    
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg text-center">
            <div className={`relative group w-28 h-28 mx-auto ${!isAdminViewing && 'cursor-pointer'}`} onClick={handleAvatarClick}>
                <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-full border-4 border-brand-blue object-cover"/>
                {!isAdminViewing && (
                    <>
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity">
                        {isUploading 
                            ? <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                            : <CameraIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </>
                )}
            </div>
            <h3 className="text-2xl font-bold mt-4">{user.name}</h3>
            <p className="text-brand-light">{rank}</p>
        </div>
    );
};

export default UserInfoCard;