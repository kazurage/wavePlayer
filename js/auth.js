/**
 * Wave - Система аутентификации
 * Файл отвечает за регистрацию, вход и управление пользователями
 */

class AuthSystem {
    constructor() {
        // Базовый URL для API
        this.apiUrl = '/api/';
        
        // Авторизованный пользователь
        this.currentUser = null;
        
        // Элементы интерфейса
        this.loginModal = document.getElementById('login-modal');
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        
        this.registerModal = document.getElementById('register-modal');
        this.registerForm = document.getElementById('register-form');
        this.registerError = document.getElementById('register-error');
        
        this.loginBtn = document.getElementById('login-button');
        this.registerBtn = document.getElementById('register-button');
        this.logoutBtn = document.getElementById('logout-button');
        this.profileBtn = document.getElementById('profile-button');
        
        this.username = document.getElementById('username');
        this.userAvatar = document.getElementById('user-avatar');
        this.profileModal = document.getElementById('profile-modal');
        
        // Содержимое приложения
        this.appContent = document.getElementById('app-content');
        this.authOverlay = document.getElementById('auth-overlay');
        
        // Проверяем авторизацию при загрузке
        this.checkAuth();
        
        // Инициализация обработчиков событий
        this.initEventListeners();
        
        // Инициализация профиля пользователя
        this.initUserProfile();
        
        // Инициализация изменения статуса
        this.initStatusChange();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Открытие модальных окон через верхнее меню
        document.getElementById('login-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
        
        document.getElementById('register-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });
        
        // Обработчик для кнопки профиля
        this.profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserProfile();
        });
        
        // Кнопки на оверлее авторизации
        const overlayLoginBtn = document.getElementById('overlay-login-btn');
        const overlayRegisterBtn = document.getElementById('overlay-register-btn');
        
        if (overlayLoginBtn) {
            overlayLoginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }
        
        if (overlayRegisterBtn) {
            overlayRegisterBtn.addEventListener('click', () => {
                this.showRegisterModal();
            });
        }
        
        // Переключение между окнами
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideLoginModal();
            this.showRegisterModal();
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideRegisterModal();
            this.showLoginModal();
        });
        
        // Закрытие модальных окон (для авторизованных полностью, для остальных возврат к оверлею)
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.currentUser) {
                    // Если пользователь авторизован, закрываем всё
                    this.hideLoginModal();
                    this.hideRegisterModal();
                } else {
                    // Если не авторизован, просто скрываем модальные окна, оставляя оверлей
                    this.loginModal.style.display = 'none';
                    this.registerModal.style.display = 'none';
                }
            });
        });
        
        // Клик вне модального окна
        window.addEventListener('click', (e) => {
            if (this.currentUser) {
                // Полностью закрываем для авторизованных пользователей
                if (e.target === this.loginModal) {
                    this.hideLoginModal();
                }
                if (e.target === this.registerModal) {
                    this.hideRegisterModal();
                }
            } else {
                // Для неавторизованных просто скрываем модальное окно, оставляя оверлей
                if (e.target === this.loginModal) {
                    this.loginModal.style.display = 'none';
                }
                if (e.target === this.registerModal) {
                    this.registerModal.style.display = 'none';
                }
            }
        });
        
        // Обработка отправки форм
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // Выход из аккаунта
        this.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }
    
    /**
     * Проверка авторизации при загрузке страницы
     */
    checkAuth() {
        const savedUser = localStorage.getItem('wave_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.username.textContent = this.currentUser.username;
                
                // Отображаем аватар пользователя
                if (this.currentUser.avatar_url) {
                    this.userAvatar.src = this.currentUser.avatar_url;
                }
                
                this.updateUI(true);
            } catch (error) {
                console.error('Ошибка при разборе данных пользователя:', error);
                localStorage.removeItem('wave_user');
            }
        } else {
            this.updateUI(false);
            // Не показываем модальное окно автоматически, только оверлей
        }
    }
    
    /**
     * Обновление элементов интерфейса в зависимости от статуса авторизации
     */
    updateUI(isLoggedIn) {
        if (isLoggedIn && this.currentUser) {
            this.username.textContent = this.currentUser.username;
            
            // Устанавливаем аватар пользователя, если он есть
            if (this.currentUser.avatar_url) {
                this.userAvatar.src = this.currentUser.avatar_url;
            } else {
                this.userAvatar.src = 'image/user.svg';
            }
            
            this.loginBtn.style.display = 'none';
            this.registerBtn.style.display = 'none';
            this.logoutBtn.style.display = 'block';
            this.profileBtn.style.display = 'block';
            
            // Показываем содержимое приложения
            if (this.appContent) {
                this.appContent.style.display = 'block';
            }
            if (this.authOverlay) {
                this.authOverlay.style.display = 'none';
            }
            
            // Скрываем все модальные окна
            this.loginModal.style.display = 'none';
            this.registerModal.style.display = 'none';
        } else {
            this.username.textContent = 'Гость';
            this.userAvatar.src = 'image/user.svg';
            this.loginBtn.style.display = 'block';
            this.registerBtn.style.display = 'block';
            this.logoutBtn.style.display = 'none';
            this.profileBtn.style.display = 'none';
            
            // Скрываем содержимое приложения и показываем оверлей
            if (this.appContent) {
                this.appContent.style.display = 'none';
            }
            if (this.authOverlay) {
                this.authOverlay.style.display = 'flex';
            }
        }
    }
    
    /**
     * Вход в аккаунт
     */
    async login() {
        this.loginError.textContent = '';
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            this.loginError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }
        
        try {
            const response = await fetch(this.apiUrl + 'login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.loginError.textContent = data.error;
                return;
            }
            
            if (data.success && data.user) {
                this.handleSuccessfulLogin(data.user);
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            this.loginError.textContent = 'Произошла ошибка при входе. Проверьте подключение к серверу.';
        }
    }
    
    /**
     * Обработка успешного входа пользователя
     */
    handleSuccessfulLogin(userData) {
        // Сохраняем пользователя
        this.currentUser = userData;
        
        // Сохраняем в localStorage
        localStorage.setItem('wave_user', JSON.stringify(userData));
        
        // Обновляем интерфейс
        this.updateUI(true);
        
        // Скрываем модальное окно входа
        this.loginModal.style.display = 'none';
        
        // Сбрасываем форму
        this.loginForm.reset();
        this.loginError.textContent = '';
        
        // Показываем уведомление об успешном входе
        this.showNotification(`Добро пожаловать, ${userData.username}!`, 'success');
    }
    
    /**
     * Регистрация нового аккаунта
     */
    async register() {
        this.registerError.textContent = '';
        const usernameInput = document.getElementById('register-username');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let gender = 'male'; // По умолчанию
        
        // Получаем выбранный пол
        genderInputs.forEach(input => {
            if (input.checked) {
                gender = input.value;
            }
        });
        
        // Валидация
        if (!username || !password || !confirmPassword) {
            this.registerError.textContent = 'Пожалуйста, заполните все поля';
            return;
        }
        
        if (username.length < 3) {
            this.registerError.textContent = 'Имя пользователя должно содержать минимум 3 символа';
            return;
        }
        
        if (password.length < 6) {
            this.registerError.textContent = 'Пароль должен содержать минимум 6 символов';
            return;
        }
        
        if (password !== confirmPassword) {
            this.registerError.textContent = 'Пароли не совпадают';
            return;
        }
        
        try {
            const response = await fetch(this.apiUrl + 'register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    gender: gender
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.registerError.textContent = data.error;
                return;
            }
            
            if (data.success && data.user) {
                // Используем общий метод обработки успешной авторизации
                this.handleSuccessfulLogin(data.user);
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            this.registerError.textContent = 'Произошла ошибка при регистрации. Проверьте подключение к серверу.';
        }
    }
    
    /**
     * Выход из аккаунта
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('wave_user');
        this.updateUI(false);
        this.showNotification('Вы вышли из аккаунта', 'info');
    }
    
    /**
     * Отображение модального окна входа
     */
    showLoginModal() {
        // Скрываем окно регистрации, если оно открыто
        this.registerModal.style.display = 'none';
        
        // Показываем окно входа
        this.loginModal.style.display = 'flex';
        document.getElementById('login-username').focus();
    }
    
    /**
     * Скрытие модального окна входа
     */
    hideLoginModal() {
        this.loginModal.style.display = 'none';
        this.loginForm.reset();
        this.loginError.textContent = '';
    }
    
    /**
     * Отображение модального окна регистрации
     */
    showRegisterModal() {
        // Скрываем окно входа, если оно открыто
        this.loginModal.style.display = 'none';
        
        // Показываем окно регистрации
        this.registerModal.style.display = 'flex';
        document.getElementById('register-username').focus();
    }
    
    /**
     * Скрытие модального окна регистрации
     */
    hideRegisterModal() {
        this.registerModal.style.display = 'none';
        this.registerForm.reset();
        this.registerError.textContent = '';
    }
    
    /**
     * Отображение профиля пользователя
     */
    showUserProfile() {
        // Проверяем, авторизован ли пользователь
        if (!this.currentUser) {
            this.showNotification('Необходимо авторизоваться', 'error');
            return;
        }
        
        // Заполняем данные профиля
        document.getElementById('profile-username').textContent = this.currentUser.username;
        document.getElementById('profile-gender').textContent = this.currentUser.gender === 'male' ? 'Мужской' : 'Женский';
        document.getElementById('profile-created').textContent = this.currentUser.created || 'Нет данных';
        document.getElementById('profile-id').textContent = this.currentUser.id;
        
        // Отображаем правильный статус
        const profileStatus = document.getElementById('profile-status');
        let statusText = 'Пользователь';
        
        if (this.currentUser.status === 'admin_wave_owo') {
            statusText = 'Администратор сайта';
        } else if (this.currentUser.status === 'author_wave_owo') {
            statusText = 'Музыкальный автор';
        }
        
        profileStatus.textContent = statusText;
        
        // Устанавливаем аватар, если он есть
        const profileAvatar = document.getElementById('profile-avatar');
        if (this.currentUser.avatar_url) {
            profileAvatar.src = this.currentUser.avatar_url;
        } else {
            profileAvatar.src = 'image/user.svg';
        }
        
        // Инициализируем загрузку аватара
        this.initAvatarUpload();
        
        // Показываем модальное окно профиля (центрированное)
        this.profileModal.style.display = 'flex';
        
        // Добавляем обработчик для закрытия
        const closeButtons = this.profileModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.profileModal.style.display = 'none';
            });
        });
        
        // Клик вне модального окна закрывает его
        window.addEventListener('click', (e) => {
            if (e.target === this.profileModal) {
                this.profileModal.style.display = 'none';
            }
        });
    }
    
    /**
     * Инициализация всех компонентов профиля пользователя
     */
    initUserProfile() {
        this.initAvatarUpload();
        this.initStatusChange();
        this.initUsernameChange();
    }
    
    /**
     * Инициализация изменения никнейма
     */
    initUsernameChange() {
        // Элементы интерфейса
        const editUsernameBtn = document.getElementById('edit-username-btn');
        const usernameModal = document.getElementById('username-change-modal');
        const newUsernameInput = document.getElementById('new-username');
        const saveUsernameBtn = usernameModal.querySelector('.save-btn');
        const cancelUsernameBtn = usernameModal.querySelector('.cancel-btn');
        const closeBtn = usernameModal.querySelector('.modal-close');
        
        // Обработчик нажатия на кнопку редактирования
        editUsernameBtn.addEventListener('click', () => {
            // Заполняем поле ввода текущим никнеймом
            if (this.currentUser) {
                newUsernameInput.value = this.currentUser.username;
            }
            
            // Показываем модальное окно
            usernameModal.style.display = 'flex';
            
            // Фокус на поле ввода
            setTimeout(() => newUsernameInput.focus(), 100);
        });
        
        // Обработчик сохранения никнейма
        saveUsernameBtn.addEventListener('click', () => {
            const newUsername = newUsernameInput.value.trim();
            
            if (newUsername && this.currentUser) {
                // Проверяем валидность никнейма
                if (newUsername.length < 3 || newUsername.length > 20) {
                    this.showNotification('Никнейм должен содержать от 3 до 20 символов', 'error');
                    return;
                }
                
                this.updateUsername(newUsername);
            } else if (!newUsername) {
                this.showNotification('Введите новый никнейм', 'error');
                return;
            }
            
            usernameModal.style.display = 'none';
        });
        
        // Обработчик нажатия Enter в поле ввода
        newUsernameInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                saveUsernameBtn.click();
            }
        });
        
        // Обработчики закрытия модального окна
        [cancelUsernameBtn, closeBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                usernameModal.style.display = 'none';
            });
        });
        
        // Закрытие модального окна при клике вне его содержимого
        window.addEventListener('click', (e) => {
            if (e.target === usernameModal) {
                usernameModal.style.display = 'none';
            }
        });
    }
    
    /**
     * Обновление никнейма пользователя
     */
    async updateUsername(newUsername) {
        try {
            // Показываем индикатор загрузки
            this.showNotification('Обновление никнейма...', 'info');
            
            // Отправляем запрос на сервер
            const response = await fetch('/api/profile/update-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    newUsername: newUsername
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.showNotification(data.error, 'error');
                return;
            }
            
            if (data.success && data.user) {
                // Обновляем данные пользователя
                this.currentUser = data.user;
                
                // Обновляем отображение никнейма в интерфейсе
                document.getElementById('profile-username').textContent = this.currentUser.username;
                
                // Обновляем отображение имени в меню
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = this.currentUser.username;
                }
                
                // Сохраняем обновленные данные в localStorage
                localStorage.setItem('wave_user', JSON.stringify(this.currentUser));
                
                // Показываем уведомление об успехе
                this.showNotification('Никнейм успешно обновлен', 'success');
            }
        } catch (error) {
            console.error('Ошибка при обновлении никнейма:', error);
            this.showNotification('Ошибка при обновлении никнейма', 'error');
        }
    }
    
    /**
     * Инициализация загрузки аватара
     */
    initAvatarUpload() {
        const fileInput = document.getElementById('avatar-file');
        const uploadButton = document.getElementById('upload-avatar-btn');
        
        // Сбрасываем предыдущие обработчики
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        const newUploadButton = uploadButton.cloneNode(true);
        uploadButton.parentNode.replaceChild(newUploadButton, uploadButton);
        
        // Добавляем обработчик изменения файла
        newFileInput.addEventListener('change', (e) => {
            if (newFileInput.files.length > 0) {
                const file = newFileInput.files[0];
                
                // Проверяем размер файла (не более 3 МБ)
                if (file.size > 3 * 1024 * 1024) {
                    this.showNotification('Размер файла не должен превышать 3 МБ', 'error');
                    newFileInput.value = '';
                    return;
                }
                
                // Проверяем тип файла
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    this.showNotification('Поддерживаются только форматы JPEG, PNG, GIF и WEBP', 'error');
                    newFileInput.value = '';
                    return;
                }
                
                // Меняем текст кнопки на имя файла
                newUploadButton.textContent = 'Загрузка...';
                
                // Автоматически загружаем файл после выбора
                this.uploadAvatar(file);
            } else {
                newUploadButton.textContent = 'Изменить аватар';
            }
        });
        
        // Добавляем обработчик нажатия на кнопку загрузки
        newUploadButton.addEventListener('click', () => {
            // Открываем диалог выбора файла
            newFileInput.click();
        });
    }
    
    /**
     * Загрузка аватара на сервер
     */
    uploadAvatar(file) {
        // Создаем форму для отправки файла
        const formData = new FormData();
        formData.append('userAvatar', file); // Изменили имя поля на userAvatar
        formData.append('userId', this.currentUser.id);
        
        // Создаем индикатор прогресса
        let progressContainer = document.querySelector('.avatar-upload-progress');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'avatar-upload-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'avatar-upload-progress-bar';
            
            progressContainer.appendChild(progressBar);
            document.querySelector('.avatar-upload').appendChild(progressContainer);
        }
        
        const progressBar = progressContainer.querySelector('.avatar-upload-progress-bar');
        progressBar.style.width = '0%';
        progressContainer.style.display = 'block';
        
        // Отправляем запрос
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/profile/upload-avatar', true);
        
        // Обработка прогресса загрузки
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        };
        
        // Обработка завершения запроса
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // Обновляем данные пользователя
                        this.currentUser = response.user;
                        
                        // Обновляем аватар в UI
                        const profileAvatar = document.getElementById('profile-avatar');
                        const userAvatar = document.getElementById('user-avatar');
                        
                        if (this.currentUser.avatar_url) {
                            profileAvatar.src = this.currentUser.avatar_url;
                            userAvatar.src = this.currentUser.avatar_url;
                        }
                        
                        // Сохраняем обновленные данные в localStorage
                        localStorage.setItem('wave_user', JSON.stringify(this.currentUser));
                        
                        // Отображаем уведомление об успехе
                        this.showNotification('Аватар успешно обновлен', 'success');
                    } else {
                        this.showNotification(response.error || 'Ошибка при загрузке аватара', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при разборе ответа:', error);
                    this.showNotification('Ошибка при обработке ответа сервера', 'error');
                }
            } else {
                this.showNotification('Ошибка при загрузке: ' + xhr.status, 'error');
            }
            
            // Скрываем прогресс-бар
            setTimeout(() => {
                progressContainer.style.display = 'none';
                
                // Сбрасываем форму
                document.getElementById('avatar-file').value = '';
                document.getElementById('upload-avatar-btn').textContent = 'Изменить аватар';
            }, 1000);
        };
        
        // Обработка ошибок
        xhr.onerror = () => {
            this.showNotification('Ошибка сети при загрузке аватара', 'error');
            progressContainer.style.display = 'none';
        };
        
        // Отправляем запрос
        xhr.send(formData);
    }
    
    /**
     * Отображение уведомления
     */
    showNotification(message, type = 'info') {
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
    
    /**
     * Инициализация обработчиков профиля
     */
    initProfileHandlers() {
        // Добавляем обработчики для профиля
    }
    
    /**
     * Инициализация изменения статуса
     */
    initStatusChange() {
        // Элементы интерфейса
        const editStatusBtn = document.getElementById('edit-status-btn');
        const statusModal = document.getElementById('status-select-modal');
        const statusCodeInput = document.getElementById('status-code');
        const saveStatusBtn = statusModal.querySelector('.save-btn');
        const cancelStatusBtn = statusModal.querySelector('.cancel-btn');
        const closeBtn = statusModal.querySelector('.modal-close');
        
        // Обработчик нажатия на кнопку редактирования
        editStatusBtn.addEventListener('click', () => {
            // Сбрасываем поле ввода кода
            statusCodeInput.value = '';
            
            // Показываем модальное окно
            statusModal.style.display = 'flex';
            
            // Фокус на поле ввода
            setTimeout(() => statusCodeInput.focus(), 100);
        });
        
        // Обработчик сохранения статуса
        saveStatusBtn.addEventListener('click', () => {
            const statusCode = statusCodeInput.value.trim();
            
            if (statusCode && this.currentUser) {
                this.updateUserStatus(statusCode);
            } else if (!statusCode) {
                this.showNotification('Введите код статуса', 'error');
                return;
            }
            
            statusModal.style.display = 'none';
        });
        
        // Обработчик нажатия Enter в поле ввода
        statusCodeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                saveStatusBtn.click();
            }
        });
        
        // Обработчики закрытия модального окна
        [cancelStatusBtn, closeBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                statusModal.style.display = 'none';
            });
        });
        
        // Закрытие модального окна при клике вне его содержимого
        window.addEventListener('click', (e) => {
            if (e.target === statusModal) {
                statusModal.style.display = 'none';
            }
        });
    }
    
    /**
     * Обновление статуса пользователя
     */
    async updateUserStatus(statusCode) {
        try {
            // Показываем индикатор загрузки
            this.showNotification('Обновление статуса...', 'info');
            
            // Отправляем запрос на сервер
            const response = await fetch('/api/profile/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    statusCode: statusCode
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.showNotification(data.error, 'error');
                return;
            }
            
            if (data.success && data.user) {
                // Обновляем данные пользователя
                this.currentUser = data.user;
                
                // Обновляем отображение статуса
                this.updateUserStatusDisplay();
                
                // Сохраняем обновленные данные в localStorage
                localStorage.setItem('wave_user', JSON.stringify(this.currentUser));
                
                // Показываем уведомление об успехе
                this.showNotification('Статус успешно обновлен', 'success');
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            this.showNotification('Ошибка при обновлении статуса', 'error');
        }
    }
    
    /**
     * Обновление отображения статуса пользователя
     */
    updateUserStatusDisplay() {
        const profileStatus = document.getElementById('profile-status');
        if (!profileStatus || !this.currentUser) return;
        
        // Определяем текст статуса на основе кода
        let statusText = 'Пользователь';
        
        if (this.currentUser.status === 'admin_wave_owo') {
            statusText = 'Администратор сайта';
        } else if (this.currentUser.status === 'author_wave_owo') {
            statusText = 'Музыкальный автор';
        }
        
        // Обновляем текст статуса
        profileStatus.textContent = statusText;
    }
}

// Инициализация системы аутентификации при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const authSystem = new AuthSystem();
    
    // Глобальный доступ к системе аутентификации (для отладки)
    window.authSystem = authSystem;
});
