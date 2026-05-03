import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldAlert, MessageCircle } from 'lucide-react';

interface SupportChatProps {
  onClose: () => void;
  isAdmin: boolean;
  targetUserId?: string; // For Admin: which user to talk to
  t: any;
  lang: string;
}

export default function SupportChat({ onClose, isAdmin, targetUserId, t, lang }: SupportChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';
  
  const fetchMessages = async () => {
    const url = isAdmin && targetUserId 
      ? `http://localhost:3000/api/admin/support/messages/${targetUserId}`
      : `http://localhost:3000/api/services/support/messages`;
      
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) setMessages(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const url = isAdmin && targetUserId
      ? `http://localhost:3000/api/admin/support/messages/${targetUserId}`
      : `http://localhost:3000/api/services/support/messages`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setContent('');
        fetchMessages();
      }
    } catch (e) {}
  };

  return (
    <div className="chat-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(12px)'
    }}>
      <div className="chat-modal-content" style={{
        background: 'var(--bg-card)', borderRadius: '24px', width: '480px', maxWidth: '100%', height: '85vh', maxHeight: '700px',
        display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)', position: 'relative'
      }}>
        
        {/* HEADER */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.03)',
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-md)' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Support Center</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                {isAdmin ? `Chat avec Utilisateur` : `Assistance en direct`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: '0.6rem', borderRadius: '50%', display: 'flex', transition: 'var(--transition)' }}>
            <X size={20}/>
          </button>
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: 'auto', marginBottom: 'auto', padding: '2rem' }}>
              <MessageCircle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>{isRTL ? 'ابدأ المحادثة مع الدعم الفني' : 'Démarrer la discussion avec le support'}</p>
            </div>
          )}
          {messages.map(m => {
            const isMe = isAdmin ? m.isAdmin : !m.isAdmin;
            return (
              <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                  color: 'white', 
                  padding: '0.8rem 1.25rem', 
                  borderRadius: '18px',
                  borderBottomRightRadius: isMe ? '4px' : '18px', 
                  borderBottomLeftRadius: !isMe ? '4px' : '18px',
                  fontSize: '0.92rem', 
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  textAlign: isRTL ? 'right' : 'left',
                  boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'none'
                }}>
                  {m.content}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', marginTop: '0.4rem', textAlign: isMe ? 'right' : 'left', fontWeight: '600' }}>
                  {new Date(m.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <form onSubmit={sendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input 
            type="text" 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder={isRTL ? "اكتب رسالة..." : "Tapez votre message..."} 
            style={{ 
              flex: 1, 
              padding: '0.8rem 1.25rem', 
              borderRadius: '14px', 
              border: '1px solid var(--border)', 
              background: 'rgba(255,255,255,0.03)', 
              color: 'white', 
              fontSize: '0.95rem',
              textAlign: isRTL ? 'right' : 'left'
            }}
          />
          <button type="submit" disabled={!content.trim()} className="btn btn-primary" style={{ padding: '0 1.25rem', borderRadius: '14px' }}>
            <Send size={20} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .chat-modal-content {
            width: 100% !important;
            height: 100% !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
