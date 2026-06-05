# 🐾 PetCare Resort Management System
### OS Scheduling Algorithms — Full-Stack Project

A complete multi-department pet care system that simulates four Operating System scheduling algorithms in a real-world setting.

---

## 🗂 Project Structure

```
PetCare-System/
├── backend/
│   ├── config/dbConfig.js          ← MySQL connection pool
│   ├── models/petModel.js          ← Pet CRUD
│   ├── services/
│   │   ├── fcfsService.js          ← FCFS algorithm
│   │   ├── sjfService.js           ← SJF algorithm
│   │   ├── priorityService.js      ← Priority Scheduling
│   │   └── roundRobinService.js    ← Round Robin + Daycare
│   ├── controllers/
│   │   ├── registrationController.js
│   │   ├── groomingController.js
│   │   ├── vetController.js
│   │   └── billingController.js
│   ├── routes/
│   │   ├── registrationRoutes.js
│   │   ├── groomingRoutes.js
│   │   ├── vetRoutes.js
│   │   └── billingRoutes.js
│   ├── app.js                      ← Express entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html                  ← Landing / home page
│   ├── dashboard.html              ← System overview
│   ├── registration.html           ← FCFS / SJF demo
│   ├── grooming.html               ← FCFS / SJF demo
│   ├── vet.html                    ← Priority Scheduling
│   ├── billing.html                ← Round Robin
│   ├── css/style.css
│   └── js/
│       ├── api.js
│       ├── registration.js
│       ├── grooming.js
│       ├── vet.js
│       └── billing.js
├── database/
│   ├── schema.sql                  ← All table definitions
│   └── seed.sql                    ← Sample data
└── README.md
```

---

## 🧠 Algorithms Implemented

| Department      | Algorithm(s)            | Key Feature                          |
|-----------------|-------------------------|--------------------------------------|
| Registration    | FCFS, SJF               | Toggle between algorithms live       |
| Grooming        | FCFS, SJF               | Gantt chart + avg wait/turnaround    |
| Veterinary      | Priority Scheduling     | Emergency first, room auto-assignment|
| Billing         | Round Robin (Q=2s)      | Visual rounds, equal per-pet time    |
| Daycare         | Round Robin (Q=2s)      | Activity rotation: Play→Train→Ball   |

---

## ⚙️ Setup Instructions

### 1. Database

```sql
-- Run these in order in MySQL Workbench or CLI:
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set your MySQL password

npm install
npm start          # production
npm run dev        # with nodemon (auto-reload)
```

Server runs on: `http://localhost:3000`

### 3. Frontend

Open `frontend/index.html` in a browser.  
*(No build step needed — pure HTML/CSS/JS)*

For local development with live reload you can use:
```bash
npx serve frontend
```

---

## 🔌 REST API Reference

### Registration
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/registration                 | Add pet to queue         |
| GET    | /api/registration/queue?algorithm=FCFS\|SJF | Get scheduled queue |
| GET    | /api/registration/all             | All registrations        |
| PUT    | /api/registration/:id/done        | Mark as done             |

### Grooming
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/grooming                     | Add grooming task        |
| GET    | /api/grooming/schedule?algorithm=FCFS\|SJF | Scheduled tasks |
| GET    | /api/grooming/all                 | All tasks                |
| PUT    | /api/grooming/:id/complete        | Mark complete            |

### Veterinary
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/vet                          | Add vet case             |
| GET    | /api/vet/schedule                 | Priority-sorted queue    |
| GET    | /api/vet/all                      | All cases                |
| PUT    | /api/vet/:id/discharge            | Discharge pet            |

### Billing & Daycare
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/billing                      | Add billing entry        |
| GET    | /api/billing/schedule             | RR billing schedule      |
| GET    | /api/billing/daycare              | RR daycare schedule      |
| GET    | /api/billing/all                  | All billing records      |
| PUT    | /api/billing/:id/pay              | Mark as paid             |

---

## 📦 Dependencies

```
express      — HTTP server & routing
mysql2       — MySQL driver (Promise API)
cors         — Cross-origin requests
dotenv       — Environment variables
nodemon      — Dev auto-reload (devDependency)
```

---

## 🎓 OS Concepts Demonstrated

- **FCFS**: Simple queue, O(n) sort by arrival time
- **SJF**: Greedy selection of minimum burst time — minimises average waiting time
- **Priority Scheduling**: Emergency (P1) cases pre-empt normal (P2) cases at each decision point
- **Round Robin**: Fixed time quantum ensures CPU fairness; each process gets equal time slices

---

*Built for Operating Systems course — full-stack simulation of scheduling algorithms.*
