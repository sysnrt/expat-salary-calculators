/* ══════════════════════════════════════════════════════════
   ExpatCalc — AnimatedNumber Component
   Smooth odometer-style animation for salary numbers.
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';

const { useState, useEffect, useRef } = React;

const DURATION = 400; // ms

export default function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (from === to) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = null;

    function tick(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * ease;
      setDisplay(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  // On first render, snap immediately
  useEffect(() => {
    fromRef.current = value;
    setDisplay(value);
  }, []);

  return html`<span>${format ? format(display) : Math.round(display).toLocaleString()}</span>`;
}
