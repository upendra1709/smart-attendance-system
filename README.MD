# SmartAttend — AI-Powered Smart Attendance System

An AI-driven, contactless attendance system for campuses that replaces paper registers and roll calls with real-time facial recognition, liveness detection, and live cloud dashboards.

## 🔗 Live Demo

- **Frontend (Vercel):** smart-attendan-git-573346-upendrarajpoot2005-gmailcoms-projects.vercel.app
- **Backend API (Render):** https://smart-attendance-system-gc7k.onrender.com

## ✨ Features (in progress)

- Face recognition attendance — InsightFace (ArcFace), 512-d embeddings, cosine similarity
- Liveness detection — blocks photo & video replay (anti-proxy)
- Three role-based portals — Student, Teacher, Admin
- Real-time dashboards with live sync
- Smart defaulter alerts (&lt;75% attendance)
- One-click CSV/PDF reports
- Privacy-first — embeddings only, never raw face images

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 · React · TypeScript · Tailwind CSS · Framer Motion |
| Backend | Python · FastAPI · Pydantic |
| AI Engine | InsightFace (ArcFace) · RetinaFace · MediaPipe |
| Database | PostgreSQL (Supabase) |
| Auth | JWT · Role-Based Access Control |
| Deploy | Vercel (frontend) · Render (backend) |

## 🗄️ Database (8 Tables)

`users` · `subjects` · `classes` · `enrollments` · `face_embeddings` · `sessions` · `attendance` · `alerts_log`

## 🚀 Run Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
