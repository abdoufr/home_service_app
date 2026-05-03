import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2 } from 'lucide-react';

export default function ChatModal({ orderId, onClose, currentUserId, orderStatus, onDelete, t, lang, recipientName }: { orderId: string, onClose: () => void, currentUserId: string, orderStatus: string, onDelete?: () => void, t: any, lang: string, recipientName?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';

  const fetchMessages = async () => {
    const res = await fetch(`http://localhost:3000/api/services/orders/${orderId}/messages`, { credentials: 'include' });
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch(`http://localhost:3000/api/services/orders/${orderId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages([...messages, newMsg]);
      setContent('');
    }
  };

  const deleteDiscussion = async () => {
    const confirmMsg = isRTL ? 'هل تريد حذف المحادثة من جانبك؟ سيظل الطرف الآخر قادراً على رؤيتها.' : 'Supprimer la discussion de votre côté ? L\'autre personne pourra toujours la voir.';
    if (!window.confirm(confirmMsg)) return;
    const res = await fetch(`http://localhost:3000/api/services/orders/${orderId}/messages`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      setMessages([]);
      if (onDelete) onDelete();
    }
  };

  const isClosed = orderStatus === 'CANCELLED' || orderStatus === 'COMPLETED';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '15px', width: '440px', maxWidth: '95%', height: '80vh', maxHeight: '600px',
        display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }} className="animate-fade-in">
        
        {/* HEADER */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{recipientName || t.chat}</h3>
            {isClosed && <span className="badge badge-manual" style={{ fontSize: '0.65rem' }}>{isRTL ? 'مغلق' : 'Clôturée'}</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <button onClick={deleteDiscussion} title={isRTL ? 'حذف المحادثة' : "Supprimer la discussion"} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={18}/>
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto' }}>{isRTL ? 'لا توجد رسائل. كن أول من يرسل!' : 'Aucun message. Envoyez le premier !'}</div>}
          {messages.map(m => {
            const isMe = m.senderId === currentUserId;
            return (
              <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {!isMe && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textAlign: isRTL ? 'right' : 'left' }}>{m.sender.name}</div>}
                <div style={{
                  background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: 'white', padding: '0.6rem 1rem', borderRadius: '15px',
                  borderBottomRightRadius: isMe ? '2px' : '15px', borderBottomLeftRadius: !isMe ? '2px' : '15px',
                  fontSize: '0.9rem', wordBreak: 'break-word', textAlign: isRTL ? 'right' : 'left'
                }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        {!isClosed ? (
          <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <input 
              type="text" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder={isRTL ? "اكتب رسالة..." : "Écrivez un message..."} 
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '20px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white', textAlign: isRTL ? 'right' : 'left' }}
            />
            <button type="submit" disabled={!content.trim()} style={{ background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: content.trim() ? 'pointer' : 'not-allowed', opacity: content.trim() ? 1 : 0.5 }}>
              <Send size={18} style={{ transform: isRTL ? 'rotate(180deg)' : 'translateX(-1px)' }} />
            </button>
          </form>
        ) : (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isRTL ? "المحادثة مغلقة لأن الطلب مكتمل أو ملغي" : "La discussion est clôturée car la commande est terminée ou annulée."}
          </div>
        )}
      </div>
    </div>
  );
}
