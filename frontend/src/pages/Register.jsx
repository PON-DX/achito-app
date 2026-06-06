import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

export default function Register() {
  const { login, isAdmin, user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm_password: '', email: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  const handleChange = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await import('axios').then(m => m.default.post('/api/auth/register', form));
      const { token, user: u } = res.data;
      // Use AuthContext login equivalent by setting token manually
      localStorage.setItem('amulet_token', token);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-1/4 right-1/4 text-[200px] text-gold select-none">☸</div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-charcoal border border-charcoal-light rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-b from-charcoal-light to-charcoal px-8 pt-8 pb-5 text-center border-b border-gold/20">
            <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-3 shadow-gold">
              <span className="text-gold text-2xl">☸</span>
            </div>
            <h1 className="font-serif text-2xl text-cream">{t('auth.register_title')}</h1>
            <p className="text-cream-muted text-sm mt-1">{t('appName')}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('auth.first_name')}</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} className="input-field" placeholder="ชื่อ" />
              </div>
              <div>
                <label className="label">{t('auth.last_name')}</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} className="input-field" placeholder="นามสกุล" />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.username')} <span className="text-red-400">*</span></label>
              <input name="username" required value={form.username} onChange={handleChange} className="input-field" placeholder="username" />
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="email@example.com" />
            </div>

            <div>
              <label className="label">{t('auth.password')} <span className="text-red-400">*</span></label>
              <input name="password" type="password" required value={form.password} onChange={handleChange} className="input-field" placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>

            <div>
              <label className="label">{t('auth.confirm_password')} <span className="text-red-400">*</span></label>
              <input name="confirm_password" type="password" required value={form.confirm_password} onChange={handleChange} className="input-field" placeholder="ยืนยันรหัสผ่าน" />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3 mt-1 flex items-center justify-center gap-2">
              {loading ? t('auth.registering') : t('auth.sign_up')}
            </button>

            <p className="text-center text-cream-muted text-sm pt-1">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-gold hover:text-gold-light transition-colors">{t('auth.login_link')}</Link>
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
