# CodeBoard API

## Описание
CodeBoard API — серверная часть платформы CodeBoard, реализующая REST API для работы с данными.

## Технологии
- Node.js
- Express
- TypeScript
- PostgreSQL (Supabase)
- JWT (аутентификация)

## Архитектура
- Controller → Model → Database
- Четкое разделение ответственности

## Основной функционал
- Авторизация и регистрация
- CRUD постов
- Комментарии (дерево)
- Лайки
- Коллекции
- Поиск по тегам и тексту

## Установка и запуск
```bash
npm install
npm run dev
```

## Переменные окружения
Создать файл .env:
```
PORT=3000
DATABASE_URL=your_db_url
JWT_SECRET=your_secret
```
