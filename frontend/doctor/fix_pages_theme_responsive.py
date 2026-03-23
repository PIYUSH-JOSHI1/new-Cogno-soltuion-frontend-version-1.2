"""
Apply dashboard-matching dark theme + responsive mobile CSS to:
  - schedule.html
  - consultations.html
  - reports.html
"""
import re, os

BASE = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor'

# ──────────────────────────────────────────────────────────────
# Shared CSS block to INJECT at top of <style> (replaces whatever :root block exists)
# Mirrors dashboard.html exactly.
# ──────────────────────────────────────────────────────────────
SHARED_VARS = """\
        :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --primary-light: #eff6ff;
            --success: #10b981;
            --success-light: #d1fae5;
            --warning: #f59e0b;
            --warning-light: #fef3c7;
            --danger: #ef4444;
            --danger-light: #fee2e2;
            --info: #06b6d4;
            --info-light: #cffafe;
            --bg: #f5f7fa;
            --card: #ffffff;
            --text: #1f2937;
            --text-muted: #6b7280;
            --border: #e5e7eb;
        }
        [data-theme="dark"] {
            --bg: #0f172a;
            --card: #1e293b;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --border: #334155;
            --primary-light: #1e3a5f;
            --success-light: #064e3b;
            --warning-light: #451a03;
            --danger-light: #450a0a;
            --info-light: #164e63;
        }
"""

