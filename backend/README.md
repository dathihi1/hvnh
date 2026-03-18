# Backend - Student Activity Portal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Prisma 6 (PostgreSQL) |
| Auth | JWT (jsonwebtoken) + Redis blacklist |
| Validation | Zod |
| Email | Nodemailer |
| SMS | Twilio |
| Password | bcryptjs |
| Queue | BullMQ + Redis (ioredis) |
| AI | Google Generative AI (Gemini) |
| Security | Helmet, CORS, Rate Limiting |

---

## Cau truc thu muc

```
backend/
├── prisma/
│   └── schema.prisma              # Prisma schema - dinh nghia toan bo models
│
├── src/
│   ├── config/
│   │   ├── env.js                 # Validate required environment variables
│   │   ├── prisma.js              # PrismaClient singleton
│   │   ├── db.js                  # Ket noi / ngat ket noi database
│   │   ├── redis.js               # Redis connection (ioredis)
│   │   ├── bullmq.js              # BullMQ job queue configuration
│   │   └── gemini.js              # Google Gemini AI configuration
│   │
│   ├── modules/                   # To chuc theo domain (feature-first)
│   │   ├── auth/                  # Xac thuc (login, register, JWT, reset password)
│   │   ├── users/                 # Quan ly profile nguoi dung
│   │   ├── organizations/         # Quan ly to chuc / CLB
│   │   ├── activities/            # Quan ly hoat dong & su kien
│   │   ├── registrations/         # Dang ky tham gia hoat dong
│   │   ├── club-applications/     # Don ung tuyen CLB
│   │   ├── forms/                 # Dynamic form builder
│   │   ├── notifications/         # Thong bao (in-app, email, SMS)
│   │   ├── admin/                 # Admin dashboard & quan ly
│   │   └── ai/                    # AI service integration (Gemini)
│   │
│   │   # Moi module gom:
│   │   #   *.controller.js        # Xu ly HTTP request/response
│   │   #   *.service.js           # Business logic
│   │   #   *.route.js             # Khai bao endpoints
│   │   #   *.validation.js        # Zod schemas cho input validation
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Xac thuc JWT token
│   │   ├── role.middleware.js      # Phan quyen RBAC
│   │   ├── validate.middleware.js  # Chay Zod validation schema
│   │   └── error.middleware.js     # Global error handler
│   │
│   ├── utils/
│   │   ├── constants.js           # Enums (USER_STATUS, ROLE_CODE, ACTIVITY_STATUS, ...)
│   │   ├── error-codes.js         # Standardized error codes
│   │   ├── jwt.js                 # Sign / verify JWT token
│   │   ├── response.js            # Chuan hoa API response { success, data, error }
│   │   ├── mailer.js              # Nodemailer config + send helpers
│   │   ├── sms.js                 # Twilio SMS service
│   │   ├── google-workspace.js    # Google Workspace integration
│   │   ├── id.js                  # Generate custom ID (nanoid/uuid)
│   │   └── app-error.js           # Custom error class
│   │
│   ├── workers/
│   │   └── notification.worker.js # BullMQ worker - xu ly thong bao async
│   │
│   ├── app.js                     # Express app setup + dang ky routes
│   └── server.js                  # Entry point - khoi dong server
│
├── .env                           # Bien moi truong (khong commit)
├── .env.example                   # Template bien moi truong
└── package.json
```

---

## Database Schema

### Tong quan

16 bang, chia theo 4 phan he chinh:

```
users ─────────┬── user_roles ──── roles
               │
               ├── organization_members ──── organizations ──── organization_documents
               │
               ├── registrations ──┬── registration_checkins
               │                   ├── team_members
               │                   └── reviews
               │
               ├── club_applications
               │
               ├── notifications
               └── system_logs

activities ────┬── activity_checkins
               ├── activity_team_rules
               └── activity_categories
```

### Bang & Moi quan he

| Bang | Mo ta | Quan he chinh |
|------|-------|---------------|
| `users` | Nguoi dung he thong | PK: userId |
| `roles` | Vai tro (admin, student, organization_leader, organization_member) | PK: roleId |
| `user_roles` | Gan vai tro cho nguoi dung | FK: userId, roleId |
| `organizations` | To chuc / CLB (university, club, department, company) | PK: organizationId |
| `organization_members` | Thanh vien to chuc (president, vice_president, head_of_department, vice_head, member) | FK: userId, organizationId |
| `organization_documents` | Tai lieu to chuc | FK: organizationId, userId |
| `activity_categories` | Danh muc hoat dong | PK: categoryId |
| `activities` | Hoat dong / su kien (program, competition, recruitment) | FK: organizationId, categoryId |
| `activity_checkins` | Phien diem danh cua hoat dong (checkInTime, checkOutTime) | FK: activityId |
| `activity_team_rules` | Quy tac doi nhom (min/max thanh vien) | FK: activityId (1-1) |
| `registrations` | Dang ky tham gia (individual/group) | FK: userId, activityId |
| `registration_checkins` | Diem danh ca nhan | FK: registrationId, activityCheckinId |
| `team_members` | Thanh vien nhom (leader/member) | FK: registrationId, userId |
| `club_applications` | Don ung tuyen CLB (pending, interview, accepted, rejected) | FK: activityId, userId |
| `reviews` | Danh gia hoat dong (1-5 sao) | FK: registrationId (1-1) |
| `notifications` | Thong bao (activity, registration, system) | FK: userId |
| `system_logs` | Nhat ky he thong | FK: userId |

### Enums quan trong

| Field | Values |
|-------|--------|
| `users.status` | active, inactive, banned, suspended |
| `roles.code` | admin, student, organization_leader, organization_member |
| `organizations.organizationType` | university, club, department, company |
| `organization_members.role` | president, vice_president, head_of_department, vice_head, member |
| `activities.activityType` | program, competition, recruitment |
| `activities.teamMode` | individual, team, both |
| `activities.activityStatus` | draft, published, running, finished, cancelled |
| `registrations.status` | pending, approved, rejected, cancelled |
| `registrations.registrationType` | individual, group |
| `club_applications.result` | pending, interview, accepted, rejected |
| `notifications.notificationType` | activity, registration, system |
| `team_members.role` | leader, member |

### Soft Delete

Tat ca cac bang deu co pattern:
- `isDeleted` BOOLEAN DEFAULT FALSE
- `deletedAt` TIMESTAMP
- `deletedBy` INT REFERENCES users

### Audit Columns

Tat ca cac bang deu co:
- `createdAt`, `updatedAt`
- `createdBy`, `updatedBy`, `deletedBy` (FK -> users)

---

## Phan he & Features

### Module 2: Quan ly Hoat dong & Su kien (Activity Management)

**Tables:** `activities`, `activity_categories`, `activity_checkins`, `activity_team_rules`

| Feature | API Endpoint | Method | Auth | Trang thai |
|---------|-------------|--------|------|-----------|
| Tao moi hoat dong | `/api/activities` | POST | JWT + Org Leader | Planned |
| Cap nhat hoat dong | `/api/activities/:id` | PUT | JWT + Org Leader | Planned |
| Phe duyet hoat dong | `/api/activities/:id/approve` | PUT | JWT + Admin | Planned |
| Danh sach hoat dong | `/api/activities` | GET | Public | Planned |
| Tim kiem & loc | `/api/activities?search=&category=&status=` | GET | Public | Planned |
| Xem chi tiet | `/api/activities/:id` | GET | Public | Planned |
| Xoa hoat dong (soft) | `/api/activities/:id` | DELETE | JWT + Admin | Planned |
| Theo doi thu/chi | - | - | - | Ban sau |

**Luong trang thai hoat dong:**
```
draft -> published -> running -> finished
                  \-> cancelled
```

### Module 3: Dang ky & Tham gia (Participation Management)

**Tables:** `registrations`, `registration_checkins`, `team_members`, `reviews`

| Feature | API Endpoint | Method | Auth | Trang thai |
|---------|-------------|--------|------|-----------|
| Dang ky tham gia | `/api/registrations` | POST | JWT | Planned |
| Huy dang ky | `/api/registrations/:id` | DELETE | JWT | Planned |
| Xem lich su dang ky | `/api/registrations/my` | GET | JWT | Planned |
| Phe duyet sinh vien | `/api/registrations/:id/approve` | PUT | JWT + Org Leader | Planned |
| Quan ly DS dang ky | `/api/registrations?activityId=` | GET | JWT + Org Leader | Planned |
| Diem danh (check-in) | `/api/registrations/:id/checkin` | POST | JWT + Org Leader | Planned |
| Gui phan hoi & danh gia | `/api/reviews` | POST | JWT | Ban sau |
| Xem thong ke danh gia | `/api/reviews/stats?activityId=` | GET | Public | Ban sau |

**Waitlist:** Tu dong khi `registrations count >= activities.maxParticipants`, dang ky moi vao trang thai `pending`.

**Dang ky nhom:**
- `registrations.registrationType` = 'group'
- `registrations.teamName` - ten nhom
- `registrations.isLookingForTeam` - tim nhom
- `team_members` - luu thanh vien nhom (leader/member)
- `activity_team_rules` - gioi han min/max thanh vien

### Module 4: Quan ly Cau lac bo (Club Management)

**Tables:** `organizations`, `organization_members`, `organization_documents`, `club_applications`

| Feature | API Endpoint | Method | Auth | Trang thai |
|---------|-------------|--------|------|-----------|
| Tao to chuc | `/api/organizations` | POST | JWT + Admin | Planned |
| Cap nhat thong tin CLB | `/api/organizations/:id` | PUT | JWT + Org Leader | Planned |
| Xem danh sach CLB | `/api/organizations` | GET | Public | Planned |
| Xem chi tiet CLB | `/api/organizations/:id` | GET | Public | Planned |
| To chuc tuyen TV | POST activity voi `activityType = 'recruitment'` | - | - | Planned |
| Dang ky gia nhap CLB | `/api/club-applications` | POST | JWT | Planned |
| Quan ly DS thanh vien | `/api/organizations/:id/members` | GET | JWT + Org Leader | Planned |
| Them/xoa thanh vien | `/api/organizations/:id/members` | POST/DELETE | JWT + Org Leader | Planned |
| Phe duyet ung tuyen | `/api/club-applications/:id/approve` | PUT | JWT + Org Leader | Planned |
| Phan quyen thanh vien | - | - | - | Ban sau |
| Quan ly tai nguyen | `/api/organizations/:id/documents` | CRUD | JWT + Org Leader | Ban sau |
| Xem thong tin noi bo | - | - | - | Ban sau |

**Luong tuyen thanh vien:**
```
1. Org Leader tao activity (activityType = 'recruitment')
2. Student nop don -> club_applications (result = 'pending')
3. Org Leader duyet -> 'interview' -> 'accepted' / 'rejected'
4. Neu accepted -> them vao organization_members
```

---

## API Routes (Da implement)

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| POST | `/api/auth/register` | No | Dang ky tai khoan |
| POST | `/api/auth/login` | No | Dang nhap, tra JWT |
| POST | `/api/auth/refresh-token` | No | Lam moi access token |
| POST | `/api/auth/forgot-password` | No | Gui email reset password |
| POST | `/api/auth/reset-password` | No | Dat lai mat khau |
| GET | `/api/auth/me` | JWT | Thong tin nguoi dung hien tai |
| POST | `/api/auth/logout` | JWT | Dang xuat (blacklist token) |
| PUT | `/api/auth/change-password` | JWT | Doi mat khau |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| POST | `/api/notifications/send` | JWT + Admin/Org Leader | Gui thong bao |
| POST | `/api/notifications/send-bulk` | JWT + Admin/Org Leader | Gui thong bao hang loat |
| GET | `/api/notifications/stats` | JWT | Thong ke thong bao |
| PUT | `/api/notifications/read-all` | JWT | Danh dau tat ca da doc |
| GET | `/api/notifications` | JWT | Danh sach thong bao (pagination + filter) |
| GET | `/api/notifications/:id` | JWT | Chi tiet thong bao |
| PUT | `/api/notifications/:id/read` | JWT | Danh dau da doc |
| DELETE | `/api/notifications/:id` | JWT | Xoa thong bao |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| GET | `/api/admin/stats/overview` | JWT + Admin | Thong ke tong quan |
| GET | `/api/admin/stats/activities` | JWT + Admin | Thong ke hoat dong |
| POST | `/api/admin/users` | JWT + Admin | Tao nguoi dung |
| POST | `/api/admin/users/import` | JWT + Admin | Import nguoi dung tu CSV |

### AI (`/api/ai`)

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| POST | `/api/ai/search` | JWT | Tim kiem bang AI |
| POST | `/api/ai/recommend` | JWT | Goi y hoat dong |
| POST | `/api/ai/ask` | JWT | Hoi dap chatbot |

### Forms (`/api/forms`) - Route da dinh nghia, chua mount

Module dynamic form builder (Google Forms-like) voi:
- Tao/sua/xoa form
- Them cau hoi (text, multiple choice, checkbox, ...)
- Thu thap cau tra loi
- Export Excel / Google Sheets

---

## Cai dat & Chay

```bash
# Cai dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema len database
npx prisma db push

# Chay development
npm run dev

# Chay production
npm start
```

---

## Environment Variables

Sao chep `.env.example` thanh `.env` va dien thong tin:

```bash
cp .env.example .env
```

| Bien | Mo ta |
|------|-------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret key ky JWT |
| `JWT_EXPIRE` | Thoi han JWT (vd: `7d`) |
| `NODE_ENV` | `development` hoac `production` |
| `PORT` | Port server (mac dinh: 3000) |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | Email gui |
| `MAIL_PASS` | App password email |
| `REDIS_URL` | Redis connection URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TWILIO_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE` | Twilio phone number |

---

## Database

PostgreSQL chay qua Docker:

```bash
# Kiem tra container
docker ps

# Ten container: clb_database_container
# Host: localhost:5432
# Database: clb_db
# User: root / Password: root
```

Xem du lieu qua Prisma Studio:

```bash
npx prisma studio
```

---

## Features bi hoan (Ban sau)

| Feature | Module | Ly do |
|---------|--------|-------|
| Theo doi thu/chi hoat dong | Activity Management | Chua co bang trong DB |
| Gui phan hoi & danh gia | Participation | Bang `reviews` da co, chua implement API |
| Xem thong ke danh gia | Participation | Bang `reviews` da co, chua implement API |
| Phan quyen thanh vien trong CLB | Club Management | Dang dung `organization_members.role` |
| Quan ly tai nguyen (tep tin, thong bao noi bo) | Club Management | Bang `organization_documents` da co |
| Xem thong tin noi bo | Club Management | Can thiet ke them |
