// 首先測試 JavaScript 是否執行
console.log('Script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // 確保字體已載入
    document.fonts.ready.then(() => {
        console.log('Fonts loaded');
        initMegaTitle();
    }).catch(error => {
        console.error('Font loading error:', error);
    });

    // 初始化觀察器
    initIntersectionObserver();
    
    // 初始化 Dock
    initDock();
    
    // 初始化導航欄
    initNavbar();

    // 初始化影片控制
    initVideoControl();
});

function initMegaTitle() {
    const megaTitle = document.querySelector('.mega-title');
    if (!megaTitle) {
        console.error('Could not find mega-title element');
        return;
    }

    try {
        const text = megaTitle.textContent;
        megaTitle.textContent = '';

        // 創建字母
        const letters = text.split('').map(letter => {
            if (letter === ',') {
                const span = document.createElement('span');
                span.textContent = letter;
                span.className = 'letter separator';
                megaTitle.appendChild(span);
                return span;
            }
            const span = document.createElement('span');
            span.textContent = letter;
            span.className = 'letter';
            span.style.fontVariationSettings = "'wght' 400, 'opsz' 9";
            megaTitle.appendChild(span);
            return span;
        });

        megaTitle.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const radius = 200; // 增加影響範圍

            letters.forEach(letter => {
                const rect = letter.getBoundingClientRect();
                const letterX = rect.left + rect.width / 2;
                const letterY = rect.top + rect.height / 2;

                const distance = Math.hypot(mouseX - letterX, mouseY - letterY);
                const factor = Math.max(0, 1 - distance / radius);
                const easing = factor * factor * factor;

                // 增加字重變化範圍
                const weight = Math.round(300 + easing * 700); // 從 300 到 1000
                const opsz = Math.round(8 + easing * 36);     // 從 8 到 44

                requestAnimationFrame(() => {
                    letter.style.fontVariationSettings = `'wght' ${weight}, 'opsz' ${opsz}`;
                });
            });
        });

        megaTitle.addEventListener('mouseleave', () => {
            letters.forEach(letter => {
                letter.style.fontVariationSettings = "'wght' 400, 'opsz' 9";
            });
        });

    } catch (error) {
        console.error('Error in mega-title setup:', error);
    }
}

function initDock() {
    const dockNav = document.querySelector('.dock-nav');
    const dock = document.querySelector('.dock-panel');
    const items = dock.querySelectorAll('.dock-item');

    const influence = 120;
    const maxScale = 0.5;
    const minOpacity = 0.45;
    const minBrightness = 0.55;

    items.forEach(item => {
        const label = document.createElement('div');
        label.className = 'dock-label';
        label.textContent = item.dataset.label;
        item.appendChild(label);
    });

    function resetItems() {
        items.forEach(item => {
            item.style.scale = '1';
            item.style.opacity = '1';
            item.style.filter = 'none';

            const label = item.querySelector('.dock-label');
            if (label) {
                label.style.opacity = '0';
                label.style.visibility = 'hidden';
                label.style.transform = 'translateX(-50%) translateY(10px)';
            }
        });
    }

    dockNav.addEventListener('pointermove', (e) => {
        items.forEach(item => {
            const r = item.getBoundingClientRect();
            const t = Math.max(0, 1 - Math.abs(e.clientX - r.x - r.width / 2) / influence);

            item.style.scale = String(1 + t * maxScale);
            item.style.opacity = String(minOpacity + t * (1 - minOpacity));
            item.style.filter = `brightness(${minBrightness + t * (1 - minBrightness)})`;

            const label = item.querySelector('.dock-label');
            if (label) {
                if (t > 0.5) {
                    label.style.opacity = String(t);
                    label.style.visibility = 'visible';
                    label.style.transform = 'translateX(-50%) translateY(0)';
                } else {
                    label.style.opacity = '0';
                    label.style.visibility = 'hidden';
                    label.style.transform = 'translateX(-50%) translateY(10px)';
                }
            }
        });
    });

    dockNav.addEventListener('pointerleave', resetItems);
}

