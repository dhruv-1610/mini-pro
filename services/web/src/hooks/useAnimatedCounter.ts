import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface UseAnimatedCounterOptions {
  end: number;
  duration?: number;
  startOnView?: boolean;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export function useAnimatedCounter({
  end,
  duration = 1500,
  startOnView = true,
  decimals = 0,
  suffix = '',
  prefix = '',
}: UseAnimatedCounterOptions): {
  count: string;
  ref: React.RefObject<HTMLDivElement | null>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (startOnView && !isInView) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 2; // easeOutQuad
      const value = Math.floor(eased * end * Math.pow(10, decimals)) / Math.pow(10, decimals);
      setCount(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, startOnView, decimals, isInView]);

  const formatted = count.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { count: `${prefix}${formatted}${suffix}`, ref };
}
