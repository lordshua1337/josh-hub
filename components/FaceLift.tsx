"use client";

import { useEffect } from "react";

// Mount-once side effects: scroll-triggered reveals, stat counters, XP bar entrance,
// button ripple, and scroll-aware navbar. Ported from legacy/js/shared.js.
export function FaceLift() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".fl-reveal"));
    if (reveals.length) {
      if (reduce) {
        reveals.forEach((el) => el.classList.add("fl-visible"));
      } else {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("fl-visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        reveals.forEach((el, i) => {
          el.style.transitionDelay = `${i * 0.08}s`;
          observer.observe(el);
        });
      }
    }

    // Stat counters
    let counted = false;
    const statNums = Array.from(document.querySelectorAll<HTMLElement>(".stat-num"));
    if (statNums.length && !reduce) {
      const countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !counted) {
              counted = true;
              statNums.forEach((el) => {
                const raw = (el.textContent || "").replace(/,/g, "");
                const target = parseInt(raw, 10);
                if (Number.isNaN(target)) return;
                const duration = 1200;
                const start = performance.now();
                const comma = (el.textContent || "").indexOf(",") !== -1;
                const step = (now: number) => {
                  const elapsed = now - start;
                  const progress = Math.min(elapsed / duration, 1);
                  const eased = 1 - Math.pow(1 - progress, 3);
                  const current = Math.round(eased * target);
                  el.textContent = comma ? current.toLocaleString() : String(current);
                  if (progress < 1) requestAnimationFrame(step);
                };
                el.textContent = "0";
                requestAnimationFrame(step);
              });
              countObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      const statsBar = document.querySelector(".stats-bar");
      if (statsBar) countObserver.observe(statsBar);
    }

    // XP bar entrance
    const fill = document.querySelector<HTMLElement>(".xp-bar-fill");
    if (fill && !reduce) {
      const targetWidth = fill.style.width;
      fill.classList.add("fl-bar-waiting");
      const barObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                fill.classList.remove("fl-bar-waiting");
                fill.style.width = targetWidth;
              }, 300);
              barObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      const hero = fill.closest(".xp-hero");
      if (hero) barObserver.observe(hero);
    }

    // Button ripple
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const btn = target?.closest<HTMLElement>(".act-btn, .quick-card");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "fl-ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }
    document.addEventListener("click", onClick);

    // Scroll-aware navbar
    const nav = document.querySelector<HTMLElement>(".topbar");
    let scrolled = false;
    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      if (y > 20 && !scrolled) {
        nav?.classList.add("fl-scrolled");
        scrolled = true;
      } else if (y <= 20 && scrolled) {
        nav?.classList.remove("fl-scrolled");
        scrolled = false;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
