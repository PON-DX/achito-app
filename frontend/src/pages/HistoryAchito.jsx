import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LanguageContext';
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
  {
    num: '๑',
    title: 'อุณาโลม',
    content: 'หมายถึง ปัญญา แสงสว่าง ตรัสรู้ หรือตาที่ 3 ของพระศิวะ และ โอม ในศาสนาพราหมณ์ฮินดู อยู่เหนือยอดยันต์ทั้งปวง สำหรับพุทธศาสนาแทนคุณพระพุทธเจ้า 3 ประการ ได้แก่ พระปัญญาคุณ พระบริสุทธิคุณ พระมหากรุณาธิคุณ',
    sub: 'คาถา: มะ อะ อุ มะ',
    badge: '๑',
  },
  {
    num: '๒',
    title: 'พุท',
    content: 'พยางค์แรกของบทสวดพุทธานุสสติ สรรเสริญคุณพระพุทธเจ้า นำสู่บทสวดอิติปิโส',
    badge: 'พุท',
  },
  {
    num: '๓',
    title: 'ธา',
    content: 'พยางค์ที่สองในบทพุทธานุสสติ รวมกับ พุท สื่อถึงความศักดิ์สิทธิ์แห่งพระธรรม',
    badge: 'ธา',
  },
  {
    num: '๔',
    title: 'นุ',
    content: 'พยางค์ที่สามในลำดับบทสวด รวมเป็น พุทธานุ — ผู้ตามรอยพระพุทธเจ้า',
    badge: 'นุ',
  },
  {
    num: '๕',
    title: 'สะ',
    content: 'ในยันต์ปิดตาจะครบสูตร มีไม้โทพร้อมหางยาวด้านล่าง สื่อถึงการสงบนิ่ง',
    badge: 'สะ',
  },
  {
    num: '๖',
    title: 'ติ',
    content: 'พยางค์สุดท้ายในชุด พุท-ธา-นุ-สะ-ติ รวมหมายถึง บทสวดพุทธานุสสติครบสูตร "หันทะ มะยัง พุทธานุสสะตินะยัง กะโรมะ เส"',
    badge: 'ติ',
  },
  {
    num: '๗-๑๐',
    title: 'นะ มะ พะ ทะ',
    content: 'หัวใจธาตุสี่ — ดิน น้ำ ลม ไฟ ต้นกำเนิดพลังทั้งหมดบนโลกนี้',
    badge: '4',
  },
  {
    num: '๑๒',
    title: 'อะ — หัวใจพุทธคุณ ๙ ห้อง',
    content: 'ตัวอักษรแรกของบทสวดนวหรคุณ หัวใจพุทธคุณ 9 ห้อง: "อะ สัง วิ สุ โล ปุ สะ พุ ภะ"',
    badge: 'อะ',
  },
  {
    num: '๑๓',
    title: 'ยันต์พุทธคุณ ๕๖',
    content: 'ตารางยันต์ 16 ช่อง ใช้เลขอารบิก 7–21 เมื่อบวกทั้งแนวตั้ง แนวนอน และแนวทแยงได้ 56 เท่ากับจำนวนพยางค์ในบทสรรเสริญพระพุทธคุณ',
    badge: '56',
  },
  {
    num: '๑๔',
    title: 'นะ ๑๐๘',
    content: 'สูตรเมตตามหาระรวย 108 — เรียกทรัพย์ เรียกโชค เรียกลาภ',
    badge: '108',
  },
  {
    num: '๑๕',
    title: 'นะ สรีระ — ปฐมกัปป์',
    content: 'ตัวนะปฐมกัปป์ หรือ นะตัวแรก ต้นกำเนิดของการลงนะต่างๆ เช่น ลงนะหน้าทอง',
    badge: 'นะ',
  },
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
  return (
    <div className="relative min-h-screen bg-[#080603]">

      {/* ══════════════════════════════════════
          FIXED FADED BG — achito.png
          ══════════════════════════════════════ */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${achito})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.06,
          filter: 'grayscale(40%) sepia(30%)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#080603]/70 via-transparent to-[#080603]" />

      {/* ══════════════════════════════════════
          HERO
          ══════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '560px' }}>
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 100%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 flex flex-col items-center text-center">
          {/* Back link */}
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
              src={achito}
              alt="พ่อท่านเจิม อชิโต"
              className="relative w-44 h-44 md:w-56 md:h-56 object-cover rounded-full"
              style={{
                border: '2px solid rgba(212,175,55,0.5)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              }}
            />
            {/* Gold ring decoration */}
            <div
              className="absolute inset-[-12px] rounded-full border border-gold/20 rotate-sacred-slow pointer-events-none"
              style={{ borderStyle: 'dashed' }}
            />
          </div>

          <p className="text-gold/60 text-xs tracking-[0.5em] uppercase mb-3">{t('history.legend_label')}</p>
          <h1 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-3">
            พระผงพรายสมุทร
            <br />
            <span
              className="gold-shimmer"
              style={{ fontSize: '1.1em' }}
            >
              อชิโต
            </span>
          </h1>
          <p className="text-gold text-base md:text-lg font-medium mt-1">
            พ่อท่านเจิม วัดหอยราก
          </p>
          <p className="text-cream-muted text-sm mt-1">
            อ.ปากพนัง จ.นครศรีธรรมราช
          </p>

          <div className="gold-divider-flow w-32 mt-6" />

          <div className="flex items-center gap-4 mt-4 text-gold/30 text-sm tracking-[0.8em] select-none">
            <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HISTORY CARD
          ══════════════════════════════════════ */}
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

            <div
              className="mb-4 pb-4"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}
            >
              <span
                className="inline-block text-xs px-3 py-1 rounded-full font-medium mb-4"
                style={{
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#D4AF37',
                }}
              >
                {t('history.year_badge')}
              </span>
            </div>

            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide">
              {t('history.para_1')}
            </p>
            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide mt-4">
              {t('history.para_2')}
            </p>
            <p className="text-cream/85 text-sm md:text-base leading-8 tracking-wide mt-4">
              {t('history.para_3')}
            </p>

            <div
              className="mt-6 px-5 py-4 rounded-xl text-center"
              style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              <p className="text-gold font-serif text-lg tracking-wider">{t('history.meaning_quote')}</p>
            </div>
          </div>
        </RevealBlock>

        {/* ══════════════════════════════════════
            SACRED INGREDIENTS
            ══════════════════════════════════════ */}
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

            <p className="text-cream-muted text-sm mb-6 leading-7">
              {t('history.ingredients_intro')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INGREDIENTS.map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.1)',
                  }}
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

        {/* ══════════════════════════════════════
            SYMBOL MEANINGS
            ══════════════════════════════════════ */}
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
                  style={{
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.1)',
                  }}
                >
                  {/* Badge */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-charcoal-dark text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                        boxShadow: '0 2px 12px rgba(212,175,55,0.3)',
                      }}
                    >
                      {sym.badge}
                    </div>
                    <span className="text-gold/50 text-xs font-mono">{sym.num}</span>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="font-serif text-gold text-base mb-2 group-hover:text-gold transition-colors">
                      {sym.title}
                    </h3>
                    <p className="text-cream/75 text-sm leading-7">{sym.content}</p>
                    {sym.sub && (
                      <p
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg inline-block font-medium tracking-wider"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: '#D4AF37',
                        }}
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

        {/* ══════════════════════════════════════
            CLOSING
            ══════════════════════════════════════ */}
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
            <p className="text-cream-muted text-sm leading-7 max-w-lg mx-auto">
              {t('history.closing_desc')}
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-gold/25 text-sm tracking-[1em]">
              <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
            </div>

            <Link
              to="/"
              className="inline-block mt-8 btn-outline-gold px-8 py-3"
            >
              {t('history.back_to_collection')}
            </Link>
          </div>
        </RevealBlock>

      </section>
    </div>
  );
}
