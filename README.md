# Sem-Pilot 🎓
### Your Academic Planning & Productivity Companion

Sem-Pilot is an academic productivity platform designed to help students organize their semester, manage attendance, track assignments, and keep academic activities in one place.

**Repository:** [github.com/jainamdavda1-pixel/Sem-Pilot](https://github.com/jainamdavda1-pixel/Sem-Pilot)

## ✨ Key Features

- 📅 **Timetable & Academic Planning** — Organize class schedules and academic activities.
- 📊 **Attendance Tracking** — Track attendance and review attendance-related information.
- 📝 **Assignment Management** — Organize assignments and academic tasks.
- 🗓️ **Calendar & Notifications** — Keep important dates, events, and reminders organized.
- 📈 **Academic Analytics** — Review academic activity through summaries and analytics.
- 🤖 **AI-Assisted Academic Workflows** — Explore AI-powered academic assistance using Gemini.
- 🔗 **Google Classroom Integration** — Support integration-related academic workflows.

> **Project status:** Sem-Pilot is an ongoing project. Feature availability and integration completeness may vary across modules.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database access | Prisma ORM |
| Development database | SQLite |
| Database compatibility | PostgreSQL adapter/configuration |
| Integrations | Google Classroom and Gemini-related workflows |

## 🏗️ Architecture

```text
React + Vite Frontend
        │
        │ HTTP requests
        ▼
Node.js + Express Backend
        │
        ▼
     Prisma ORM
        │
        ▼
 SQLite / Configured Database
```

The frontend provides the user interface, while the Express backend handles API routes and application operations. Prisma provides the database access layer.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- Git
- Required database and API configuration

### 1. Clone the repository

```bash
git clone https://github.com/jainamdavda1-pixel/Sem-Pilot.git
cd Sem-Pilot
```

### 2. Install dependencies

If the project has separate frontend and backend packages:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Adjust the directory names if the repository uses a different structure.

### 3. Configure environment variables

Check the repository for `.env.example` files and the required configuration. Add the necessary database settings and API credentials to the appropriate environment files.

**Never commit API keys, passwords, or other secrets to GitHub.**

### 4. Set up the database

Follow the Prisma schema and database migration instructions provided in the repository. The exact commands depend on the configured database provider and package scripts.

### 5. Run the application

Start the backend in one terminal using the development script configured in its `package.json`.

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

If a `dev` script is not defined, use the corresponding script available in each `package.json`. Open the local URL displayed by Vite to access the frontend.

## 📁 Project Structure

Conceptual overview (actual filenames may vary):

```text
Sem-Pilot/
├── frontend/       # React + Vite application
├── backend/        # Node.js + Express API
├── prisma/         # Database schema/configuration
└── README.md       # Project documentation
```

## 🎯 Project Objectives

Sem-Pilot brings common academic workflows into a unified platform. It provides practical experience with:

- Developing interactive interfaces using React
- Building backend APIs with Node.js and Express
- Managing data through Prisma ORM
- Structuring a full-stack application into feature-focused modules
- Exploring third-party integrations and AI-assisted workflows

## 🔮 Future Improvements

- Complete and validate remaining feature modules
- Improve personalized academic insights
- Complete and test external integrations
- Expand automated testing and error handling
- Improve production database configuration and deployment
- Add screenshots and a live demonstration



---

*Sem-Pilot — Plan your semester. Stay organized. Make academic progress.*
