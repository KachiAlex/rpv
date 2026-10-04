"use client";

import { useState, useEffect } from "react";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2700);

    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div className={`rpv-splash ${fadeOut ? "rpv-splash-fadeout" : ""}`}>
          <div className="rpv-splash-content">
            <div className="rpv-splash-logo-wrap">
              <img
                src="/rpv-logo.svg"
                alt="RPV Bible"
                className="rpv-splash-logo"
                width={120}
                height={120}
              />
            </div>
            <div className="rpv-splash-text">
              <h1 className="rpv-splash-title">RPV Bible</h1>
              <p className="rpv-splash-subtitle">Study &amp; Projection</p>
            </div>
            <div className="rpv-splash-progress">
              <div className="rpv-splash-progress-bar" />
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
