"""
Fix 3 issues:
1. messages.html - full dark theme for chat/panel areas (hardcoded white/light)
2. profile.html - avatar 'profile-avatar' id conflict + stats table uses wrong table name
3. Language globe icon - move it to topbar-right ONLY, remove from bottom-nav
"""
import os, re

BASE = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor'

# ─────────────────────── 1. MESSAGES DARK THEME ────────────────────────────
def fix_messages_dark_theme():
    path = os.path.join(BASE, 'messages.html')
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()

    DARK_CSS = """
        /* ── Messages page – dark theme overrides ── */
        [data-theme="dark"] body {
            background-color: #0f172a;
            color: #f1f5f9;
        }
        [data-theme="dark"] .messages-container {
            background: #1e293b;
            border-color: #334155;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }
        [data-theme="dark"] .conversations-panel {
            background: #1e293b;
            border-right-color: #334155;
        }
        [data-theme="dark"] .conversations-header {
            border-bottom-color: #334155;
        }
        [data-theme="dark"] .conversations-header h3 {
            color: #f1f5f9;
        }
        [data-theme="dark"] .search-box input {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
        }
        [data-theme="dark"] .search-box input::placeholder { color: #64748b; }
        [data-theme="dark"] .search-box input:focus {
            background: #1e293b;
            border-color: #3b82f6;
        }
        [data-theme="dark"] .conversation-item {
            border-bottom-color: #1e293b;
        }
        [data-theme="dark"] .conversation-item:hover {
            background: #334155;
        }
        [data-theme="dark"] .conversation-item.active {
            background: #1e3a5f;
            border-left-color: #3b82f6;
        }
        [data-theme="dark"] .conversation-name h4 { color: #f1f5f9; }
        [data-theme="dark"] .conversation-preview { color: #94a3b8; }
        [data-theme="dark"] .conversation-time { color: #64748b; }
        [data-theme="dark"] .avatar {
            background: #334155;
            color: #94a3b8;
        }
        [data-theme="dark"] .chat-panel {
            background: #0f172a;
        }
        [data-theme="dark"] .chat-header {
            background: #1e293b;
            border-bottom-color: #334155;
        }
        [data-theme="dark"] .name-row h3 { color: #f1f5f9; }
        [data-theme="dark"] .chat-messages {
            background: #0f172a;
        }
        [data-theme="dark"] .message.received .message-content {
            background: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
        }
        [data-theme="dark"] .chat-input-area {
            background: #1e293b;
            border-top-color: #334155;
        }
        [data-theme="dark"] #message-input {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
        }
        [data-theme="dark"] #message-input::placeholder { color: #64748b; }
        [data-theme="dark"] #message-input:focus {
            background: #1e293b;
            border-color: #3b82f6;
        }
        [data-theme="dark"] .attach-btn {
            background: #334155;
            border-color: #475569;
            color: #94a3b8;
        }
        [data-theme="dark"] .attach-btn:hover {
            background: #1e3a5f;
            color: #3b82f6;
            border-color: #3b82f6;
        }
        [data-theme="dark"] .bottom-nav {
            background: #1e293b;
            border-top-color: #334155;
        }
        [data-theme="dark"] .profile-menu {
            background: #1e293b;
            border-color: #334155;
        }
        [data-theme="dark"] .profile-menu-header {
            border-bottom-color: #334155;
        }
        [data-theme="dark"] .profile-menu-item { color: #f1f5f9; }
        [data-theme="dark"] .profile-menu-item:hover { background: #334155; }
        [data-theme="dark"] .profile-menu-item i { color: #94a3b8; }
        [data-theme="dark"] .notifications-panel {
            background: #1e293b;
            border-color: #334155;
        }
        [data-theme="dark"] .notifications-header {
            border-bottom-color: #334155;
        }
        [data-theme="dark"] .notifications-header h4 { color: #f1f5f9; }
        [data-theme="dark"] .chat-empty {
            background: #0f172a;
        }
        [data-theme="dark"] .chat-empty h3 { color: #f1f5f9; }
        [data-theme="dark"] .chat-empty p { color: #94a3b8; }
        /* Also fix mobile chat-panel white bg */
        [data-theme="dark"] @media (max-width: 900px) {
            .chat-panel { background: #0f172a !important; }
        }
"""

    # Inject before </style>
    if 'Messages page – dark theme' not in t:
        t = t.replace('</style>', DARK_CSS + '\n    </style>', 1)

    # Also fix the body hardcoded bg
    t = t.replace(
        'background-color: #f1f5f9; /* Slightly darker gray for better card contrast */',
        'background-color: var(--bg-color);'
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(t)
    print('  ✓  messages.html - dark theme')


# ─────────────────────── 2. PROFILE - Fix avatar ID conflict + stats table ──
def fix_profile_avatar():
    path = os.path.join(BASE, 'profile.html')
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()

    # The profile header has id="profile-avatar" AND topbar also has id="profile-avatar"
    # This causes loadDoctorHeader to overwrite the large avatar with just initials text
    # Fix: rename the large profile avatar in the header to id="profile-avatar-large"
    t = t.replace(
        '<div class="profile-avatar-large" id="profile-avatar">',
        '<div class="profile-avatar-large" id="profile-avatar-large">'
    )

    # Fix loadProfile() - it references profile-avatar (should be profile-avatar-large)
    t = t.replace(
        "document.getElementById('profile-avatar').innerHTML = `\n                            <img src=\"${profile.avatar_url}\" alt=\"Avatar\">",
        "document.getElementById('profile-avatar-large').innerHTML = `\n                            <img src=\"${profile.avatar_url}\" alt=\"Avatar\">"
    )
    t = t.replace(
        "document.getElementById('profile-avatar').innerHTML = `\n                            ${initial}",
        "document.getElementById('profile-avatar-large').innerHTML = `\n                            ${initial}"
    )

    # Fix stats - wrong table name doctor_patient_relationships (should be doctor_patients)
    t = t.replace(
        ".from('doctor_patient_relationships')",
        ".from('doctor_patients')"
    )
    # Fix wrong consultations table
    t = t.replace(
        ".from('doctor_schedule')\n                    .select('*', { count: 'exact', head: true })\n                    .eq('doctor_id', doctorId)\n                    .eq('status', 'completed')",
        ".from('consultations')\n                    .select('*', { count: 'exact', head: true })\n                    .eq('doctor_id', doctorId)\n                    .eq('status', 'completed')"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(t)
    print('  ✓  profile.html - avatar ID conflict & stats tables fixed')


# ─────────────────────── 3. LANGUAGE ICON - topbar only, hidden when tiny ──
def fix_lang_icon_visibility():
    """
    On desktop the lang button is in the topbar. Just make sure it's always visible.
    The issue is z-index conflict with bottom nav on desktop when the dropdown opens.
    """
    pages = ['messages.html', 'schedule.html', 'consultations.html', 'reports.html',
             'dashboard.html', 'patients.html', 'profile.html']

    LANG_TOPBAR_CSS = """
        /* ── Language button – always visible in topbar ── */
        #lang-btn { display: flex !important; }
        #lang-menu { z-index: 2000 !important; }
        /* On very small screens, hide text labels in topbar to save space */
        @media (max-width: 400px) {
            .topbar-title { display: none; }
        }
"""

    for filename in pages:
        p = os.path.join(BASE, filename)
        if not os.path.exists(p):
            continue
        with open(p, 'r', encoding='utf-8') as f:
            t = f.read()

        if 'Language button – always visible' not in t:
            t = t.replace('</style>', LANG_TOPBAR_CSS + '\n    </style>', 1)

        # Also ensure lang-menu uses var(--card) and var(--border) fallbacks for dark mode
        t = t.replace(
            'background:var(--card); border:1px solid var(--border);',
            'background:var(--card, #1e293b); border:1px solid var(--border, #334155);'
        )

        with open(p, 'w', encoding='utf-8') as f:
            f.write(t)
        print(f'  ✓  {filename} - lang z-index fix')


print('Fixing messages dark theme, profile avatar, lang icon...')
fix_messages_dark_theme()
fix_profile_avatar()
fix_lang_icon_visibility()
print('Done!')
