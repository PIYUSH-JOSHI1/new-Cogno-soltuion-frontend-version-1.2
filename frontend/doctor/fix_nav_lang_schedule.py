"""
Fix 3 issues across pages:
1. Bottom nav styling to exactly match dashboard (dark bg, pill active state)
2. Translation / language icon on desktop topbar
3. schedule.html - fix dummy loadDoctorInfo() to use correct element IDs and call loadDoctorHeader()
"""
import os, re

BASE = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor'

# ─── 1. DASHBOARD-STYLE BOTTOM NAV CSS (for ALL pages) ───────────────────────
NAV_CSS_BLOCK = """\
        /* ── Bottom Nav – dashboard style ── */
        .bottom-nav {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--card);
            border-top: 1px solid var(--border);
            padding: 0.35rem 0.5rem;
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 -2px 16px rgba(0,0,0,0.10);
        }
        .nav-btn, .bottom-nav .nav-btn, .bottom-nav a {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.45rem 0.65rem;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-muted);
            font-size: 0.62rem;
            font-weight: 500;
            border-radius: 10px;
            text-decoration: none;
            min-width: 48px;
            transition: all 0.18s;
            font-family: 'Inter', sans-serif;
            line-height: 1;
            gap: 0.2rem;
        }
        .nav-btn i, .bottom-nav .nav-btn i, .bottom-nav a i {
            font-size: 1.2rem;
            display: block;
        }
        .nav-btn:hover, .bottom-nav .nav-btn:hover, .bottom-nav a:hover {
            background: var(--border);
            color: var(--text);
        }
        .nav-btn.active, .bottom-nav .nav-btn.active, .bottom-nav a.active {
            color: var(--primary);
            background: var(--primary-light);
            border-radius: 10px;
        }
"""

# ─── 2. TRANSLATION ICON (i18n language selector) ─────────────────────────────
# To be added in the topbar-right, before the bell icon
LANG_BTN_HTML = '''\
            <div style="position:relative;">
                <button class="topbar-btn" id="lang-btn" onclick="toggleLangMenu()" title="Language">
                    <i class="fa-solid fa-globe"></i>
                </button>
                <div id="lang-menu" style="display:none !important; position:absolute; top:calc(100% + 8px); right:0; background:var(--card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 32px rgba(0,0,0,0.18); min-width:160px; padding:0.4rem; z-index:1200;">
                    <button onclick="setLang(\'en\')" style="display:flex;align-items:center;gap:0.6rem;width:100%;padding:0.6rem 0.75rem;border:none;background:none;border-radius:8px;cursor:pointer;color:var(--text);font-size:0.85rem;font-family:\'Inter\',sans-serif;" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'none\'">🇬🇧 English</button>
                    <button onclick="setLang(\'hi\')" style="display:flex;align-items:center;gap:0.6rem;width:100%;padding:0.6rem 0.75rem;border:none;background:none;border-radius:8px;cursor:pointer;color:var(--text);font-size:0.85rem;font-family:\'Inter\',sans-serif;" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'none\'">🇮🇳 हिन्दी</button>
                    <button onclick="setLang(\'mr\')" style="display:flex;align-items:center;gap:0.6rem;width:100%;padding:0.6rem 0.75rem;border:none;background:none;border-radius:8px;cursor:pointer;color:var(--text);font-size:0.85rem;font-family:\'Inter\',sans-serif;" onmouseover="this.style.background=\'var(--border)\'" onmouseout="this.style.background=\'none\'">🇮🇳 मराठी</button>
                </div>
            </div>
'''

# Lang JS helper (tiny, to toggle the menu)
LANG_JS = """
        function toggleLangMenu() {
            const m = document.getElementById('lang-menu');
            if (!m) return;
            const showing = m.style.display !== 'none !important' && m.style.display === 'block';
            m.style.cssText = showing
                ? 'display:none !important; position:absolute; top:calc(100% + 8px); right:0; background:var(--card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 32px rgba(0,0,0,0.18); min-width:160px; padding:0.4rem; z-index:1200;'
                : 'display:block !important; position:absolute; top:calc(100% + 8px); right:0; background:var(--card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 32px rgba(0,0,0,0.18); min-width:160px; padding:0.4rem; z-index:1200;';
        }
        function setLang(lang) {
            localStorage.setItem('cogno_lang', lang);
            document.getElementById('lang-menu').style.cssText = 'display:none !important;';
            if (window.i18n && typeof window.i18n.setLanguage === 'function') {
                window.i18n.setLanguage(lang);
            } else if (typeof setLanguage === 'function') {
                setLanguage(lang);
            }
            location.reload();
        }
        document.addEventListener('click', function(e) {
            const btn = document.getElementById('lang-btn');
            const menu = document.getElementById('lang-menu');
            if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
                menu.style.cssText = 'display:none !important; position:absolute; top:calc(100% + 8px); right:0; background:var(--card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 32px rgba(0,0,0,0.18); min-width:160px; padding:0.4rem; z-index:1200;';
            }
        });
"""

