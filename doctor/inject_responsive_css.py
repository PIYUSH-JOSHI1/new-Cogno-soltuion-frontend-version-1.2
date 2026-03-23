"""
Inject page-specific responsive CSS into schedule.html, consultations.html, reports.html.
"""
import os

BASE = r'c:\Users\Piyush\Downloads\cognoflask-main (2)\cognoflask-main\frontend\doctor'

# ─────────────────────────── SCHEDULE ─────────────────────────────
SCHED_RESPONSIVE = """\
        /* ── Schedule page – responsive ── */
        .content { padding: 1rem; max-width: 1200px; margin: 0 auto; }
        @media (min-width: 768px) { .content { padding: 1.5rem; } }

        /* Form inputs & selects dark-mode aware */
        .form-group select,
        .form-group input,
        .form-group textarea,
        .dropdown-menu {
            background: var(--card);
            color: var(--text);
            border-color: var(--border);
        }
        .dropdown-menu { border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
        .dropdown-menu button { color: var(--text); }
        .dropdown-menu button:hover { background: var(--border); }
        .dropdown-menu button.danger { color: var(--danger); }
        .modal-content { background: var(--card); color: var(--text); }
        .modal-header { border-bottom: 1px solid var(--border); }
        .modal-footer { border-top: 1px solid var(--border); }
        .btn-outline { background: var(--card); border: 1px solid var(--border); color: var(--text); }

        /* Calendar responsive */
        @media (max-width: 900px) {
            .week-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 600px) {
            .week-grid { grid-template-columns: repeat(2, 1fr); }
            .calendar-header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
            .calendar-nav { justify-content: space-between; }
            .calendar-nav h2 { min-width: unset; font-size: 1rem; }
            .view-tabs button { padding: 0.4rem 0.65rem; font-size: 0.8rem; }
            .apt-card { flex-direction: column; align-items: flex-start; }
            .apt-actions { flex-direction: row; width: 100%; }
            .apt-actions .btn { flex: 1; justify-content: center; }
        }
"""

# ─────────────────────────── CONSULTATIONS ─────────────────────────
CONSULT_RESPONSIVE = """\
        /* ── Consultations page – responsive ── */
        .content { padding: 1rem; max-width: 900px; margin: 0 auto; }
        @media (min-width: 768px) { .content { padding: 1.5rem; } }

        /* Dark-mode cards */
        .quick-action-card { background: var(--card); border: 1px solid var(--border); color: var(--text); }
        .quick-action-card .icon { background: var(--primary-light); color: var(--primary); }
        .consultation-card { background: var(--card); border: 1px solid var(--border); color: var(--text); }
        .consultation-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
        .consultation-info h3 { color: var(--text); }
        .consultation-info p { color: var(--text-muted); }
        .consultation-meta { color: var(--text-muted); }
        .tabs { background: var(--card); border: 1px solid var(--border); }
        .tab { color: var(--text-muted); }
        .tab:hover { background: var(--border); color: var(--text); }
        .btn-outline { background: var(--card); border: 1px solid var(--border); color: var(--text); }

        @media (max-width: 600px) {
            .quick-actions { grid-template-columns: 1fr; }
            .consultation-card { flex-direction: column; align-items: flex-start; }
            .consultation-actions { flex-direction: row; width: 100%; }
            .consultation-actions .btn { flex: 1; justify-content: center; }
            .tabs { flex-wrap: wrap; }
            .tab { flex: 1; min-width: 80px; font-size: 0.8rem; padding: 0.6rem 0.5rem; }
        }
"""

# ─────────────────────────── REPORTS ─────────────────────────────
REPORTS_RESPONSIVE = """\
        /* ── Reports page – responsive ── */
        .content { padding: 1rem; max-width: 1200px; margin: 0 auto; }
        @media (min-width: 768px) { .content { padding: 1.5rem; } }

        /* Dark-mode modal + form */
        .modal-content { background: var(--card); color: var(--text); border: 1px solid var(--border); }
        .modal-header { border-bottom: 1px solid var(--border); }
        .modal-footer { border-top: 1px solid var(--border); }
        .form-group label { color: var(--text); }
        .form-group input,
        .form-group select,
        .form-group textarea {
            background: var(--card);
            color: var(--text);
            border: 1px solid var(--border);
        }
        .modal-close { color: var(--text-muted); }
        .btn-outline { background: var(--card); border: 1px solid var(--border); color: var(--text); }

        /* Table row hover */
        .reports-table tr:last-child td { border-bottom: none; }
        .reports-table tbody tr:hover { background: var(--border); }
        .report-icon { background: var(--primary-light); }

        @media (max-width: 768px) {
            .reports-table th:nth-child(3),
            .reports-table td:nth-child(3),
            .reports-table th:nth-child(4),
            .reports-table td:nth-child(4) { display: none; }
        }
        @media (max-width: 600px) {
            .stats-row { grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
            .stat-card { padding: 0.85rem 0.5rem; }
            .stat-card .number { font-size: 1.35rem; }
            .templates-grid { grid-template-columns: repeat(2, 1fr); }
            .section-header { flex-wrap: wrap; gap: 0.5rem; }
            .filters-bar { flex-direction: column; align-items: stretch; }
            .search-box { min-width: unset; }
            .filter-select { width: 100%; }
        }
"""

def inject_before_close_style(filename, css_block):
    path = os.path.join(BASE, filename)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    # Only inject if not already present
    marker = '/* ── ' + filename.split('.')[0].capitalize()[:10]
    if marker not in text and '/* ── Schedule' not in text and '/* ── Consult' not in text and '/* ── Reports' not in text:
        text = text.replace('</style>', css_block + '\n        </style>', 1)
    else:
        # Replace existing block
        import re
        text = re.sub(r'/\* ── .*?page – responsive ── \*/.*?(?=</style>)',
                      css_block + '\n        ', text, flags=re.DOTALL)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'  ✓  {filename}')


print('Injecting page-specific responsive CSS...')
inject_before_close_style('schedule.html', SCHED_RESPONSIVE)
inject_before_close_style('consultations.html', CONSULT_RESPONSIVE)
inject_before_close_style('reports.html', REPORTS_RESPONSIVE)
print('Done!')
