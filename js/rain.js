// Класс для создания и управления эффектом дождя
class RainEffect {
    constructor(options = {}) {
        // Настройки по умолчанию
        this.options = {
            container: '.rain-effect',
            dropCount: 100,
            maxDropSize: 8,
            minDropSize: 2,
            fallSpeed: 2,
            colors: ['rgba(157, 139, 176, 0.6)', 'rgba(192, 192, 192, 0.6)'],
            glowCount: 5,
            ...options
        };

        // Инициализация
        this.container = document.querySelector(this.options.container);
        this.drops = [];
        this.glows = [];
        this.ripples = [];
        this.renderTimestamp = null;
        this.rainSounds = null;
        
        // Создаем дождь только если контейнер найден
        if (this.container) {
            this.createRaindrops();
            this.createGlowEffect();
            this.createReflectionLayer();
            this.animate();
            
            // Адаптация при изменении размера окна
            window.addEventListener('resize', () => {
                this.resize();
            });
        }
    }

    // Создание капель дождя
    createRaindrops() {
        for (let i = 0; i < this.options.dropCount; i++) {
            this.createRaindrop();
        }
    }

    // Создание одной капли дождя
    createRaindrop() {
        // Случайные параметры для разнообразия
        const size = Math.random() * (this.options.maxDropSize - this.options.minDropSize) + this.options.minDropSize;
        const x = Math.random() * 100; // позиция в процентах
        const delay = Math.random() * 5; // задержка анимации
        const duration = (Math.random() * 0.7 + 0.3) * (10 / this.options.fallSpeed); // длительность падения
        const colorIndex = Math.floor(Math.random() * this.options.colors.length);
        
        // Создаем элемент капли
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.width = `${size}px`;
        drop.style.height = `${size * 3}px`; // Капля длиннее, чем шире
        drop.style.left = `${x}%`;
        drop.style.top = '-50px';
        drop.style.opacity = (Math.random() * 0.4 + 0.4).toString();
        drop.style.background = `linear-gradient(to bottom, transparent, ${this.options.colors[colorIndex]})`;
        drop.style.animation = `fall ${duration}s linear ${delay}s infinite`;
        drop.style.zIndex = (Math.floor(Math.random() * 3)).toString();
        
        // Добавляем каплю в контейнер и массив
        this.container.appendChild(drop);
        this.drops.push({
            element: drop,
            x,
            size,
            delay,
            duration,
            timestamp: 0
        });
        
        // Возвращаем созданную каплю
        return drop;
    }

    // Создание эффекта свечения
    createGlowEffect() {
        for (let i = 0; i < this.options.glowCount; i++) {
            const glow = document.createElement('div');
            glow.className = 'glow';
            const size = Math.random() * 200 + 100;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            
            glow.style.width = `${size}px`;
            glow.style.height = `${size}px`;
            glow.style.left = `${x}%`;
            glow.style.top = `${y}%`;
            glow.style.animation = `flicker ${Math.random() * 3 + 2}s ease-in-out ${Math.random() * 2}s infinite alternate`;
            
            this.container.appendChild(glow);
            this.glows.push(glow);
        }
    }

    // Создание слоя отражения для капель
    createReflectionLayer() {
        const reflection = document.createElement('div');
        reflection.className = 'reflection';
        this.container.appendChild(reflection);
    }

    // Создание эффекта брызг при падении капли
    createSplash(x, y, size) {
        // Создаем несколько брызг в разных направлениях
        const splashCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < splashCount; i++) {
            const splash = document.createElement('div');
            splash.className = 'splash';
            const splashSize = Math.random() * size / 2 + size / 4;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * size * 2 + size;
            
            splash.style.width = `${splashSize}px`;
            splash.style.height = `${splashSize / 3}px`;
            splash.style.left = `${x}%`;
            splash.style.top = `${y}px`;
            splash.style.opacity = '1';
            splash.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
            splash.style.animation = `splash ${Math.random() * 0.5 + 0.3}s ease-out forwards`;
            
            this.container.appendChild(splash);
            
            // Удаляем брызги после завершения анимации
            setTimeout(() => {
                if (splash.parentNode) {
                    splash.parentNode.removeChild(splash);
                }
            }, 800);
        }
        
