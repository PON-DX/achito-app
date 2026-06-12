import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useScrollReveal from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSiteContent } from '../hooks/useSiteContent';
import achito from '../assets/images/achito.png';

const INGREDIENTS = [
  { num: 1,  text: 'ว่าน 108 ชนิด จำนวน 108 บาตร' },
  { num: 2,  text: 'ดินพรายสมุทรท้องทะเลลึก 108 ปั้น' },
  { num: 3,  text: 'ดินท้องแม่น้ำปากพนัง 108 ปั้น' },
  { num: 4,  text: 'ดินกลางวัด 108 วัด 108 ปั้น' },
  { num: 5,  text: 'ดินกลางนา 108 แปลง 108 ปั้น' },
  { num: 6,  text: 'ดินหาดทรายแก้ว 108 หาด' },
  { num: 7,  text: 'ดินกลางไร่ 108 ไร่' },
  { num: 8,  text: 'ดินรูปูนา 108 รู' },
  { num: 9,  text: 'ดินปราบหญ้าไม่งอก 108 ปราบ' },
  { num: 10, text: 'ดินจอมปลวกวัวเลีย 108 จอม' },
  { num: 11, text: 'ดินกลางสระน้ำ 108 สระ' },
  { num: 12, text: 'เถ้าเชิงตะกอนเผาศพ คนตายวันเสาร์เผาวันอังคาร 7 ป่าช้า บดเป็นผง 108 จอก' },
  { num: 13, text: 'เถ้าหนังสือใบลาน 108 จอก' },
  { num: 14, text: 'ดินป่าช้า 3 วัด 108 ปั้น' },
  { num: 15, text: 'ดอกไม้บูชาพระบรมธาตุวันมาฆบูชาที่ตรงวันเสาร์ขึ้น 15 ค่ำ บดเป็นผง 108 จอกชา' },
  { num: 16, text: 'น้ำจากหุบเขาชัยราชเป็นส่วนผสมสำหรับปั้นพระ' },
  { num: 17, text: 'น้ำฝนตกชายคาพระอุโบสถที่ตรงกับวันจันทร์ขึ้น 10 ค่ำ เป็นส่วนผสมสำหรับปั้นพระ' },
  { num: 18, text: 'ดินพอกหางหมู 108 ก้อน' },
  { num: 19, text: 'พระผงท่าเรือ จ.นครศรีธรรมราช' },
];

const SYMBOLS = [
  { num: '๑', title: 'อุณาโลม', content: 'หมายถึง ปัญญา แสงสว่าง ตรัสรู้ หรือตาที่ 3 ของพระศิวะ และ โอม ในศาสนาพราหมณ์ฮินดู อยู่เหนือยอดยันต์ทั้งปวง สำหรับพุทธศาสนาแทนคุณพระพุทธเจ้า 3 ประการ ได้แก่ พระปัญญาคุณ พระบริสุทธิคุณ พระมหากรุณาธิคุณ', sub: 'คาถา: มะ อะ อุ มะ', badge: '๑' },
  { num: '๒', title: 'พุท', content: 'พยางค์แรกของบทสวดพุทธานุสสติ สรรเสริญคุณพระพุทธเจ้า นำสู่บทสวดอิติปิโส', badge: 'พุท' },
  { num: '๓', title: 'ธา', content: 'พยางค์ที่สองในบทพุทธานุสสติ รวมกับ พุท สื่อถึงความศักดิ์สิทธิ์แห่งพระธรรม', badge: 'ธา' },
  { num: '๔', title: 'นุ', content: 'พยางค์ที่สามในลำดับบทสวด รวมเป็น พุทธานุ — ผู้ตามรอยพระพุทธเจ้า', badge: 'นุ' },
  { num: '๕', title: 'สะ', content: 'ในยันต์ปิดตาจะครบสูตร มีไม้โทพร้อมหางยาวด้านล่าง สื่อถึงการสงบนิ่ง', badge: 'สะ' },
  { num: '๖', title: 'ติ', content: 'พยางค์สุดท้ายในชุด พุท-ธา-นุ-สะ-ติ รวมหมายถึง บทสวดพุทธานุสสติครบสูตร "หันทะ มะยัง พุทธานุสสะตินะยัง กะโรมะ เส"', badge: 'ติ' },
  { num: '๗-๑๐', title: 'นะ มะ พะ ทะ', content: 'หัวใจธาตุสี่ — ดิน น้ำ ลม ไฟ ต้นกำเนิดพลังทั้งหมดบนโลกนี้', badge: '4' },
  { num: '๑๒', title: 'อะ — หัวใจพุทธคุณ ๙ ห้อง', content: 'ตัวอักษรแรกของบทสวดนวหรคุณ หัวใจพุทธคุณ 9 ห้อง: "อะ สัง วิ สุ โล ปุ สะ พุ ภะ"', badge: 'อะ' },
  { num: '๑๓', title: 'ยันต์พุทธคุณ ๕๖', content: 'ตารางยันต์ 16 ช่อง ใช้เลขอารบิก 7–21 เมื่อบวกทั้งแนวตั้ง แนวนอน และแนวทแยงได้ 56 เท่ากับจำนวนพยางค์ในบทสรรเสริญพระพุทธคุณ', badge: '56' },
  { num: '๑๔', title: 'นะ ๑๐๘', content: 'สูตรเมตตามหาระรวย 108 — เรียกทรัพย์ เรียกโชค เรียกลาภ', badge: '108' },
  { num: '๑๕', title: 'นะ สรีระ — ปฐมกัปป์', content: 'ตัวนะปฐมกัปป์ หรือ นะตัวแรก ต้นกำเนิดของการลงนะต่างๆ เช่น ลงนะหน้าทอง', badge: 'นะ' },
];