def apply_to_file(filename, is_active, active_label):
    path = os.path.join(BASE, filename)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # ─── Remove old bottom-nav CSS blocks (replace them) ───
    # Remove any existing nav CSS blocks we injected
    text = re.sub(
        r'/\* ── Bottom Nav[^*]*\*/.*?(?=\n        /\*|\n        @media|\n        </style|\n        \.content)',
        '', text, flags=re.DOTALL
    )
    text = re.sub(
        r'\.nav-btn, \.bottom-nav \.nav-btn, \.bottom-nav a \{.*?\}',
        '', text, flags=re.DOTALL
    )
    # Remove old nav-btn block if present multiple times
    for pat in [
        r'\.nav-btn, \.bottom-nav \.nav-btn \{[^}]+\}',
        r'\.nav-btn i, \.bottom-nav \.nav-btn i \{[^}]+\}',
        r'\.nav-btn:hover, \.bottom-nav \.nav-btn:hover \{[^}]+\}',
        r'\.nav-btn\.active, \.bottom-nav \.nav-btn\.active \{[^}]+\}',
    ]:
        text = re.sub(pat, '', text, flags=re.DOTALL)

    # ─── Inject fresh nav CSS before </style> ───
    if '/* ── Bottom Nav – dashboard style ── */' not in text:
        text = text.replace('</style>', NAV_CSS_BLOCK + '\n        </style>', 1)

    # ─── Add language button to topbar (before notifications button) ───
    # Only add if not already present
    if 'lang-btn' not in text:
        # Insert before the notifications button wrapper
        text = text.replace(
            '<div style="position:relative;">\n                <button class="topbar-btn" id="notifications-btn"',
            LANG_BTN_HTML + '            <div style="position:relative;">\n                <button class="topbar-btn" id="notifications-btn"',
            1  # only replace first occurrence
        )

    # ─── Inject lang JS before </script> (first closing script tag of main script) ───
    if 'toggleLangMenu' not in text:
        # Insert before the closing of the first major <script> block
        text = text.replace('</script>', LANG_JS + '\n    </script>', 1)

    # ─── SCHEDULE specific: fix loadDoctorInfo to use topbar element IDs ───
    if filename == 'schedule.html':
        # The old code sets 'doctor-name' and 'doctor-avatar' - fix to use profile-name/profile-avatar
        text = text.replace(
            "document.getElementById('doctor-name').textContent = displayName;",
            "const nameEl = document.getElementById('profile-name');\n"
            "                    const menuNameEl = document.getElementById('menu-name');\n"
            "                    if (nameEl) nameEl.textContent = displayName;\n"
            "                    if (menuNameEl) menuNameEl.textContent = displayName;"
        )
        text = text.replace(
            "document.getElementById('doctor-avatar').textContent = initials;",
            "const avatarEl = document.getElementById('profile-avatar');\n"
            "                    if (avatarEl) avatarEl.textContent = initials;"
        )
        # Also ensure loadDoctorHeader() is called in DOMContentLoaded
        if 'loadDoctorHeader()' not in text:
            text = text.replace(
                '            // Get doctor info\n            await loadDoctorInfo();',
                '            // Get doctor info\n            await loadDoctorInfo();\n            loadDoctorHeader();'
            )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'  ✓  {filename}')


pages = [
    ('schedule.html', True, 'Schedule'),
    ('consultations.html', True, 'Consult'),
    ('reports.html', True, 'Reports'),
    ('dashboard.html', True, 'Home'),
    ('messages.html', True, 'Messages'),
    ('patients.html', True, 'Patients'),
]

print('Fixing bottom nav, language icon, schedule header...')
for p, active, label in pages:
    try:
        apply_to_file(p, active, label)
    except Exception as e:
        print(f'  ✗  {p}: {e}')

print('Done!')
