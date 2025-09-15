import React from 'react';
import { User } from '../../../types';
import UserInfoCard from './UserInfoCard';
import SkillsPanel from './SkillsPanel';
import BadgesPanel from './BadgesPanel';
import EquipmentPanel from './EquipmentPanel';

const ProfileView: React.FC<{ user: User; isAdminViewing?: boolean; }> = ({ user, isAdminViewing }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Info */}
            <div className="flex flex-col gap-8">
                <UserInfoCard user={user} isAdminViewing={isAdminViewing} />
                <SkillsPanel skills={user.skills} />
                <BadgesPanel badges={user.badges} />
            </div>

            {/* Right Column: Character Sheet */}
            <div className="h-full md:min-h-[700px]">
                <EquipmentPanel user={user} />
            </div>
        </div>
    );
};

export default ProfileView;
