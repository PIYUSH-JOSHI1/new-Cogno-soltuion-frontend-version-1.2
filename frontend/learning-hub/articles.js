/**
 * Cogno Solution - Learning Hub Articles
 * Fetches real-time Wikipedia articles and displays in an in-app reader.
 * NO redirects - all articles open INSIDE the website.
 */

document.addEventListener('DOMContentLoaded', () => {
    const articlesList = document.getElementById('articles-list');
    const filterTabs = document.querySelectorAll('.filter-tab[data-filter]');

    if (!articlesList) return;

    // Wikipedia search terms mapped to filter categories
    const searchTerms = {
        all: 'learning disability special education dyslexia dyscalculia dysgraphia dyspraxia',
        dyslexia: 'dyslexia reading disorder phonological awareness',
        dyscalculia: 'dyscalculia mathematics learning disability',
        dysgraphia: 'dysgraphia writing disorder handwriting',
        dyspraxia: 'developmental coordination disorder dyspraxia motor skills',
        parents: 'special education parent support learning disability children',
        educators: 'inclusive education teaching strategies learning differences classroom'
    };

    const categoryIcons = {
        all: 'fa-graduation-cap',
        dyslexia: 'fa-book',
        dyscalculia: 'fa-calculator',
        dysgraphia: 'fa-pen',
        dyspraxia: 'fa-person-running',
        parents: 'fa-users',
        educators: 'fa-chalkboard-teacher'
    };

    const categoryColors = {
        all: '#3b82f6',
        dyslexia: '#3b82f6',
        dyscalculia: '#10b981',
        dysgraphia: '#f59e0b',
        dyspraxia: '#8b5cf6',
        parents: '#ec4899',
        educators: '#06b6d4'
    };

    let currentCategory = 'all';

    // ── Fetch and Render Articles ──
    async function fetchWikipediaArticles(query, category) {
        articlesList.innerHTML = `
            <div style="text-align:center; padding: 60px 20px; width: 100%;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--color-primary); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--color-text-secondary); font-size: 1rem;">Loading real-time articles from Wikipedia...</p>
            </div>
        `;

        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=12`;
            const res = await fetch(searchUrl);
            const data = await res.json();

            if (!data.query?.search?.length) {
                articlesList.innerHTML = `<div class="alert" style="text-align:center; padding: 40px; color: var(--color-text-secondary);">No articles found for this category. Try another filter.</div>`;
                return;
            }

            const results = data.query.search;
            articlesList.innerHTML = '';

            const color = categoryColors[category] || '#3b82f6';
            const icon = categoryIcons[category] || 'fa-file-alt';

            results.forEach(result => {
                const { pageid, title, snippet, wordcount } = result;
                const readTime = Math.ceil((wordcount || 500) / 200);
                const cleanSnippet = snippet.replace(/<[^>]+>/g, '');

                const card = document.createElement('article');
                card.className = 'article-item';
                card.setAttribute('data-category', category);
                card.setAttribute('data-pageid', pageid);
                card.setAttribute('data-title', title);
                card.style.cssText = 'cursor:pointer; transition: all 0.25s;';

                card.innerHTML = `
                    <div class="article-icon" style="background: ${color}18; color: ${color}; border: 1.5px solid ${color}33; flex-shrink: 0;">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="article-content" style="flex:1; min-width:0;">
                        <h3 style="color: var(--color-primary); margin-bottom: 6px; font-size: 1rem; font-weight: 600;">${title}</h3>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 10px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${cleanSnippet}...</p>
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <span style="background: ${color}18; color: ${color}; border: 1px solid ${color}33; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">
                                <i class="fa-brands fa-wikipedia-w" style="margin-right:4px;"></i>Wikipedia
                            </span>
                            <span style="font-size: 0.75rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-book-open-reader"></i> Read In-App
                            </span>
                            <span style="font-size: 0.75rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-clock"></i> ~${readTime} min read
                            </span>
                            <button onclick="event.stopPropagation(); downloadArticlePDF(${pageid}, '${title.replace(/'/g, "\\'")}');" 
                                style="background: none; border: 1px solid var(--color-border); color: var(--color-text-secondary); padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                onmouseover="this.style.borderColor='${color}'; this.style.color='${color}';"
                                onmouseout="this.style.borderColor='var(--color-border)'; this.style.color='var(--color-text-secondary)';">
                                <i class="fa-solid fa-download"></i> Save PDF
                            </button>
                        </div>
                    </div>
                    <div style="align-self: center; color: ${color}; opacity: 0.6; padding-left: 8px;">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                `;

                card.addEventListener('click', () => openWikipediaModal(pageid, title, color));
                card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; });
                card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = ''; });

                articlesList.appendChild(card);
            });

        } catch (err) {
            console.error('Failed to fetch articles:', err);
            articlesList.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--color-text-secondary);">
                    <i class="fa-solid fa-wifi-slash" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
                    <p>Failed to load articles. Please check your connection and try again.</p>
                    <button onclick="fetchWikipediaArticles('${query}', '${category}')" class="btn btn-primary" style="margin-top: 16px;">
                        <i class="fa-solid fa-rotate-right"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // ── In-App Reader Modal ──
    function createReaderModal() {
        const existing = document.getElementById('wikipedia-reader-modal');
        if (existing) return existing;

        const modal = document.createElement('div');
        modal.id = 'wikipedia-reader-modal';
        modal.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 99999; background: rgba(0,0,0,0.65); align-items: center;
            justify-content: center; backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div id="wiki-modal-box" style="
                background: var(--color-surface); width: 94%; max-width: 860px;
                max-height: 92vh; border-radius: 20px; display: flex;
                flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                border: 1px solid var(--color-border); overflow: hidden;
            ">
                <!-- Modal Header -->
                <div style="
                    padding: 18px 24px; border-bottom: 1px solid var(--color-border);
                    display: flex; justify-content: space-between; align-items: center;
                    background: var(--color-primary); color: white; flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <i class="fa-brands fa-wikipedia-w" style="font-size: 1.4rem; opacity: 0.9; flex-shrink: 0;"></i>
                        <h3 id="wiki-modal-title" style="margin: 0; font-size: 1.1rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Loading...</h3>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 16px;">
                        <button id="wiki-download-pdf" title="Download as PDF" style="
                            background: rgba(255,255,255,0.2); border: none; color: white;
                            width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 0.9rem; transition: background 0.2s;
                        " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fa-solid fa-file-pdf"></i>
                        </button>
                        <button id="close-wiki-modal" title="Close" style="
                            background: rgba(255,255,255,0.2); border: none; color: white;
                            width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 1.1rem; transition: background 0.2s;
                        " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- Article Body -->
                <div id="wiki-modal-body" style="
                    padding: 28px 32px; overflow-y: auto; flex: 1;
                    color: var(--color-text); line-height: 1.85; font-size: 1rem;
                "></div>

                <!-- Modal Footer -->
                <div style="
                    padding: 12px 24px; border-top: 1px solid var(--color-border);
                    display: flex; justify-content: space-between; align-items: center;
                    background: var(--color-background); flex-shrink: 0;
                ">
                    <span style="font-size: 0.75rem; color: var(--color-text-secondary);">
                        <i class="fa-brands fa-wikipedia-w" style="margin-right: 4px;"></i>
                        Content from Wikipedia, licensed under CC BY-SA 4.0
                    </span>
                    <button id="wiki-close-bottom" class="btn btn-ghost btn-sm">Close Reader</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Inject reader styles
        const style = document.createElement('style');
        style.innerHTML = `
            #wiki-modal-body h1, #wiki-modal-body h2 {
                font-size: 1.2rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.6em;
                padding-bottom: 6px; border-bottom: 1px solid var(--color-border); color: var(--color-primary);
            }
            #wiki-modal-body h3, #wiki-modal-body h4 {
                font-size: 1rem; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; color: var(--color-text);
            }
            #wiki-modal-body p { margin-bottom: 1em; }
            #wiki-modal-body ul, #wiki-modal-body ol { padding-left: 24px; margin-bottom: 1em; }
            #wiki-modal-body li { margin-bottom: 0.4em; }
            #wiki-modal-body a { color: var(--color-primary); text-decoration: none; pointer-events: none; }
            #wiki-modal-body table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9rem; }
            #wiki-modal-body table td, #wiki-modal-body table th { border: 1px solid var(--color-border); padding: 8px 10px; }
            #wiki-modal-body table th { background: var(--color-background); font-weight: 600; }
            #wiki-modal-body .infobox, #wiki-modal-body .sidebar { display: none; }
            #wiki-modal-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
            @media (max-width: 600px) { #wiki-modal-body { padding: 16px; } }
        `;
        document.head.appendChild(style);

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        document.getElementById('close-wiki-modal').addEventListener('click', closeModal);
        document.getElementById('wiki-close-bottom').addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

        return modal;
    }

    // ── Open Modal with Wikipedia Content ──
    async function openWikipediaModal(pageId, title, accentColor) {
        const modal = createReaderModal();
        const modalBox = document.getElementById('wiki-modal-box');
        const modalBody = document.getElementById('wiki-modal-body');
        const modalTitle = document.getElementById('wiki-modal-title');
        const downloadBtn = document.getElementById('wiki-download-pdf');

        // Update header accent color
        modalBox.querySelector('[style*="background: var(--color-primary)"]').style.background = accentColor || 'var(--color-primary)';

        modalTitle.textContent = title;
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-book-open-reader fa-bounce" style="font-size: 3rem; color: var(--color-primary); margin-bottom: 16px; display: block;"></i>
                <p style="color: var(--color-text-secondary);">Loading article content...</p>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Update PDF button
        downloadBtn.onclick = () => downloadArticlePDF(pageId, title);

        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&pageids=${pageId}&format=json&origin=*`;
            const res = await fetch(url);
            const data = await res.json();
            const content = data.query?.pages?.[pageId]?.extract;

            if (content) {
                // Clean up references and edit links from Wikipedia HTML
                const cleaned = content
                    .replace(/<span class="mw-editsection[^"]*"[^>]*>.*?<\/span>/gs, '')
                    .replace(/<span id="References[^"]*"[^>]*>/gs, '<span>')
                    .replace(/<\!--[^>]*-->/g, '');
                modalBody.innerHTML = cleaned;
                // Make all links non-navigational
                modalBody.querySelectorAll('a').forEach(a => {
                    a.addEventListener('click', e => e.preventDefault());
                });
            } else {
                modalBody.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--color-text-secondary);">No detailed content available for this article.</div>';
            }
        } catch (err) {
            modalBody.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--color-text-secondary);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 12px; display:block; color: var(--color-warning);"></i>
                    <p>Could not load this article. Please check your connection.</p>
                </div>
            `;
        }
    }

    // ── PDF Download for Articles ──
    window.downloadArticlePDF = async function(pageId, title) {
        const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF;
        if (!jsPDFCtor) {
            // Download fallback: open Wikipedia in new tab for Print-to-PDF
            alert(`Your browser does not support PDF generation.\n\nYou can use Ctrl+P (Print) on the Wikipedia page to save as PDF.`);
            window.open(`https://en.wikipedia.org/?curid=${pageId}`, '_blank');
            return;
        }

        try {
            // Fetch content
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&pageids=${pageId}&format=json&origin=*`);
            const data = await res.json();
            const content = data.query?.pages?.[pageId]?.extract || '';
            const plainText = content.replace(/<[^>]+>/g, '').trim().slice(0, 3000);

            const doc = new jsPDFCtor();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 0, pageWidth, 38, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Cogno Solution', 14, 16);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Learning Hub — Article', 14, 26);
            doc.text(new Date().toLocaleDateString(), pageWidth - 14, 16, { align: 'right' });

            // Title
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const titleLines = doc.splitTextToSize(title, pageWidth - 28);
            doc.text(titleLines, 14, 52);

            // Content
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 80);
            const bodyLines = doc.splitTextToSize(plainText, pageWidth - 28);
            doc.text(bodyLines, 14, 52 + titleLines.length * 8 + 8);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Source: Wikipedia (CC BY-SA 4.0) | Generated by Cogno Solution`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

            doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        } catch (e) {
            console.error('PDF generation failed:', e);
            window.open(`https://en.wikipedia.org/?curid=${pageId}`, '_blank');
        }
    };

    // Expose modal for other usages
    window.openWikipediaModal = openWikipediaModal;

    // ── Filter Tabs ──
    filterTabs.forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-filter');
            fetchWikipediaArticles(searchTerms[currentCategory] || searchTerms.all, currentCategory);
        });
    });

    // ── Initial Fetch ──
    articlesList.innerHTML = '';
    fetchWikipediaArticles(searchTerms.all, 'all');
});
