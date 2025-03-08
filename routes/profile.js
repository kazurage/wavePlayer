const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db/database');

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function(req, file, cb) {
        // Генерируем уникальное имя файла с добавлением временной метки
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

// Проверка типа файла
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый формат файла. Разрешены только JPEG, PNG, GIF и WEBP.'), false);
    }
};

// Настройка multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3 МБ
    },
    fileFilter: fileFilter
});

// Загружаем конфигурацию статусов
const statusConfig = require('../config/status.json');

// Маршрут для загрузки аватара
router.post('/upload-avatar', upload.single('userAvatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        // Проверяем, что ID пользователя был передан
        const { userId } = req.body;
        if (!userId) {
            // Удаляем загруженный файл если ID пользователя не указан
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'ID пользователя не указан' });
        }

        // Формируем URL для аватара
        const avatarUrl = `/uploads/${path.basename(req.file.path)}`;

        // Проверяем существование пользователя
        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            // Удаляем загруженный файл если пользователь не найден
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Получаем предыдущие аватары пользователя
        const previousAvatars = await query('SELECT avatar_url FROM avatars WHERE user_id = ?', [userId]);
        
        // Удаляем старые файлы аватаров с диска
        for (const avatar of previousAvatars) {
            try {
                const oldFilePath = path.join(__dirname, '..', avatar.avatar_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Удален старый аватар: ${oldFilePath}`);
                }
            } catch (error) {
                console.error('Ошибка при удалении старого аватара:', error);
            }
        }

        // Удаляем предыдущую запись аватара, если она существует
        await query('DELETE FROM avatars WHERE user_id = ?', [userId]);

        // Добавляем новую запись в таблицу аватаров
        await query('INSERT INTO avatars (user_id, avatar_url) VALUES (?, ?)', [userId, avatarUrl]);

        const user = users[0];
        
        // Преобразуем избранное в массив
        let favorites = [];
        try {
            favorites = JSON.parse(user.favorites);
        } catch (error) {
            console.error('Ошибка при разборе избранного:', error);
        }

        // Возвращаем обновленные данные пользователя
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                gender: user.gender,
                status: user.status,
                favorites: favorites,
                avatar_url: avatarUrl,
                created: user.created_at
            }
        });
        
    } catch (error) {
        console.error('Ошибка при загрузке аватара:', error);
        // Удаляем загруженный файл в случае ошибки
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Ошибка сервера при загрузке аватара' });
    }
});

// Маршрут для обновления статуса пользователя
router.post('/update-status', async (req, res) => {
    try {
        const { userId, statusCode } = req.body;
        
        if (!userId || !statusCode) {
            return res.status(400).json({ error: 'Необходимо указать ID пользователя и код статуса' });
        }
        
        // Проверяем, является ли код одним из допустимых значений
        const validCodes = Object.values(statusConfig);
        if (!validCodes.includes(statusCode) && statusCode !== 'user') {
            return res.status(400).json({ error: 'Недопустимый код статуса' });
        }
        
        // Обновляем статус в базе данных - сохраняем сам код
        await query('UPDATE users SET status = ? WHERE id = ?', [statusCode, userId]);
        
        // Получаем обновленную информацию о пользователе
        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        
        // Преобразуем избранное в массив
        let favorites = [];
        try {
            favorites = JSON.parse(user.favorites);
        } catch (error) {
            console.error('Ошибка при разборе избранного:', error);
        }
        
        // Получаем аватар пользователя
        const avatars = await query('SELECT avatar_url FROM avatars WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
        const avatar_url = avatars.length > 0 ? avatars[0].avatar_url : null;
        
        // Возвращаем обновленные данные пользователя
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                gender: user.gender,
                status: user.status, // Теперь возвращаем реальный статус из БД
                favorites: favorites,
                avatar_url: avatar_url,
                created: user.created_at
            }
        });
        
    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении статуса' });
    }
});

// Маршрут для обновления никнейма пользователя
router.post('/update-username', async (req, res) => {
    try {
        const { userId, newUsername } = req.body;
        
        if (!userId || !newUsername) {
            return res.status(400).json({ error: 'Необходимо указать ID пользователя и новый никнейм' });
        }
        
        // Проверяем, не используется ли уже такой никнейм
        const existingUsers = await query('SELECT * FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Этот никнейм уже занят' });
        }
        
        // Проверяем длину никнейма
        if (newUsername.length < 3 || newUsername.length > 20) {
            return res.status(400).json({ error: 'Никнейм должен содержать от 3 до 20 символов' });
        }
        
        // Обновляем никнейм в базе данных
        await query('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
        
        // Получаем обновленную информацию о пользователе
        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        
        // Преобразуем избранное в массив
        let favorites = [];
        try {
            favorites = JSON.parse(user.favorites);
        } catch (error) {
            console.error('Ошибка при разборе избранного:', error);
        }
        
        // Получаем аватар пользователя
        const avatars = await query('SELECT avatar_url FROM avatars WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
        const avatar_url = avatars.length > 0 ? avatars[0].avatar_url : null;
        
        // Возвращаем обновленные данные пользователя
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                gender: user.gender,
                status: user.status,
                favorites: favorites,
                avatar_url: avatar_url,
                created: user.created_at
            }
        });
        
    } catch (error) {
        console.error('Ошибка при обновлении никнейма:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении никнейма' });
    }
});

module.exports = router;
