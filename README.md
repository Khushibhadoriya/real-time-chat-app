# 💬 ChatSphere — Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## ✨ Features
- Real-time messaging with Socket.io WebSockets
- JWT Authentication (Register/Login)
- Multiple chat rooms / group channels
- Online/offline user presence
- Typing indicators
- Auto-scroll to latest message
- Responsive UI with Tailwind CSS
- Members panel with leave room option

## 🛠️ Tech Stack
**Frontend:** React + Vite, Tailwind CSS, Zustand, Socket.io-client, React Router  
**Backend:** Node.js, Express.js, Socket.io, JWT, bcryptjs  
**Database:** MongoDB + Mongoose

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally

### Backend Setup
cd backend
npm install
cp .env.example .env   # add your values
npm run dev

### Frontend Setup
cd frontend
npm install
npm run dev

## 🌐 Ports
- Frontend: http://localhost:5173
- Backend:  http://localhost:5003