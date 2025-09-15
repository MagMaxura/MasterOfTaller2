import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Role, Chat, ChatMessage } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface ChatViewProps {
  currentUser: User;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
    const { users, chats, chatMessages, handleSelectOrCreateChat, handleSendMessage, handleMarkAsRead } = useAppContext();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const contacts = useMemo(() => {
        if (currentUser.role === Role.ADMIN) {
            return users.filter(u => u.role === Role.TECHNICIAN);
        } else {
            return users.filter(u => u.role === Role.ADMIN);
        }
    }, [currentUser, users]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, selectedChat]);

    const handleContactClick = async (contactId: string) => {
        setIsLoading(true);
        const chat = await handleSelectOrCreateChat(contactId);
        setSelectedChat(chat);
        if (chat) {
            await handleMarkAsRead(chat.id);
        }
        setIsLoading(false);
    };

    const handleFormSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && selectedChat) {
            await handleSendMessage(selectedChat.id, newMessage);
            setNewMessage('');
        }
    };
    
    const selectedChatMessages = useMemo(() => {
        if (!selectedChat) return [];
        return chatMessages.filter(m => m.chat_id === selectedChat.id);
    }, [chatMessages, selectedChat]);
    
    const getChatForContact = (contactId: string): Chat | undefined => {
        return chats.find(c => 
            (c.participant_1 === currentUser.id && c.participant_2 === contactId) ||
            (c.participant_1 === contactId && c.participant_2 === currentUser.id)
        );
    };

    return (
        <div className="flex h-[calc(100vh-160px)] bg-brand-secondary rounded-lg shadow-2xl overflow-hidden">
            {/* Contact List */}
            <div className="w-1/3 border-r border-brand-accent flex flex-col">
                <div className="p-4 border-b border-brand-accent">
                    <h2 className="text-xl font-bold">Conversaciones</h2>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {contacts.map(contact => {
                         const chat = getChatForContact(contact.id);
                         const unreadCount = chat ? chatMessages.filter(m => m.chat_id === chat.id && !m.is_read && m.sender_id !== currentUser.id).length : 0;

                         return (
                            <div
                                key={contact.id}
                                onClick={() => handleContactClick(contact.id)}
                                className={`flex items-center p-4 cursor-pointer hover:bg-brand-accent/50 ${selectedChat && [selectedChat.participant_1, selectedChat.participant_2].includes(contact.id) ? 'bg-brand-blue/30' : ''}`}
                            >
                                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full mr-4" />
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{contact.name}</h3>
                                </div>
                                {unreadCount > 0 && <span className="bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Message Area */}
            <div className="w-2/3 flex flex-col">
                {isLoading && (
                     <div className="flex-grow flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
                     </div>
                )}
                {!isLoading && selectedChat ? (
                    <>
                        {/* Message History */}
                        <div className="flex-grow p-6 overflow-y-auto">
                           <div className="space-y-4">
                               {selectedChatMessages.map(msg => (
                                   <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                       <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-brand-blue text-white' : 'bg-brand-accent'}`}>
                                           <p>{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.sender_id === currentUser.id ? 'text-blue-200' : 'text-brand-light'} text-right`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                       </div>
                                   </div>
                               ))}
                               <div ref={messagesEndRef} />
                           </div>
                        </div>
                        {/* Message Input */}
                        <div className="p-4 border-t border-brand-accent">
                            <form onSubmit={handleFormSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-grow bg-brand-primary p-3 rounded-lg border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                />
                                <button type="submit" className="bg-brand-blue font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Enviar</button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center">
                        <div>
                            <h2 className="text-2xl font-bold">Bienvenido al Chat</h2>
                            <p className="text-brand-light mt-2">Selecciona una conversación para empezar a chatear.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatView;