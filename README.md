# 🖊️ Inkwell

A real-time collaborative note-taking web application — think Notion-lite. Teams create workspaces, invite members, and edit documents simultaneously with live cursors and instant sync.

> **Status:** Phase 2 complete — core editor live. Phase 3 (real-time collaboration) in progress.

---

## Live Demo

| Service  | URL                                                      |
| -------- | -------------------------------------------------------- |
| Frontend | [inkwell.vercel.app](https://inkwell-collab.vercel.app/) |

---

## Features

- **Authentication** — Register, login, JWT access + refresh tokens
- **Workspaces** — Create team workspaces, invite members with roles (Owner / Editor / Viewer)
- **Rich text editor** — Tiptap-powered editor with headings, lists, task lists, code blocks, highlights
- **Auto-save** — Document content saves automatically as you type (debounced)
- **Nested pages** — Documents can contain child pages like Notion
- **Role-based access** — Viewers can read, Editors can write, Owners manage everything
- **File uploads** — Images upload directly to AWS S3 via presigned URLs
- **Activity log** — Track who created, edited, or deleted documents

**Coming soon (Phase 3):**

- Real-time collaborative editing with live cursors
- WebSocket-powered instant sync across multiple users
- Version history

---

## Tech Stack

### Frontend

- **Next.js 16** — App Router, SSR
- **TypeScript** — Full type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library
- **Tiptap** — Rich text editor
- **React Query** — Server state management and caching
- **Axios** — HTTP client with interceptors

### Backend

- **Express.js** — REST API
- **TypeScript** — Full type safety
- **Prisma ORM** — Type-safe database queries
- **JWT** — Access + refresh token authentication
- **bcrypt** — Password hashing
- **Socket.io** — WebSockets (Phase 3)

### Database & Cache

- **PostgreSQL** — Primary database
- **Redis** — Sessions and caching
- **Prisma** — ORM and migrations

### Infrastructure

- **Docker + Docker Compose** — Local development environment
- **AWS EC2** — Backend hosting (t2.micro, Mumbai region)
- **AWS RDS** — Managed PostgreSQL (db.t3.micro)
- **AWS S3** — File storage
- **Vercel** — Frontend hosting
- **GitHub Actions** — CI/CD pipeline (Phase 4)

---

## Project Structure

```
inkwell/
  apps/
    frontend/                 ← Next.js 16 app
      src/
        app/
          (auth)/             ← Login, register pages
          (dashboard)/        ← Dashboard, workspace, editor pages
        components/
          editor/             ← Tiptap editor + toolbar
          dashboard/          ← Sidebar, workspace components
          ui/                 ← shadcn/ui components
        hooks/                ← React Query hooks
        lib/
          api/                ← Typed API service functions
          axios.ts            ← Axios instance with interceptors
        types/                ← Shared TypeScript types
    backend/                  ← Express.js API
      src/
        modules/
          auth/               ← Register, login, refresh endpoints
          workspace/          ← Workspace CRUD + member management
          document/           ← Document CRUD + nested pages
          upload/             ← S3 presigned URL generation
        middleware/
          auth.middleware.ts  ← JWT verification
          permissions.middleware.ts ← Role-based access control
        lib/
          prisma.ts           ← Prisma client singleton
          s3.ts               ← AWS S3 utilities
        utils/
          jwt.utils.ts        ← Token generation and verification
  packages/
    database/
      prisma/
        schema.prisma         ← Database schema
        migrations/           ← Migration history
  docker-compose.yml          ← PostgreSQL + Redis for local dev
```

---

## Getting Started

### Prerequisites

- Node.js v22+
- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/prasad0022/inkwell.git
cd inkwell
```

### 2. Start Docker containers

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 7379) locally.

### 3. Set up environment variables

**Backend** — create `apps/backend/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://inkwell:inkwell123@localhost:5432/inkwell_dev
REDIS_URL=redis://localhost:7379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

**Frontend** — create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Inkwell
```

### 4. Run database migrations

```bash
cd apps/backend
npm run db:migrate
npm run db:generate
```

### 5. Start the apps

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

| Service      | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000        |
| Backend API  | http://localhost:4000        |
| Health check | http://localhost:4000/health |

---

## API Endpoints

### Auth

| Method | Endpoint           | Auth | Description           |
| ------ | ------------------ | ---- | --------------------- |
| POST   | /api/auth/register | ❌   | Register new user     |
| POST   | /api/auth/login    | ❌   | Login, returns tokens |
| POST   | /api/auth/refresh  | ❌   | Refresh access token  |
| GET    | /api/auth/me       | ✅   | Get current user      |

### Workspaces

| Method | Endpoint                          | Auth          | Description             |
| ------ | --------------------------------- | ------------- | ----------------------- |
| POST   | /api/workspaces                   | ✅            | Create workspace        |
| GET    | /api/workspaces                   | ✅            | Get all user workspaces |
| GET    | /api/workspaces/:slug             | ✅            | Get workspace by slug   |
| PATCH  | /api/workspaces/:slug             | ✅ Owner      | Update workspace        |
| DELETE | /api/workspaces/:slug             | ✅ Owner      | Delete workspace        |
| POST   | /api/workspaces/:slug/members     | ✅ Owner      | Invite member           |
| GET    | /api/workspaces/:slug/members     | ✅ Member     | Get all members         |
| PATCH  | /api/workspaces/:slug/members/:id | ✅ Owner      | Update member role      |
| DELETE | /api/workspaces/:slug/members/:id | ✅ Owner/Self | Remove member           |

### Documents

| Method | Endpoint                     | Auth       | Description             |
| ------ | ---------------------------- | ---------- | ----------------------- |
| POST   | /api/documents               | ✅         | Create document         |
| GET    | /api/documents/workspace/:id | ✅         | Get workspace documents |
| GET    | /api/documents/:id           | ✅         | Get single document     |
| PATCH  | /api/documents/:id           | ✅ Editor+ | Update document         |
| DELETE | /api/documents/:id           | ✅ Editor+ | Delete document         |

### Upload

| Method | Endpoint                  | Auth | Description                 |
| ------ | ------------------------- | ---- | --------------------------- |
| POST   | /api/upload/presigned-url | ✅   | Get S3 presigned upload URL |

---

## Database Schema

```
users
  id, email, name, password, avatar, createdAt, updatedAt

workspaces
  id, name, description, slug, ownerId, createdAt, updatedAt

workspace_members
  id, workspaceId, userId, role (OWNER/EDITOR/VIEWER), joinedAt

documents
  id, title, content (JSON), emoji, isPublic, workspaceId,
  createdById, parentId (self-relation for nesting), createdAt, updatedAt

activities
  id, action, userId, workspaceId, documentId, createdAt
```

---

## Roadmap

- [x] Phase 1 — Foundation (monorepo, auth, workspaces, AWS deployment)
- [x] Phase 2 — Core editor (Tiptap, documents, dashboard, Vercel)
- [ ] Phase 3 — Real-time (Socket.io, live cursors, WebSocket sync)
- [ ] Phase 4 — Polish + DevOps (GitHub Actions CI/CD, search, rate limiting)
- [ ] Phase 5 — AI (Claude API, document summarisation, semantic search)

---

## Development Notes

**Installing packages (npm workspaces on Windows):**

Always use `--install-strategy=nested` to prevent hoisting issues:

```bash
npm install --install-strategy=nested <package-name>
```

**Prisma commands (run from `apps/backend`):**

```bash
npm run db:migrate    # create and apply migration
npm run db:generate   # regenerate Prisma client after schema change
```

**Docker — Redis port:**

Redis runs on port `7379` locally (not the default 6379) because Windows reserves ports 6317–6616. The container still runs on 6379 internally.

---

## Deployment

### Backend (AWS EC2)

```bash
ssh -i inkwell-key.pem ubuntu@xx.xxx.xxx.xxx
cd ~/inkwell
git pull origin main
cd apps/backend
npx prisma generate --schema=../../packages/database/prisma/schema.prisma
npm run build
pm2 restart inkwell-backend
```

### Frontend (Vercel)

Automatically deploys on push to `main` via Vercel GitHub integration.

---

## Author

**Prasad Khose**

---

_Built as a portfolio project to demonstrate full-stack engineering with real-world tools and patterns._
