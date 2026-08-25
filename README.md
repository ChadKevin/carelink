# CareLink (Rural MedTech)

A telehealth and emergency medical assistance platform designed for rural communities, connecting patients, healthcare workers, doctors, and nearby hospitals.

## Project Structure

```text
rural-medtech/
│
├── Frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── map/
│   │   │   ├── ticket/
│   │   │   └── doctor/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── RaiseTicket/
│   │   │   ├── TicketDetails/
│   │   │   ├── NearbyHospitals/
│   │   │   └── DoctorDashboard/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── ticketService.ts
│   │   │   └── locationService.ts
│   │   ├── hooks/
│   │   │   ├── useLocation.ts
│   │   │   └── useAuth.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env
│
├── Backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/medtech/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/
│   │   │   │   ├── security/
│   │   │   │   ├── exception/
│   │   │   │   └── MedtechApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application-prod.properties
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
├── .gitignore
└── README.md
```

## Getting Started

### Frontend Setup
1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
2. Build and run with Maven:
   ```bash
   mvn spring-boot:run
   ```
