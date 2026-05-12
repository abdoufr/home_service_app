import { useState, useEffect } from 'react';
import { ShoppingBag, Briefcase, MessageCircle, Search, Clock, MapPin, Star, Filter, ArrowRight, Trash2, User, Map as MapIcon } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import WorkerMap from '../components/WorkerMap.js';

export default function ClientDashboard({ userId, t, lang }: { userId: string, t: any, lang: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'orders' | 'chat' | 'map'>('explore');
  const [workers, setWorkers] = useState<any[]>([]);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [orderDates, setOrderDates] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chat');
    if (chatId) {
      setActiveChat(chatId);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const fetchAll = async () => {
    try {
      const [srvRes, ordRes, catRes, workRes, meRes] = await Promise.all([
        fetch('/api/services', { credentials: 'include' }),
        fetch('/api/services/orders/client', { credentials: 'include' }),
        fetch('/api/services/categories', { credentials: 'include' }),
        fetch('/api/services/workers', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);
      setServices(srvRes.ok ? await srvRes.json() : []);
      setOrders(ordRes.ok ? await ordRes.json() : []);
      setCategories(catRes.ok ? await catRes.json() : []);
      setWorkers(workRes.ok ? await workRes.json() : []);
      setClientProfile(meRes.ok ? await meRes.json() : null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrder = async (serviceId: string) => {
    const scheduledAt = orderDates[serviceId];
    if (!scheduledAt) {
      alert(lang === 'ar' ? "يرجى اختيار موعد." : "Veuillez choisir une date.");
      return;
    }

    const res = await fetch('/api/services/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ serviceId, scheduledAt })
    });
    if (res.ok) {
      setMsg(lang === 'ar' ? '✅ تم إرسال الطلب بنجاح!' : '✅ Commande envoyée avec succès !');
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm(lang === 'ar' ? "هل أنت متأكد؟" : "Annuler?")) return;
    const res = await fetch(`/api/services/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'CANCELLED' })
    });
    if (res.ok) fetchAll();
  };

  if (loading) return (
    <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Clock className="spin" size={40} color="var(--primary)" />
    </div>
  );

  const filteredServices = services.filter(s => {
    const matchCat = selectedCat ? s.categoryId === selectedCat : true;
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.worker?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeOrder = orders.find(o => o.id === activeChat);

  // Filter orders that have chats or are active
  const chatOrders = orders.filter(o =>
    !o.clientChatClearedAt && (o.status === 'ACCEPTED' || o.status === 'COMPLETED' || o.status === 'CANCELLED')
  );

  return (
    <div className="app-container animate-fade-in">
      {activeChat && <ChatModal
        orderId={activeChat}
        orderStatus={activeOrder?.status || 'PENDING'}
        currentUserId={userId}
        recipientName={activeOrder?.service?.worker?.name || 'Prestataire'}
        onClose={() => setActiveChat(null)}
        onDelete={fetchAll}
        t={t}
        lang={lang}
      />}

      <div className="tab-switcher glass-panel" style={{ marginBottom: '3rem', padding: '0.4rem', borderRadius: '100px', width: 'fit-content' }}>
        <button className={`btn ${activeTab === 'explore' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('explore')} style={{ padding: '0.6rem 2rem' }}>
          {t.explorer}
        </button>
        <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('orders')} style={{ padding: '0.6rem 2rem' }}>
          {t.history}
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('chat')} style={{ padding: '0.6rem 2rem' }}>
          {t.chat}
        </button>
        <button className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('map')} style={{ padding: '0.6rem 2rem' }}>
          <MapIcon size={18} /> {lang === 'ar' ? 'الخريطة' : 'Carte'}
        </button>
      </div>

      {msg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{msg}</div>}

      {activeTab === 'explore' && (
        <div className="animate-slide-up">
          <div className="search-section" style={{ marginBottom: '3rem' }}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Search className="search-icon" size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
              <input
                type="text"
                style={{ paddingLeft: '4rem', borderRadius: '100px', height: '60px', background: 'var(--bg-card)' }}
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="categories-pill-scroll" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              <button className={`pill ${selectedCat === '' ? 'active' : ''}`} onClick={() => setSelectedCat('')} style={pillStyle(selectedCat === '')}>
                {t.allCategories}
              </button>
              {categories.map(c => (
                <button key={c.id} className={`pill ${selectedCat === c.id ? 'active' : ''}`} onClick={() => setSelectedCat(c.id)} style={pillStyle(selectedCat === c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bento-grid">
            {filteredServices.length === 0 && (
              <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '5rem' }}>
                <Search size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p>{t.noServices}</p>
              </div>
            )}
            {filteredServices.map(s => (
              <div key={s.id} className="bento-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>{s.category?.name || 'Service'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '800' }}>
                    <Star size={14} fill="var(--accent)" color="var(--accent)" /> 4.9
                  </div>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', minHeight: '3em' }}>{s.description}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <div className="avatar-small" style={{ background: 'var(--primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{s.worker?.name?.[0] || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block' }}>{s.worker?.name || 'Inconnu'}</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary-light)' }}>{s.price} <small style={{ fontSize: '0.6rem' }}>DZD</small></div>
                  </div>
                </div>

                <div className="card-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                    <Clock size={16} color="var(--text-sub)" />
                    <input
                      type="datetime-local"
                      style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.85rem' }}
                      value={orderDates[s.id] || ''}
                      onChange={(e) => setOrderDates({ ...orderDates, [s.id]: e.target.value })}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleOrder(s.id)}>
                    {t.order} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="deck-table-wrap animate-slide-up">
          <table className="deck-table">
            <thead>
              <tr>
                <th>{t.service}</th>
                <th>{t.provider}</th>
                <th>{t.date}</th>
                <th>{t.price}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-sub)' }}>{t.noServices}</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td data-label={t.service}>
                    <div style={{ fontWeight: '800' }}>{o.service.title}</div>
                    <small className="badge-auto" style={{ fontSize: '0.65rem' }}>{o.service.category.name}</small>
                  </td>
                  <td data-label={t.provider}>{o.service.worker.name}</td>
                  <td data-label={t.date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Clock size={14} />
                      {o.scheduledAt ? new Date(o.scheduledAt).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </div>
                  </td>
                  <td data-label={t.price} style={{ fontWeight: '900', color: 'var(--primary-light)' }}>{o.service.price} DZD</td>
                  <td data-label={t.status}>
                    <span className={`badge ${o.status === 'PENDING' ? 'badge-manual' : o.status === 'ACCEPTED' ? 'badge-auto' : o.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td data-label={t.actions}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {((o.status === 'ACCEPTED') || ((o.status === 'CANCELLED' || o.status === 'COMPLETED') && !o.clientChatClearedAt)) && (
                        <button className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveChat(o.id)}>
                          <MessageCircle size={16} /> {o.status === 'ACCEPTED' ? t.chat : t.viewChat}
                        </button>
                      )}
                      {(o.status === 'PENDING' || o.status === 'ACCEPTED') && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleCancel(o.id)} style={{ border: 'none', color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="animate-slide-up">
          <div className="bento-card" style={{ gridColumn: 'span 12', padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', fontSize: '1.8rem' }}>
              {lang === 'ar' ? 'العاملين القريبين منك' : 'Prestataires à proximité'}
            </h2>
            <WorkerMap
              workers={workers}
              clientLocation={clientProfile?.latitude ? { lat: clientProfile.latitude, lng: clientProfile.longitude } : null}
            />
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bento-grid animate-slide-up">
          {chatOrders.length === 0 && (
            <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '5rem' }}>
              <MessageCircle size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p>{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'Aucune conversation active'}</p>
            </div>
          )}
          {chatOrders.map(o => (
            <div key={o.id} className="bento-card" onClick={() => setActiveChat(o.id)} style={{ cursor: 'pointer', gridColumn: 'span 4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="avatar-small" style={{ width: '56px', height: '56px', fontSize: '1.4rem', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{o.service?.worker?.name?.[0] || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '1.2rem' }}>{o.service?.worker?.name || 'Prestataire'}</strong>
                    <span className={`badge ${o.status === 'ACCEPTED' ? 'badge-auto' : 'badge-manual'}`} style={{ fontSize: '0.6rem' }}>{o.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{o.service?.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pillStyle = (active: boolean) => ({
  whiteSpace: 'nowrap' as const,
  padding: '0.7rem 1.8rem',
  borderRadius: '100px',
  border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
  background: active ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
  color: active ? 'white' : 'var(--text-muted)',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: '0.3s',
  boxShadow: active ? '0 10px 20px var(--primary-glow)' : 'none'
});

