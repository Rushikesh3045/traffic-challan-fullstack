# 🚦 Traffic Controller - Real-Time Violation Management System

A comprehensive, production-ready traffic violation management system with real-time updates powered by WebSocket technology.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Frontend](https://img.shields.io/badge/Frontend-React.js-blue)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![WebSocket](https://img.shields.io/badge/Real--Time-WebSocket-orange)

---

## 📋 Features

### 🔐 Multi-Role Authentication
- **Admin**: Full system oversight and appeal management
- **Police**: Record violations and monitor activity
- **Citizen**: Search violations, submit appeals, make payments

### ⚡ Real-Time Updates
- Live violation statistics
- Instant appeal decision notifications
- Real-time violation feed across all police dashboards
- WebSocket-powered instant updates

### 📊 Comprehensive Dashboards
- **Admin Dashboard**: Live statistics, charts, recent violations, appeal management
- **Police Dashboard**: Quick violation recording, real-time feed
- **Citizen Dashboard**: Violation search, appeal submission, payment processing
- **Admin Appeal Dashboard**: Review and decide on citizen appeals

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Java 17+
- PostgreSQL 12+
- Maven 3.6+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/traffic-controller.git
cd traffic-controller
```

2. **Set up the database**
```bash
# Create PostgreSQL database
createdb traffic_db

# Run the schema
psql -d traffic_db -f backend/schema.sql
```

3. **Start the backend**
```bash
cd backend/traffic
mvn spring-boot:run
```
Backend will run on `http://localhost:8080`

4. **Start the frontend**
```bash
cd frontend
npm install
npm start
```
Frontend will run on `http://localhost:3000`

5. **Access the application**
Open your browser and navigate to `http://localhost:3000`

### Demo Credentials
- **Admin**: `admin` / `admin123`
- **Police**: `police` / `police123`
- **Citizen**: `citizen` / `citizen123`

---

## 🏗️ Project Structure

```
TrafficController/
├── backend/
│   ├── schema.sql                    # Database schema
│   └── traffic/
│       ├── src/
│       │   └── main/
│       │       ├── java/com/traffic/
│       │       │   ├── controller/   # REST controllers
│       │       │   ├── entity/       # JPA entities
│       │       │   ├── repository/   # Data repositories
│       │       │   ├── service/      # Business logic
│       │       │   ├── config/       # Configuration
│       │       │   └── dto/          # Data transfer objects
│       │       └── resources/
│       │           └── application.properties
│       └── pom.xml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API & WebSocket services
│   │   ├── index.css             # Global styles
│   │   └── App.js                # Main app component
│   └── package.json
│
├── PROJECT_SUMMARY.md            # Detailed project documentation
├── DEPLOYMENT_GUIDE.md           # Production deployment guide
└── README.md                     # This file
```

---

## 🔧 Technology Stack

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **STOMP/SockJS** - WebSocket client
- **Recharts** - Data visualization

### Backend
- **Spring Boot** - Application framework
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - Database access
- **Spring WebSocket** - Real-time communication
- **PostgreSQL** - Database
- **JWT** - Token-based authentication

---

## 📊 Real-Time Architecture

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Admin     │◄────────────────────────────┤             │
│ Dashboard   │                             │             │
└─────────────┘                             │   Backend   │
                                            │   (STOMP)   │
┌─────────────┐         WebSocket          │             │
│   Police    │◄────────────────────────────┤             │
│ Dashboard   │                             │             │
└─────────────┘                             └─────────────┘
                                                    │
┌─────────────┐         WebSocket                  │
│  Citizen    │◄────────────────────────────────────┤
│ Dashboard   │                                     │
└─────────────┘                                     ▼
                                            ┌─────────────┐
                                            │ PostgreSQL  │
                                            │  Database   │
                                            └─────────────┘
```

### WebSocket Topics
- `/topic/violations` - New violation broadcasts
- `/topic/appeals` - New appeal submissions
- `/topic/appeals/decision` - Appeal approval/rejection

---

## 🎯 Key Functionalities

### Police Portal
1. Record new violations with quick-select violation types
2. View real-time feed of all recorded violations
3. Monitor today's statistics (count, collection, average)

### Citizen Portal
1. Search violations by vehicle number
2. View violation details with status badges
3. Submit appeals with detailed reasoning
4. Receive real-time notifications for appeal decisions
5. Process payments for violations

### Admin Portal
1. Live dashboard with comprehensive statistics
2. Real-time charts (Bar, Pie, Line, Area)
3. Recent violations monitoring
4. Appeal review and decision-making
5. System-wide activity notifications

---

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption with BCrypt
- Protected API endpoints
- CORS configuration
- SQL injection prevention via JPA

---

## 📈 Performance

- **Real-time updates** without polling
- **WebSocket auto-reconnection** (5-second retry)
- **Optimized database queries** with JPA
- **Efficient React rendering** with hooks
- **Responsive design** for all devices

---

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running: `pg_ctl status`
- Verify database credentials in `application.properties`
- Ensure port 8080 is not in use

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && npm install`
- Check if port 3000 is available

### WebSocket not connecting
- Verify backend is running on port 8080
- Check browser console for connection errors
- Ensure CORS is properly configured

---

## 📝 API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

### Violations
```
GET  /api/violations/{vehicleNo}
POST /api/violations
```

### Appeals
```
GET  /api/appeals/all
POST /api/appeals
POST /api/appeals/decision/{id}/{decision}
```

### Admin
```
GET /api/admin/dashboard
GET /api/admin/recent-violations
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- Spring Boot documentation
- React.js community
- STOMP WebSocket implementation
- Recharts library for beautiful charts

---

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Made with ❤️ and ☕**
