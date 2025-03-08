// Класс для управления музыкальным плеером
class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.isPlaying = false;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isShuffled = false;
        this.repeatMode = 'none'; // none, one, all
        this.volume = 0.6;

        // Инициализация слушателей событий
        this.initListeners();
        this.updateVolumeUI();
        this.hidePlayer(); // Скрываем плеер в начальном состоянии
    }

    initListeners() {
        // Слушатели для аудиоэлемента
        this.audioElement.addEventListener('timeupdate', () => this.updateProgressBar());
        this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
        this.audioElement.addEventListener('canplay', () => {
            if (this.isPlaying) {
                this.audioElement.play();
            }
        });
        
        // Установка громкости
        this.audioElement.volume = this.volume;
        
        // Кнопки управления
        const playPauseBtn = document.querySelector('.play-pause');
        const prevBtn = document.querySelector('.fa-step-backward');
        const nextBtn = document.querySelector('.fa-step-forward');
        const shuffleBtn = document.querySelector('.fa-random');
        const repeatBtn = document.querySelector('.fa-redo');
        const volumeBtn = document.querySelector('.fa-volume-up');
        const volumeSlider = document.querySelector('.volume-slider');
        const progressContainer = document.querySelector('.progress-container');
        const favoriteBtn = document.querySelector('.track-info .fa-heart');

        // События клика на кнопки
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevTrack());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTrack());
        }
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        // Управление громкостью
        if (volumeSlider) {
            volumeSlider.addEventListener('click', (e) => {
                const newVolume = this.calculateVolumeFromClick(e);
                this.setVolume(newVolume);
            });
        }

        // Управление прогрессом
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const newTime = this.calculateTimeFromClick(e);
                this.seekTo(newTime);
            });
        }
    }

    // Загрузка трека
    loadTrack(track) {
        if (!track) return;

        this.currentTrack = track;
        this.audioElement.src = track.audioUrl;
        this.audioElement.load();

        // Обновляем UI
        this.updateTrackInfoUI();
    }

    // Начать воспроизведение
    play() {
        if (!this.currentTrack) return;
        
        this.isPlaying = true;
        this.audioElement.play();
        this.updatePlayPauseUI();
        this.showPlayer(); // Показываем плеер при воспроизведении
        
        // Отправляем событие о начале воспроизведения для анимации дождя
        document.dispatchEvent(new CustomEvent('playStateChanged', { 
            detail: { isPlaying: true }
        }));
    }

    // Пауза
    pause() {
        this.isPlaying = false;
        this.audioElement.pause();
        this.updatePlayPauseUI();
        // Не скрываем плеер при паузе, только при остановке или в начальном состоянии
        
        // Отправляем событие о паузе для анимации дождя
        document.dispatchEvent(new CustomEvent('playStateChanged', { 
            detail: { isPlaying: false }
        }));
    }

    // Остановка
    stop() {
        this.isPlaying = false;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.updatePlayPauseUI();
        this.hidePlayer(); // Скрываем плеер при остановке
        
        // Отправляем событие о остановке для анимации дождя
        document.dispatchEvent(new CustomEvent('playStateChanged', { 
            detail: { isPlaying: false }
        }));
    }

    // Переключение воспроизведение/пауза
    togglePlayPause() {
        if (!this.currentTrack) {
            if (this.playlist.length > 0) {
                this.loadTrack(this.playlist[this.currentTrackIndex]);
                this.play();
            }
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // Показать плеер
    showPlayer() {
        const playerElement = document.querySelector('.player');
        if (playerElement) {
            playerElement.classList.add('active');
        }
    }

    // Скрыть плеер
    hidePlayer() {
        const playerElement = document.querySelector('.player');
        if (playerElement) {
            playerElement.classList.remove('active');
        }
    }

    // Следующий трек
    nextTrack() {
        if (this.playlist.length === 0) return;

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(this.playlist[this.currentTrackIndex]);
        if (this.isPlaying) {
            this.play();
        }
    }

    // Предыдущий трек
    prevTrack() {
        if (this.playlist.length === 0) return;

        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.playlist[this.currentTrackIndex]);
        if (this.isPlaying) {
            this.play();
        }
    }

    // Обработка окончания трека
    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audioElement.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || (!this.repeatMode && this.currentTrackIndex < this.playlist.length - 1)) {
            this.nextTrack();
        } else {
            this.stop(); // Останавливаем и скрываем плеер при окончании последнего трека
        }
    }

    // Переключение случайного порядка
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.querySelector('.fa-random');
        
        if (shuffleBtn) {
            if (this.isShuffled) {
                shuffleBtn.classList.add('active');
                // Перемешиваем плейлист
                this.shufflePlaylist();
            } else {
                shuffleBtn.classList.remove('active');
                // Восстанавливаем оригинальный порядок
                this.unshufflePlaylist();
            }
        }
    }

    // Перемешать плейлист
    shufflePlaylist() {
        // Сохраняем текущий трек
        const currentTrack = this.playlist[this.currentTrackIndex];
        
        // Перемешиваем
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
        
        // Находим новый индекс текущего трека
        this.currentTrackIndex = this.playlist.findIndex(track => track === currentTrack);
    }

    // Восстановить оригинальный порядок плейлиста
    unshufflePlaylist() {
        // Предполагается, что у треков есть originalIndex
        this.playlist.sort((a, b) => a.originalIndex - b.originalIndex);
        
        // Обновляем текущий индекс
        if (this.currentTrack) {
            this.currentTrackIndex = this.playlist.findIndex(track => track === this.currentTrack);
        }
    }

    // Переключение режима повтора
    toggleRepeat() {
        const repeatBtn = document.querySelector('.fa-redo');
        
        if (this.repeatMode === 'none') {
            this.repeatMode = 'all';
            if (repeatBtn) repeatBtn.classList.add('active');
        } else if (this.repeatMode === 'all') {
            this.repeatMode = 'one';
            if (repeatBtn) repeatBtn.classList.add('active-one');
        } else {
            this.repeatMode = 'none';
            if (repeatBtn) {
                repeatBtn.classList.remove('active');
                repeatBtn.classList.remove('active-one');
            }
        }
    }

    // Добавление/удаление из избранного
    toggleFavorite() {
        if (!this.currentTrack) return;
        
        this.currentTrack.isFavorite = !this.currentTrack.isFavorite;
        const favoriteBtn = document.querySelector('.track-info .fa-heart');
        
        if (favoriteBtn) {
            if (this.currentTrack.isFavorite) {
                favoriteBtn.classList.remove('far');
                favoriteBtn.classList.add('fas');
                favoriteBtn.style.color = 'var(--accent-color)';
            } else {
                favoriteBtn.classList.remove('fas');
                favoriteBtn.classList.add('far');
                favoriteBtn.style.color = 'var(--text-secondary)';
            }
        }
        
        // Тут можно добавить сохранение в localStorage или на сервер
    }

    // Устанавливает громкость
    setVolume(value) {
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        
        this.volume = value;
        this.audioElement.volume = value;
        this.updateVolumeUI();
    }

    // Переключение отключения звука
    toggleMute() {
        const volumeBtn = document.querySelector('.fa-volume-up');
        
        if (this.audioElement.volume > 0) {
            this.lastVolume = this.audioElement.volume;
            this.setVolume(0);
            if (volumeBtn) {
                volumeBtn.classList.remove('fa-volume-up');
                volumeBtn.classList.add('fa-volume-mute');
            }
        } else {
            this.setVolume(this.lastVolume || 0.6);
            if (volumeBtn) {
                volumeBtn.classList.remove('fa-volume-mute');
                volumeBtn.classList.add('fa-volume-up');
            }
        }
    }

    // Обновить интерфейс громкости
    updateVolumeUI() {
        const volumeProgress = document.querySelector('.volume-progress');
        if (volumeProgress) {
            volumeProgress.style.width = `${this.volume * 100}%`;
        }
    }

    // Вычислить громкость на основе клика
    calculateVolumeFromClick(event) {
        const volumeSlider = document.querySelector('.volume-slider');
        if (!volumeSlider) return this.volume;
        
        const rect = volumeSlider.getBoundingClientRect();
        const x = event.clientX - rect.left;
        return Math.max(0, Math.min(1, x / rect.width));
    }

    // Обновление интерфейса прогресса
    updateProgressBar() {
        const progressElement = document.querySelector('.progress');
        const currentTimeElement = document.querySelector('.current-time');
        const totalTimeElement = document.querySelector('.total-time');
        
        if (progressElement && this.audioElement.duration) {
            const percentage = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            progressElement.style.width = `${percentage}%`;
        }
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(this.audioElement.currentTime);
        }
        
        if (totalTimeElement) {
            totalTimeElement.textContent = this.formatTime(this.audioElement.duration);
        }
    }

    // Перемотка к определенному времени
    seekTo(time) {
        if (!this.audioElement.duration) return;
        
        this.audioElement.currentTime = time;
    }

    // Вычислить время на основе клика
    calculateTimeFromClick(event) {
        const progressContainer = document.querySelector('.progress-container');
        if (!progressContainer || !this.audioElement.duration) return 0;
        
        const rect = progressContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        return (x / rect.width) * this.audioElement.duration;
    }

    // Форматирование времени в мм:сс
    formatTime(time) {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Обновление интерфейса информации о треке
    updateTrackInfoUI() {
        if (!this.currentTrack) return;
        
        const trackImage = document.querySelector('.current-track-img');
        const trackTitle = document.querySelector('.track-details h4');
        const trackArtist = document.querySelector('.track-details p');
        const favoriteBtn = document.querySelector('.track-info .fa-heart');
        
        if (trackImage) {
            trackImage.src = this.currentTrack.imageUrl;
            trackImage.alt = `${this.currentTrack.title} by ${this.currentTrack.artist}`;
        }
        
        if (trackTitle) {
            trackTitle.textContent = this.currentTrack.title;
        }
        
        if (trackArtist) {
            trackArtist.textContent = this.currentTrack.artist;
        }
        
        if (favoriteBtn) {
            if (this.currentTrack.isFavorite) {
                favoriteBtn.classList.remove('far');
                favoriteBtn.classList.add('fas');
                favoriteBtn.style.color = 'var(--accent-color)';
            } else {
                favoriteBtn.classList.remove('fas');
                favoriteBtn.classList.add('far');
                favoriteBtn.style.color = 'var(--text-secondary)';
            }
        }
    }

    // Обновление интерфейса кнопки воспроизведения/паузы
    updatePlayPauseUI() {
        const playPauseIcon = document.querySelector('.play-pause i');
        
        if (playPauseIcon) {
            if (this.isPlaying) {
                playPauseIcon.classList.remove('fa-play');
                playPauseIcon.classList.add('fa-pause');
            } else {
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }
        }
    }

    // Загрузка плейлиста
    loadPlaylist(tracks) {
        this.playlist = tracks.map((track, index) => {
            return {
                ...track,
                originalIndex: index
            };
        });
        
        if (this.playlist.length > 0 && !this.currentTrack) {
            this.currentTrackIndex = 0;
            this.loadTrack(this.playlist[0]);
        }
    }
}

// Экспорт класса
window.MusicPlayer = MusicPlayer;
