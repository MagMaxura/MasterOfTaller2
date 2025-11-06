import React, { useMemo } from 'react';
import { User, EquipmentSlot, UserInventoryItem } from '../../../types';
import { BeltIcon } from '../../Icons';
import { getStorageUrl } from '../../../config';

const ItemTooltip: React.FC<{ items: UserInventoryItem[] }> = ({ items }) => (
  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-brand-primary border border-brand-accent rounded-lg shadow-xl text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    {items.map(({ item, assigned_at }) => (
      <div key={item.id} className="mb-2 last:mb-0">
        <p className="font-bold text-brand-blue">{item.name}</p>
        <p className="text-brand-light text-xs italic mb-1">{item.description}</p>
        <p className="text-xs text-brand-accent">Entregado: {new Date(assigned_at).toLocaleDateString()}</p>
      </div>
    ))}
  </div>
);

const EquipmentSlotComponent: React.FC<{
  items: UserInventoryItem[];
  icon: React.ReactNode;
}> = ({ items, icon }) => {
  const equippedItem = items[0]?.item;
  const hasItems = items.length > 0;
  const stackCount = items.length > 1 ? items.length : null;

  return (
    <div className={`relative flex items-center justify-center w-20 h-20 bg-brand-primary/50 border-2 rounded-lg ${hasItems ? 'border-brand-blue' : 'border-dashed border-brand-accent/50'}`}>
      <div className="relative group w-full h-full flex items-center justify-center">
        {hasItems ? (
          <img src={equippedItem!.icon_url} alt={equippedItem!.name} className="w-14 h-14 object-contain" />
        ) : (
          icon
        )}
        {stackCount && (
          <div className="absolute -top-2 -right-2 bg-brand-orange text-brand-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-secondary">
            {stackCount}
          </div>
        )}
        {hasItems && <ItemTooltip items={items} />}
      </div>
    </div>
  );
};

const EquipmentPanel: React.FC<{ user: User }> = ({ user }) => {
    const inventoryBySlot = useMemo(() => {
        const slots: { [key in EquipmentSlot]?: UserInventoryItem[] } = {};
        for (const invItem of user.inventory) {
            if (!slots[invItem.item.slot]) slots[invItem.item.slot] = [];
            slots[invItem.item.slot]!.push(invItem);
        }
        return slots;
    }, [user.inventory]);
    
    const slotIcons: Record<EquipmentSlot, React.ReactNode> = {
        [EquipmentSlot.HEAD]: <img src={getStorageUrl('iconos-equipamiento', 'cazco.png')} alt="Ranura de cabeza" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.FACE]: <img src={getStorageUrl('iconos-equipamiento', 'protector%20visual.png')} alt="Ranura de rostro" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.EARS]: <img src={getStorageUrl('iconos-equipamiento', 'protector%20auditivo.png')} alt="Ranura de oídos" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.OUTERWEAR]: <img src={getStorageUrl('iconos-equipamiento', 'campera%20impermeable.png')} alt="Ranura de ropa exterior" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.SHIRT]: <img src={getStorageUrl('iconos-equipamiento', 'camisa%20de%20trabajo.png')} alt="Ranura de camisa" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.HANDS]: <img src={getStorageUrl('iconos-equipamiento', 'guantes%20de%20seguridad.png')} alt="Ranura de manos" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.PANTS]: <img src={getStorageUrl('iconos-equipamiento', 'pantalon.png')} alt="Ranura de pantalones" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.FEET]: <img src={getStorageUrl('iconos-equipamiento', 'zapatos%20de%20seguridad.png')} alt="Ranura de pies" className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.BELT]: <BeltIcon className="w-10 h-10 object-contain opacity-50" />,
        [EquipmentSlot.ACCESSORY]: <img src={getStorageUrl('iconos-equipamiento', 'pulover.png')} alt="Ranura de accesorio" className="w-10 h-10 object-contain opacity-50" />,
    };

    return (
      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl relative bg-cover bg-center h-full flex flex-col" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-leather.png')"}}>
        <div className="absolute inset-0 bg-brand-secondary/80 backdrop-blur-sm"></div>
        <div className="relative flex-grow flex items-center justify-center gap-4 md:gap-8">
            {/* Left Slots */}
            <div className="flex flex-col gap-y-4">
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.HEAD] || []} icon={slotIcons.head} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.EARS] || []} icon={slotIcons.ears} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.OUTERWEAR] || []} icon={slotIcons.outerwear} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.SHIRT] || []} icon={slotIcons.shirt} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.PANTS] || []} icon={slotIcons.pants} />
            </div>

            {/* Character Silhouette */}
            <div className="w-1/3 max-w-[150px] text-brand-primary/40">
                <svg viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M192 0C139 0 96 43 96 96s43 96 96 96 96-43 96-96S245 0 192 0zM256 224H128c-35.3 0-64 28.7-64 64v16c0 17.7 14.3 32 32 32h16v128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V336h16c17.7 0 32-14.3 32-32v-16c0-35.3-28.7-64-64-64z"/>
                </svg>
            </div>

            {/* Right Slots */}
            <div className="flex flex-col gap-y-4">
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.FACE] || []} icon={slotIcons.face} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.HANDS] || []} icon={slotIcons.hands} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.BELT] || []} icon={slotIcons.belt} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.FEET] || []} icon={slotIcons.feet} />
                <EquipmentSlotComponent items={inventoryBySlot[EquipmentSlot.ACCESSORY] || []} icon={slotIcons.accessory} />
            </div>
        </div>
      </div>
    );
};

export default EquipmentPanel;
