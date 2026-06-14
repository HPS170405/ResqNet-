# ResqNet 🚨

ResqNet is a state-of-the-art, AI-powered disaster relief and response coordination platform designed to bridge the gap between victims, first responders, and emergency resources in real-time. Built with a stunning dark-neon glassmorphism UI, it combines agentic workflows, local RAG protocols, geolocated OSM querying, and n8n webhooks.

---

## 🌟 Key Features

*   **RAG Crisis Safety Guide**: Integrated AI chat assistant powered by **Gemini** and a local emergency protocol knowledge base (`protocols.json`) to provide instant safety advice during natural disasters (floods, fires, earthquakes).
*   **Nominatim Geocoding**: Accepts natural address/location names (e.g., *"Dadar, Mumbai"*) when reporting emergencies, converting names to geo-coordinates on the fly with local offline dictionary fallbacks.
*   **OSM Overpass Emergency Finder**: Automatically queries OpenStreetMap's Overpass API to locate nearby hospitals, medical care centers, and police stations within a 5km radius of reported incidents.
*   **Interactive Live Map**: Custom dark-themed Leaflet map overlay rendering neon route optimization paths (calculated from logistics routing models) bypassing roadblock hazard zones.
*   **Real Payment Portal**: Embedded checkout flow utilizing **Razorpay** for receiving real-time relief funds and donations securely.
*   **Automated Email Dispatch**: Integrated **Nodemailer** welcome emails upon new user registration and receipt notifications upon successful donations.
*   **n8n Workflow Webhooks**: Dispatches incident alert payloads to local n8n nodes for severe/critical reports, triggering automated Slack posts, Twilio SMS alerts to volunteers, and audit logs to Google Sheets.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, Lucide icons, Leaflet.js
*   **Backend Server**: Node.js, Express, Socket.IO, Mongoose, Nodemailer, Razorpay SDK
*   **AI/ML Service**: Python, FastAPI, Uvicorn, Google Gemini API
*   **Automation**: n8n Workflow Engine

---

## 🔌 Default Port Mapping

When fully booted, the services are mapped to the following local ports:

| Service | Port | Description |
| :--- | :--- | :--- |
| **Vite Client** | `5173` | React web portal for dispatchers and volunteers |
| **Express Backend** | `5000` | Core API, Socket.IO event handler, database routing |
| **ML Service** | `8000` | Gemini RAG assistant and mock routing endpoints |
| **n8n Automation** | `5678` | n8n workflow designer and trigger receiver |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js (v18+), Python (3.10+), and n8n installed on your system.

### 2. Configure Environment Files
Before starting, create `.env` files in both backend folders:

#### Backend (`/server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resqnet
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SMTP_HOST=your_smtp_server
SMTP_PORT=587
SMTP_USER=your_email_user
SMTP_PASS=your_email_pass
```

#### ML Service (`/ml-service/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Spin Up All Servers
Simply run the startup script at the root directory:
```bash
# Double-click or run from terminal:
.\START_SERVERS.bat
```
This batch script will automatically terminate any hanging ports and start the Backend, Frontend, ML Service, and n8n engine concurrently in separate terminal windows.

---

## 🤖 n8n Automation Setup
1. Open **[http://localhost:5678](http://localhost:5678)**.
2. Select **Import from File** in the settings menu.
3. Choose the [n8n/disaster_alerts_workflow.json](n8n/disaster_alerts_workflow.json) file.
4. Link your API credentials for Slack, Twilio, and Google Sheets, then activate the workflow.
