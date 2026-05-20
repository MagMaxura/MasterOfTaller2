import { useEffect, useRef } from 'react';
import { supabase } from '../../config';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { Role } from '../../types';

interface LocationRow {
  user_id: string;
  is_online: boolean;
  updated_at: string;
}

// Requests browser notification permission once per session.
async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showBrowserNotif(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon: icon || '/icons/icon-192x192.png', tag: 'tech-offline' });
  // Auto-close after 8 seconds
  setTimeout(() => n.close(), 8000);
  n.onclick = () => { window.focus(); n.close(); };
}

const TechnicianStatusMonitor: React.FC = () => {
  const { currentUser, users } = useData();
  const { showToast } = useToast();
  // baseline: user_id → is_online state at mount time
  const baseline = useRef<Record<string, boolean>>({});
  const initialized = useRef(false);

  const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.OPERATIONS;

  useEffect(() => {
    if (!isAdmin) return;

    // Request browser notification permission
    requestNotifPermission();

    // Fetch initial states to build baseline (avoid false alarms on load)
    const init = async () => {
      const { data } = await supabase.from('technician_locations').select('user_id, is_online, updated_at');
      if (data) {
        (data as LocationRow[]).forEach(row => {
          baseline.current[row.user_id] = row.is_online;
        });
      }
      initialized.current = true;
    };
    init();

    // Subscribe to changes
    const channel = supabase
      .channel('technician_status_monitor')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'technician_locations',
      }, payload => {
        if (!initialized.current) return;

        const row = payload.new as LocationRow;
        const wasOnline = baseline.current[row.user_id];

        // Only notify on true → false transition
        if (wasOnline === true && row.is_online === false) {
          const tech = users.find(u => u.id === row.user_id);
          const name = tech?.name ?? 'Un técnico';

          showToast(`📵 ${name} se desconectó`, 'error');
          showBrowserNotif(
            '📵 Técnico sin conexión',
            `${name} perdió la conexión o cerró la aplicación.`,
            tech?.avatar,
          );
        }

        // Update baseline
        baseline.current[row.user_id] = row.is_online;
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, users, showToast]);

  return null; // purely logic, no UI
};

import React from 'react';
export default TechnicianStatusMonitor;
