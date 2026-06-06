import React from 'react';

const SYMBOLS = ['✦', '✧', '⋆', '✺', '❋', '◈', '⊹', '✦', '✧', '⋆'];

function getParticle(i, total) {
  return {
    id: i,
    symbol: SYMBOLS[i % SYMBOLS.length],
    left: `${((i * 97) % 90) + 2}%`,
    top: `${((i * 83) % 85) + 5}%`,
    fontSize: `${0.45 + (i % 5) * 0.22}rem`,
    delay: `${(i * 0.41) % 6}s`,
    duration: `${3 + (i % 6)}s`,
    opacity: 0.08 + (i % 7) * 0.07,
  };
}

export default function SparkleOverlay({ count = 28 }) {
  const particles = Array.from({ length: count }, (_, i) => getParticle(i, count));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute text-gold"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.fontSize,
            opacity: p.opacity,
            animation: `sparkle-twinkle ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
