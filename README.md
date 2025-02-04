<p align="center">
    <img src="/backend/assets/logo.png" align="center" width="30%">
</p>

<h1 align="center">ft_transcendence</h1>

<p align="center">
    <em><code>❯ A Web-Based Gaming Platform with Real-Time Features</code></em>
</p>

<p align="center">
    <img src="https://img.shields.io/github/license/aouaziz/ft_transcendence?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="License">
    <img src="https://img.shields.io/github/last-commit/aouaziz/ft_transcendence?style=default&logo=git&logoColor=white&color=0080ff" alt="Last Commit">
    <img src="https://img.shields.io/github/languages/top/aouaziz/ft_transcendence?style=default&color=0080ff" alt="Top Language">
    <img src="https://img.shields.io/github/languages/count/aouaziz/ft_transcendence?style=default&color=0080ff" alt="Languages Count">
</p>

---

## 🔗 Table of Contents

- [📍 Overview](#-overview)
- [👾 Features](#-features)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [☑️ Prerequisites](#-prerequisites)
  - [⚙️ Installation](#-installation)
  - [🤖 Usage](#-usage)
  - [🧪 Testing](#-testing)
- [📌 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [🎗 License](#-license)
- [🙌 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

**FT_TRANSCENDENCE** is a web-based gaming platform featuring real-time multiplayer Pong games, tournaments, chat functionality, and user profiles. Built with **Django** for the backend and **vanilla JavaScript** for the frontend, it leverages **Docker** for containerization and scalability.

---

## 👾 Features

- **🎮 Real-Time Pong Games**: Play locally or online against other users.
- **🏆 Tournaments**: Compete in organized tournaments with dynamic brackets.
- **💬 Chat System**: Real-time messaging with other players.
- **🔐 OAuth2 Authentication**: Login via **42 School's OAuth provider**.
- **👤 User Profiles**: Customize your profile and track stats.
- **🤝 Friends System**: Add friends and track their online status.

---

## 📁 Project Structure

```
ft_transcendence/
├── backend/               # Django backend with REST API and WebSockets
│   ├── auth_service/      # User authentication and management
│   ├── chat/             # Real-time chat functionality
│   ├── game/             # Game logic and WebSocket handlers
│   ├── friendship/       # Friends system and social features
│   ├── oauth_42/         # 42 OAuth2 integration
│   └── tests/            # Unit and integration tests
├── frontend/             # Static frontend assets (HTML/CSS/JS)
│   ├── game/            # Game client and UI components
│   └── *.html           # Application pages
├── docker-compose.yml    # Docker orchestration setup
├── Makefile              # Development shortcuts
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### ☑️ Prerequisites

Before setting up the project, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/aouaziz/ft_transcendence.git
   cd ft_transcendence
   ```

2. **Build and start the containers**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Open `https://localhost:3000` in your browser.

### 🤖 Usage

- Sign in using **42 OAuth authentication**.
- Play real-time **Pong** matches.
- Chat with friends and **join tournaments**.

### 🧪 Testing

Run tests for the backend:
```bash
cd backend
python manage.py test
```

---

## 📌 Project Roadmap

- ✅ **Core Features**: Pong gameplay, authentication, and chat system.
- 🔄 **Upcoming Enhancements**:
  - **User Matchmaking**: Implement ranked matchmaking system.
  - **Achievements System**: Add in-game achievements.
  - **Enhanced Tournament UI**: Visualize tournament brackets in real-time.

---

## 🔰 Contributing

Contributions are welcome! To get started:

1. Fork the repository.
2. Create a new branch (`feature-xyz`).
3. Commit your changes.
4. Submit a pull request.

---

## 🙌 Acknowledgments

- **42 School**: For OAuth2 integration and project inspiration.
- **Django & Django Channels**: Powering the backend and real-time features.
- **Docker**: Simplifying deployment and scalability.

---

🚀 **Enjoy playing Pong with friends!** 🎮

