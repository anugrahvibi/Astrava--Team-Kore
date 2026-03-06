import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

 export const useGsapAnimations = (containerRef: React.RefObject<HTMLElement | null>, deps: any[] = []) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Button Hover/Click Animations
      const buttons = containerRef.current?.querySelectorAll('button') || [];
      buttons.forEach(btn => {
        const button = btn as HTMLButtonElement;
        
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.04,
            borderRadius: '1.25rem',
            duration: 0.15,
            ease: 'power2.out',
            boxShadow: '0 8px 20px -5px rgba(37, 99, 235, 0.25)'
          });
        });

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            borderRadius: '', // Resets to original CSS definition
            duration: 0.15,
            ease: 'power2.inOut',
            boxShadow: 'none',
            clearProps: "scale,boxShadow,borderRadius"
          });
        });

        button.addEventListener('mousedown', () => {
          gsap.to(button, { scale: 0.96, duration: 0.08 });
        });

        button.addEventListener('mouseup', () => {
          gsap.to(button, { scale: 1.05, duration: 0.12 });
        });
      });

      // 2. Scroll Triggered Entrance Animations for Cards
      const cards = containerRef.current?.querySelectorAll('.glass-card, .glass-red, .glass-blue, .glass-amber, .glass-emerald, .glass-orange, .timeline-item, .alert-card-gsap, .gsap-appear') || [];
      cards.forEach((card, index) => {
         gsap.from(card, {
          y: 20,
          opacity: 0,
          scale: 0.98,
          duration: 0.45,
          delay: Math.min(index * 0.05, 0.4),
          ease: 'power2.out',
          clearProps: 'all',
          immediateRender: false
        });
      });

      // 3. Header/Title Entrance
      const headers = containerRef.current?.querySelectorAll('header, .gsap-header') || [];
      headers.forEach(header => {
         gsap.from(header, {
          y: -15,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'all',
          immediateRender: false
        });
      });

      // 4. Staggered List Items
      const listItems = containerRef.current?.querySelectorAll('li, .gsap-list-item') || [];
      if (listItems.length > 0) {
         gsap.from(listItems, {
          x: -10,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'all',
          immediateRender: false
        });
      }
     }, containerRef.current);

    return () => ctx.revert();
  }, [containerRef, ...deps]);
};
