        const CSS_JSON_URL = 'https://raw.githubusercontent.com/imnotkoolkid/KCH/refs/heads/main/data/css.json',
            d = document,
            ls = localStorage;
        let allItems = [],
            liked = new Set(),
            cur = null,
            imgMode = 'home',
            scale = 1,
            posX = 0,
            posY = 0,
            isDragging = false,
            startX, startY,
            curSourceCode = '';

        const $ = id => d.getElementById(id),
            badgeCls = a => 'badge-' + a,
            noResHTML = msg => `<div class="no-results-msg"><h3>No results found</h3><p>${msg}</p></div>`,
            showToast = (msg, icon = 'check') => {
                let t = d.createElement('div');
                t.className = 'toast';
                t.innerHTML = `<i data-lucide="${icon}"></i><span>${msg}</span>`;
                $('toast-container').appendChild(t);
                lucide.createIcons();
                setTimeout(() => t.remove(), 2200);
            };

        const handleDownload = (url, title) => {
            if (!url) return;
            fetch(url).then(r => r.ok ? r.text() : Promise.reject()).then(c => {
                let a = d.createElement('a'),
                    f = url.split('/').pop();
                if (!f || !f.endsWith('.css')) f = title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.css';
                a.href = URL.createObjectURL(new Blob([c], { type: 'text/css' }));
                a.download = f;
                d.body.appendChild(a);
                a.click();
                d.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }).catch(() => showToast('Download failed.', 'alert-circle'));
        };

        const updateImg = () => {
            let img = $('preview-img');
            img.style.transform = `translate(-50%,-50%) translate(${posX}px,${posY}px) scale(${scale})`;
            $('zoom-indicator').textContent = `${Math.round(scale * 100)}%`;
            $('zoom-indicator').style.opacity = scale === 1 ? '0' : '1';
        };

        const toggleLike = i => {
            if (!i) return;
            let t = i.title,
                idx = allItems.indexOf(i),
                now = !liked.has(t);
            now ? liked.add(t) : liked.delete(t);
            ls.setItem('likedCss', JSON.stringify([...liked]));
            d.querySelectorAll(`.card[data-idx="${idx}"] .btn-icon`).forEach(b => {
                b.classList.toggle('liked', now);
                b.title = now ? 'Unlike' : 'Like';
            });
            if (cur && cur.title === t) {
                let btn = Array.from(d.querySelectorAll('.preview-actions .preview-btn')).find(b => b.innerHTML.includes('heart'));
                if (btn) {
                    btn.classList.toggle('liked', now);
                    btn.innerHTML = `<i data-lucide="heart"></i> ${now ? 'Unlike' : 'Like'}`;
                    lucide.createIcons();
                }
            }
            renderLiked();
        };

        const titleToSlug = t => encodeURIComponent(t.trim().replace(/\s+/g, '-').toLowerCase());
        const slugToTitle = s => decodeURIComponent(s).replace(/-/g, ' ').toLowerCase();

        let curSourceItem = null;

        const highlightCSS = code => {

            return code
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="css-comment">$1</span>')
                .replace(/(@[\w-]+)/g, '<span class="css-atrule">$1</span>')
                .replace(/(#[0-9a-fA-F]{3,8}(?=[;\s,)]|$))/g, '<span class="css-color">$1</span>')
                .replace(/([\w-]+)\s*:/g, '<span class="css-property">$1</span>:')
                .replace(/(\b\d+\.?\d*(?:px|em|rem|vh|vw|%|s|ms|deg|fr|ch|ex|vmin|vmax)?\b)/g, '<span class="css-number">$1</span>');
        };

        const renderSourceCode = (code, filename) => {
            const lines = code.split('\n');
            const nums = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
            const highlighted = highlightCSS(code);
            const highlightedLines = highlighted.split('\n').map(l => `<div>${l || '&nbsp;'}</div>`).join('');
            $('source-code-wrapper').innerHTML = `
                <div class="source-line-numbers">
                    <div class="line-nums">${nums}</div>
                    <div class="line-code">${highlightedLines}</div>
                </div>`;
        };

        const openSourceViewer = async (url, title) => {
            if (!url) return;
            const filename = url.split('/').pop() || (title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.css');
            curSourceItem = { url, title, filename };
            curSourceCode = '';

            $('source-modal-name').textContent = title;
            $('source-code-wrapper').innerHTML = `<div class="source-loading"><div class="loader" style="width:28px;aspect-ratio:1.154"></div><span>Loading source…</span></div>`;


            history.pushState({ sourceOpen: true, sourceTitle: title }, '', `#vs:${titleToSlug(title)}`);

            $('source-overlay').classList.add('visible');
            d.body.style.overflow = 'hidden';
            lucide.createIcons();

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed');
                curSourceCode = await res.text();
                renderSourceCode(curSourceCode, filename);
            } catch {
                $('source-code-wrapper').innerHTML = `<div class="source-loading" style="color:#e27383"><span>Failed to load source code.</span></div>`;
            }
        };

        const closeSourceViewer = () => {
            $('source-overlay').classList.remove('visible');
            d.body.style.overflow = '';
            curSourceItem = null;
            curSourceCode = '';
            if (cur) {
                history.pushState({ previewOpen: true }, '', `#${titleToSlug(cur.title)}`);
            } else {
                history.pushState({ sourceOpen: false }, '', location.pathname + location.search);
            }
        };

        const handleSourceOverlayClick = e => {
            if (e.target === $('source-overlay')) closeSourceViewer();
        };

        const copySourceCode = async () => {
            if (!curSourceCode) return;
            try {
                await navigator.clipboard.writeText(curSourceCode);
                const btn = $('source-copy-btn');
                btn.classList.add('copied');
                btn.innerHTML = '<i data-lucide="check"></i>';
                lucide.createIcons();
                showToast('CSS copied to clipboard!');
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<span class="copy-icon"></span>';
                }, 2000);
            } catch {
                showToast('Failed to copy CSS.', 'alert-circle');
            }
        };

        const shareSourceCode = async () => {
            try {
                const type = location.pathname.split('/').pop().replace('.html', '') || 'css';
                const slug = curSourceItem ? titleToSlug(curSourceItem.title) : '';
                const shareUrl = slug ? `${location.origin}/${type}/${slug}` : location.href;
                await navigator.clipboard.writeText(shareUrl);
                const btn = $('source-share-btn');
                btn.innerHTML = '<i data-lucide="check"></i>';
                lucide.createIcons();
                showToast('Link copied to clipboard!');
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="share-2"></i>';
                    lucide.createIcons();
                }, 2000);
            } catch {
                showToast('Failed to copy link.', 'alert-circle');
            }
        };
        const openPreview = i => {
            cur = i;
            imgMode = 'home';
            let img = $('preview-img'),
                loader = d.querySelector('.preview-img-section .loader');
            loader.style.display = 'block';
            img.onload = () => loader.style.display = 'none';
            img.onerror = () => {
                loader.style.display = 'none';
                img.src = '';
                img.style.background = '#000';
            };
            img.src = i.homeImage || '';
            $('toggle-home').classList.add('active');
            $('toggle-ingame').classList.remove('active');
            $('preview-img-toggles').style.display = i.ingameImage ? 'flex' : 'none';
            $('preview-title').textContent = i.title;
            let own = $('preview-owner');
            i.discord ? own.innerHTML = `by <a href="${i.discord}" target="_blank">${i.owner || 'Unknown'}</a>` : own.textContent = `by ${i.owner || 'Unknown'}`;
            let b = $('preview-badge');
            b.textContent = i.availability;
            b.className = `preview-badge ${badgeCls(i.availability)}`;
            $('preview-tags').innerHTML = (i.tags || []).map(t => `<span class="preview-tag">${t}</span>`).join('');
            let ac = $('preview-actions'),
                hasSrc = !!i.downloadUrl,
                primary = i.availability === 'free' && i.downloadUrl
                    ? `<button class="preview-btn primary" onclick="handleDownload('${i.downloadUrl}','${i.title.replace(/'/g, "\\'")}')"><i data-lucide="download"></i> Download CSS</button>`
                    : i.availability === 'paid'
                        ? `<button class="preview-btn primary" ${i.discord ? `onclick="window.open('${i.discord}','_blank')"` : ''}><i data-lucide="shopping-cart"></i> Buy</button>`
                        : '';
            ac.innerHTML = `${primary}${hasSrc
                ? `<button class="preview-btn" onclick="openSourceViewer('${i.downloadUrl}','${i.title.replace(/'/g, "\\'")}')"><i data-lucide="code-2"></i> View Source</button><button class="preview-btn" onclick="copyCSSFile('${i.downloadUrl}')"><i data-lucide="clipboard"></i> Copy CSS</button>`
                : ''
                }<button class="preview-btn" onclick="shareCurrentPage()"><i data-lucide="share-2"></i> Share</button>`;
            scale = 1;
            posX = 0;
            posY = 0;
            updateImg();
            $('preview-overlay').classList.add('visible');
            d.body.style.overflow = 'hidden';
            lucide.createIcons();
            history.pushState({ previewOpen: true }, '', `#${titleToSlug(i.title)}`);
        };

        const switchImage = m => {
            if (!cur || m === imgMode) return;
            let src = m === 'ingame' ? cur.ingameImage : cur.homeImage;
            if (!src) return;
            let img = $('preview-img'),
                loader = d.querySelector('.preview-img-section .loader');
            loader.style.display = 'block';
            img.onload = () => loader.style.display = 'none';
            img.onerror = () => {
                loader.style.display = 'none';
                img.src = '';
                img.style.background = '#000';
            };
            img.src = src;
            imgMode = m;
            $('toggle-home').classList.toggle('active', m === 'home');
            $('toggle-ingame').classList.toggle('active', m === 'ingame');
            scale = 1;
            posX = 0;
            posY = 0;
            updateImg();
        };

        const closePreview = () => {
            $('preview-overlay').classList.remove('visible');
            d.body.style.overflow = '';
            cur = null;
            history.pushState({ previewOpen: false }, '', location.pathname + location.search);
        };

        const handleOverlayClick = e => {
            if (e.target === $('preview-overlay')) closePreview();
        };

        d.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if ($('source-overlay').classList.contains('visible')) closeSourceViewer();
                else closePreview();
            }
        });

        const copyCSSFile = async url => {
            try {
                await navigator.clipboard.writeText(await (await fetch(url)).text());
                showToast('CSS copied to clipboard!');
            } catch {
                showToast('Failed to copy CSS.', 'alert-circle');
            }
        };

        const shareCurrentPage = () => {
            const type = location.pathname.split('/').pop().replace('.html', '') || 'css';
            const slug = cur ? titleToSlug(cur.title) : '';
            const shareUrl = slug
                ? `${location.origin}/${type}/${slug}`
                : location.href;

            navigator.clipboard.writeText(shareUrl)
                .then(() => showToast('Link copied to clipboard!'))
                .catch(() => showToast('Failed to copy link.', 'alert-circle'));
        };


        const handleHash = () => {
            let h = location.hash;
            if (!h || h.length < 2) return;

            if (h.startsWith('#vs:')) {
                const slug = h.substring(4);
                const title = slugToTitle(slug);
                const item = allItems.find(i => i.title.trim().toLowerCase() === title);
                if (item && item.downloadUrl) {
                    cur = item;
                    openSourceViewer(item.downloadUrl, item.title);
                } else {
                    window.location.href = '404.html';
                }
                return;
            }

            let i = allItems.find(i => i.title.trim().toLowerCase() === slugToTitle(h.substring(1)));
            if (i) {
                openPreview(i);
            } else {
                window.location.href = '404.html';
            }
        };

        window.addEventListener('popstate', () => {
            let h = location.hash;
            if (h && h.length > 1) {
                handleHash();
            } else {
                if ($('source-overlay').classList.contains('visible')) {
                    $('source-overlay').classList.remove('visible');
                    d.body.style.overflow = '';
                    curSourceItem = null;
                    curSourceCode = '';
                }
                if ($('preview-overlay').classList.contains('visible')) {
                    $('preview-overlay').classList.remove('visible');
                    d.body.style.overflow = '';
                    cur = null;
                }
            }
        });

        const buildSearchUI = (p, m) => {
            $(m).innerHTML = `<div class="search-area"><div class="search-row"><div class="search-input-wrapper"><span class="search-icon"><i data-lucide="search"></i></span><input type="text" class="search-input" id="${p}-input" placeholder="Search CSS"><div class="search-suggestions" id="${p}-sug"></div></div><div class="avail-dropdown" id="${p}-dd"><button class="avail-dropdown-btn" id="${p}-dd-btn"><span id="${p}-dd-label">All</span><i data-lucide="chevron-down"></i></button><div class="avail-dropdown-menu" id="${p}-dd-menu">${['all', 'free', 'paid', 'showcase'].map((v, i) => `<div class="avail-option${i ? '' : ' selected'}" data-value="${v}">${v[0].toUpperCase() + v.slice(1)}</div>`).join('')}</div></div></div><div class="tags-scroll-row"><button class="tags-scroll-btn" id="${p}-tl"><i data-lucide="chevron-left"></i></button><div class="tags-container" id="${p}-tags"></div><button class="tags-scroll-btn" id="${p}-tr"><i data-lucide="chevron-right"></i></button></div></div>`;
            lucide.createIcons();
        };

        const createSearchController = (p, onUp) => {
            let avail = 'all',
                tags = new Set(),
                term = '',
                S = s => $(p + s),
                input = S('-input'),
                sug = S('-sug'),
                dd = S('-dd'),
                tagsEl = S('-tags');
            const filtered = () => allItems.filter(i => (avail === 'all' || i.availability === avail) && (!tags.size || [...tags].every(t => (i.tags || []).includes(t))) && (!term || [i.title, i.description || '', ...(i.tags || []), i.owner || ''].some(s => s.toLowerCase().includes(term))));
            tagsEl.innerHTML = [...new Set(allItems.flatMap(i => i.tags || []))].sort().map(t => `<span class="tag-item" data-tag="${t}">${t}</span>`).join('');
            tagsEl.querySelectorAll('.tag-item').forEach(el => el.addEventListener('click', () => {
                let t = el.dataset.tag;
                tags[tags.has(t) ? 'delete' : 'add'](t);
                el.classList.toggle('selected');
                onUp(filtered());
            }));
            S('-tl').addEventListener('click', () => tagsEl.scrollBy({ left: -150, behavior: 'smooth' }));
            S('-tr').addEventListener('click', () => tagsEl.scrollBy({ left: 150, behavior: 'smooth' }));
            tagsEl.addEventListener('wheel', e => {
                if (Math.abs(e.deltaY) > 0) {
                    e.preventDefault();
                    tagsEl.scrollLeft += e.deltaY;
                }
            });
            S('-dd-btn').addEventListener('click', e => {
                e.stopPropagation();
                dd.classList.toggle('open');
            });
            S('-dd-menu').querySelectorAll('.avail-option').forEach(opt => opt.addEventListener('click', e => {
                e.stopPropagation();
                S('-dd-menu').querySelectorAll('.avail-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                avail = opt.dataset.value;
                S('-dd-label').textContent = opt.textContent;
                dd.classList.remove('open');
                onUp(filtered());
            }));
            const hideSug = () => { sug.classList.remove('visible'); sug.innerHTML = ''; };
            const showSug = raw => {
                if (!raw) return hideSug();
                let t = raw.toLowerCase(),
                    top = allItems.map(i => {
                        let ti = i.title.toLowerCase(),
                            s = ti === t ? 100 : ti.startsWith(t) ? 90 : ti.includes(t) ? 80 : (i.description || '').toLowerCase().includes(t) ? 70 : (i.tags || []).some(x => x.toLowerCase().includes(t)) ? 60 : (i.owner || '').toLowerCase().includes(t) ? 50 : 0;
                        return { item: i, s };
                    }).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 3);
                if (!top.length) return hideSug();
                sug.innerHTML = top.map(({ item }) => `<div class="suggestion-item" data-title="${item.title}"><div class="suggestion-main"><img class="suggestion-img" src="${item.homeImage || ''}" alt="" onerror="this.style.background='#1a1f29';"> <div class="suggestion-text"><span class="suggestion-title">${item.title}</span><span class="suggestion-owner">by ${item.owner || 'Unknown'}</span></div></div><span class="suggestion-badge ${badgeCls(item.availability)}">${item.availability}</span></div>`).join('');
                sug.querySelectorAll('.suggestion-item').forEach(el => el.addEventListener('mousedown', e => {
                    e.preventDefault();
                    input.value = el.dataset.title;
                    term = el.dataset.title.toLowerCase();
                    hideSug();
                    onUp(filtered());
                }));
                sug.classList.add('visible');
            };
            input.addEventListener('input', e => {
                term = e.target.value.toLowerCase().trim();
                onUp(filtered());
                showSug(e.target.value.trim());
            });
            input.addEventListener('focus', () => {
                if (input.value.trim()) showSug(input.value.trim());
            });
            return { getFiltered: filtered, hideSug, closeDd: () => dd.classList.remove('open'), isActive: () => term.length > 0 || tags.size > 0 };
        };

        const createCard = i => {
            let t = (i.tags || []).map(t => `<span class="tag">${t}</span>`).join(''),
                dl = i.availability === 'free' && i.downloadUrl ? `<button class="btn-download" onclick="handleDownload('${i.downloadUrl}','${i.title}'); event.stopPropagation()" title="Download"><i data-lucide="download"></i></button>` : '',
                star = i.label === 'featured' ? '<div class="featured-star-badge"><i data-lucide="star"></i></div>' : '',
                idx = allItems.indexOf(i),
                likedClass = isLiked(i) ? 'liked' : '';
            return `<div class="card" onclick="openPreview(allItems[${idx}])" data-idx="${idx}"><div class="card-img-wrapper loader-container">${star}<img class="card-img" src="${i.homeImage || ''}" alt="" loading="lazy" onload="this.parentNode.querySelector('.loader').style.display='none';"><div class="loader"></div></div><div class="card-body"><div class="card-title">${i.title}</div><div class="card-owner">by ${i.owner || 'Unknown'}</div><div class="card-desc">${i.description || ''}</div><div class="card-actions"><div class="card-tags">${t}<span style="margin-left:8px"><span class="badge ${badgeCls(i.availability)}">${i.availability}</span></span></div></div><div class="card-actions">${dl}<button class="btn-icon ${likedClass}" title="${isLiked(i) ? 'Unlike' : 'Like'}" onclick="toggleLike(allItems[${idx}]); event.stopPropagation()"><i data-lucide="heart"></i></button></div></div></div>`;
        };

        const isLiked = i => liked.has(i.title);
        let homeCtrl, allCtrl;

        const renderHome = f => {
            let car = $('home-carousel'),
                inn = $('carousel-inner-all'),
                sm = homeCtrl.isActive();
            car.classList.toggle('search-mode', sm);
            inn.classList.toggle('search-mode', sm);
            if (!f.length) inn.innerHTML = noResHTML(sm ? 'Try different search terms' : 'No items match');
            else if (sm) inn.innerHTML = f.map(createCard).join('');
            else {
                inn.innerHTML = f.map(createCard).join('') + f.map(createCard).join('');
                inn.style.animation = 'none';
                void inn.offsetWidth;
                inn.style.animation = `scroll ${Math.max(20, f.length * 4)}s linear infinite`;
            }
            lucide.createIcons();
        };

        const renderAllGrid = f => {
            $('all-grid').innerHTML = f.length ? f.map(createCard).join('') : noResHTML('Try different search terms');
            lucide.createIcons();
        };

        const renderFeatured = () => {
            let f = allItems.filter(i => i.label === 'featured');
            $('featured-placeholder').style.display = f.length ? 'none' : 'flex';
            $('featured-list').innerHTML = f.map(createCard).join('');
            lucide.createIcons();
        };

        const renderLiked = () => {
            let l = allItems.filter(i => liked.has(i.title)),
                grid = $('liked-grid'),
                ph = $('liked-placeholder');
            if (l.length) {
                grid.innerHTML = l.map(createCard).join('');
                grid.style.display = 'grid';
                ph.style.display = 'none';
            } else {
                grid.innerHTML = '';
                grid.style.display = 'none';
                ph.style.display = 'flex';
            }
            lucide.createIcons();
        };

        const setActive = (el, id) => {
            d.querySelectorAll('.tab-item, .tab-content').forEach(e => e.classList.remove('active'));
            el.classList.add('active');
            $(id).classList.add('active');
            if (id === 'tab-Featured') renderFeatured();
            if (id === 'tab-All' && allCtrl) renderAllGrid(allCtrl.getFiltered());
            if (id === 'tab-Liked') renderLiked();
        };

        d.addEventListener('click', e => {
            [homeCtrl, allCtrl].forEach(c => {
                if (!c) return;
                c.closeDd();
                if (!e.target.closest('.search-input-wrapper')) c.hideSug();
            });
        });

        (async () => {
            try {
                allItems = await (await fetch(CSS_JSON_URL)).json();
                liked = new Set(JSON.parse(ls.getItem('likedCss') || '[]'));
                buildSearchUI('home', 'home-mount');
                buildSearchUI('all', 'all-mount');
                homeCtrl = createSearchController('home', renderHome);
                allCtrl = createSearchController('all', renderAllGrid);
                renderHome(homeCtrl.getFiltered());
                renderLiked();
                handleHash();
            } catch (e) {
                console.error('Failed to load CSS data:', e);
            }
        })();

        let sec = $('preview-overlay').querySelector('.preview-img-section');
        sec.addEventListener('wheel', e => {
            if (!$('preview-overlay').classList.contains('visible')) return;
            e.preventDefault();
            let delta = -Math.sign(e.deltaY) * 0.1;
            scale = Math.max(0.5, Math.min(5, scale + delta));
            if (scale <= 1) { posX = 0; posY = 0; }
            updateImg();
        });
        sec.addEventListener('mousedown', e => {
            if (scale <= 1 || e.target.closest('.preview-img-toggles,.zoom-indicator')) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            sec.style.cursor = 'grabbing';
        });
        d.addEventListener('mousemove', e => {
            if (!isDragging) return;
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            updateImg();
        });
        d.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                sec.style.cursor = 'default';
            }
        });