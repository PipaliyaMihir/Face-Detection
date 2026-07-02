# 🧠 AttendEase — Smart Face Recognition Attendance System

A full-stack attendance system with **real-time face recognition** via webcam. Users mark attendance by showing their face; admins manage people and download Excel reports.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, OpenCV, face_recognition |
| **Database** | MongoDB (via motor async driver) |
| **Frontend** | React 18, Vite, Tailwind CSS v3 |
| **Auth** | JWT (python-jose + bcrypt) |
| **Export** | openpyxl (Excel .xlsx) |

## 📋 Prerequisites

1. **Python 3.9+** — [python.org](https://www.python.org/downloads/)
2. **Node.js 18+** — [nodejs.org](https://nodejs.org/)
3. **MongoDB** — [mongodb.com](https://www.mongodb.com/try/download/community)
   - MongoDB **auto-creates databases** — no manual setup needed!
   - Just make sure it's running on `localhost:27017`
4. **CMake** — `pip install cmake`
5. **Visual C++ Build Tools** (Windows) — for `dlib`/`face_recognition`

## 🚀 Quick Start

### 1. Start MongoDB
```bash
mongod --dbpath /path/to/data
# Or if installed as a service, it's already running
```

### 2. Start Backend (Server)
```bash
cd "d:\Attendence System\server"

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API: **http://localhost:8000** | Docs: **http://localhost:8000/docs**

### 3. Start Frontend (Client)
```bash
cd "d:\Attendence System\client"
npm install
npm run dev
```
App: **http://localhost:5173**

## 🔐 Admin Login
- URL: **http://localhost:5173/login**
- Default credentials: `admin` / `admin123`
- Change via env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD`

## 📱 Features

### User Side (/)
- 📸 Live camera with real-time face detection
- 🟢 Green box = recognized | 🔴 Red box = unknown
- ▶️ Start/Stop camera buttons
- 📊 Person's attendance history shown after recognition
- 🔔 Toast notifications on attendance
- 📋 Today's attendance log

### Admin Side (/admin) — Login Required
- 👤 Add/Edit/Delete people with face image upload
- 🖼️ Drag & drop image upload
- 🔍 Search people by name
- 📅 Attendance table with date filters
- 📥 Download Excel report (.xlsx)
- 🚪 Logout button

### Design
- 🌙 Dark glassmorphism theme
- ✨ Smooth animations
- 📱 Fully mobile responsive

## 📁 Project Structure

```
Attendence System/
├── server/                        # Python FastAPI backend
│   ├── main.py                    # Entry point
│   ├── database.py                # MongoDB async layer
│   ├── face_engine.py             # Face recognition engine
│   ├── requirements.txt           # Python dependencies
│   ├── known_faces/               # Stored face images
│   └── routes/
│       ├── auth.py                # JWT login/verify
│       ├── people.py              # People CRUD
│       └── attendance.py          # Attendance + Excel export
│
├── client/                        # React + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx                # Router + auth guard
│   │   ├── api/api.js             # Axios client + auth interceptor
│   │   ├── pages/
│   │   │   ├── UserPage.jsx       # Camera + history
│   │   │   ├── AdminPage.jsx      # Admin dashboard
│   │   │   └── LoginPage.jsx      # Admin login
│   │   └── components/
│   │       ├── CameraFeed.jsx     # Webcam + face detection
│   │       ├── PersonHistory.jsx  # Attendance history
│   │       ├── Navbar.jsx         # Navigation
│   │       ├── AttendanceLog.jsx  # Today's log
│   │       ├── StatsCard.jsx      # Stat cards
│   │       ├── PersonCard.jsx     # Person card
│   │       └── AddPersonModal.jsx # Add/edit modal
│   └── package.json
│
└── README.md
```

## 🔧 MongoDB Configuration

MongoDB auto-creates the `attendance_system` database when data is first inserted. To change the database name:

```python
# In server/database.py, line 19:
DB_NAME = os.getenv("DB_NAME", "attendance_system")  # Change here
```

Or use environment variable:
```bash
set DB_NAME=my_attendance_db
```

## 🔧 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/api/auth/login` | No | Admin login → JWT |
| GET | `/api/auth/verify` | Yes | Verify token |
| GET | `/api/people/` | No | List people |
| POST | `/api/people/` | No | Add person |
| PUT | `/api/people/{id}` | No | Update person |
| DELETE | `/api/people/{id}` | No | Delete person |
| POST | `/api/attendance/recognize` | No | Recognize faces |
| GET | `/api/attendance/` | No | Get records |
| GET | `/api/attendance/today` | No | Today's records |
| GET | `/api/attendance/stats` | No | Dashboard stats |
| GET | `/api/attendance/person/{id}` | No | Person's history |
| GET | `/api/attendance/export` | No | Download Excel |

## ⚠️ Troubleshooting

### `face_recognition` fails on Windows
```bash
pip install cmake
pip install dlib
pip install face_recognition
```

### MongoDB connection error
Make sure MongoDB is running: `mongosh` or `mongo`

### Camera not working
- Access via `localhost` (browsers require HTTPS for camera on other hosts)
- Check browser camera permissions

## 📄 License
MIT License
