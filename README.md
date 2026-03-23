# Midterm Full-stack App

## Tech stack
- Frontend: React + Vite (port 5173)
- Backend: Node.js + Express (port 5000)
- Data: MongoDB (seeded from JSON file)

## API endpoints
- GET /products
- GET /products/:id
- POST /products
- PUT /products/:id
- DELETE /products/:id

Supports:
- Filter: /products?category=Phone
- Search: /products?search=iphone

## Setup
### 1) Start MongoDB
Make sure MongoDB is running locally at mongodb://127.0.0.1:27017

### 2) Backend
1. Copy backend/.env.example to backend/.env
2. Run:
   npm install
   npm run dev

### 3) Frontend
1. Copy frontend/.env.example to frontend/.env
2. Run:
   npm install
   npm run dev

Frontend calls backend using VITE_API_URL (default: http://localhost:5000).
