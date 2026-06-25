'use client';

import { COIN_LOGOS } from '@/lib/coinLogos';

const COINS = Object.keys(COIN_LOGOS);

const OPACITIES = [0.18, 0.25, 0.30, 0.20, 0.33, 0.15];
const SCALES = [1.0, 0.8, 1.2, 0.9, 1.1, 0.85];

export default function CryptoMarquee() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Left fade overlay */}
      <div className="absolute left-0 top-0 bottom-0 z-10 w-20 md:w-32 pointer-events-none" style={{
        background: 'linear-gradient(to right, #0e0b1a 0%, transparent 100%)',
      }} />
      {/* Right fade overlay */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-20 md:w-32 pointer-events-none" style={{
        background: 'linear-gradient(to left, #0e0b1a 0%, transparent 100%)',
      }} />

      {/* Top row - scroll left */}
      <div className="absolute left-0 top-[18%] w-full overflow-hidden" style={{ height: 80 }}>
        <div className="flex gap-6 absolute" style={{ animation: 'scrollLeft 30s linear infinite', width: 'max-content' }}>
          {[...COINS, ...COINS, ...COINS, ...COINS, ...COINS, ...COINS].map((coin, i) => (
            <div
              key={`top-${i}`}
              className="marq-logo flex items-center justify-center rounded-full flex-shrink-0"
            >
              <img
                src={COIN_LOGOS[coin].logo}
                alt={COIN_LOGOS[coin].name}
                width={60}
                height={60}
                className="marq-img"
                style={{ transform: `scale(${SCALES[i % SCALES.length]})` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row - scroll right */}
      <div className="absolute left-0 bottom-[18%] w-full overflow-hidden" style={{ height: 80 }}>
        <div className="flex gap-6 absolute" style={{ animation: 'scrollRight 35s linear infinite', width: 'max-content' }}>
          {[...COINS, ...COINS, ...COINS, ...COINS, ...COINS, ...COINS].map((coin, i) => (
            <div
              key={`bot-${i}`}
              className="marq-logo flex items-center justify-center rounded-full flex-shrink-0"
            >
              <img
                src={COIN_LOGOS[coin].logo}
                alt={COIN_LOGOS[coin].name}
                width={60}
                height={60}
                className="marq-img"
                style={{ transform: `scale(${SCALES[i % SCALES.length]})` }}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marq-logo {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(2px);
          filter: drop-shadow(0 0 8px rgba(255,215,0,0.15));
        }
        .marq-logo:nth-child(6n+1) { opacity: ${OPACITIES[0]}; }
        .marq-logo:nth-child(6n+2) { opacity: ${OPACITIES[1]}; }
        .marq-logo:nth-child(6n+3) { opacity: ${OPACITIES[2]}; }
        .marq-logo:nth-child(6n+4) { opacity: ${OPACITIES[3]}; }
        .marq-logo:nth-child(6n+5) { opacity: ${OPACITIES[4]}; }
        .marq-logo:nth-child(6n+6) { opacity: ${OPACITIES[5]}; }
        .marq-img {
          object-fit: contain;
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .marq-logo {
            width: 56px;
            height: 56px;
          }
          .marq-img {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
