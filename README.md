# StudyFlow 🧠📚

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-strict?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-4-blue?style=flat&logo=tailwind)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-00D8C6?style=flat&logo=prisma)](https://prisma.io)
[![Bun](https://img.shields.io/badge/Bun-1-fast?style=flat&logo=bun)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**StudyFlow** is a **100% free, offline-first personal study assistant**. Upload notes (text or PDF), extract topics, generate study plans and quizzes, track results — all powered by local rule-based NLP. No paid APIs, no cloud tracking, your data stays private.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📝 Note Management** | Upload text/PDF notes, full CRUD, automatic topic extraction (TF-IDF n-grams) |
| **🧠 Study Plans** | AI-generated day-by-day plans with topic breakdown and activities |
| **❓ Adaptive Quizzes** | 3 types: Multiple Choice, Fill-in-Blank, True/False — generated from your notes |
| **📊 Results & Stats** | Score tracking, performance charts, weak topic recommendations |
| **🔐 Secure Auth** | Email/password (bcrypt), session management |
| **📱 Responsive UI** | Mobile-first, shadcn/ui components, dark mode, tabs navigation |
| **⚡ Offline-First** | SQLite DB, local NLP — works without internet |

## 🚀 Quick Start

```bash
# Clone & Install
git clone <repo> personal-study-assistant
cd personal-study-assistant
bun install

# Database Setup (SQLite)
bun run db:push
bun run db:generate

# Development
bun run dev  # http://localhost:3000

# Production Build
bun run build
bun run start
```

**Live Demo**: [localhost:3000](http://localhost:3000) after `bun run dev`.

## 🏗️ Architecture

```
StudyFlow (Next.js App Router)
├── src/app/          # Pages & API Routes
│   ├── api/          # REST APIs (auth, notes, quizzes, etc.)
│   ├── page.tsx      # Main App (tabs: Dashboard/Notes/Plans/Quizzes/Results)
│   └── layout.tsx    # Root Layout + Metadata
├── src/lib/nlp/      # Local AI Engine
│   ├── topic-extraction.ts  # TF-IDF topics
│   ├── quiz-generator.ts    # Quiz types
│   ├── study-plan-generator.ts
│   └── recommendations.ts
├── src/components/study-assistant/  # Feature Views
├── prisma/schema.prisma  # 5 Models: User/Note/StudyPlan/Quiz/QuizResult
├── db/custom.db          # SQLite DB
└── tailwind.config.ts    # Shadcn UI
```

**Data Flow**:
1. User uploads note → NLP extracts topics → Save to DB.
2. Generate plan/quiz from note ID → Local computation → Store results.
3. Dashboard aggregates stats/recs.

## 🧠 Local NLP Engine (No External APIs)

Built from scratch with rule-based algorithms:

- **Tokenization**: Custom stopwords (300+), n-grams (1-3).
- **Topics**: TF-IDF scoring, key sentence extraction.
- **Quizzes**: Fill-blank (nouns), MCQ (4 options), T/F.
- **Plans**: Topic → Daily schedule (e.g., Day 1: Read/Quiz/Review).
- **Recs**: Score-based weak topics.

See `src/lib/nlp/` for full implementations.

## 📊 API Endpoints

All `/api/*` routes (protected except auth):

| Endpoint | Method | Description | Params |
|----------|--------|-------------|--------|
| `/api/auth/register` | POST | Create user | `{email, name, password}` |
| `/api/auth/login` | POST | Login | `{email, password}` |
| `/api/notes` | GET/POST/DELETE | Notes CRUD | `{title, content}` (POST) |
| `/api/notes/topics` | POST | Extract topics | `{noteId}` |
| `/api/notes/study-plan` | POST | Generate plan | `{noteId, days}` |
| `/api/notes/quiz` | POST | Create quiz | `{noteId}` |
| `/api/notes/quiz/[id]` | POST | Take quiz | `{quizId, answers}` |
| `/api/recommendations` | GET | Topic recs | - |
| `/api/stats` | GET | User stats | - |
| `/api/results` | GET | Quiz results | - |

## 🛠️ Database

**SQLite** (`db/custom.db`):

```prisma
model User { notes StudyPlan[] quizzes[] ... }
model Note { topics String studyPlans[] quizzes[] }
model StudyPlan { plan String days Int }
model Quiz { questions String results[] }
model QuizResult { score Int answers String }
```

Commands:
```bash
bun run db:push    # Sync schema
bun run db:reset   # Dev reset (danger!)
```

## 🔧 Development

- **Scripts**: `dev`, `build`, `lint`, `db:*`.
- **Add UI**: `npx shadcn@latest add <component>`.
- **Linter**: ESLint + Next config.
- **State**: Zustand (`src/store/auth.ts`).
- **Types**: Strict TS, Zod validation.

Hot reload on `bun run dev`.

## 🚀 Production

1. Build: `bun run build` (copies to `.next/standalone/`).
2. Run: `bun run start` (or `node .next/standalone/server.js`).
3. Reverse Proxy: Edit `Caddyfile`:
   ```
   :3000 {
     reverse_proxy localhost:3000
   }
   ```

Standalone mode for Docker/edge deployment.

## 🤝 Contributing

1. Fork & PR.
2. Run `bun install && bun run lint`.
3. Add tests in `src/__tests__/`.
4. Update NLP utils for new features.

Issues: [Create Issue](https://github.com/yourusername/personal-study-assistant/issues/new).

## 📄 License

MIT — Free for personal/commercial use. See [LICENSE](LICENSE) (create if missing).

---

**Built with ❤️ for students & lifelong learners. Stars/forks appreciated! ⭐**

