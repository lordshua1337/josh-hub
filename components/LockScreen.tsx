"use client";

import { useEffect, useRef, useState } from "react";

const CODE = [1, 3, 3, 7] as const;
const STORAGE_KEY = "hub_unlocked";

export function LockScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shake, setShake] = useState(false);
  const [merge, setMerge] = useState(false);
  const [spin, setSpin] = useState(false);
  const [glow, setGlow] = useState(false);
  const [closing, setClosing] = useState(false);

  // Refs to read latest progress inside the keydown handler without re-binding.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  function unlockNow() {
    setMerge(true);
    setTimeout(() => setSpin(true), 250);
    setTimeout(() => setGlow(true), 450);
    setTimeout(() => setClosing(true), 800);
    setTimeout(() => {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setUnlocked(true);
    }, 1300);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY)) {
      setUnlocked(true);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (Number.isNaN(num)) return;
      const cur = progressRef.current;
      if (num === CODE[cur]) {
        const next = cur + 1;
        setProgress(next);
        if (next === CODE.length) {
          setTimeout(() => setMerge(true), 350);
          setTimeout(() => setSpin(true), 600);
          setTimeout(() => setGlow(true), 800);
          setTimeout(() => setClosing(true), 1200);
          setTimeout(() => {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
            setUnlocked(true);
          }, 1800);
        }
      } else {
        setShake(true);
        setProgress(0);
        setTimeout(() => setShake(false), 500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reveal dashboard via a body class so layout doesn't paint twice.
  useEffect(() => {
    if (unlocked) document.body.classList.add("hub-unlocked");
    else document.body.classList.remove("hub-unlocked");
  }, [unlocked]);

  if (unlocked) return null;

  return (
    <div id="lock" className={closing ? "unlocked" : undefined}>
      <div className="lock-bg" />
      <div className={`lock-inner${shake ? " shake" : ""}`}>
        <div className="lock-label">Command Center</div>
        <div className={`lock-ring${spin ? " spin" : ""}${glow ? " glow" : ""}`}>
          <div className={`piece p1${progress > 0 ? " in" : ""}${merge ? " merge" : ""}`} />
          <div className={`piece p2${progress > 1 ? " in" : ""}${merge ? " merge" : ""}`} />
          <div className={`piece p3${progress > 2 ? " in" : ""}${merge ? " merge" : ""}`} />
          <div className={`piece p4${progress > 3 ? " in" : ""}${merge ? " merge" : ""}`} />
        </div>
        <div className="lock-dots">
          <span className={`ldot${progress > 0 ? " filled" : ""}`} />
          <span className={`ldot${progress > 1 ? " filled" : ""}`} />
          <span className={`ldot${progress > 2 ? " filled" : ""}`} />
          <span className={`ldot${progress > 3 ? " filled" : ""}`} />
        </div>
        <div className="lock-hint">Access Code — type 1·3·3·7</div>
        <button type="button" className="lock-skip" onClick={unlockNow}>
          enter →
        </button>
      </div>
    </div>
  );
}
