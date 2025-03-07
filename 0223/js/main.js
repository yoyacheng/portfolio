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
    const dock = document.querySelector('.dock-panel');
    const items = dock.querySelectorAll('.dock-item');
    
    // 調整參數
    const spring = {
        mass: 1,
        stiffness: 80,     // 降低剛性
        damping: 15,       // 增加阻尼
        precision: 0.01
    };
    
    // 調整大小參數
    const baseItemSize = 50;
    const magnification = 65;   // 減小放大倍率
    const distance = 120;      // 減小影響範圍
    
    function createSpring(initialValue) {
        let velocity = 0;
        let currentValue = initialValue;
        let targetValue = initialValue;

        return {
            set: function(value) {
                targetValue = value;
            },
            update: function() {
                const force = (targetValue - currentValue) * spring.stiffness;
                const damping = velocity * spring.damping;
                const acceleration = (force - damping) / spring.mass;
                
                velocity += acceleration * 0.0007; // 降低速度
                currentValue += velocity;
                
                if (Math.abs(targetValue - currentValue) < spring.precision && 
                    Math.abs(velocity) < spring.precision) {
                    currentValue = targetValue;
                    velocity = 0;
                }
                
                return currentValue;
            },
            getCurrentValue: function() {
                return currentValue;
            }
        };
    }

    const itemSprings = new Map();
    items.forEach(item => {
        itemSprings.set(item, createSpring(baseItemSize));
    });

    function updateSizes() {
        let isAnimating = false;

        items.forEach(item => {
            const spring = itemSprings.get(item);
            const currentSize = spring.getCurrentValue();
            const newSize = spring.update();
            
            if (Math.abs(currentSize - newSize) > spring.precision) {
                isAnimating = true;
            }
            
            // 更新容器大小
            item.style.width = `${newSize}px`;
            item.style.height = `${newSize}px`;
            
            // 更新圖標大小，保持圖標大小相對穩定
            const icon = item.querySelector('.dock-icon');
            if (icon) {
                // 使用平方根來平滑縮放
                const scaleRatio = Math.sqrt(baseItemSize / newSize);
                icon.style.transform = `scale(${scaleRatio})`;
            }
        });

        if (isAnimating) {
            requestAnimationFrame(updateSizes);
        }
    }

    function updateItemSize(item, mouseX) {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const mouseDistance = Math.abs(mouseX - itemCenterX);
        
        const spring = itemSprings.get(item);
        if (mouseDistance < distance) {
            const factor = 1 - (mouseDistance / distance);
            // 使用更平滑的緩動函數
            const easing = factor * factor * (3 - 2 * factor);
            const targetSize = baseItemSize + (magnification - baseItemSize) * easing;
            spring.set(targetSize);
        } else {
            spring.set(baseItemSize);
        }
        
        requestAnimationFrame(updateSizes);
    }

    // 處理標籤顯示
    items.forEach(item => {
        const label = document.createElement('div');
        label.className = 'dock-label';
        label.textContent = item.dataset.label;
        item.appendChild(label);

        item.addEventListener('mouseenter', () => {
            label.style.opacity = '1';
            label.style.visibility = 'visible';
            label.style.transform = 'translateX(-50%) translateY(0)';
        });

        item.addEventListener('mouseleave', () => {
            label.style.opacity = '0';
            label.style.visibility = 'hidden';
            label.style.transform = 'translateX(-50%) translateY(10px)';
        });
    });

    // 鼠標移動處理
    dock.addEventListener('mousemove', (e) => {
        items.forEach(item => updateItemSize(item, e.clientX));
    });

    dock.addEventListener('mouseleave', () => {
        items.forEach(item => {
            const spring = itemSprings.get(item);
            spring.set(baseItemSize);
        });
    });

    // 開始動畫循環
    updateSizes();
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