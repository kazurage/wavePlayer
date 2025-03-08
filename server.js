const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const { setupDatabase } = require('./db/database');

// Создаем экземпляр приложения Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname)));
// Настраиваем доступ к загруженным файлам
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Маршруты API
app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);

// Основной маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Инициализация базы данных и запуск сервера
async function startServer() {
    try {
        // Настраиваем базу данных
        await setupDatabase();
        
        // Запускаем сервер
        app.listen(PORT, () => {
            console.log(`Сервер Wave запущен на порту http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Ошибка при запуске сервера:', error);
        process.exit(1);
    }
}

startServer();
