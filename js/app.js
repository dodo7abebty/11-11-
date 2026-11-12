"use strict";
(() => {
    const byId = (id) => document.getElementById(id);
    const introScreen = byId('introScreen');
    const openButton = byId('openButton');
    const audio = byId('loveSong');
    const musicButton = byId('musicButton');
    const musicLabel = byId('musicLabel');
    const musicPlayer = byId('musicPlayer');
    const playlistToggle = byId('playlistToggle');
    const playlistPanel = byId('playlistPanel');
    const playlistItems = byId('playlistItems');
    const playlistCount = byId('playlistCount');
    const previousSong = byId('previousSong');
    const nextSong = byId('nextSong');
    const toast = byId('toast');
    const lightbox = byId('lightbox');
    const lightboxImage = byId('lightboxImage');
    const lightboxVideo = byId('lightboxVideo');
    const lightboxAudio = byId('lightboxAudio');
    const lightboxTitle = byId('lightboxTitle');
    const lightboxMessage = byId('lightboxMessage');
    const themeButton = byId('themeButton');
    const themeIcon = byId('themeIcon');
    const themeLabel = byId('themeLabel');
    const themeInkCircle = document.getElementById('themeInkCircle');
    const themeInkGrowth = document.getElementById('themeInkGrowth');
    const topbar = byId('topbar');
    const motionLayer = byId('motionLayer');
    function scatterHearts(x, y, count = 18) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        const shapes = ['♡', '♥', '✦', '✧'];
        for (let index = 0; index < count; index++) {
            const particle = document.createElement('span');
            particle.className = 'heart-burst';
            particle.textContent = shapes[Math.floor(Math.random() * shapes.length)];
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--size', `${12 + Math.random() * 15}px`);
            particle.style.setProperty('--dx', `${Math.round((Math.random() - .5) * 240)}px`);
            particle.style.setProperty('--dy', `${-55 - Math.round(Math.random() * 150)}px`);
            particle.style.setProperty('--spin', `${Math.round((Math.random() - .5) * 100)}deg`);
            motionLayer.append(particle);
            particle.addEventListener('animationend', () => particle.remove(), { once: true });
        }
    }
    const tracks = Array.from(audio.querySelectorAll('source')).map((source, index) => ({
        title: source.dataset.title || `أغنيتنا ${(index + 1).toLocaleString('ar-EG')}`,
        src: source.getAttribute('src') || '',
        path: source.getAttribute('src') || ''
    })).filter(track => track.src.length > 0);
    let currentTrackIndex = 0;
    let toastTimer;
    document.body.style.overflow = 'hidden';
    function say(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
    }
    function setTheme(theme, persist = true) {
        const isLight = theme === 'light';
        document.body.classList.toggle('theme-light', isLight);
        document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
        themeButton.setAttribute('aria-pressed', String(isLight));
        themeButton.setAttribute('aria-label', isLight ? 'التبديل إلى وضع الليل' : 'التبديل إلى وضع النهار');
        themeIcon.textContent = isLight ? '☾' : '☼';
        themeLabel.textContent = isLight ? 'الليل' : 'النهار';
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor)
            themeColor.content = isLight ? '#f7eee9' : '#210c17';
        if (persist) {
            try {
                window.localStorage.setItem('gift-theme', theme);
            }
            catch (_) { /* local files can block storage */ }
        }
    }
    let initialTheme = 'dark';
    try {
        if (window.localStorage.getItem('gift-theme') === 'light')
            initialTheme = 'light';
    }
    catch (_) { /* keep the default theme */ }
    setTheme(initialTheme, false);
    themeButton.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('theme-light') ? 'dark' : 'light';
        const transitionDocument = document;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !transitionDocument.startViewTransition) {
            setTheme(nextTheme);
            return;
        }
        const buttonRect = themeButton.getBoundingClientRect();
        themeInkCircle.setAttribute('cx', String((buttonRect.left + buttonRect.width / 2) / window.innerWidth));
        themeInkCircle.setAttribute('cy', String((buttonRect.top + buttonRect.height / 2) / window.innerHeight));
        themeInkCircle.setAttribute('r', '0');
        try {
            const transition = transitionDocument.startViewTransition(() => setTheme(nextTheme));
            void transition.ready.then(() => themeInkGrowth.beginElement()).catch(() => { });
            const resetMask = () => themeInkCircle.setAttribute('r', '0');
            void transition.finished.then(resetMask, resetMask);
        }
        catch (_) {
            setTheme(nextTheme);
        }
    });
    function renderPlaylist() {
        playlistCount.textContent = `${tracks.length.toLocaleString('ar-EG')} أغاني`;
        playlistItems.replaceChildren();
        tracks.forEach((track, index) => {
            const item = document.createElement('li');
            const button = document.createElement('button');
            const number = document.createElement('span');
            const title = document.createElement('span');
            const state = document.createElement('span');
            button.type = 'button';
            button.className = 'playlist-item';
            button.setAttribute('aria-current', index === currentTrackIndex ? 'true' : 'false');
            number.className = 'playlist-number';
            number.textContent = (index + 1).toLocaleString('ar-EG');
            title.className = 'playlist-title';
            title.textContent = track.title;
            state.className = 'playlist-state';
            state.textContent = index === currentTrackIndex && !audio.paused ? '♫' : '♡';
            button.append(number, title, state);
            button.addEventListener('click', () => {
                selectTrack(index, true);
                closePlaylist();
            });
            item.append(button);
            playlistItems.append(item);
        });
    }
    function syncMusic() {
        const playing = !audio.paused && !audio.ended;
        const track = tracks[currentTrackIndex];
        musicButton.classList.toggle('is-playing', playing);
        musicLabel.textContent = track ? track.title : 'قائمة الأغاني';
        musicButton.setAttribute('aria-label', playing ? `إيقاف ${track?.title || 'الأغنية'}` : `تشغيل ${track?.title || 'الأغنية المحددة'}`);
        renderPlaylist();
    }
    audio.addEventListener('play', syncMusic);
    audio.addEventListener('pause', syncMusic);
    audio.addEventListener('error', syncMusic);
    audio.addEventListener('ended', () => { selectTrack(currentTrackIndex + 1, true); });
    function closePlaylist() {
        playlistPanel.hidden = true;
        playlistToggle.setAttribute('aria-expanded', 'false');
    }
    function selectTrack(index, autoplay) {
        if (!tracks.length) {
            say('ضيفي ملفات الأغاني داخل assets/music ♡');
            return;
        }
        currentTrackIndex = (index + tracks.length) % tracks.length;
        const track = tracks[currentTrackIndex];
        audio.pause();
        audio.src = track.src;
        audio.load();
        syncMusic();
        if (autoplay)
            void startMusic();
    }
    async function startMusic() {
        const track = tracks[currentTrackIndex];
        if (!track) {
            say('ضيفي ملفات الأغاني داخل assets/music ♡');
            return;
        }
        try {
            await audio.play();
        }
        catch (_) {
            if (audio.error)
                say(`ضيفي ملف «${track.title}» هنا: ${track.path}`);
            else
                say('اضغطي تشغيل مرة تانية لو المتصفح ما بدأش الأغنية ♡');
        }
    }
    renderPlaylist();
    selectTrack(0, false);
    playlistToggle.addEventListener('click', () => {
        const opening = playlistPanel.hidden;
        playlistPanel.hidden = !opening;
        playlistToggle.setAttribute('aria-expanded', String(opening));
    });
    previousSong.addEventListener('click', () => selectTrack(currentTrackIndex - 1, true));
    nextSong.addEventListener('click', () => selectTrack(currentTrackIndex + 1, true));
    document.addEventListener('click', event => {
        if (!musicPlayer.contains(event.target))
            closePlaylist();
    });
    openButton.addEventListener('click', event => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        scatterHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 28);
        introScreen.classList.add('opening');
        document.body.style.overflow = '';
        startMusic();
        setTimeout(() => introScreen.classList.add('dismissed'), 650);
        setTimeout(() => byId('words').scrollIntoView({ behavior: 'smooth' }), 480);
    });
    musicButton.addEventListener('click', () => {
        if (audio.paused)
            startMusic();
        else
            audio.pause();
    });
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target instanceof HTMLElement) {
                    const siblings = entry.target.parentElement
                        ? Array.from(entry.target.parentElement.children).filter(element => element.classList.contains('reveal'))
                        : [];
                    entry.target.style.setProperty('--reveal-delay', `${Math.max(0, siblings.indexOf(entry.target)) * 115}ms`);
                }
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    const loveNotes = [
        { message: 'يا حبيبتي، كل يوم بيمر وأنا بحبك أكتر، وبحمد ربنا إنك بقيتي أجمل حكاية في أيامي.', signoff: 'بحبك النهارده وكل يوم' },
        { message: 'في نص انشغالي بتعدّي على بالي وأبتسم من غير ما أحس. فكرة إنك في حياتي لوحدها بتخلّي يومي أحنّ.', signoff: 'إنتِ فرحتي الحلوة' },
        { message: 'ضحكتك من الحاجات اللي بتصلّح يومي. نفسي أفضل العمر كله السبب في ضحكة جديدة على وشك.', signoff: 'ضحكتك عندي بالدنيا' },
        { message: 'بحب تفاصيلك الصغيرة، وطريقتك، وكلامك، والحاجات اللي يمكن إنتِ ما تعرفيش قد إيه بتفرّحني.', signoff: 'بحبك زي ما إنتِ' },
        { message: 'إنتِ حبيبتي وبنت قلبي وونس أيامي. نفسي أفضل دايمًا حد ترتاحي معاه وتحكيله كل اللي جواكي.', signoff: 'أنا جنبك من قلبي' },
        { message: 'أنا فخور بيكي وبكل خطوة بتاخديها. بحب أشوفك بتكبري وتنجحي، وبتمنى أكون دايمًا أول مشجّع ليكي.', signoff: 'هفضل دايمًا في صفك' },
        { message: 'لو يومك كان تقيل أو الدنيا شغلتك، افتكري إن في قلب بيحبك وبيتمنى يهوّنها عليكي.', signoff: 'إنتِ مش لوحدك أبدًا' },
        { message: 'ولو زعلتك في يوم، حقك عليّا. أنا بتعلم أسمعك وأفهمك أكتر، وهحاول كل مرة أكون أحنّ وأقرب.', signoff: 'آسف… وبحبك بجد' },
        { message: 'مش متخيّل حياتي من غيرك؛ نفسي أشاركك كل تفاصيل العمر، يومه الحلو والعادي، وإيدك تفضل في إيدي.', signoff: 'إنتِ أجمل بكرا' },
        { message: 'إحنا اخترنا بعض، ومستنيين النصيب والميعاد اللي ربنا يكتبه. وأنا بدعي من قلبي إن الجاي يجمعنا على خير.', signoff: 'يا رب دايمًا سوا' },
        { message: 'نفسي أكلم باباكي رسمي وأطلب إيدك؛ أقوله قد إيه بنتُه غالية، وقد إيه نفسي أبني معاها بيت كله مودة ورحمة.', signoff: 'على باب الحلال… مستني النصيب' },
        { message: 'في يوم ١١/١١ حبيت أقولك تاني: بحبك، وإنتِ حبيبتي وحياة قلبي، ونفسي أكمّل كل اللي جاي معاكي.', signoff: 'كل ١١/١١ وإنتِ معايا ♡' }
    ];
    let noteIndex = 0;
    const noteCard = byId('noteCard');
    const noteCounter = byId('noteCounter');
    const noteMessage = byId('noteMessage');
    const noteSignoff = byId('noteSignoff');
    function showNote(index) {
        noteIndex = (index + loveNotes.length) % loveNotes.length;
        const note = loveNotes[noteIndex];
        noteCounter.textContent = `رسالة ${(noteIndex + 1).toLocaleString('ar-EG')} من ${loveNotes.length.toLocaleString('ar-EG')}`;
        noteMessage.textContent = note.message;
        noteSignoff.textContent = note.signoff;
        noteCard.classList.remove('changing');
        void noteCard.offsetWidth;
        noteCard.classList.add('changing');
    }
    byId('previousNote').addEventListener('click', event => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        scatterHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
        showNote(noteIndex - 1);
    });
    byId('nextNote').addEventListener('click', event => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        scatterHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 16);
        showNote(noteIndex + 1);
    });
    byId('randomNote').addEventListener('click', event => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        scatterHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
        let nextIndex = noteIndex;
        while (nextIndex === noteIndex)
            nextIndex = Math.floor(Math.random() * loveNotes.length);
        showNote(nextIndex);
    });
    showNote(noteIndex);
    function updateScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll * 100 : 0;
        byId('progressBar').style.width = `${progress}%`;
        topbar.classList.toggle('scrolled', window.scrollY > 30);
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    function resetLightboxMedia() {
        lightboxImage.onerror = null;
        lightboxImage.hidden = true;
        lightboxImage.removeAttribute('src');
        lightboxVideo.pause();
        lightboxVideo.onerror = null;
        lightboxVideo.hidden = true;
        lightboxVideo.removeAttribute('src');
        lightboxVideo.load();
        lightboxAudio.pause();
        lightboxAudio.onerror = null;
        lightboxAudio.hidden = true;
        lightboxAudio.removeAttribute('src');
        lightboxAudio.load();
        lightboxMessage.hidden = true;
        lightboxMessage.textContent = '';
    }
    function openLightbox(title) {
        resetLightboxMedia();
        lightboxTitle.textContent = title;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function showMissingMedia(path) {
        lightboxMessage.textContent = `المكان محجوز للحظة دي ♡\nضيفي الملف هنا عشان يظهر: ${path}`;
        lightboxMessage.hidden = false;
    }
    function closeLightbox() {
        lightbox.classList.remove('open');
        resetLightboxMedia();
        document.body.style.overflow = '';
    }
    document.querySelectorAll('.photo-card').forEach(card => {
        function openPhoto() {
            const img = card.querySelector('.photo-image');
            if (!img || !img.classList.contains('loaded')) {
                say('مكان حكايتنا الحلوة… ضيف صورتك للمجلد ♡');
                return;
            }
            openLightbox(img.alt || 'لحظة من حكايتنا');
            lightboxImage.hidden = false;
            lightboxImage.alt = img.alt;
            lightboxImage.src = img.src;
        }
        card.addEventListener('click', openPhoto);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPhoto();
            }
        });
    });
    document.querySelectorAll('.facet-card[data-media-type]').forEach(card => {
        function openFacetMedia() {
            const type = card.dataset.mediaType;
            const src = card.dataset.mediaSrc || '';
            const title = card.dataset.mediaTitle || 'تفصيلة بحبها فيكي';
            openLightbox(title);
            if (type === 'image') {
                lightboxImage.alt = title;
                lightboxImage.hidden = false;
                lightboxImage.onerror = () => {
                    lightboxImage.hidden = true;
                    showMissingMedia(src);
                };
                lightboxImage.src = src;
            }
            else if (type === 'video') {
                lightboxVideo.hidden = false;
                lightboxVideo.onerror = () => {
                    lightboxVideo.hidden = true;
                    showMissingMedia(src);
                };
                lightboxVideo.src = src;
                void lightboxVideo.play().catch(() => { });
            }
            else if (type === 'audio') {
                lightboxAudio.hidden = false;
                lightboxAudio.onerror = () => {
                    lightboxAudio.hidden = true;
                    showMissingMedia(src);
                };
                lightboxAudio.src = src;
                void lightboxAudio.play().catch(() => { });
            }
        }
        card.addEventListener('click', openFacetMedia);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openFacetMedia();
            }
        });
    });
    document.querySelectorAll('[data-tilt="true"]').forEach(card => {
        card.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - .5;
            const y = (event.clientY - rect.top) / rect.height - .5;
            card.style.setProperty('--tilt-x', `${(x * 8).toFixed(2)}deg`);
            card.style.setProperty('--tilt-y', `${(-y * 7).toFixed(2)}deg`);
            card.classList.add('is-tilting');
        });
        card.addEventListener('pointerleave', () => {
            card.classList.remove('is-tilting');
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
        });
    });
    byId('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox)
        closeLightbox(); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape')
            closeLightbox();
    });
})();
