        /* ══════════════════════════════════════════════════════════════════
           라이티 통화 데모 — 랜딩(peera-landing)의 히어로 데모를 그대로 옮긴 것.
           본품 dearmydiary의 writy.riv가 여기서도 실제로 구동된다.
           ★원본 로직을 재구현하지 말 것. 손대면 call-top·일기장처럼
             '보일 때만 보이는' 연출이 조용히 깨진다.
           달라진 점은 두 가지뿐: 자산 경로(/assets/peera/)와 대본의 ko/en 분기.
           ══════════════════════════════════════════════════════════════════ */

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ── 라이브 라이티 ── */
        const riveCanvas = document.getElementById('riveCanvas');
        let laityVmi = null;
        let riveInst = null;   // 화면 밖에선 멈춰 둔다(모바일 배터리·CPU)

        function setLaity(name, v) {
            try { const b = laityVmi && laityVmi.boolean && laityVmi.boolean(name); if (b) b.value = v; } catch (_) {}
        }

        function initLaityRive() {
            if (prefersReduced || !window.rive || !riveCanvas || riveCanvas.dataset.init) return;
            riveCanvas.dataset.init = '1';
            try {
                rive.RuntimeLoader.setWasmUrl(new URL('/assets/peera/rive.wasm', location.origin).href);
                const r = new rive.Rive({
                    src: '/assets/peera/writy.riv',
                    canvas: riveCanvas,
                    artboard: 'Artboard',
                    stateMachines: 'squirrel_state',
                    autoplay: true,
                    autoBind: true,
                    layout: new rive.Layout({ fit: rive.Fit.Cover, alignment: rive.Alignment.Center }),
                    onLoad: () => {
                        r.resizeDrawingSurfaceToCanvas();
                        riveInst = r;
                        laityVmi = r.viewModelInstance || null;
                        setLaity('isTalking', false);
                        setLaity('isListening', false);
                        setLaity('isThinkingComplex', false);
                        try { const m = laityVmi && laityVmi.number && laityVmi.number('mouthOpen'); if (m) m.value = -1; } catch (_) {}
                        riveCanvas.classList.add('on');
                    },
                });
                addEventListener('resize', () => { try { r.resizeDrawingSurfaceToCanvas(); } catch (_) {} });
            } catch (_) { /* 포스터 폴백 */ }
        }
        initLaityRive();

        /* ── 대본 ──
           실제 앱의 하루: 라이티가 문자를 보내고 → 아이가 전화를 걸고 → 통화 → 일기.
           ko는 랜딩 원본 그대로. en은 사이트 기본 언어가 영어라 함께 싣는다. */
        const SCRIPTS = {
            ko: {
                notif: '나 오늘 진짜 커다란 도토리를 주웠어!',
                turns: [
                    { who: 'laity', text: '어? 지우야, 안녕! 오늘 하루 어땠어?' },
                    { who: 'kid',   text: '라이티야! 아까 문자 봤어. 도토리 어디서 주웠어?' },
                    { who: 'laity', text: '참나무 밑에서! 너무 커서 들고 오다 데굴데굴 굴렀지 뭐야. 너는 오늘 뭐 했어?' },
                    { who: 'kid',   text: '유치원에서 종이접기 했어. 어려웠는데 끝까지 했어' },
                    { who: 'laity', text: '끝까지 해냈구나, 멋지다! 그때 기분이 어땠어?' },
                    { who: 'kid',   text: '뿌듯했어!' },
                    { who: 'laity', text: '그 뿌듯한 마음, 우리 일기로 남겨볼까?' },
                ],
                diary: '오늘 종이접기를 했다.\n어려웠는데 끝까지 해서 뿌듯했다.',
            },
            en: {
                notif: 'I found a REALLY big acorn today!',
                turns: [
                    { who: 'laity', text: 'Oh, hi Jiwoo! How was your day?' },
                    { who: 'kid',   text: 'Laity! I saw your message. Where did you find the acorn?' },
                    { who: 'laity', text: 'Under the oak tree! It was so big I dropped it and it rolled away. What did you do today?' },
                    { who: 'kid',   text: 'We did origami at kindergarten. It was hard but I finished it' },
                    { who: 'laity', text: 'You saw it through — that’s wonderful! How did that feel?' },
                    { who: 'kid',   text: 'I felt proud!' },
                    { who: 'laity', text: 'Shall we keep that proud feeling in your diary?' },
                ],
                diary: 'Today I did origami.\nIt was hard, but I finished it and felt proud.',
            },
        };
        const script = () => SCRIPTS[currentLang] || SCRIPTS.en;

        const phone      = document.getElementById('phoneDemo');
        const chat       = document.getElementById('chat');
        const diary      = document.getElementById('diary');
        const diaryText  = document.getElementById('diaryText');
        const diaryStamp = document.getElementById('diaryStamp');
        const battFill   = document.getElementById('battFill');
        const callTime   = document.getElementById('callTime');
        const callTop    = document.querySelector('.call-top');
        const callHint   = document.getElementById('callHint');
        const notif      = document.getElementById('notif');
        const notifText  = document.getElementById('notifText');
        const calling    = document.getElementById('calling');

        let demoGen = 0;          // 리셋 시 진행 중인 체인을 무효화
        let demoVisible = false;
        let callRunning = false;  // 3막(통화) 중에만 통화시간이 흐른다
        let secs = 0, timeTimer = null;

        const wait = (ms, gen) => new Promise((r) => setTimeout(() => r(gen === demoGen), ms));
        const fmt = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');

        function addBubble(who) {
            const b = document.createElement('div');
            b.className = 'bubble ' + who;
            chat.appendChild(b);
            // 오래된 말풍선은 3개까지만 유지
            while (chat.children.length > 3) chat.removeChild(chat.firstChild);
            return b;
        }

        async function typeInto(el, text, gen, cps = 38) {
            const caret = document.createElement('span');
            caret.className = 'caret';
            for (let i = 0; i <= text.length; i++) {
                if (gen !== demoGen) return false;
                el.textContent = text.slice(0, i);
                el.appendChild(caret);
                await new Promise((r) => setTimeout(r, 1000 / cps));
            }
            caret.remove();
            el.textContent = text;
            return true;
        }

        function setBattery(pct) {
            battFill.style.width = pct + '%';
            battFill.style.background = pct <= 18 ? '#F2A05C' : '#7BD68B';
        }

        function renderStatic() {
            // 모션 최소화 환경: 통화 마지막 장면 + 완성된 일기를 그대로 보여준다.
            const S = script();
            chat.innerHTML = '';
            S.turns.slice(-3).forEach((m) => { addBubble(m.who).textContent = m.text; });
            setBattery(12);
            callTop.style.opacity = '1';
            callTime.textContent = fmt(184);
            diary.classList.add('show');
            diaryText.textContent = S.diary.replace('\n', ' ');
            diaryStamp.classList.add('show');
        }

        async function runDemo() {
            const gen = ++demoGen;
            const S = script();
            chat.innerHTML = '';
            diary.classList.remove('show');
            diaryStamp.classList.remove('show');
            diaryText.textContent = '';
            notif.classList.remove('show');
            notifText.textContent = '';
            calling.classList.remove('show');
            callHint.classList.remove('show');
            callTop.style.opacity = '0';
            setBattery(92);
            secs = 0;
            callTime.textContent = fmt(secs);
            callRunning = false;

            // ── 1막 · 라이티가 문자를 보낸다 ──
            if (!await wait(700, gen)) return;
            notif.classList.add('show');
            if (!await typeInto(notifText, S.notif, gen, 30)) return;
            if (!await wait(1700, gen)) return;
            notif.classList.remove('show');

            // ── 2막 · 궁금해진 아이가 전화를 건다 ──
            if (!await wait(500, gen)) return;
            calling.classList.add('show');
            if (!await wait(2100, gen)) return;
            calling.classList.remove('show');

            // ── 3막 · 통화 ──
            callTop.style.opacity = '1';
            callHint.classList.add('show');
            callRunning = true;
            if (!await wait(500, gen)) return;

            for (let i = 0; i < S.turns.length; i++) {
                if (gen !== demoGen) return;
                const m = S.turns[i];
                setBattery(92 - i * 11);

                if (m.who === 'laity') {
                    const b = addBubble('laity');
                    setLaity('isTalking', true);       // Rive: 말하는 애니메이션
                    const ok = await typeInto(b, m.text, gen, 46);
                    setLaity('isTalking', false);
                    if (!ok) return;
                    if (!await wait(750, gen)) return;
                } else {
                    const b = addBubble('kid');
                    b.innerHTML = '<span class="listen" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
                    setLaity('isListening', true);     // Rive: 귀 기울이는 애니메이션
                    if (!await wait(900, gen)) return;
                    b.textContent = m.text;
                    setLaity('isListening', false);
                    if (!await wait(850, gen)) return;
                }
            }

            // ── 4막 · 통화 끝, 말이 글로 ──
            setBattery(8);
            callRunning = false;
            callHint.classList.remove('show');
            if (!await wait(1200, gen)) return;
            diary.classList.add('show');
            if (!await wait(650, gen)) return;
            const lines = S.diary.split('\n');
            for (const [idx, line] of lines.entries()) {
                const ok = await typeInto(diaryText, lines.slice(0, idx).join('\n') + (idx ? '\n' : '') + line, gen, 22);
                if (!ok) return;
            }
            diaryStamp.classList.add('show');
            if (!await wait(3600, gen)) return;
            if (demoVisible) runDemo();   // 루프
        }

        // 언어를 바꾸면 진행 중인 대본을 끊고 새 언어로 다시 돌린다
        function restartDemoForLang() {
            if (prefersReduced) { renderStatic(); return; }
            demoGen++;
            if (demoVisible) runDemo();
        }

        if (prefersReduced) {
            renderStatic();
        } else {
            // 통화 시간 카운터 — 실제 통화 중일 때만 흐른다
            timeTimer = setInterval(() => {
                if (demoVisible && callRunning) { secs++; callTime.textContent = fmt(secs); }
            }, 1000);

            const demoIO = new IntersectionObserver((ents) => {
                ents.forEach((e) => {
                    const was = demoVisible;
                    demoVisible = e.isIntersecting;
                    if (demoVisible && !was) {
                        try { riveInst && riveInst.play(); } catch (_) {}
                        runDemo();
                    }
                    if (!demoVisible) {
                        demoGen++;                                          // 화면 밖: 대본 체인 중단
                        try { riveInst && riveInst.pause(); } catch (_) {}  // Rive 렌더링도 정지
                    }
                });
            }, { threshold: .2 });
            demoIO.observe(phone);

            // 탭이 백그라운드면 애니메이션을 멈춘다.
            document.addEventListener('visibilitychange', () => {
                try {
                    if (document.hidden) { demoGen++; riveInst && riveInst.pause(); }
                    else if (demoVisible) { riveInst && riveInst.play(); runDemo(); }
                } catch (_) {}
            });
        }