// 將導航欄相關邏輯移到單獨的函數中
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const introSection = document.querySelector('.intro-hero');
    
    // 確保元素存在才添加事件監聽器
    if (navbar && introSection) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > introSection.offsetHeight * 0.7) {
                navbar.classList.add('visible');
            } else {
                navbar.classList.remove('visible');
            }
        });
    }

    // 移動端選單邏輯
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && window.innerWidth <= 768) {
        const menuToggle = document.createElement('button');
        menuToggle.classList.add('menu-toggle');
        menuToggle.innerHTML = '☰';
        
        const navContent = document.querySelector('.nav-content');
        if (navContent) {
            navContent.appendChild(menuToggle);
            
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }
}

// 將 Intersection Observer 相關邏輯移到單獨的函數中
function initIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-fade');
    elements.forEach(element => {
        observer.observe(element);
    });
}

// 添加影片控制相關的函數
function initVideoControl() {
    const introContent = document.querySelector('.intro-content');
    const showreelContainer = document.querySelector('.showreel-container');
    const video = document.querySelector('.showreel-video');
    const videoControl = document.querySelector('.video-control');
    const volumeControl = document.querySelector('.volume-control');

    if (!video || !videoControl || !showreelContainer || !introContent || !volumeControl) {
        console.error('Video elements not found');
        return;
    }

    // 移除 muted 屬性，允許播放聲音
    video.muted = true; // 初始設為靜音

    // 音量控制
    volumeControl.addEventListener('click', () => {
        if (video.muted) {
            video.muted = false;
            volumeControl.classList.remove('muted');
        } else {
            video.muted = true;
            volumeControl.classList.add('muted');
        }
    });

    // 更新滾動效果
    function updateScroll() {
        const wrapper = document.querySelector('.showreel-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const heroSection = document.querySelector('.hero-section');
        
        // 計算滾動進度 (50% ~ 85%)
        const scrollProgress = (viewportHeight - wrapperRect.top) / viewportHeight;
        const normalizedProgress = Math.max(0, Math.min(1, (scrollProgress - 0.5) / 0.25));
        
        if (scrollProgress > 0.5) {
            showreelContainer.classList.add('expanded');
            showreelContainer.style.opacity = normalizedProgress;
            
            // 計算尺寸變化 (50% ~ 85%)
            const scale = 0.5 + (normalizedProgress * 0.35);
            showreelContainer.style.transform = `scale(${scale})`;
            
            introContent.classList.add('scrolled');
            
            // 當影片開始顯示時，隱藏遮罩
            heroSection.classList.add('hide-mask');
        } else {
            showreelContainer.classList.remove('expanded');
            showreelContainer.style.opacity = 0;
            showreelContainer.style.transform = 'scale(0.5)';
            introContent.classList.remove('scrolled');
            
            // 當影片隱藏時，顯示遮罩
            heroSection.classList.remove('hide-mask');
        }
    }

    // 監聽滾動事件
    window.addEventListener('scroll', updateScroll);
    
    // 初始檢查
    updateScroll();

    // 影片播放控制
    videoControl.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            videoControl.classList.remove('paused');
        } else {
            video.pause();
            videoControl.classList.add('paused');
        }
    });

    // 確保影片適當載入
    video.addEventListener('loadedmetadata', () => {
        showreelContainer.classList.add('loaded');
    });

    // 添加錯誤處理
    video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        console.log('Video error code:', video.error.code);
        console.log('Video error message:', video.error.message);
    });

    video.addEventListener('loadstart', () => console.log('Video load started'));
    video.addEventListener('loadeddata', () => console.log('Video data loaded'));
    video.addEventListener('canplay', () => console.log('Video can play'));
}

// 測試全局錯誤
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
}); 