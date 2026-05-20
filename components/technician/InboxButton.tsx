import React, { useState, useEffect } from 'react';
import { supabase } from '../../config';
import { User } from '../../types';
import ChatModal from '../common/ChatModal';

interface InboxButtonProps {
  currentUser: User;
  allUsers: User[];
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const InboxButton: React.FC<InboxButtonProps> = ({ currentUser, allUsers }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatWith, setChatWith] = useState<User | null>(null);
  const [conversations, setConversations] = useState<{ user: User; lastMsg: Message; unread: number }[]>([]);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, read_at, created_at')
        .eq('receiver_id', currentUser.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (!data) return;
      setUnreadCount(data.length);

      // Group by sender
      const bySender: Record<string, Message[]> = {};
      (data as Message[]).forEach(m => {
        if (!bySender[m.sender_id]) bySender[m.sender_id] = [];
        bySender[m.sender_id].push(m);
      });
      const convos = Object.entries(bySender).map(([senderId, msgs]) => {
        const user = allUsers.find(u => u.id === senderId);
        if (!user) return null;
        return { user, lastMsg: msgs[0], unread: msgs.length };
      }).filter(Boolean) as { user: User; lastMsg: Message; unread: number }[];
      setConversations(convos);
    };

    fetchUnread();

    const channel = supabase
      .channel(`inbox_${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id, allUsers]);

  if (chatWith) {
    return <ChatModal currentUser={currentUser} otherUser={chatWith} onClose={() => { setChatWith(null); setShowInbox(false); }} />;
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setShowInbox(v => !v)}
        className="relative p-2 rounded-xl text-brand-light hover:text-brand-highlight hover:bg-brand-secondary transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Inbox dropdown */}
      {showInbox && (
        <div className="absolute top-16 right-4 z-40 w-80 bg-white rounded-3xl shadow-2xl border border-brand-accent overflow-hidden animate-fadeIn">
          <div className="px-5 py-4 border-b border-brand-accent">
            <h3 className="font-black text-brand-highlight text-sm">Mensajes</h3>
          </div>
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-brand-light text-sm">Sin mensajes nuevos</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.user.id}
                onClick={() => { setChatWith(conv.user); setShowInbox(false); }}
                className="flex items-center gap-3 w-full px-5 py-4 hover:bg-brand-secondary/50 transition-colors border-b border-brand-accent/50 last:border-0"
              >
                <div className="relative flex-shrink-0">
                  <img src={conv.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center">{conv.unread}</span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-black text-sm text-brand-highlight truncate">{conv.user.name}</p>
                  <p className="text-xs text-brand-light truncate">{conv.lastMsg.content}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default InboxButton;
