# Caspian Eco Monitor

MVP для хакатона: рыбак фиксирует улов, инспектор подтверждает экологические заявки, подтверждённые данные появляются на карте Каспия, рынок помогает продавать улов, а аналитика показывает нагрузку на море.

## Стек

- Frontend: React + TypeScript + Vite
- Backend: NestJS + TypeORM
- Database: MySQL
- API: REST
- Future deploy: Docker Compose + Nginx на собственном Linux сервере

Проект не использует Supabase, Firebase, Vercel-specific features или внешнюю авторизацию. Основные данные хранятся в backend + MySQL, frontend только отправляет и отображает данные через API.

## Тестовые email

- `fisherman1@test.com` / `fisherman123` — рыбак
- `fisherman2@test.com` / `fisherman123` — рыбак
- `inspector@test.com` / `inspector123` — инспектор

Логика входа простая:

- пользователь вводит email и пароль
- при регистрации backend создаёт пользователя с ролью `fisherman`
- пароль хранится в базе только как bcrypt hash
- роль `inspector` нельзя получить через регистрацию, она создаётся seed-данными или вручную в БД
- текущий пользователь хранится во frontend в `localStorage`

## Backend

```bash
cd Backend
cp .env.example .env
npm install
npm run start:dev
```

Backend запускается на `http://localhost:3000`.

Нужные env:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173,http://localhost:5174

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=caspian_eco_monitor
DB_SYNC=true
```

## Frontend

```bash
cd Frontend/frontend
cp .env.example .env
npm install
npm run dev
```

Нужный env:

```env
VITE_API_URL=http://localhost:3000
```

## Роли и вкладки

Для `fisherman`:

- Карта
- Мой улов
- Рынок
- Заявки
- Аналитика

Для `inspector`:

- Карта
- Рынок
- Заявки
- Аналитика

У инспектора нет вкладки `Мой улов`. Во вкладке `Заявки` инспектор проверяет pending-уловы и pending-экологические жалобы.

## API

Auth/User:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me?email=`
- `GET /users/me?email=`

Catches:

- `GET /catches?userId=`
- `GET /catches/approved`
- `GET /catches/pending`
- `POST /catches`
- `PATCH /catches/:id/approve`
- `PATCH /catches/:id/reject`

Market:

- `GET /market`
- `POST /market/listing`
- `POST /market/requests`
- `GET /market/requests`
- `POST /market/:listingId/review`

EcoReports:

- `GET /eco-reports`
- `GET /eco-reports/pending`
- `GET /eco-reports/approved`
- `POST /eco-reports`
- `PATCH /eco-reports/:id/approve`
- `PATCH /eco-reports/:id/reject`

Analytics:

- `GET /analytics`

Map:

- `GET /map/markers`

## Seed data

При пустых таблицах backend добавляет:

- тестовых пользователей
- approved и pending уловы возле Актау, Акшукыра, Тельмана и побережья Каспия
- экологические заявки: загрязнение, мусор, мёртвая рыба, незаконные сети
- активные товары рынка
- рыночные запросы покупателей
- отзывы продавцам

## Docker Compose

Для будущего VPS/Linux deployment:

```bash
cp .env.example .env
cp Backend/.env.example Backend/.env
docker compose up --build
```

Сервисы:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- MySQL: `localhost:3306`

На production сервере обычно ставится Nginx перед frontend/backend контейнерами, а `FRONTEND_URL` и `VITE_API_URL` меняются на доменные адреса.
