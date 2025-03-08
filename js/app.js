// Инициализация приложения при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
    // Создание экземпляра плеера
    const player = new MusicPlayer();
    
    // Инициализация приложения без демо-треков
    initializeApp(player);
    
    // Добавление обработчиков событий для навигации
    setupNavigationListeners();
});

// Инициализация приложения
function initializeApp(player) {
    // Пустой плейлист для начала
    const playlist = [];
    
    // Загрузка пустого плейлиста в плеер
    player.loadPlaylist(playlist);
    
    // Заполнение интерфейса пустым состоянием
    updateUIForEmptyState();
}

// Обновление интерфейса для пустого состояния
function updateUIForEmptyState() {
    const trackGrid = document.querySelector('.track-grid');
    if (!trackGrid) return;
    
    // Очистка содержимого
    trackGrid.innerHTML = '';
    
    // Добавляем сообщение о пустой коллекции
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <div class="empty-state-icon">
            <i class="fas fa-music"></i>
        </div>
        <h3>Ваша коллекция пуста</h3>
        <p>Начните поиск музыки, чтобы добавить треки в коллекцию</p>
        <button class="search-button">
            <i class="fas fa-search"></i> Начать поиск
        </button>
    `;
    
    trackGrid.appendChild(emptyState);
    
    // Добавляем обработчик для кнопки поиска
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            document.querySelector('.search-bar input').focus();
        });
    }
}

// Обработчик добавления новой музыки (заглушка для будущей реализации)
function handleAddMusic(track) {
    const trackGrid = document.querySelector('.track-grid');
    if (!trackGrid) return;
    
    // Проверяем, есть ли пустое состояние, если да - очищаем грид
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        trackGrid.innerHTML = '';
    }
    
    // Создаем карточку трека
    const trackCard = createTrackCard(track);
    trackGrid.appendChild(trackCard);
}

// Создание карточки трека
function createTrackCard(track) {
    const trackCard = document.createElement('div');
    trackCard.className = 'track-card';
    trackCard.dataset.trackId = track.id;
    
    trackCard.innerHTML = `
        <div class="track-image">
            <img src="${track.imageUrl}" alt="${track.title}">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <h4>${track.title}</h4>
        <p>${track.artist}</p>
    `;
    
    return trackCard;
}

// Настройка обработчиков событий для навигации
function setupNavigationListeners() {
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Удаление класса active со всех ссылок
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            
            // Добавление класса active текущей ссылке
            link.parentElement.classList.add('active');
            
            // Здесь можно добавить логику для переключения между разделами
            // Например, загрузка содержимого соответствующей страницы
        });
    });
}

// Вспомогательная функция для добавления временного уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
