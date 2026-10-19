'use client';

import { useEffect, type CSSProperties } from 'react';
import styles from './PlayConfetti.module.css';

const colors = ['#dca52b', '#247c76', '#dc7358', '#678dc9'];

export function PlayConfetti({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) {
      onFinished();
      return;
    }
    const timer = window.setTimeout(onFinished, 3600);
    const handlePreference = () => { if (preference.matches) onFinished(); };
    preference.addEventListener('change', handlePreference);
    return () => {
      window.clearTimeout(timer);
      preference.removeEventListener('change', handlePreference);
    };
  }, [onFinished]);

  return (
    <div data-testid="play-confetti" aria-hidden="true" className={styles.confetti}>
      {Array.from({ length: 32 }, (_, index) => (
        <span
          key={index}
          className={styles.piece}
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: colors[index % colors.length],
            animationDelay: `${(index % 7) * 55}ms`,
            '--drift': `${((index * 29) % 160) - 80}px`,
            '--turn': `${index % 2 ? 540 : -540}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
