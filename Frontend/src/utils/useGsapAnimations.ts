import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGsapAnimations = (containerRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Button Hover/Click Animations
      const buttons = containerRef.current?.querySelectorAll('button') || [];
      buttons.forEach(btn => {
        const button = btn as HTMLButtonElement;
        
        // Remove existing transitions to avoid conflicts
        button.style.transition = 'none';

        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.2,
            ease: 'power2.out',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
          });
        });

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.inOut',
            boxShadow: 'none'
          });
        });

        button.addEventListener('mousedown', () => {
          gsap.to(button, { scale: 0.95, duration: 0.1 });
        });

        button.addEventListener('mouseup', () => {
          gsap.to(button, { scale: 1.05, duration: 0.2 });
        });
      });

      // 2. Scroll Triggered Entrance Animations for Cards
      const cards = containerRef.current?.querySelectorAll('.glass-card, .glass-red, .glass-blue, .glass-amber, .glass-emerald, .glass-orange') || [];
      cards.forEach((card, index) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
            scroller: containerRef.current || window
          },
          y: 20,
          opacity: 0,
          duration: 0.5,
          delay: index * 0.03,
          ease: 'power3.out'
        });
      });

      // 3. Header Entrance
      const header = containerRef.current?.querySelector('header');
      if (header) {
        gsap.from(header, {
          y: -15,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
};
