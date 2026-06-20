 # Kuriosity 🧑‍🎓

**Teach an AI student. Watch yourself learn better.**

Kuriosity is an AI-powered learning platform where you upload your study material and teach it to **Kurio** — a curious AI student who asks questions, gets confused, makes mistakes, and pushes you to actually understand the material instead of just reading it.

🔗 **Live app:** [kuriosity.gokul.quest](https://kuriosity.gokul.quest)

---

## How it works

1. **Upload** a PDF, PPT, or text file of your study material
2. **Teach Kurio** — he asks genuine questions about the content, rotating through definitions, MCQs, real-world applications, and comparisons
3. **Get evaluated** — click the ⓘ icon next to any answer to get an instant accuracy score, missing concepts, and suggested revision topics
4. **Track progress** — the Analytics dashboard shows your strong topics, weak topics, and overall accuracy across sessions

Kurio remembers what you've struggled with across sessions and circles back to it — no cramming the same flashcard forever, no forgetting what tripped you up last week.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway) |
| Vector store | ChromaDB |
| AI chat | Groq (`llama-3.1-8b-instant`) |
| Embeddings | Cohere (`embed-english-v3.0`) |
| Email/OTP | Resend |
| Auth | JWT + bcrypt + OTP verification |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Key features

- **RAG-powered tutoring** — every question Kurio asks is grounded in the actual uploaded material, retrieved via vector similarity search
- **Honest evaluation engine** — wrong or incomplete answers are called out directly, with specific missing concepts and a revision plan
- **Cross-session topic memory** — tracks which topics you've struggled with and revisits them intelligently
- **Learning analytics** — PDFs uploaded, questions answered, accuracy %, strong/weak topic breakdown
- **OTP email verification** on registration
- **Fully responsive** — works on desktop and mobile with a dedicated mobile navigation pattern
- **Rate-limited & hardened** — auth endpoints are rate-limited, all queries are parameterized, CORS is locked to the production domain

---

## Project structure
ai-student-platform/

├── client/                 # React + Vite frontend

│   ├── src/

│   │   ├── pages/          # Login, Register, Dashboard, SubjectPage

│   │   ├── components/     # Shared UI components

│   │   ├── store/          # Zustand auth store

│   │   └── services/       # Axios API client

│   └── vercel.json         # SPA routing rewrite rules

│

├── server/                 # Express backend

│   ├── src/

│   │   ├── controllers/    # Route handlers

│   │   ├── services/       # RAG pipeline, LLM calls, email, memory

│   │   ├── routes/         # Express routers

│   │   ├── middleware/     # Auth, upload validation, error handling

│   │   ├── utils/          # Chunking, embeddings, prompt building

│   │   └── config/         # DB, ChromaDB clients

│   └── server.js

│

└── docker-compose.yml       # Local ChromaDB instance
---

## Local development setup

### Prerequisites
- Node.js 20+
- A PostgreSQL database (or use Supabase/Railway free tier)
- API keys: Groq, Cohere, Resend

### 1. Clone and install

```bash
git clone https://github.com/gokulraj9488/ai-student-platform.git
cd ai-student-platform

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

Create a `.env` file at the project root:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_random_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
COHERE_API_KEY=your_cohere_key
RESEND_API_KEY=your_resend_key
CHROMA_URL=http://localhost:8000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
FRONTEND_URL=http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start ChromaDB locally

```bash
docker compose up -d
```

### 4. Run the backend

```bash
cd server
npm run dev
```

### 5. Run the frontend

```bash
cd client
npm run dev
```

Visit `http://localhost:5173`.

---

## Deployment

- **Backend** deploys to Railway (root directory: `server`)
- **Frontend** deploys to Vercel (root directory: `client`)
- ChromaDB runs as a separate Railway service with a persistent volume
- Environment variables are set independently on each platform — see `.env.example` and `client/.env.example` for the full list

---

## Roadmap

- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Multi-file context per subject (currently per-subject vector collection, multi-doc reasoning planned)
- [ ] Export learning analytics as PDF report

---

## Author

Built by **Gokulraj M** — Software Engineer specializing in Google Cloud, Looker, and full-stack development.

- Portfolio: [gokul.quest](https://gokulraj9488.github.io/Gokulraj-portfolio/)
- GitHub: [@gokulraj9488](https://github.com/gokulraj9488)
