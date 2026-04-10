/* ============================================================
   Cogno Solution - PWA Install Prompt
   Shows a beautiful install banner on mobile devices
   ============================================================ */

(function () {
  'use strict';

  let deferredPrompt = null;
  const DISMISSED_KEY = 'cogno_pwa_dismissed';
  const INSTALLED_KEY = 'cogno_pwa_installed';

  // ── Inject CSS ─────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cogno-pwa-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      padding: 0 16px 16px;
      transform: translateY(110%);
      transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
    }
    #cogno-pwa-banner.visible {
      transform: translateY(0);
      pointer-events: all;
    }
    /* Push up the tab bar if it exists */
    @media (max-width: 768px) {
      .tab-bar { bottom: 110px !important; }
    }
    #cogno-pwa-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 -4px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      overflow: hidden;
      max-width: 480px;
      margin: 0 auto;
    }
    [data-theme="dark"] #cogno-pwa-card {
      background: #1e2433;
      box-shadow: 0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;
    }
    #cogno-pwa-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(14,165,233,0.04) 100%);
      pointer-events: none;
    }
    #cogno-pwa-app-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #2563eb, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 8px 20px rgba(37,99,235,0.35);
    }
    #cogno-pwa-app-icon svg {
      width: 28px;
      height: 28px;
      fill: #fff;
    }
    #cogno-pwa-text {
      flex: 1;
      min-width: 0;
    }
    #cogno-pwa-text strong {
      display: block;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0d1117;
      margin-bottom: 3px;
      letter-spacing: -0.01em;
    }
    [data-theme="dark"] #cogno-pwa-text strong { color: #f0f6fc; }
    #cogno-pwa-text span {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.78rem;
      color: #6b7280;
      line-height: 1.4;
    }
    [data-theme="dark"] #cogno-pwa-text span { color: #8b949e; }
    #cogno-pwa-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }
    #cogno-pwa-install-btn {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 10px 18px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(37,99,235,0.4);
      transition: all 0.2s ease;
      letter-spacing: 0.01em;
    }
    #cogno-pwa-install-btn:hover {
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37,99,235,0.5);
    }
    #cogno-pwa-install-btn:active { transform: scale(0.97); }
    #cogno-pwa-dismiss-btn {
      background: transparent;
      color: #9ca3af;
      border: none;
      border-radius: 8px;
      padding: 6px 10px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: color 0.2s ease;
    }
    #cogno-pwa-dismiss-btn:hover { color: #6b7280; }
    #cogno-pwa-close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.07);
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      line-height: 1;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    [data-theme="dark"] #cogno-pwa-close-btn { background: rgba(255,255,255,0.1); }
    #cogno-pwa-close-btn:hover { background: #ef4444; color: #fff; }
    /* iOS instructions overlay */
    #cogno-ios-tip {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99998;
      padding: 0 16px 16px;
      transform: translateY(110%);
      transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
    }
    #cogno-ios-tip.visible {
      transform: translateY(0);
      pointer-events: all;
    }
    #cogno-ios-tip-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 20px 20px 18px;
      box-shadow: 0 -4px 40px rgba(0,0,0,0.18);
      max-width: 480px;
      margin: 0 auto;
      position: relative;
      text-align: center;
    }
    [data-theme="dark"] #cogno-ios-tip-card {
      background: #1e2433;
    }
    #cogno-ios-tip-card h4 {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0d1117;
      margin-bottom: 10px;
    }
    [data-theme="dark"] #cogno-ios-tip-card h4 { color: #f0f6fc; }
    #cogno-ios-tip-card p {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 0.82rem;
      color: #6b7280;
      line-height: 1.6;
    }
    [data-theme="dark"] #cogno-ios-tip-card p { color: #8b949e; }
    #cogno-ios-tip-card .ios-step {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(37,99,235,0.08);
      border-radius: 8px;
      padding: 4px 10px;
      margin: 4px 2px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #2563eb;
    }
    #cogno-ios-tip-card .arrow-down {
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid #ffffff;
    }
    [data-theme="dark"] #cogno-ios-tip-card .arrow-down { border-top-color: #1e2433; }
    #cogno-ios-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.07);
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.7rem;
      transition: all 0.2s;
    }
    #cogno-ios-close:hover { background: #ef4444; color: #fff; }
  `;
  document.head.appendChild(style);

  // ── Helper: Is iOS? ────────────────────────────────────────
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function isMobileOrTablet() {
    return /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent) ||
      window.innerWidth <= 900;
  }

  // ── Build Android/Desktop Banner ───────────────────────────
  function buildBanner() {
    const banner = document.createElement('div');
    banner.id = 'cogno-pwa-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install Cogno Solution App');
    banner.innerHTML = `
      <div id="cogno-pwa-card">
        <button id="cogno-pwa-close-btn" aria-label="Close install prompt" title="Close">✕</button>
        <div id="cogno-pwa-app-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <div id="cogno-pwa-text">
          <strong>Install Cogno Solution</strong>
          <span>Add to your home screen for the best experience — fast, offline-ready!</span>
        </div>
        <div id="cogno-pwa-actions">
          <button id="cogno-pwa-install-btn">📲 Install</button>
          <button id="cogno-pwa-dismiss-btn">Not now</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cogno-pwa-install-btn').addEventListener('click', installApp);
    document.getElementById('cogno-pwa-dismiss-btn').addEventListener('click', dismissBanner);
    document.getElementById('cogno-pwa-close-btn').addEventListener('click', dismissBanner);

    return banner;
  }

  // ── Build iOS Banner ───────────────────────────────────────
  function buildIOSTip() {
    const tip = document.createElement('div');
    tip.id = 'cogno-ios-tip';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', 'iOS install instructions');
    tip.innerHTML = `
      <div id="cogno-ios-tip-card">
        <button id="cogno-ios-close" aria-label="Close">✕</button>
        <h4>📲 Install Cogno Solution</h4>
        <p>Add this app to your home screen for the best experience!</p>
        <br>
        <p>
          <span class="ios-step">1️⃣ Tap <strong>Share</strong> button <strong>⎙</strong></span>
          <span class="ios-step">2️⃣ Scroll down & tap <strong>Add to Home Screen</strong></span>
          <span class="ios-step">3️⃣ Tap <strong>Add</strong> to confirm</span>
        </p>
        <div class="arrow-down"></div>
      </div>
    `;
    document.body.appendChild(tip);
    document.getElementById('cogno-ios-close').addEventListener('click', dismissIOSTip);
    return tip;
  }

  // ── Show/Hide Logic ────────────────────────────────────────
  let bannerEl = null;
  let iosTipEl = null;

  function showBanner() {
    if (!bannerEl) bannerEl = buildBanner();
    requestAnimationFrame(() => bannerEl.classList.add('visible'));
  }

  function hideBanner() {
    if (bannerEl) {
      bannerEl.classList.remove('visible');
      setTimeout(() => {
        bannerEl?.remove();
        bannerEl = null;
      }, 500);
    }
  }

  function dismissBanner() {
    hideBanner();
    sessionStorage.setItem(DISMISSED_KEY, '1');
  }

  function showIOSTip() {
    if (!iosTipEl) iosTipEl = buildIOSTip();
    requestAnimationFrame(() => iosTipEl.classList.add('visible'));
  }

  function hideIOSTip() {
    if (iosTipEl) {
      iosTipEl.classList.remove('visible');
      setTimeout(() => {
        iosTipEl?.remove();
        iosTipEl = null;
      }, 500);
    }
  }

  function dismissIOSTip() {
    hideIOSTip();
    sessionStorage.setItem(DISMISSED_KEY, '1');
  }

  // ── Install App ────────────────────────────────────────────
  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, '1');
    }
    deferredPrompt = null;
    hideBanner();
  }

  // ── Service Worker Registration ────────────────────────────
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // ── Main Init ──────────────────────────────────────────────
  function init() {
    // Register the service worker
    registerServiceWorker();

    // Don't show if already installed or dismissed in this session
    if (
      localStorage.getItem(INSTALLED_KEY) === '1' ||
      sessionStorage.getItem(DISMISSED_KEY) === '1' ||
      isInStandaloneMode()
    ) {
      return;
    }

    // iOS: show tip after a delay
    if (isIOS() && isMobileOrTablet()) {
      setTimeout(showIOSTip, 3500);
      return;
    }

    // Android/Chrome: wait for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Only show on mobile/tablet, or always show (adjust to taste)
      if (isMobileOrTablet()) {
        setTimeout(showBanner, 3000);
      }
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      hideBanner();
      console.log('[PWA] App installed successfully!');
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
