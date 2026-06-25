'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  triggerOnce?: boolean;  // if true, only animates on first scroll into view
}

export default function AnimatedNumber({
  value, prefix = '', suffix = '', decimals = 2, duration = 1.2,
  className, style, triggerOnce = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const hasRun = useRef(false);

  useEffect(() => {
    // Respect reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    if (triggerOnce && hasRun.current) {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) { setDisplay(value); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasRun.current = true;
          animateValue(0, value, duration, setDisplay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, triggerOnce]);

  return (
    <span ref={ref} className={className} style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

function animateValue(from: number, to: number, durationSec: number, setter: (v: number) => void) {
  const start = performance.now();
  const animate = (now: number) => {
    const elapsed = (now - start) / 1000;
    const progress = Math.min(elapsed / durationSec, 1);
    // ease-out (power2)
    const eased = 1 - Math.pow(1 - progress, 2);
    setter(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
