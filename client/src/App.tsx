import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Settings, UserCheck, Briefcase,
  Users, ClipboardList, LogOut, Bell, Zap,
  CheckCircle, Clock, XCircle, Tag, Trash2, Plus, Globe, Moon, Sun, ShieldAlert, Menu, X, Home, Search, ShoppingBag
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkerDashboard from './pages/WorkerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupportChat from './components/SupportChat';

const translations: any = {
  fr: {
    home: "Accueil", admin: "Admin", explorer: "Explorer", worker: "Mes Services",
    login: "Connexion", logout: "Déconnexion", settings: "Paramètres",
    theme: "Thème", language: "Langue", light: "Clair", dark: "Sombre",
    overview: "Vue d'ensemble", users: "Utilisateurs", categories: "Catégories",
    notifications: "Notifications", noNotifs: "Aucune notification",
    loading: "Chargement...", clientSpace: "Espace Client", workerSpace: "Espace Prestataire",
    totalUsers: "Utilisateurs", activeServices: "Services actifs", orders: "Commandes", pending: "En attente",
    allCategories: "Toutes les catégories", noServices: "Aucun service trouvé",
    provider: "Prestataire", order: "Commander", history: "Commandes",
    service: "Service", date: "Date", status: "Statut", actions: "Actions",
    chat: "Discuter", viewChat: "Voir Chat", cancel: "Annuler",
    addService: "Ajouter un service", title: "Titre", price: "Prix", description: "Description",
    create: "Créer", myActiveServices: "Mes Services", noActiveServices: "Vous n'avez pas encore de service",
    approve: "Approuver", reject: "Refuser", auto: "AUTO", manual: "MANUEL",
    stats: "Stats", search: "Rechercher...",
    newMsg: "Nouveau Message", newOrder: "Nouvelle Commande", orderAccepted: "Commande Acceptée",
    contactAdmin: "Aide & Support"
  },
  ar: {
    home: "الرئيسية", admin: "الإدارة", explorer: "استكشاف", worker: "خدماتي",
    login: "تسجيل الدخول", logout: "تسجيل الخروج", settings: "الإعدادات",
    theme: "المظهر", language: "اللغة", light: "فاتح", dark: "داكن",
    overview: "نظرة عامة", users: "المستخدمين", categories: "الأصناف",
    notifications: "التنبيهات", noNotifs: "لا توجد تنبيهات",
    loading: "جاري التحميل...", clientSpace: "مساحة العميل", workerSpace: "مساحة المزود",
    totalUsers: "المستخدمين", activeServices: "الخدمات النشطة", orders: "الطلبات", pending: "في الانتظار",
    allCategories: "كل الأصناف", noServices: "لم يتم العثور على خدمات",
    provider: "المزود", order: "طلب", history: "الطلبات",
    service: "الخدمة", date: "التاريخ", status: "الحالة", actions: "الإجراءات",
    chat: "دردشة", viewChat: "عرض الدردشة", cancel: "إلغاء",
    addService: "إضافة خدمة", title: "العنوان", price: "السعر", description: "الوصف",
    create: "إنشاء", myActiveServices: "خدماتي النشطة", noActiveServices: "ليس لديك خدمات بعد",
    approve: "تفعيل", reject: "رفض", auto: "تلقائي", manual: "يدوي",
    stats: "إحصائيات", search: "بحث...",
    newMsg: "رسالة جديدة", newOrder: "طلب جديد", orderAccepted: "تم قبول الطلب",
    contactAdmin: "الدعم الفني"
  }
};