# ──────────────────────────────────────────────────────────────
# Full shared topbar + profile menu + bottom-nav CSS block
# (replaces the old --tg-xxx block that was appended to every page)
# ──────────────────────────────────────────────────────────────
SHARED_TOPBAR_CSS = """\
        /* ── Topbar & Profile Dropdown (shared across all doctor pages) ── */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding-bottom: 80px;
            transition: background 0.3s, color 0.3s;
        }
        .topbar { background: var(--card); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 1000; height: 64px; }
        .topbar-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; }
        .topbar-logo { width: 36px; height: 36px; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
        .topbar-title { font-size: 1.1rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-right { display: flex; align-items: center; gap: 0.5rem; }
        .topbar-btn { position: relative; width: 40px; height: 40px; border-radius: 10px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all 0.2s; color: var(--text-muted); }
        .topbar-btn:hover { background: var(--border); color: var(--text); }
        .topbar-btn .badge { position: absolute; top: 6px; right: 6px; min-width: 18px; height: 18px; background: var(--danger); color: white; border-radius: 50%; font-size: 0.65rem; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

        /* Profile Dropdown */
        .profile-dropdown { position: relative; }
        .profile-btn { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.6rem; border-radius: 10px; border: none; background: transparent; cursor: pointer; transition: all 0.2s; color: var(--text); }
        .profile-btn:hover { background: var(--border); }
        .profile-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.85rem; overflow: hidden; flex-shrink: 0; }
        .profile-info { text-align: left; }
        .profile-info .name { font-size: 0.85rem; font-weight: 600; color: var(--text); line-height: 1.2; margin: 0; }
        .profile-info .role { font-size: 0.7rem; color: var(--text-muted); margin: 0; }
        .profile-chevron { font-size: 0.75rem; color: var(--text-muted); transition: transform 0.2s; }
        .profile-dropdown.open .profile-chevron { transform: rotate(180deg); }
        .profile-menu { position: absolute; top: calc(100% + 8px); right: 0; background: var(--card); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.15); min-width: 240px; padding: 0.5rem; display: none !important; z-index: 1100; }
        .profile-menu.show { display: block !important; animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .profile-menu-header { padding: 0.75rem; border-bottom: 1px solid var(--border); margin-bottom: 0.5rem; }
        .profile-menu-header .name { font-weight: 600; font-size: 0.95rem; color: var(--text); }
        .profile-menu-header .email { font-size: 0.75rem; color: var(--primary); }
        .profile-menu-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.75rem; border-radius: 8px; cursor: pointer; text-decoration: none; font-size: 0.85rem; transition: background 0.2s; border: none; background: transparent; width: 100%; color: var(--text); }
        .profile-menu-item:hover { background: var(--border); }
        .profile-menu-item i { width: 20px; color: var(--text-muted); }
        .profile-menu-item.danger { color: var(--danger); }
        .profile-menu-item.danger i { color: var(--danger); }
        .theme-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0.75rem; border-radius: 8px; cursor: pointer; }
        .theme-toggle-row:hover { background: var(--border); }
        .theme-toggle-left { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text); }
        .theme-toggle-left i { width: 20px; color: var(--text-muted); }
        .theme-switch { position: relative; width: 44px; height: 24px; }
        .theme-switch input { opacity: 0; width: 0; height: 0; }
        .theme-slider { position: absolute; cursor: pointer; inset: 0; background: var(--border); transition: 0.3s; border-radius: 24px; }
        .theme-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; transition: 0.3s; border-radius: 50%; }
        input:checked + .theme-slider { background: var(--primary); }
        input:checked + .theme-slider:before { transform: translateX(20px); }
        .menu-divider { height: 1px; background: var(--border); margin: 0.5rem 0; }
        .dropdown-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1050; display: none; }
        .dropdown-overlay.show { display: block; }

        /* Notifications Panel */
        .notifications-panel { position: absolute; top: calc(100% + 8px); right: 0; background: var(--card); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 40px rgba(0,0,0,0.15); width: 300px; max-height: 400px; overflow: hidden; display: none !important; z-index: 1100; }
        .notifications-panel.show { display: block !important; animation: slideDown 0.2s ease; }
        .notifications-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .notifications-header h4 { font-size: 0.95rem; font-weight: 600; margin: 0; color: var(--text); }
        .notifications-header button { font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer; }
        .notifications-empty { padding: 2rem; text-align: center; color: var(--text-muted); }
        .notifications-list { max-height: 320px; overflow-y: auto; }

        /* Bottom Navigation */
        .bottom-nav {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--card);
            border-top: 1px solid var(--border);
            padding: 0.5rem 0.75rem;
            display: flex;
            justify-content: space-around;
            z-index: 1000;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
        }
        .nav-btn, .bottom-nav .nav-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.4rem 0.75rem;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-muted);
            font-size: 0.65rem;
            border-radius: 10px;
            text-decoration: none;
            min-width: 50px;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .nav-btn i, .bottom-nav .nav-btn i { font-size: 1.15rem; margin-bottom: 0.2rem; }
        .nav-btn:hover, .bottom-nav .nav-btn:hover { background: var(--border); color: var(--text); }
        .nav-btn.active, .bottom-nav .nav-btn.active { color: var(--primary); background: var(--primary-light); }

        /* Responsive topbar */
        @media (max-width: 600px) {
            .topbar { padding: 0.5rem 0.75rem; height: 56px; gap: 0.5rem; }
            .topbar-right { gap: 2px; }
            .topbar-btn { width: 34px; height: 34px; font-size: 1rem; }
            .profile-info { display: none; }
            .topbar-title { font-size: 0.95rem; }
            .notifications-panel { width: calc(100vw - 1.5rem); right: -0.5rem; }
            .profile-menu { width: calc(100vw - 2rem); right: -1rem; }
        }
"""

def strip_old_root_blocks(text):
    """Remove any :root{} and [data-theme="dark"]{} and old shared topbar block."""
    # Remove the shared-topbar comment block that was injected before
    text = re.sub(
        r'/\* === SHARED TOPBAR CSS === \*/.*?\.notifications-empty \{[^}]+\}',
        '', text, flags=re.DOTALL
    )
    return text

def strip_old_style_block_header(text):
    """Remove any standalone * {} body {} or :root {} before we reinjec them."""
    # We'll keep the page-specific custom CSS and inject our shared block at top
    return text

