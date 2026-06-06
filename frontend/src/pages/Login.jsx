import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

export default function Login() {
  const { login, user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate(user.role === 'admin' ? '/admin' : '/'); }, [user, navigate]);

  const handleChange = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await login(form.username, form.password);
      navigate(res.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-1/4 left-1/4 text-[200px] text-gold select-none">☸</div>
        <div className="absolute bottom-1/4 right-1/4 text-[150px] text-gold select-none">☸</div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-charcoal border border-charcoal-light rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-b from-charcoal-light to-charcoal px-8 pt-10 pb-6 text-center border-b border-gold/20">
            <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
              <span className="text-gold text-3xl">☸</span>
            </div>
            <h1 className="font-serif text-2xl text-cream">{t('auth.login_title')}</h1>
            <p className="text-cream-muted text-sm mt-1">{t('appName')}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}
            <div>
              <label className="label">{t('auth.username')}</label>
              <input id="username" name="username" type="text" required value={form.username} onChange={handleChange} placeholder="username" className="input-field" autoComplete="username" />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-base flex items-center justify-center gap-2">
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </button>
            <p className="text-center text-cream-muted text-sm">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-gold hover:text-gold-light transition-colors">{t('auth.register_link')}</Link>
            </p>
            <div className="text-center">
              <Link to="/" className="text-cream-muted text-sm hover:text-gold transition-colors">{t('auth.back_to_shop')}</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