function RevealBlock({ children, delay = 0, dir = 'up' }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.1 });
  const from = dir === 'left' ? 'translateX(-32px)' : dir === 'right' ? 'translateX(32px)' : 'translateY(32px)';
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0)' : from,
        transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function HistoryAchito() {
  const { t } = useLang();
  const { isAdmin } = useAuth();
  const { content, refetch } = useSiteContent('history');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ para_1: '', para_2: '', para_3: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const [monks, setMonks] = useState([]);
  const [monkModal, setMonkModal] = useState(null);
  const [monkForm, setMonkForm] = useState({ name: '', content: '' });
  const [monkFile, setMonkFile] = useState(null);
  const [monkPreview, setMonkPreview] = useState('');
  const [monkSaving, setMonkSaving] = useState(false);
  const monkFileRef = useRef();

  useEffect(() => {
    axios.get('/api/history').then(res => setMonks(res.data)).catch(() => {});
  }, []);

  const openMonkModal = (monk) => {
    setMonkForm({ name: monk?.name || '', content: monk?.content || '' });
    setMonkFile(null);
    setMonkPreview('');
    setMonkModal(monk || { id: null });
  };

  const handleMonkImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMonkFile(file);
    setMonkPreview(URL.createObjectURL(file));
  };

  const saveMonk = async () => {
    if (!monkForm.name.trim()) { alert('กรุณากรอกชื่อพระเกจิ'); return; }
    setMonkSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', monkForm.name);
      fd.append('content', monkForm.content);
      if (monkFile) fd.append('image', monkFile);
      if (monkModal.id) {
        await axios.put(`/api/history/${monkModal.id}`, fd);
      } else {
        await axios.post('/api/history', fd);
      }
      const res = await axios.get('/api/history');
      setMonks(res.data);
      setMonkModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setMonkSaving(false);
    }
  };

  const deleteMonk = async (id) => {
    if (!window.confirm('ลบประวัติพระเกจิรายนี้?')) return;
    try {
      await axios.delete(`/api/history/${id}`);
      setMonks(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const openEdit = () => {
    setForm({
      para_1: content.para_1 || t('history.para_1'),
      para_2: content.para_2 || t('history.para_2'),
      para_3: content.para_3 || t('history.para_3'),
    });
    setImageFile(null);
    setImagePreview(null);
    setEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      if (imageFile) fd.append('image', imageFile);
      await axios.put('/api/content/history', fd);
      await refetch();
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const heroImage = content.image_url || achito;

  return (
    <div className="relative min-h-screen bg-[#080603]">

      {/* Admin edit button */}
      {isAdmin && (
        <button
          onClick={openEdit}
          className="fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          แก้ไข
        </button>
      )}

      {/* Fixed faded BG */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.06,
          filter: 'grayscale(40%) sepia(30%)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#080603]/70 via-transparent to-[#080603]" />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ minHeight: '560px' }}>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 100%)' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 flex flex-col items-center text-center">
          <Link to="/" className="self-start text-gold/60 hover:text-gold text-sm mb-10 transition-colors flex items-center gap-2">
            {t('history.back')}
          </Link>

          {/* Monk portrait */}
          <div className="relative mb-8 animate-hero-entrance">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 60px rgba(212,175,55,0.35), 0 0 120px rgba(212,175,55,0.12)',
                borderRadius: '50%',
                animation: 'sacred-aura 4s ease-in-out infinite',
              }}
            />
            <img
              src={heroImage}
              alt="พ่อท่านเจิม อชิโต"
              className="relative w-44 h-44 md:w-56 md:h-56 object-cover rounded-full"
              style={{ border: '2px solid rgba(212,175,55,0.5)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
            />
            <div
              className="absolute inset-[-12px] rounded-full border border-gold/20 rotate-sacred-slow pointer-events-none"
              style={{ borderStyle: 'dashed' }}
            />
          </div>

          <p className="text-gold/60 text-xs tracking-[0.5em] uppercase mb-3">{t('history.legend_label')}</p>
          <h1 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-3">
            พระผงพรายสมุทร
            <br />
            <span className="gold-shimmer" style={{ fontSize: '1.1em' }}>อชิโต</span>
          </h1>
          <p className="text-gold text-base md:text-lg font-medium mt-1">พ่อท่านเจิม วัดหอยราก</p>
          <p className="text-cream-muted text-sm mt-1">อ.ปากพนัง จ.นครศรีธรรมราช</p>

          <div className="gold-divider-flow w-32 mt-6" />
          <div className="flex items-center gap-4 mt-4 text-gold/30 text-sm tracking-[0.8em] select-none">
            <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
          </div>
        </div>
      </section>

      {/* MONK HISTORY */}
      <section className="relative max-w-4xl mx-auto px-4 pt-4 pb-2">
        <RevealBlock>
          <div
            className="rounded-2xl p-8 mb-10"
            style={{
              background: 'rgba(20,15,5,0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧘</span>
                <div>
                  <p className="text-gold/50 text-xs tracking-widest uppercase">ผู้สร้าง</p>
                  <h2 className="font-serif text-2xl text-cream">พระเกจิ</h2>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => openMonkModal(null)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
                >
                  + เพิ่มประวัติ
                </button>
              )}
            </div>

            {monks.length === 0 ? (
              <p className="text-cream/50 text-sm text-center py-6">ยังไม่มีประวัติพระเกจิ</p>
            ) : (
              <div className="space-y-5">
                {monks.map(monk => (
                  <div
                    key={monk.id}
                    className="flex gap-4 rounded-xl p-5 transition-all duration-300 group hover:scale-[1.005]"
                    style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}
                  >
                    {monk.image_url && (
                      <img
                        src={monk.image_url}
                        alt={monk.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gold/30 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-gold text-lg">{monk.name}</h3>
                        {isAdmin && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => openMonkModal(monk)}
                              className="text-xs px-2 py-1 rounded border border-gold/20 text-gold/60 hover:text-gold transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => deleteMonk(monk.id)}
                              className="text-xs px-2 py-1 rounded border border-red-900/30 text-red-400/60 hover:text-red-400 transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-cream/75 text-sm leading-7 mt-2 whitespace-pre-line">{monk.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RevealBlock>
      </section>

      {/* HISTORY CARD */}
      <section className="relative max-w-4xl mx-auto px-4 pb-16">

        <RevealBlock>
          <div
            className="rounded-2xl p-8 mb-10"
            style={{
              background: 'rgba(20,15,5,0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🛕</span>
              <div>
                <p className="text-gold/50 text-xs tracking-widest uppercase">{t('history.origin_label')}</p>
                <h2 className="font-serif text-2xl text-cream">{t('history.origin_title')}</h2>
              </div>
            </div>

            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
              <span
                className="inline-block text-xs px-3 py-1 rounded-full font-medium mb-4"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}
              >
                {t('history.year_badge')}
              </span>
            </div>

            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide">
              {content.para_1 || t('history.para_1')}
            </p>
            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide mt-4">
              {content.para_2 || t('history.para_2')}
            </p>
            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide mt-4">
              {content.para_3 || t('history.para_3')}
            </p>

            <div
              className="mt-6 px-5 py-4 rounded-xl text-center"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              <p className="text-gold font-serif text-lg tracking-wider">{t('history.meaning_quote')}</p>
            </div>
          </div>
        </RevealBlock>

        {/* SACRED INGREDIENTS */}
        <RevealBlock delay={0.05}>
          <div
            className="rounded-2xl p-8 mb-10"
            style={{
              background: 'rgba(20,15,5,0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⚗️</span>
              <div>
                <p className="text-gold/50 text-xs tracking-widest uppercase">{t('history.ingredients_label')}</p>
                <h2 className="font-serif text-2xl text-cream">{t('history.ingredients_title')}</h2>
              </div>
            </div>
            <p className="text-cream-muted text-sm mb-6 leading-7">{t('history.ingredients_intro')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INGREDIENTS.map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.01]"
                  style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}
                >
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-charcoal-dark"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)' }}
                  >
                    {item.num}
                  </span>
                  <p className="text-cream/80 text-sm leading-6">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealBlock>

        {/* SYMBOL MEANINGS */}
        <RevealBlock delay={0.05}>
          <div
            className="rounded-2xl p-8 mb-10"
            style={{
              background: 'rgba(20,15,5,0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">☸</span>
              <div>
                <p className="text-gold/50 text-xs tracking-widest uppercase">{t('history.symbols_label')}</p>
                <h2 className="font-serif text-2xl text-cream">{t('history.symbols_title')}</h2>
              </div>
            </div>
            <div className="space-y-4">
              {SYMBOLS.map((sym, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl p-5 transition-all duration-300 group hover:scale-[1.01]"
                  style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}
                >
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-charcoal-dark text-sm"
                      style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)', boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                    >
                      {sym.badge}
                    </div>
                    <span className="text-gold/50 text-xs font-mono">{sym.num}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-gold text-base mb-2 group-hover:text-gold transition-colors">{sym.title}</h3>
                    <p className="text-cream/75 text-sm leading-7">{sym.content}</p>
                    {sym.sub && (
                      <p
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg inline-block font-medium tracking-wider"
                        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}
                      >
                        {sym.sub}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealBlock>

        {/* CLOSING */}
        <RevealBlock delay={0.05}>
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(20,15,5,0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)',
            }}
          >
            <div className="text-5xl mb-4 rotate-sacred-slow select-none">☸</div>
            <p className="font-serif text-2xl gold-shimmer mb-3">{t('history.closing_word')}</p>
            <p className="text-gold/70 text-sm tracking-widest uppercase mb-4">{t('history.closing_meaning')}</p>
            <div className="gold-divider-flow max-w-[100px] mx-auto mb-6" />
            <p className="text-cream-muted text-sm leading-7 max-w-lg mx-auto">{t('history.closing_desc')}</p>
            <div className="flex items-center justify-center gap-4 mt-6 text-gold/25 text-sm tracking-[1em]">
              <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
            </div>
            <Link to="/" className="inline-block mt-8 btn-outline-gold px-8 py-3">
              {t('history.back_to_collection')}
            </Link>
          </div>
        </RevealBlock>

      </section>

      {/* Monk Modal */}
      {monkModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14100a', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
          >
            <h3 className="font-serif text-xl text-gold mb-5">
              {monkModal.id ? 'แก้ไขประวัติพระเกจิ' : 'เพิ่มประวัติพระเกจิ'}
            </h3>

            <div className="mb-4 text-center">
              {(monkPreview || monkModal.image_url) && (
                <img
                  src={monkPreview || monkModal.image_url}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gold/30"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <button
                onClick={() => monkFileRef.current.click()}
                className="text-gold/70 hover:text-gold text-xs border border-gold/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {monkPreview || monkModal.image_url ? 'เปลี่ยนรูป' : 'เลือกรูป'}
              </button>
              <input ref={monkFileRef} type="file" accept="image/*" className="hidden" onChange={handleMonkImageChange} />
            </div>

            <label className="block text-gold/60 text-xs mb-1">ชื่อพระเกจิ *</label>
            <input
              value={monkForm.name}
              onChange={e => setMonkForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50"
              placeholder="เช่น พ่อท่านเจิม อชิโต"
            />

            <label className="block text-gold/60 text-xs mb-1">ประวัติ</label>
            <textarea
              value={monkForm.content}
              onChange={e => setMonkForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-5 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
              placeholder="ประวัติและเกร็ดน่ารู้..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => setMonkModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm hover:border-white/20 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveMonk}
                disabled={monkSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#0a0803' }}
              >
                {monkSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14100a', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
          >
            <h3 className="font-serif text-xl text-gold mb-5">แก้ไขหน้าประวัติ</h3>

            {/* Hero image */}
            <div className="mb-5">
              <label className="block text-gold/60 text-xs mb-2">รูปภาพหลัก (พ่อท่านเจิม)</label>
              <div className="flex items-center gap-4">
                <img
                  src={imagePreview || heroImage}
                  alt="preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gold/30 flex-shrink-0"
                />
                <button
                  onClick={() => fileRef.current.click()}
                  className="text-gold/70 hover:text-gold text-xs border border-gold/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  เปลี่ยนรูป
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>

            <label className="block text-gold/60 text-xs mb-1">ข้อความย่อหน้า 1</label>
            <textarea
              value={form.para_1}
              onChange={e => setForm({ ...form, para_1: e.target.value })}
              rows={4}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
            />

            <label className="block text-gold/60 text-xs mb-1">ข้อความย่อหน้า 2</label>
            <textarea
              value={form.para_2}
              onChange={e => setForm({ ...form, para_2: e.target.value })}
              rows={4}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
            />

            <label className="block text-gold/60 text-xs mb-1">ข้อความย่อหน้า 3</label>
            <textarea
              value={form.para_3}
              onChange={e => setForm({ ...form, para_3: e.target.value })}
              rows={4}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-5 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm hover:border-white/20 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#0a0803' }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
