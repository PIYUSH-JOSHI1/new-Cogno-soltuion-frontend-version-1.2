/**
 * COGNO SOLUTION - Internationalization (i18n) Engine using Google Translate API
 * Supports: English (en), Hindi (hi), Marathi (mr)
 * 
 * Automatically translates the entire DOM dynamically without needing manual JSON files.
 */

const CognoI18n = {
    // State
    currentLang: 'en',
    supportedLanguages: [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'mr', name: 'Marathi', flag: '🇮🇳' }
    ],
    initialized: false,
    _callbacks: [],

    /**
     * Initialize the Google Translate i18n system
     */
    async init() {
        // Prevent double init
        if (this.initialized) return;

        // 1. Get saved language preference
        this.currentLang = localStorage.getItem('cogno_language') || 'en';

        // 2. Inject Google Translate hidden container
        const gtContainer = document.createElement('div');
        gtContainer.id = 'google_translate_element';
        gtContainer.style.display = 'none'; // Hide the default Google UI entirely
        document.body.appendChild(gtContainer);

        // 3. Define the Global Callback that Google Translate script looks for
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi,mr',
                autoDisplay: false
            }, 'google_translate_element');
        };

        // 4. Set the initial language cookie so Google translates immediately on load
        if (this.currentLang !== 'en') {
            const domain = window.location.hostname;
            document.cookie = `googtrans=/en/${this.currentLang}; path=/; domain=${domain}`;
            document.cookie = `googtrans=/en/${this.currentLang}; path=/;`;
        } else {
            // Unset translation cookie if english
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }

        // 5. Inject the actual Google Translate Script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);

        // 6. Inject our custom Language Switcher UI
        this._injectLanguageSwitcher();

        // 7. Inject Google Translate CSS fix to hide the top translating bar
        this._injectCSSOverrides();

        this.initialized = true;

        console.log(`🌐 CognoI18n (Google Translate) initialized: ${this.currentLang}`);

        // Fire any waiting callbacks
        this._callbacks.forEach(cb => cb(this.currentLang));
        this._callbacks = [];
    },

    /**
     * Return english fallback (Google Translate will automatically translate it once it mounts to DOM)
     */
    t(keyPath, fallback) {
        return fallback || keyPath.split('.').pop().replace(/_/g, ' ');
    },

    /**
     * Switch the current language dynamically
     */
    async setLanguage(langCode) {
        if (langCode === this.currentLang) return;
        if (!this.supportedLanguages.find(l => l.code === langCode)) {
            console.warn(`CognoI18n: Unsupported language "${langCode}"`);
            return;
        }

        this.currentLang = langCode;

        // Save to localStorage
        localStorage.setItem('cogno_language', langCode);

        // Dispatch custom event for settings page
        window.dispatchEvent(new Event('cogno-language-changed'));

        // Save to Supabase profile (if logged in)
        this._saveToProfile(langCode);

        const select = document.querySelector('select.goog-te-combo');
        
        if (langCode === 'en') {
            // To reliably return to the base language, we must clear the Google Translate cookies and reload
            const domain = window.location.hostname;
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            if (select) {
                select.value = '';
                select.dispatchEvent(new Event('change'));
            }
            
            // Allow state to save before reload
            setTimeout(() => window.location.reload(), 100);
            return;
        }

        // Update the Google Translate Widget
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            // Fallback: set cookie and reload
            const domain = window.location.hostname;
            document.cookie = `googtrans=/en/${this.currentLang}; path=/; domain=${domain}`;
            document.cookie = `googtrans=/en/${this.currentLang}; path=/;`;
            window.location.reload();
        }

        // Update our custom UI
        this._updateSwitcherUI();
    },

    /**
     * Callbacks for when system is ready
     */
    onReady(callback) {
        if (this.initialized) {
            callback(this.currentLang);
        } else {
            this._callbacks.push(callback);
        }
    },

    /* =========================================================
     * UI INJECTION STRATEGIES
     * ========================================================= */

    _injectCSSOverrides() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Hide the Google Translate Top Bar Completely */
            .goog-te-banner-frame { display: none !important; }
            iframe.goog-te-banner-frame { display: none !important; }
            .skiptranslate > iframe { display: none !important; }
            body { top: 0px !important; position: static !important; }
            
            /* Hide Google Tooltips & Popups */
            #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
            .goog-tooltip { display: none !important; }
            .goog-tooltip:hover { display: none !important; }
            .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
            
            /* Custom Switcher UI */
            .cogno-lang-switcher {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 1200;
                y-index:100;
                font-family: 'Inter', sans-serif;
            }
            
            /* Mobile - must clear bottom nav (~75px) + chat input (~75px) + gap */
            @media (max-width: 768px) {
                .cogno-lang-switcher {
                    bottom: 160px;
                    right: 12px;
                }
            }

            /* Very small mobile - move it left more */
            @media (max-width: 400px) {
                .cogno-lang-switcher {
                    bottom: 160px;
                    right: 8px;
                }
            }
            .cogno-lang-pill {
                display: flex;
                align-items: center;
                gap: 8px;
                background: white;
                color: #1e293b;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 30px;
                padding: 10px 16px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .cogno-lang-pill:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
                border-color: #3b82f6;
            }
            [data-theme="dark"] .cogno-lang-pill {
                background: #1e293b;
                color: white;
                border-color: #334155;
            }
            .cogno-lang-menu {
                position: absolute;
                bottom: calc(100% + 12px);
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                border: 1px solid #e2e8f0;
                overflow: hidden;
                width: 200px;
                display: none;
                flex-direction: column;
                transform-origin: bottom right;
                animation: slideUp 0.2s ease;
            }
            [data-theme="dark"] .cogno-lang-menu {
                background: #1e293b;
                border-color: #334155;
            }
            .cogno-lang-menu.show {
                display: flex;
            }
            .cogno-lang-option {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid #f1f5f9;
                color: #1e293b;
            }
            [data-theme="dark"] .cogno-lang-option {
                border-bottom: 1px solid #334155;
                color: #f1f5f9;
            }
            .cogno-lang-option:last-child {
                border-bottom: none;
            }
            .cogno-lang-option:hover {
                background: #f8fafc;
            }
            [data-theme="dark"] .cogno-lang-option:hover {
                background: #334155;
            }
            .cogno-lang-option.active {
                background: #eff6ff;
                color: #3b82f6;
                font-weight: 700;
            }
            [data-theme="dark"] .cogno-lang-option.active {
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
            }
            .cogno-lang-flag {
                font-size: 18px;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(10px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    },

    _injectLanguageSwitcher() {
        const container = document.createElement('div');
        container.className = 'cogno-lang-switcher';

        // 1. Create the toggle pill
        this.pillBtn = document.createElement('button');
        this.pillBtn.className = 'cogno-lang-pill';
        container.appendChild(this.pillBtn);

        // 2. Create the dropdown menu
        this.menu = document.createElement('div');
        this.menu.className = 'cogno-lang-menu';

        this.supportedLanguages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'cogno-lang-option';
            option.dataset.lang = lang.code;

            option.innerHTML = `
                <span class="cogno-lang-flag">${lang.flag}</span>
                <span class="cogno-lang-name">${lang.name}</span>
            `;

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setLanguage(lang.code);
                this.menu.classList.remove('show');
            });

            this.menu.appendChild(option);
        });

        container.appendChild(this.menu);
        document.body.appendChild(container);

        // Drag functionality for mobile & desktop
        let isDragging = false;
        let wasDragged = false;
        let startX, startY;
        let startRight, startBottom;

        const onDragStart = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            
            const style = window.getComputedStyle(container);
            startRight = parseInt(style.right, 10) || 24;
            startBottom = parseInt(style.bottom, 10) || 24;
            
            isDragging = true;
            wasDragged = false;
            container.style.transition = 'none';
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const dx = clientX - startX;
            const dy = clientY - startY;
            
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                wasDragged = true;
            }
            
            if (wasDragged) {
                if (e.cancelable) e.preventDefault();
                let newRight = startRight - dx;
                let newBottom = startBottom - dy;
                
                const maxRight = window.innerWidth - container.offsetWidth - 10;
                const maxBottom = window.innerHeight - container.offsetHeight - 10;
                
                newRight = Math.max(10, Math.min(newRight, maxRight));
                newBottom = Math.max(10, Math.min(newBottom, maxBottom));
                
                container.style.right = newRight + 'px';
                container.style.bottom = newBottom + 'px';
            }
        };

        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            container.style.transition = '';
        };

        this.pillBtn.addEventListener('touchstart', onDragStart, { passive: true });
        this.pillBtn.addEventListener('mousedown', onDragStart);
        
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('mousemove', onDragMove);
        
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('mouseup', onDragEnd);

        // Toggle behavior
        this.pillBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (wasDragged) return; // Don't trigger if it was a drag
            this.menu.classList.toggle('show');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.menu.classList.remove('show');
            }
        });

        // Initial UI state
        this._updateSwitcherUI();
    },

    _updateSwitcherUI() {
        if (!this.pillBtn || !this.menu) return;

        const lang = this.supportedLanguages.find(l => l.code === this.currentLang) || this.supportedLanguages[0];

        this.pillBtn.innerHTML = `
            <span class="cogno-lang-flag notranslate">${lang.flag}</span>
            <span class="notranslate">${lang.code.toUpperCase()}</span>
            <i class="fa-solid fa-chevron-up" style="font-size: 10px; margin-left: 4px;"></i>
        `;

        // Update active class in menu
        this.menu.querySelectorAll('.cogno-lang-option').forEach(opt => {
            if (opt.dataset.lang === this.currentLang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    },

    _saveToProfile(langCode) {
        if (typeof CognoSupabase === 'undefined') return;

        CognoSupabase.getCurrentUser().then(({ user }) => {
            if (user) {
                CognoSupabase.client
                    .from('profiles')
                    .update({ language: langCode })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.error('CognoI18n: Failed to save to profile', error);
                    });
            }
        });
    }
};

// Auto-initialize when DOM load finishes
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CognoI18n.init());
} else {
    CognoI18n.init();
}
