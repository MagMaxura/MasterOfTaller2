import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config';
import { User } from '../../types';
import { XIcon } from '../Icons';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface ChatModalProps {
  currentUser: User;
  otherUser: User;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ currentUser, otherUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages between these two users
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel(`chat_${[currentUser.id, otherUser.id].sort().join('_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
        const relevant = (msg.sender_id === currentUser.id && msg.receiver_id === otherUser.id) ||
                         (msg.sender_id === otherUser.id && msg.receiver_id === currentUser.id);
        if (relevant) setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id, otherUser.id]);

  // Mark received messages as read
  useEffect(() => {
    const unread = messages.filter(m => m.receiver_id === currentUser.id && !m.read_at).map(m => m.id);
    if (unread.length === 0) return;
    supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread).then(() => {
      setMessages(prev => prev.map(m => unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
    });
  }, [messages, currentUser.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content: text,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:w-[420px] sm:max-w-full h-[85vh] sm:h-[600px] bg-white sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-brand-highlight border-b border-white/10">
          <div className="relative">
            <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-brand-highlight" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm truncate">{otherUser.name}</p>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{otherUser.role}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50 custom-scrollbar">
          {grouped.map(group => (
            <React.Fragment key={group.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  {group.date}
                </span>
              </div>
              {group.msgs.map(msg => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe
                        ? 'bg-brand-highlight text-white rounded-br-sm'
                        : 'bg-white text-brand-highlight rounded-bl-sm border border-slate-100'
                    }`}>
                      <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] font-semibold ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && (
                          <span className={`text-[10px] ${msg.read_at ? 'text-blue-300' : 'text-white/40'}`}>
                            {msg.read_at ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <span className="text-4xl">💬</span>
              <p className="text-sm font-semibold">Sin mensajes aún</p>
              <p className="text-xs">Enviá el primer mensaje</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-slate-100">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribí un mensaje..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-sm font-semibold text-brand-highlight outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-brand-highlight text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-90">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
