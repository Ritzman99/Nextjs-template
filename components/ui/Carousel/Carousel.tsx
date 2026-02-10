'use client';

import { useRef, useState, useEffect } from 'react';
import type { HTMLAttributes } from 'react';
import styles from './Carousel.module.scss';

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[];
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function Carousel({
  children,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = '',
  ...rest
}: CarouselProps) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const count = Array.isArray(children) ? children.length : 0;

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, autoPlayInterval);
    return () => clearInterval(t);
  }, [autoPlay, autoPlayInterval, count]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
  }, [index]);

  const goTo = (i: number) => setIndex(i);

  return (
    <div className={`${styles.wrapper} ${className}`.trim()} {...rest}>
      <div ref={ref} className={styles.viewport}>
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={styles.slide}>
                {child}
              </div>
            ))
          : null}
      </div>
      {showArrows && count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => goTo((index - 1 + count) % count)} aria-label="Previous">
            ‹
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => goTo((index + 1) % count)} aria-label="Next">
            ›
          </button>
        </>
      )}
      {showDots && count > 1 && (
        <div className={styles.controls}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.active : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
