import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

export default function CheckAmulet() {
  const { user, token } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const headers = { Authorization: `Bearer ${token}` };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t('check.error_not_image')); return; }
    if (file.size > 15 * 1024 * 1024) { setError(t('check.error_too_large')); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { setError(t('check.error_no_image')); return; }
    setSending(true);
    setError('');
    const data = new FormData();
    data.append('image', image);
    if (note.trim()) data.append('note', note.trim());
    try {
      await axios.post('/api/chat/check-amulet', data, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t('common.loading'));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="text-6xl opacity-30">🔍</div>
        <p className="font-serif text-2xl text-cream">{t('check.login_required')}</p>
        <p className="text-cream-muted text-sm">{t('check.login_desc')}</p>
        <Link to="/login" className="btn-gold px-10 py-3">{t('nav.login')}</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: 'rgba(212,175,55,0.12)',
            border: '2px solid rgba(212,175,55,0.4)',
            boxShadow: '0 0 40px rgba(212,175,55,0.2)',
          }}
        >
          ✓
        </div>
        <div>
          <p className="font-serif text-3xl text-gold mb-2">{t('check.success_title')}</p>
          <p className="text-cream-muted text-sm max-w-sm">{t('check.success_desc')}</p>
        </div>
        <div className="gold-divider-flow w-24" />
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => navigate('/chat')}
            className="btn-gold px-8 py-3"
          >
            💬 {t('check.go_chat')}
          </button>
          <button
            onClick={() => { setSuccess(false); setImage(null); setPreview(null); setNote(''); }}
            className="btn-outline-gold px-8 py-3"
          >
            {t('check.send_another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-gold/50 text-xs tracking-[0.5em] uppercase mb-3">✦ {t('check.badge')} ✦</p>
        <h1 className="font-serif text-4xl text-cream mb-2">{t('check.title')}</h1>
        <p className="text-cream-muted text-sm leading-relaxed max-w-md mx-auto">
          {t('check.subtitle')}
          <br />{t('check.subtitle2')}
        </p>
        <div className="gold-divider-flow w-20 mx-auto mt-4" />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Upload area */}
        <div
          ref={null}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="rounded-2xl cursor-pointer transition-all duration-300 mb-5 relative overflow-hidden"
          style={{
            background: dragging
              ? 'rgba(212,175,55,0.1)'
              : preview
              ? 'rgba(12,10,3,0.7)'
              : 'rgba(20,15,5,0.5)',
            border: dragging
              ? '2px dashed rgba(212,175,55,0.7)'
              : preview
              ? '1px solid rgba(212,175,55,0.3)'
              : '2px dashed rgba(212,175,55,0.25)',
            backdropFilter: 'blur(12px)',
            minHeight: preview ? 'auto' : '240px',
          }}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="preview"
                className="w-full max-h-[420px] object-contain rounded-2xl"
              />
              {/* Change overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                <span className="text-cream text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                  {t('check.change_image')}
                </span>
              </div>
              {/* Filename badge */}
              <div
                className="absolute bottom-3 left-3 text-xs px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'rgba(212,175,55,0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {image?.name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 gap-4 p-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-300"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  transform: dragging ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                📷
              </div>
              <div className="text-center">
                <p className="text-cream text-sm font-medium mb-1">
                  {dragging ? t('check.upload_drag') : t('check.upload_click')}
                </p>
                <p className="text-cream-muted text-xs">{t('check.upload_hint')}</p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* Note input */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{
            background: 'rgba(20,15,5,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <label className="text-cream-muted text-xs uppercase tracking-widest mb-3 block">
            {t('check.note_label')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('check.note_placeholder')}
            rows={3}
            className="w-full bg-transparent text-cream text-sm placeholder-cream-muted/50 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-sm text-red-300"
            style={{ background: 'rgba(180,30,30,0.2)', border: '1px solid rgba(200,50,50,0.3)' }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={sending || !image}
          className="w-full btn-gold py-4 text-base font-semibold disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {sending ? (
            <>
              <span className="animate-pulse">{t('check.sending')}</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>{t('check.submit')}</span>
            </>
          )}
        </button>

        <p className="text-center text-cream-muted text-xs mt-4 leading-relaxed">
          {t('check.disclaimer')}
        </p>
      </form>
    </div>
  );
}
