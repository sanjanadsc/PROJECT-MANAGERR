# TaskFlow — Project & Task Management App

A full-stack web application for managing projects, assigning tasks, and tracking progress with role-based access control.

## Live Demo
> Add your Railway URL here after deployment

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- React Hot Toast

**Backend**
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs

**Deployment**
- Railway (backend + database)
- Railway / Vercel (frontend)

---

## Features

- **Authentication** — Signup and login with JWT tokens, protected routes
- **Role-Based Access** — Admin and Member roles with different permissions
- **Project Management** — Create, view, and manage projects (Admin only)
- **Team Management** — Add/remove members to projects
- **Task Management** — Create, assign, update, and delete tasks
- **Task Filtering** — Filter by status and priority
- **Dashboard** — Personal stats, completion rate, recent tasks
- **Overdue Detection** — Tasks past due date are highlighted
- **Responsive Design** — Works on mobile, tablet, and desktop

---

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Assign tasks to others | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| Edit/delete tasks | ✅ | ❌ |

---

## Database Schema

```
User
  id, name, email, password, role (ADMIN/MEMBER)

Project
  id, name, description, ownerId → User

ProjectMember
  id, userId → User, projectId → Project, role

Task
  id, title, description, status (TODO/IN_PROGRESS/DONE)
  priority (LOW/MEDIUM/HIGH), dueDate
  projectId → Project, assigneeId → User, creatorId → User
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and JWT secret
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
```

---

## API Endpoints

### Auth
```
POST   /api/auth/signup     Register new user
POST   /api/auth/login      Login
GET    /api/auth/me         Get current user
```

### Projects
```
GET    /api/projects              Get all projects for user
POST   /api/projects              Create project (Admin)
GET    /api/projects/:id          Get project details
PUT    /api/projects/:id          Update project
DELETE /api/projects/:id          Delete project
POST   /api/projects/:id/members  Add member
DELETE /api/projects/:id/members/:memberId  Remove member
```

### Tasks
```
GET    /api/tasks/dashboard           Dashboard stats
GET    /api/tasks/my                  My assigned tasks
GET    /api/tasks/project/:projectId  Tasks by project
POST   /api/tasks                     Create task
PUT    /api/tasks/:id                 Update task
DELETE /api/tasks/:id                 Delete task
```

### Users
```
GET    /api/users           All users (Admin only)
GET    /api/users/search    Search by email
```

---

## Deployment on Railway

### Backend + Database

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** service
3. Add a new service → **Deploy from GitHub repo** → select your repo → set root to `backend`
4. Add environment variables:
   ```
   DATABASE_URL=<auto-filled by Railway from PostgreSQL service>
   JWT_SECRET=your_random_secret_here
   CLIENT_URL=https://your-frontend-url.railway.app
   ```
5. Add build command: `npx prisma generate && npx prisma migrate deploy`
6. Start command: `node src/index.js`

### Frontend

1. Add another service in Railway → **Deploy from GitHub repo** → set root to `frontend`
2. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
3. Build command: `npm run build`
4. Start command: `npx serve dist`

---

## Project Structure

```
project-manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── user.routes.js
│   │   └── index.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       └── Layout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   └── MyTasks.jsx
    │   ├── utils/
    │   │   └── axios.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## Demo Video Script

1. Show signup as Admin
2. Create a project
3. Add a member (signup as Member in another tab)
4. Create tasks, assign to member
5. Login as Member — show restricted access
6. Update task status
7. Show dashboard stats and overdue detection
8. Show mobile responsive view
