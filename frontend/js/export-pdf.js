// ===== COGNO SOLUTION — Official PDF Export =====
// Separated into its own file to prevent HTML parser from misinterpreting
// </style>, </head>, </body> tags inside template literals inside <script> blocks.

async function exportData() {
    const btn = document.getElementById('export-btn');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
    btn.disabled = true;

    try {
        const { data: { user } } = await CognoSupabase.client.auth.getUser();
        if (!user) { showToast('Not logged in', 'error'); return; }

        // Fetch all doctor data in parallel
        const [profileRes, patientsRes, consultRes, reportsRes] = await Promise.all([
            CognoSupabase.client.from('profiles').select('*').eq('id', user.id).single(),
            CognoSupabase.client.from('doctor_patients').select('patient_id').eq('doctor_id', user.id),
            CognoSupabase.client.from('consultations').select('*').eq('doctor_id', user.id).order('scheduled_at', { ascending: false }).limit(50),
            CognoSupabase.client.from('reports').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false }).limit(50)
        ]);

        const profile    = profileRes.data   || {};
        const patients   = patientsRes.data  || [];
        const consults   = consultRes.data   || [];
        const reports    = reportsRes.data   || [];
        const doctorName = profile.full_name || user.email.split('@')[0];
        const exportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const exportTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const docId      = 'CS-DOC-' + Date.now().toString(36).toUpperCase();

        const consultRows = consults.length > 0
            ? consults.map(c => `<tr>
                <td>${c.id ? c.id.toString().slice(0,8) : 'N/A'}</td>
                <td>${c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td><span class="pill ${(c.status||'pending').toLowerCase()}">${(c.status||'pending').toUpperCase()}</span></td>
                <td>${c.duration_minutes || '-'} min</td>
                <td>${c.notes ? c.notes.substring(0,45)+'...' : '-'}</td>
            </tr>`).join('')
            : '<tr><td colspan="5" class="empty-row">No consultations recorded</td></tr>';

        const reportRows = reports.length > 0
            ? reports.map(r => `<tr>
                <td>${r.id ? r.id.toString().slice(0,8) : 'N/A'}</td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td>${r.title || r.type || '-'}</td>
                <td>${r.status || '-'}</td>
            </tr>`).join('')
            : '<tr><td colspan="4" class="empty-row">No reports recorded</td></tr>';

        const settings = [
            { label: 'Dark Mode',           val: localStorage.getItem('cogno_theme') !== 'light' },
            { label: 'Email Notifications', val: localStorage.getItem('cogno_email_notif') !== 'false' },
            { label: 'Push Notifications',  val: localStorage.getItem('cogno_push_notif') !== 'false' },
            { label: 'Appt. Reminders',     val: localStorage.getItem('cogno_apt_reminder') !== 'false' },
            { label: 'Two-Factor Auth',      val: localStorage.getItem('cogno_two_factor') === 'true' },
            { label: 'Font Size',            val: true, text: localStorage.getItem('cogno_font_size') || 'Medium' }
        ];

        const settingsBadges = settings.map(s => `
            <div class="setting-badge">
                <span class="dot ${s.val ? 'on' : 'off'}"></span>
                <span>${s.label}: ${s.text || (s.val ? 'ON' : 'OFF')}</span>
            </div>`).join('');

        // Build PDF  using DOM manipulation in a new window (avoids </style> tag parsing issues)
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            showToast('Popup was blocked! Please allow popups and try again.', 'error');
            return;
        }

        const doc = printWindow.document;
        doc.open();
        doc.write('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">');
        doc.write('<title>Cogno Solution - Official Data Export ' + docId + '</title>');
        doc.write('<link rel="preconnect" href="https://fonts.googleapis.com">');
        doc.write('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">');
        doc.close();

        // Inject styles
        const style = doc.createElement('style');
        style.textContent = `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; font-size: 12px; }
            .header-banner { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #0891b2 100%); color: white; padding: 28px 40px 22px; display: flex; justify-content: space-between; align-items: center; }
            .logo-area { display: flex; align-items: center; gap: 16px; }
            .logo-box { width: 56px; height: 56px; background: rgba(255,255,255,0.18); border: 2px solid rgba(255,255,255,0.4); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: white; }
            .logo-text h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .logo-text p { font-size: 10px; opacity: 0.75; margin-top: 3px; letter-spacing: 2.5px; text-transform: uppercase; }
            .doc-meta { text-align: right; font-size: 10px; opacity: 0.9; line-height: 1.9; }
            .doc-meta strong { font-size: 12px; display: block; margin-bottom: 2px; }
            .gradient-divider { height: 5px; background: linear-gradient(90deg, #60a5fa, #06b6d4, #8b5cf6, #ec4899); }
            .doc-title-strip { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; }
            .doc-title-strip h2 { font-size: 15px; font-weight: 700; color: #1e293b; }
            .doc-id-badge { font-size: 10px; color: #64748b; font-family: monospace; background: #e2e8f0; padding: 4px 12px; border-radius: 6px; letter-spacing: 0.5px; }
            .content { padding: 28px 40px; }
            .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
            .stat-card { text-align: center; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .stat-card.blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #93c5fd; }
            .stat-card.teal { background: linear-gradient(135deg, #f0fdfa, #ccfbf1); border-color: #6ee7b7; }
            .stat-card.purple { background: linear-gradient(135deg, #faf5ff, #ede9fe); border-color: #c4b5fd; }
            .stat-card .num { font-size: 32px; font-weight: 800; color: #1e293b; line-height: 1; }
            .stat-card .lbl { font-size: 10px; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
            .section { margin-bottom: 30px; }
            .section-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: linear-gradient(135deg, #eff6ff, #f0f9ff); border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; margin-bottom: 14px; }
            .section-header .icon { font-size: 16px; }
            .section-header h3 { font-size: 13px; font-weight: 700; color: #1e293b; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
            .info-item .key { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
            .info-item .value { font-size: 13px; font-weight: 600; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            thead tr { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: white; }
            thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            tbody tr:nth-child(odd) { background: #ffffff; }
            tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; vertical-align: middle; }
            .empty-row { text-align: center; color: #94a3b8; padding: 1.5rem !important; }
            .pill { padding: 3px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
            .pill.completed { background: #d1fae5; color: #065f46; }
            .pill.scheduled { background: #dbeafe; color: #1e40af; }
            .pill.cancelled { background: #fee2e2; color: #991b1b; }
            .pill.pending { background: #fef3c7; color: #92400e; }
            .settings-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
            .setting-badge { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; background: #f8fafc; }
            .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
            .dot.on { background: #10b981; }
            .dot.off { background: #94a3b8; }
            .setting-badge span:last-child { font-size: 10px; color: #374151; }
            .seal-section { display: flex; justify-content: flex-end; align-items: flex-end; gap: 24px; padding: 16px 40px 10px; }
            .sign-area { text-align: center; }
            .sign-line { width: 150px; border-bottom: 1.5px solid #1e293b; height: 32px; margin-bottom: 4px; }
            .sign-name { font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 4px; }
            .sign-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
            .seal { width: 108px; height: 108px; border: 2.5px solid #2563eb; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; background: white; box-shadow: 0 0 0 4px rgba(37,99,235,0.08); }
            .seal::before { content: ''; position: absolute; inset: 5px; border: 1px dashed #2563eb; border-radius: 50%; opacity: 0.5; }
            .seal-icon { font-size: 22px; color: #2563eb; }
            .seal-text { font-size: 7.5px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4; text-align: center; margin-top: 3px; }
            .seal-verified { font-size: 8px; font-weight: 800; color: #1d4ed8; margin-top: 2px; letter-spacing: 1px; }
            .footer { border-top: 2px solid #e2e8f0; padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; margin-top: 8px; }
            .footer-left { font-size: 9px; color: #94a3b8; line-height: 1.7; }
            .footer-brand { font-weight: 800; color: #2563eb; font-size: 12px; display: block; margin-bottom: 2px; }
            .footer-right { text-align: right; font-size: 9px; color: #94a3b8; line-height: 1.7; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 72px; font-weight: 900; color: rgba(37,99,235,0.035); pointer-events: none; white-space: nowrap; z-index: 0; letter-spacing: 10px; user-select: none; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `;
        doc.head.appendChild(style);

        // Build body content
        const body = doc.body;

        body.innerHTML = `
            <div class="watermark">COGNO SOLUTION</div>

            <div class="header-banner">
                <div class="logo-area">
                    <div class="logo-box">C</div>
                    <div class="logo-text">
                        <h1>Cogno Solution</h1>
                        <p>Official Medical Data Export</p>
                    </div>
                </div>
                <div class="doc-meta">
                    <strong>&#128203; CERTIFIED MEDICAL RECORD</strong>
                    Document ID: ${docId}<br>
                    Date: ${exportDate} &nbsp;&bull;&nbsp; Time: ${exportTime}<br>
                    Doctor: ${doctorName}
                </div>
            </div>
            <div class="gradient-divider"></div>

            <div class="doc-title-strip">
                <h2>Doctor Profile &amp; Activity Report</h2>
                <span class="doc-id-badge">${docId}</span>
            </div>

            <div class="content">
                <div class="stats-row">
                    <div class="stat-card blue"><div class="num">${patients.length}</div><div class="lbl">&#128101; Total Patients</div></div>
                    <div class="stat-card teal"><div class="num">${consults.length}</div><div class="lbl">&#127909; Consultations</div></div>
                    <div class="stat-card purple"><div class="num">${reports.length}</div><div class="lbl">&#128196; Reports Filed</div></div>
                </div>

                <div class="section">
                    <div class="section-header"><span class="icon">&#128100;</span><h3>Doctor Information</h3></div>
                    <div class="info-grid">
                        <div class="info-item"><div class="key">Full Name</div><div class="value">${profile.full_name || 'N/A'}</div></div>
                        <div class="info-item"><div class="key">Email Address</div><div class="value">${user.email || 'N/A'}</div></div>
                        <div class="info-item"><div class="key">Specialization</div><div class="value">${profile.specialization || 'General Practitioner'}</div></div>
                        <div class="info-item"><div class="key">License / Registration</div><div class="value">${profile.license_number || profile.registration_number || 'N/A'}</div></div>
                        <div class="info-item"><div class="key">Phone</div><div class="value">${profile.phone || profile.contact || 'N/A'}</div></div>
                        <div class="info-item"><div class="key">Member Since</div><div class="value">${profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN') : new Date(user.created_at||Date.now()).toLocaleDateString('en-IN')}</div></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header"><span class="icon">&#127909;</span><h3>Consultation History (Last 50)</h3></div>
                    <table>
                        <thead><tr><th>Ref ID</th><th>Date</th><th>Status</th><th>Duration</th><th>Notes</th></tr></thead>
                        <tbody>${consultRows}</tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-header"><span class="icon">&#128196;</span><h3>Medical Reports (Last 50)</h3></div>
                    <table>
                        <thead><tr><th>Ref ID</th><th>Date</th><th>Report Type</th><th>Status</th></tr></thead>
                        <tbody>${reportRows}</tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-header"><span class="icon">&#9881;</span><h3>Account Settings Snapshot</h3></div>
                    <div class="settings-grid">${settingsBadges}</div>
                </div>
            </div>

            <div class="seal-section">
                <div class="sign-area">
                    <div class="sign-line"></div>
                    <div class="sign-name">${doctorName}</div>
                    <div class="sign-label">Authorised Doctor</div>
                    <div class="sign-label">${exportDate}</div>
                </div>
                <div class="seal">
                    <div class="seal-icon">&#128274;</div>
                    <div class="seal-text">COGNO<br>SOLUTION</div>
                    <div class="seal-verified">VERIFIED</div>
                </div>
            </div>

            <div class="footer">
                <div class="footer-left">
                    <span class="footer-brand">Cogno Solution</span>
                    Official Medical Data Export &bull; Confidential &bull; Document ID: ${docId}<br>
                    This document is auto-generated and digitally certified by Cogno Solution.
                </div>
                <div class="footer-right">
                    Generated: ${exportDate} at ${exportTime}<br>
                    &copy; ${new Date().getFullYear()} Cogno Solution. All rights reserved.<br>
                    support@cognosolution.com
                </div>
            </div>
        `;

        // Auto-trigger print after fonts load
        setTimeout(() => { printWindow.print(); }, 800);

        showToast('PDF generated! In print dialog, select "Save as PDF"', 'success');

    } catch (err) {
        console.error('Export error:', err);
        showToast('Export failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}
