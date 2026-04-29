fetch('https://raw.githubusercontent.com/imnotkoolkid/KCH/refs/heads/main/data/css.json')
    .then(r => r.json())
    .then(d => {
        const s = document.getElementById('css-image-slider');
        if (!s) return;
        const t = d.filter(i => i.homeImage);
        if (!t.length) return;

        s.innerHTML = '<div class="loader"></div>';
        const loader = s.querySelector('.loader');
        const l = {};
        let c = 0, iT = false;

        function loadSequentially(index) {
            if (index >= t.length) return;
            const im = document.createElement('img');
            im.src = t[index].homeImage;
            im.alt = t[index].title || 'Theme Preview';
            im.className = 'slider-image';
            if (index === 0) im.classList.add('active');
            im.onload = () => {
                l[index] = true;
                if (index === 0 && loader) loader.style.display = 'none';
                loadSequentially(index + 1);
            };
            s.appendChild(im);
        }

        loadSequentially(0);

        function next() {
            if (iT || t.length < 2) return;
            const n = (c + 1) % t.length;
            if (!l[n]) {
                const int = setInterval(() => { if (l[n]) { clearInterval(int); trans(n); } }, 200);
            } else {
                trans(n);
            }
        }

        function trans(n) {
            iT = true;
            const ims = s.querySelectorAll('.slider-image');
            ims[c].classList.add('slide-out');
            ims[n].classList.add('slide-in');
            setTimeout(() => {
                ims[c].classList.remove('active', 'slide-out');
                ims[n].classList.add('active');
                ims[n].classList.remove('slide-in');
                c = n;
                iT = false;
            }, 800);
        }

        setInterval(next, 4000);
    }).catch(e => console.error('Error loading CSS data:', e));

const h = document.querySelector('.hamburger');
const m = document.querySelector('.nav-menu');
if (h && m) h.addEventListener('click', () => m.classList.toggle('active'));

document.querySelectorAll('.faq-item').forEach(it => {
    it.addEventListener('click', e => {
        if (e.target.closest('.faq-links, .btn')) return;
        const q = it.querySelector('.faq-question');
        const a = it.querySelector('.faq-answer');
        a.classList.toggle('active');
        q.querySelector('i').classList.toggle('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(lk => {
    lk.addEventListener('click', e => {
        const hr = lk.getAttribute('href');
        if (hr === '#') return;
        e.preventDefault();
        const tgt = document.getElementById(hr.substring(1));
        if (tgt) window.scrollTo({ top: tgt.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const words = ["customizations", "CSS", "textures", "crosshairs", "scripts", "skyboxes"];
    const el = document.getElementById('hero-rotating-text');
    let idx = 0;
    if (el) {
        setInterval(() => {
            el.classList.add('text-animate-out');
            el.classList.remove('text-animate-in');
            setTimeout(() => {
                idx = (idx + 1) % words.length;
                el.innerText = words[idx];
                el.classList.remove('text-animate-out');
                el.classList.add('text-animate-in');
            }, 200);
        }, 2000);
    }
});