const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/database.json');

// Функция для выполнения миграции базы данных
async function updateDatabase() {
    console.log('Начинаю обновление базы данных...');
    
    // Чтение SQL-скрипта
    const sqlScript = fs.readFileSync(
        path.join(__dirname, 'update_status_field.sql'), 
        'utf8'
    );
    
    let connection;
    
    try {
        // Создание соединения с базой данных
        connection = await mysql.createConnection({
            host: config.endpoint.split(':')[0],
            port: config.endpoint.split(':')[1] || 3306,
            user: config.username,
            password: config.password,
            database: 's320203_wave' // Извлечено из JDBC строки
        });
        
        console.log('Соединение с базой данных установлено');
        
        // Выполнение SQL-скрипта
        const [results] = await connection.query(sqlScript);
        console.log('База данных успешно обновлена!');
        console.log('Результат:', results);
        
    } catch (error) {
        console.error('Ошибка при обновлении базы данных:', error);
    } finally {
        // Закрытие соединения с базой данных
        if (connection) {
            await connection.end();
            console.log('Соединение с базой данных закрыто');
        }
    }
}

// Запуск миграции
updateDatabase();
