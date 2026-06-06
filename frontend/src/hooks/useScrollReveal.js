import { useCallback, useRef, useState } from 'react';

export default function useScrollReveal({ threshold = 0.12, once = true } = {}) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback(
    (el) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        },
        { threshold, rootMargin: '0px 0px -40px 0px' }
      );

      observer.observe(el);
      observerRef.current = observer;
    },
    [threshold, once]
  );

  return [ref, visible];
}