def apply_to_file(filename):
    path = os.path.join(BASE, filename)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Remove the old shared topbar block (with --tg- variables)
    text = strip_old_root_blocks(text)

    # 2. Replace any old :root { ... } that only has --tg vars
    text = re.sub(
        r'\s*:root \{[^}]*--tg-card[^}]*\}\s*\[data-theme="dark"\] \{[^}]*--tg-card[^}]*\}',
        '', text, flags=re.DOTALL
    )

    # 3. Inject our shared vars block right after <style>
    # But only if we haven't already done so (check for --primary: #3b82f6)
    if '--primary: #3b82f6' not in text:
        text = text.replace('<style>', '<style>\n' + SHARED_VARS, 1)

    # 4. Remove any old duplicate * { box-sizing } / body { font-family... background: #f5f7fa }
    #    and old static profile-dropdown CSS (those will come from shared block)
    text = re.sub(r'\s*\* \{ box-sizing: border-box;[^}]*\}\s*', '\n', text, count=1)
    text = re.sub(r'\s*body \{[^}]*font-family[^}]*\'Inter\'[^}]*\}', '', text, count=1)

    # 5. Inject shared topbar CSS block just before </style>
    if '/* ── Topbar & Profile Dropdown' not in text:
        text = text.replace('</style>', SHARED_TOPBAR_CSS + '\n        </style>', 1)

    # 6. Replace remaining hardcoded colours with CSS variables
    replacements = [
        # backgrounds
        ('background: white;', 'background: var(--card);'),
        ('background: #ffffff;', 'background: var(--card);'),
        ('background: #f5f7fa;', 'background: var(--bg);'),
        ('background: #f9fafb;', 'background: var(--border);'),
        ('background: #f3f4f6;', 'background: var(--border);'),
        ('background: #f1f5f9;', 'background: var(--border);'),
        ('background: #e5e7eb;', 'background: var(--border);'),
        ('background: #eff6ff;', 'background: var(--primary-light);'),
        # borders
        ('border: 1px solid #e5e7eb;', 'border: 1px solid var(--border);'),
        ('border-bottom: 1px solid #e5e7eb;', 'border-bottom: 1px solid var(--border);'),
        ('border-top: 1px solid #e5e7eb;', 'border-top: 1px solid var(--border);'),
        ('border-bottom: 1px solid #f3f4f6;', 'border-bottom: 1px solid var(--border);'),
        ('border: 1px solid var(--border);\n            border-radius: 8px;\n            font-size: 0.95rem;',
         'border: 1px solid var(--border);\n            border-radius: 8px;\n            font-size: 0.95rem;\n            background: var(--card);\n            color: var(--text);'),
        # text colours
        ('color: #1f2937;', 'color: var(--text);'),
        ('color: #374151;', 'color: var(--text);'),
        ('color: #6b7280;', 'color: var(--text-muted);'),
        ('color: #9ca3af;', 'color: var(--text-muted);'),
        # hover backgrounds
        ('background: #f3f4f6;', 'background: var(--border);'),
        ('background: #dbeafe;', 'background: var(--primary-light);'),
        # calendar/schedule page specific
        ('background: #f9fafb;\n        }', 'background: var(--bg);\n        }'),
    ]
    for old, new in replacements:
        text = text.replace(old, new)

    # 7. Also translate --tg- references if any remain
    text = text.replace('var(--tg-card)', 'var(--card)')
    text = text.replace('var(--tg-border)', 'var(--border)')
    text = text.replace('var(--tg-text)', 'var(--text)')
    text = text.replace('var(--tg-text-muted)', 'var(--text-muted)')
    text = text.replace('var(--tg-bg', 'var(--bg')
    text = text.replace('var(--tg-hover)', 'var(--border)')
    text = text.replace('var(--tg-active-bg', 'var(--primary-light)')
    text = text.replace('var(--tg-icon-bg', 'var(--primary-light)')

    # 8. Remove leftover empty :root / [data-theme] blocks that only had tg vars
    text = re.sub(r'\s*:root \{\s*\}\s*', '\n', text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'  ✓  {filename}')


pages = ['schedule.html', 'consultations.html', 'reports.html']
print('Applying shared dashboard theme + responsive CSS...')
for p in pages:
    apply_to_file(p)
print('Done!')
