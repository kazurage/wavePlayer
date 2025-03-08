const express = require('express');
const router = express.Router();
const { query } = require('../db/database');

/**
 * Регистрация нового пользователя
 * POST /api/register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, gender } = req.body;
        
        // Проверка обязательных полей
        if (!username || !password || !gender) {
            return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
        }
        
        // Валидация данных
        if (username.trim().length < 3) {
            return res.json({ error: 'Имя пользователя должно содержать минимум 3 символа' });
        }
        
        if (password.length < 6) {
            return res.json({ error: 'Пароль должен содержать минимум 6 символов' });
        }
        
        if (gender !== 'male' && gender !== 'female') {
            return res.json({ error: 'Некорректное значение пола' });
        }
        
        // Проверяем, не занято ли имя пользователя
        const existingUser = await query('SELECT id FROM users WHERE username = ?', [username]);
        
        if (existingUser.length > 0) {
            return res.json({ error: 'Это имя пользователя уже занято' });
        }
        
        // Генерируем ID пользователя (8 цифр)
        let userId = '';
        for (let i = 0; i < 8; i++) {
            userId += Math.floor(Math.random() * 10);
        }
        
        // Получаем текущую дату
        const now = new Date();
        const createdAt = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
        
        // Добавляем пользователя в базу данных
        await query(
            'INSERT INTO users (id, username, password, gender, status, favorites, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, username, password, gender, 'user', '[]', createdAt]
        );
        
        // Возвращаем информацию о пользователе
        res.json({
            success: true,
            user: {
                id: userId,
                username,
                gender,
                status: 'user',
                favorites: [],
                avatar_url: null,
                created: createdAt
            }
        });
        
    } catch (error) {
        console.error('Ошибка при регистрации пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

/**
 * Вход пользователя
 * POST /api/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Проверка обязательных полей
        if (!username || !password) {
            return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
        }
        
        // Ищем пользователя по имени
        const users = await query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.json({ error: 'Пользователь не найден' });
        }
        
        const user = users[0];
        
        // Проверяем пароль
        if (user.password !== password) {
            return res.json({ error: 'Неверный пароль' });
        }
        
        // Преобразуем избранное в массив
        let favorites = [];
        try {
            favorites = JSON.parse(user.favorites);
        } catch (error) {
            console.error('Ошибка при разборе избранного:', error);
        }
        
        // Получаем аватар пользователя
        const avatars = await query('SELECT avatar_url FROM avatars WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user.id]);
        const avatar_url = avatars.length > 0 ? avatars[0].avatar_url : null;
        
        // Возвращаем информацию о пользователе
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
        console.error('Ошибка при входе пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

module.exports = router;
