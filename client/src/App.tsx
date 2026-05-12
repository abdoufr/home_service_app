import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Settings, UserCheck, Briefcase,
  Users, ClipboardList, LogOut, Bell, Zap,
  CheckCircle, Clock, XCircle, Tag, Trash2, Plus, Globe, Moon, Sun, ShieldAlert, Menu, X, Home, Search, ShoppingBag, LayoutDashboard
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

function Sidebar({ user, t, onLogout }: { user: any, t: any, onLogout: () => void }) {
  const location = useLocation();
  if (!user) return null;

  const links = [
    { to: "/", icon: <Home size={22} />, label: t.home },
    ...(user.role === 'ADMIN' ? [{ to: "/admin", icon: <ShieldAlert size={22} />, label: t.admin }] : []),
    ...(user.role === 'WORKER' ? [{ to: "/worker", icon: <Briefcase size={22} />, label: t.worker }] : []),
    ...(user.role === 'CLIENT' ? [{ to: "/services", icon: <Search size={22} />, label: t.explorer }] : []),
  ];

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="icon"><ShieldCheck size={24} /></div>
        Home<span>Serv</span>
      </Link>
      
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={onLogout} style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}>
          <LogOut size={22} />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}

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
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(userData => {
        setUser(userData);
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/services/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(prev => {
            const newNotifs = data.filter((n: any) => !n.isRead && !prev.find(p => p.id === n.id));
            if (newNotifs.length > 0 && prev.length > 0) {
              const latest = newNotifs[0];
              const title = latest.type === 'MESSAGE' ? t.newMsg : latest.type === 'NEW_ORDER' ? t.newOrder : t.orderAccepted;
              setShowToast({ title, content: latest.content });
              setTimeout(() => setShowToast(null), 5000);
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, { body: latest.content, icon: '/favicon.ico' });
              }
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
      await fetch(`/api/services/notifications/${n.id}/read`, { method: 'PATCH', credentials: 'include' });
      setNotifications(notifications.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    setShowNotifications(false);
    if (n.type === 'MESSAGE' && n.linkId) {
      if (n.linkId === 'support') setShowSupportChat(true);
      else window.location.href = `${user?.role === 'WORKER' ? '/worker' : '/services'}?chat=${n.linkId}`;
    }
  };

  const handleLogout = async () => {
     // Perform actual logout logic if needed, then:
     setUser(null);
  };

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <Zap size={48} color="#6366f1" className="spin" />
    </div>;
  }

  return (
    <Router>
      <div className="aurora-bg"></div>
      
      {user && <Sidebar user={user} t={t} onLogout={handleLogout} />}

      <main className="main-content animate-slide-up">
        <header className="page-header">
           <div className="page-title">
             <h1>{user ? `Bienvenue, ${user.name}` : 'HomeServ'}</h1>
           </div>
           
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             {user && (
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-outline" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }} onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="dropdown-menu glass-panel animate-fade-in" style={{ position: 'absolute', top: '60px', right: 0, display: 'block' }}>
                      <div className="dropdown-header">{t.notifications}</div>
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
                </div>
             )}
             
             <button className="btn btn-outline" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }} onClick={() => setShowSettings(!showSettings)}>
               <Settings size={20} />
             </button>
             
             {showSettings && (
                <div className="dropdown-menu glass-panel animate-fade-in" style={{ position: 'absolute', top: '150px', right: '3rem', width: '280px', display: 'block', zIndex: 1200 }}>
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
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { setShowSupportChat(true); setShowSettings(false); }}>
                      <ShieldAlert size={16} /> {t.contactAdmin}
                    </button>
                  </div>
                </div>
             )}
           </div>
        </header>

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
        <div className="toast animate-fade-in" style={{ bottom: '100px' }}>
          <Zap size={20} color="#6366f1" />
          <div>
            <strong>{showToast.title}</strong>
            <p>{showToast.content}</p>
          </div>
          <X size={16} onClick={() => setShowToast(null)} style={{ cursor: 'pointer' }} />
        </div>
      )}

      <style>{`
        .notification-dot {
          position: absolute; top: -4px; right: -4px; background: var(--danger);
          color: white; font-size: 0.65rem; font-weight: 800; min-width: 20px; height: 20px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-root);
        }
        .dropdown-menu { width: 320px; z-index: 1000; display: none; }
        .dropdown-header { padding: 1.25rem; font-weight: 800; border-bottom: 1px solid var(--border); }
        .notification-item { padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; }
        .notification-item:hover { background: rgba(255,255,255,0.05); }
        .notification-item p { font-size: 0.85rem; margin-bottom: 0.2rem; }
        .notification-item span { font-size: 0.7rem; color: var(--text-sub); }
        .toast { position: fixed; right: 2rem; background: var(--bg-surface); border: 1px solid var(--primary); padding: 1rem; border-radius: 12px; display: flex; gap: 1rem; z-index: 2000; box-shadow: var(--shadow-xl); }
      `}</style>
    </Router>
  );
}

export default App;
