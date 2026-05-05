import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Briefcase, Users, Shield, MapPin } from 'lucide-react';
import MapPicker from '../components/MapPicker.js';

interface RegisterPageProps {
  onLogin: (user: { id: string; role: string; name: string; email: string }) => void;
}

const ROLES = [
  { value: 'CLIENT', label: 'Client', desc: 'Je cherche des services', icon: <Users size={22} /> },
  { value: 'WORKER', label: 'Prestataire', desc: 'Je propose mes services', icon: <Briefcase size={22} /> },
];

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('CLIENT');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, phone, role, latitude, longitude }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Erreur lors de la création du compte');
        return;
      }

      // Auto-login after registration for clients
      if (role === 'CLIENT') {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onLogin(loginData.user);
          navigate('/services');
          return;
        }
      }

      navigate('/login?registered=true');
    } catch (err) {
      setError('Impossible de se connecter au serveur');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Faible', color: '#f43f5e' };
    if (password.length < 10) return { level: 2, label: 'Moyen', color: '#f59e0b' };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password))
      return { level: 3, label: 'Fort', color: '#10b981' };
    return { level: 2, label: 'Moyen', color: '#f59e0b' };
  };

  const strength = passwordStrength();

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <ShieldCheck size={24} color="var(--primary-light)" />
          <span>Home<b>Serv</b></span>
        </div>

        <div className="auth-form-header">
          <h1>Créer un compte</h1>
          <p>Étape {step} sur 2 — {step === 1 ? 'Choisissez votre rôle' : 'Vos informations'}</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div className="auth-step-indicator">
            <div className={`auth-step ${step >= 1 ? 'active' : ''}`}>
              <span>1</span><p>Votre rôle</p>
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 2 ? 'active' : ''}`}>
              <span>2</span><p>Informations</p>
            </div>
          </div>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="animate-fade-in">
            <button className="btn-google" onClick={handleGoogleLogin} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              S'inscrire avec Google
            </button>

            <div className="auth-divider"><span>ou choisissez votre rôle</span></div>

            <div className="role-grid">
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  className={`role-card ${role === r.value ? 'selected' : ''}`}
                  onClick={() => setRole(r.value)}
                  id={`role-${r.value.toLowerCase()}`}
                >
                  <div className="role-card-icon">{r.icon}</div>
                  <h4>{r.label}</h4>
                  <p>{r.desc}</p>
                  {role === r.value && <div className="role-check">✓</div>}
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
              onClick={() => setStep(2)}
            >
              Continuer <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <div className="animate-fade-in">
            {error && <div className="auth-error"><span>⚠️ {error}</span></div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="reg-name">Nom complet</label>
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Prénom Nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-phone">Numéro de téléphone</label>
                <div className="input-icon-wrap">
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="0555..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email</label>
                <div className="input-icon-wrap">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-password">Mot de passe</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3].map((l) => (
                        <div key={l} className="strength-bar" style={{ background: l <= strength.level ? strength.color : 'var(--border)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
                <div className="input-icon-wrap">
                  <Shield size={16} className="input-icon" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label><MapPin size={16} /> Votre localisation (optionnel)</label>
                <MapPicker onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setStep(1)}
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="auth-switch">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