function BottomNav({ user, t }: { user: any, t: any }) {
  const location = useLocation();
  if (!user) return null;

  const items = [
    { to: "/", icon: <Home />, label: t.home },
    ...(user.role === 'ADMIN' ? [{ to: "/admin", icon: <ShieldAlert />, label: t.admin }] : []),
    ...(user.role === 'WORKER' ? [{ to: "/worker", icon: <Briefcase />, label: t.worker }] : []),
    ...(user.role === 'CLIENT' ? [{ to: "/services", icon: <Search />, label: t.explorer }] : []),
  ];

  return (
    <div className="mobile-nav">
      {items.map((item) => (
        <Link 
          key={item.to} 
          to={item.to} 
          className={`mobile-nav-item ${location.pathname === item.to ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<{ id: string; role: string; name: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showToast, setShowToast] = useState<{ title: string, content: string } | null>(null);

  const t = translations[lang] || translations.fr;

  React.useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(userData => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/services/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(prev => {
            const newNotifs = data.filter((n: any) => !n.isRead && !prev.find(p => p.id === n.id));
            if (newNotifs.length > 0 && prev.length > 0) {
              const latest = newNotifs[0];
              const title = latest.type === 'MESSAGE' ? t.newMsg : latest.type === 'NEW_ORDER' ? t.newOrder : t.orderAccepted;
              setShowToast({ title, content: latest.content });
              setTimeout(() => setShowToast(null), 5000);
            }
            return data;
          });
        }
      } catch (e) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user, t]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await fetch(`http://localhost:3000/api/services/notifications/${n.id}/read`, { method: 'PATCH', credentials: 'include' });
      setNotifications(notifications.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    setShowNotifications(false);
    if (n.type === 'MESSAGE' && n.linkId) {
      if (n.linkId === 'support') setShowSupportChat(true);
      else window.location.href = `${user?.role === 'WORKER' ? '/worker' : '/services'}?chat=${n.linkId}`;
    }
  };

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-root)' }}>
      <Zap size={48} color="var(--primary)" className="spin" />
    </div>;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">
              <ShieldCheck size={26} color="white" />
            </div>
            Home<span>Serv</span>
          </Link>

          <div className="nav-links">
            <Link to="/">{t.home}</Link>
            {user?.role === 'ADMIN' && <Link to="/admin">{t.admin}</Link>}
            {user?.role === 'WORKER' && <Link to="/worker">{t.worker}</Link>}
            {user?.role === 'CLIENT' && <Link to="/services">{t.explorer}</Link>}
          </div>

          <div className="nav-actions">
            {user && (
              <button 
                className="btn btn-outline" 
                style={{ border: 'none', padding: '0.6rem', position: 'relative' }}
                onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
              >
                <Bell size={22} color={unreadCount > 0 ? 'var(--primary-light)' : 'var(--text-muted)'} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
              </button>
            )}

            <button 
              className="btn btn-outline" 
              style={{ border: 'none', padding: '0.6rem' }}
              onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
            >
              <Settings size={22} color="var(--text-muted)" />
            </button>

            {user ? (
              <div className="user-profile-mini">
                <div className="avatar-mini">{user.name[0]}</div>
                <button className="btn btn-danger btn-sm" onClick={() => setUser(null)} style={{ padding: '0.5rem', border: 'none' }}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">{t.login}</Link>
            )}
          </div>
        </nav>

        {/* Dropdowns */}
        {showNotifications && (
          <div className="dropdown-menu glass-panel animate-fade-in">
            <div className="dropdown-header">
              {t.notifications}
              <X size={18} className="close-icon" onClick={() => setShowNotifications(false)} />
            </div>
            <div className="dropdown-content">
              {notifications.length === 0 && <div className="empty-state">{t.noNotifs}</div>}
              {notifications.map(n => (
                <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => handleNotificationClick(n)}>
                  <p>{n.content}</p>
                  <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="dropdown-menu glass-panel animate-fade-in" style={{ width: '280px' }}>
            <div className="dropdown-header">{t.settings}</div>
            <div className="dropdown-content" style={{ padding: '1.5rem' }}>
              <div className="setting-row">
                <label>{t.theme}</label>
                <div className="toggle-group">
                  <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={14} /> {t.light}</button>
                  <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={14} /> {t.dark}</button>
                </div>
              </div>
              <div className="setting-row">
                <label>{t.language}</label>
                <div className="lang-group">
                  <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
                  <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>AR</button>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => { setShowSupportChat(true); setShowSettings(false); }}>
                  <ShieldAlert size={16} /> {t.contactAdmin}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="animate-fade-in">
          <Routes>
            <Route path="/" element={
              user
                ? user.role === 'ADMIN' ? <Navigate to="/admin" /> : user.role === 'WORKER' ? <Navigate to="/worker" /> : <Navigate to="/services" />
                : <Navigate to="/login" />
            } />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={(u) => setUser(u)} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage onLogin={(u) => setUser(u)} />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminDashboard t={t} lang={lang} /> : <Navigate to="/login" />} />
            <Route path="/worker" element={user?.role === 'WORKER' ? <WorkerDashboard userId={user.id} t={t} lang={lang} /> : <Navigate to="/login" />} />
            <Route path="/services" element={user?.role === 'CLIENT' ? <ClientDashboard userId={user.id} t={t} lang={lang} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        
        <BottomNav user={user} t={t} />
        {showSupportChat && <SupportChat isAdmin={false} onClose={() => setShowSupportChat(false)} t={t} lang={lang} />}

        {/* Toast */}
        {showToast && (
          <div className="toast animate-fade-in">
            <Zap size={20} color="var(--primary-light)" />
            <div>
              <strong>{showToast.title}</strong>
              <p>{showToast.content}</p>
            </div>
            <X size={16} onClick={() => setShowToast(null)} style={{ cursor: 'pointer' }} />
          </div>
        )}
      </div>

      <style>{`
        .notification-dot {
          position: absolute; top: 4px; right: 4px; background: var(--danger);
          color: white; font-size: 0.65rem; font-weight: 800; min-width: 18px; height: 18px;
          border-radius: 20px; display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-surface);
        }
        .user-profile-mini { display: flex; align-items: center; gap: 0.75rem; }
        .avatar-mini {
          width: 36px; height: 36px; border-radius: 50%; background: var(--primary);
          display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;
        }
        .dropdown-menu {
          position: fixed; top: 90px; right: 2rem; width: 340px; max-width: 90vw; z-index: 1100;
          padding: 0; overflow: hidden; border: 1px solid var(--glass-border);
        }
        .dropdown-header {
          padding: 1.25rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border);
          font-weight: 800; display: flex; justify-content: space-between; align-items: center;
        }
        .dropdown-content { max-height: 400px; overflow-y: auto; }
        .notification-item {
          padding: 1.25rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s;
        }
        .notification-item:hover { background: rgba(255,255,255,0.05); }
        .notification-item.unread { background: rgba(16, 185, 129, 0.04); }
        .notification-item p { font-size: 0.9rem; margin-bottom: 0.4rem; color: var(--text-main); }
        .notification-item span { font-size: 0.75rem; color: var(--text-sub); }
        .empty-state { padding: 3rem; text-align: center; color: var(--text-sub); font-size: 0.9rem; }
        .setting-row { margin-bottom: 1.25rem; }
        .setting-row label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-sub); margin-bottom: 0.75rem; text-transform: uppercase; }
        .toggle-group, .lang-group { display: flex; background: rgba(255,255,255,0.05); padding: 0.3rem; border-radius: 12px; gap: 0.3rem; }
        .toggle-group button, .lang-group button {
          flex: 1; border: none; background: transparent; color: var(--text-muted); padding: 0.5rem;
          border-radius: 9px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .toggle-group button.active, .lang-group button.active { background: var(--primary); color: white; box-shadow: 0 4px 12px var(--primary-glow); }
        .toast {
          position: fixed; bottom: 100px; right: 2rem; left: 2rem; max-width: 400px; margin: 0 auto;
          background: var(--bg-surface); border: 1px solid var(--primary); padding: 1.25rem;
          border-radius: var(--radius-lg); display: flex; align-items: center; gap: 1rem;
          box-shadow: var(--shadow-lg); z-index: 2000;
        }
        .toast div { flex: 1; }
        .toast strong { display: block; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .toast p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
        
        @media (max-width: 768px) {
          .dropdown-menu { top: 80px; right: 1rem; left: 1rem; width: auto; }
          .toast { bottom: 90px; }
        }
      `}</style>
    </Router>
  );
}

export default App;