        // Создаем круговую рябь на поверхности
        this.createRipple(x, y, size);
    }

    // Создание ряби на поверхности
    createRipple(x, y, size) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        const containerHeight = this.container.clientHeight;
        const rippleSize = size * 4;
        
        ripple.style.width = `${rippleSize}px`;
        ripple.style.height = `${rippleSize}px`;
        ripple.style.left = `${x}%`;
        ripple.style.top = `${y}px`;
        ripple.style.animation = `ripple ${Math.random() * 0.5 + 0.8}s ease-out forwards`;
        
        this.container.appendChild(ripple);
        
        // Удаляем рябь после завершения анимации
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1300);
    }

    // Анимация капель дождя
    animate() {
        // Для каждой капли проверяем, закончилась ли анимация падения
        const containerHeight = this.container.offsetHeight;
        
        const update = (timestamp) => {
            if (!this.renderTimestamp) this.renderTimestamp = timestamp;
            const elapsed = timestamp - this.renderTimestamp;
            
            // Обновляем каждые 100мс для оптимизации производительности
            if (elapsed > 100) {
                this.renderTimestamp = timestamp;
                
                this.drops.forEach(drop => {
                    const dropEl = drop.element;
                    const rect = dropEl.getBoundingClientRect();
                    const containerRect = this.container.getBoundingClientRect();
                    
                    // Если капля достигла нижней части контейнера
                    if (rect.top > containerRect.bottom - 20) {
                        // Создаем брызги и начинаем новый цикл для этой капли
                        const relativeY = containerRect.bottom - containerRect.top - 10;
                        this.createSplash(drop.x, relativeY, drop.size);
                        
                        // Сбрасываем позицию капли
                        dropEl.style.top = '-50px';
                        drop.delay = Math.random() * 5;
                        drop.duration = (Math.random() * 0.7 + 0.3) * (10 / this.options.fallSpeed);
                        dropEl.style.animation = `fall ${drop.duration}s linear ${drop.delay}s infinite`;
                    }
                });
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }

    // Адаптация при изменении размера окна
    resize() {
        // Обновляем позиции элементов
        this.glows.forEach(glow => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            glow.style.left = `${x}%`;
            glow.style.top = `${y}%`;
        });
    }

    // Изменение интенсивности дождя
    setIntensity(dropCount) {
        const diff = dropCount - this.drops.length;
        
        if (diff > 0) {
            // Добавляем капли
            for (let i = 0; i < diff; i++) {
                this.createRaindrop();
            }
        } else if (diff < 0) {
            // Удаляем капли
            for (let i = 0; i < Math.abs(diff); i++) {
                if (this.drops.length > 0) {
                    const drop = this.drops.pop();
                    if (drop.element.parentNode) {
                        drop.element.parentNode.removeChild(drop.element);
                    }
                }
            }
        }
        
        this.options.dropCount = dropCount;
    }
}

// Создаем эффект дождя после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляр с настройками
    const rainEffect = new RainEffect({
        dropCount: 150,  // Больше капель для эффектности
        fallSpeed: 1.5,  // Немного медленнее падение для эстетичности
        maxDropSize: 6,
        colors: [
            'rgba(157, 139, 176, 0.6)', // Фиолетовый
            'rgba(192, 192, 192, 0.6)',  // Серебристый
            'rgba(176, 157, 194, 0.6)',  // Лавандовый
            'rgba(143, 130, 167, 0.6)'   // Темно-фиолетовый
        ]
    });
    
    // Реагируем на воспроизведение музыки - интенсивность дождя может меняться
    document.addEventListener('playStateChanged', (e) => {
        if (e.detail.isPlaying) {
            // Увеличиваем количество капель и меняем цвета при воспроизведении
            rainEffect.setIntensity(250);
        } else {
            // Уменьшаем количество капель при паузе
            rainEffect.setIntensity(150);
        }
    });
});
