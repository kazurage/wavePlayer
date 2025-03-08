-- Скрипт для увеличения размера поля status в таблице users
ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'user';
