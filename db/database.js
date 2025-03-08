const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Путь к конфигурационному файлу
const dbConfigPath = path.join(__dirname, '..', 'config', 'database.json');

// Загружаем конфигурацию базы данных
const loadDbConfig = () => {
    try {
        const configRaw = fs.readFileSync(dbConfigPath);
        return JSON.parse(configRaw);
    } catch (error) {
        console.error('Ошибка при загрузке конфигурации базы данных:', error);
        throw new Error('Невозможно загрузить конфигурацию базы данных');
    }
};

// Создание пула соединений с базой данных
const createPool = async () => {
    const dbConfig = loadDbConfig();
    
    // Разделяем endpoint на host и port
    const [host, port] = dbConfig.endpoint.split(':');
    
    return mysql.createPool({
        host: host,
        port: parseInt(port),
        user: dbConfig.username,
        password: dbConfig.password,
        database: 's320203_wave',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
};

// Глобальный пул соединений
let pool;

// Инициализация пула соединений
const initPool = async () => {
    if (!pool) {
        pool = await createPool();
    }
    return pool;
};

// Настраиваем базу данных
async function setupDatabase() {
    try {
        // Инициализируем пул соединений
        await initPool();
        
        // Создаем таблицу пользователей
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(8) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                gender ENUM('male', 'female') NOT NULL,
                status ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                favorites JSON DEFAULT '[]',
                created_at VARCHAR(20) NOT NULL
            )
        `;
        
        // Создаем таблицу треков
        const createTracksTable = `
            CREATE TABLE IF NOT EXISTS tracks (
                id VARCHAR(8) PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                artist VARCHAR(100) NOT NULL,
                album VARCHAR(100),
                genre VARCHAR(50),
                duration INT NOT NULL,
                path VARCHAR(255) NOT NULL
            )
        `;
        
        // Создаем таблицу избранного
        const createFavoritesTable = `
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(8) NOT NULL,
                track_id VARCHAR(8) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        // Создаем таблицу для аватаров
        const createAvatarsTable = `
            CREATE TABLE IF NOT EXISTS avatars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(8) NOT NULL,
                avatar_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        try {
            await pool.query(createUsersTable);
            await pool.query(createTracksTable);
            await pool.query(createFavoritesTable);
            await pool.query(createAvatarsTable);
            console.log('База данных успешно настроена');
        } catch (error) {
            console.error('Ошибка при создании таблиц:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('Ошибка при настройке базы данных:', error);
        throw error;
    }
}

// Выполнение запроса к базе данных
const query = async (sql, params) => {
    try {
        const dbPool = await initPool();
        const [results] = await dbPool.query(sql, params);
        return results;
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    }
};

module.exports = {
    setupDatabase,
    query
};
