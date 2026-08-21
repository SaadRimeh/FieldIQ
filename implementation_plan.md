# FieldIQ — Enterprise Field Service SaaS Platform

## Global Folder Structure

```
FieldIQ/
├── FieldIQ_Microservices/          # Node.js Core API Gateway
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts
│   │   │   └── socket.ts
│   │   ├── domain/                 # Clean Architecture: Entities
│   │   │   ├── entities/
│   │   │   │   ├── Employee.ts
│   │   │   │   ├── DailyRoute.ts
│   │   │   │   ├── Task.ts
│   │   │   │   └── Invoice.ts
│   │   │   └── repositories/       # Interfaces
│   │   │       ├── IEmployeeRepository.ts
│   │   │       ├── IRouteRepository.ts
│   │   │       └── IInvoiceRepository.ts
│   │   ├── application/            # Use Cases
│   │   │   ├── usecases/
│   │   │   │   ├── DispatchRouteUseCase.ts
│   │   │   │   ├── CheckInUseCase.ts
│   │   │   │   ├── SubmitInvoiceUseCase.ts
│   │   │   │   └── AuthenticateEmployeeUseCase.ts
│   │   │   └── services/
│   │   │       ├── TspService.ts
│   │   │       └── MessageBrokerService.ts
│   │   ├── infrastructure/         # Frameworks & Drivers
│   │   │   ├── database/
│   │   │   │   ├── prisma/
│   │   │   │   │   └── schema.prisma
│   │   │   │   └── repositories/
│   │   │   │       ├── PrismaEmployeeRepository.ts
│   │   │   │       ├── PrismaRouteRepository.ts
│   │   │   │       └── PrismaInvoiceRepository.ts
│   │   │   ├── messaging/
│   │   │   │   ├── RabbitMQPublisher.ts
│   │   │   │   └── RedisPublisher.ts
│   │   │   └── socket/
│   │   │       └── SocketManager.ts
│   │   ├── interfaces/             # HTTP Controllers
│   │   │   ├── http/
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── auth.middleware.ts
│   │   │   │   │   ├── error.middleware.ts
│   │   │   │   │   └── upload.middleware.ts
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── dispatch.routes.ts
│   │   │   │   │   ├── task.routes.ts
│   │   │   │   │   └── invoice.routes.ts
│   │   │   │   └── controllers/
│   │   │   │       ├── AuthController.ts
│   │   │   │       ├── DispatchController.ts
│   │   │   │       ├── TaskController.ts
│   │   │   │       └── InvoiceController.ts
│   │   │   └── socket/
│   │   │       └── SocketHandlers.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── docker-compose.yml
│
├── FieldIQ_App/                    # React Native (Expo)
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── index.tsx           # Login Screen (10-digit code)
│   │   ├── (employee)/
│   │   │   ├── _layout.tsx
│   │   │   ├── map.tsx             # Map + Route View
│   │   │   ├── checkin.tsx         # Check-in Screen
│   │   │   └── invoice.tsx         # Invoice Capture Screen
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── CheckInButton.tsx
│   │   │   ├── RouteMap.tsx
│   │   │   ├── InvoiceCapture.tsx
│   │   │   └── LiveTracker.tsx
│   │   ├── database/               # WatermelonDB
│   │   │   ├── schema.ts
│   │   │   ├── models/
│   │   │   │   ├── LocalTask.ts
│   │   │   │   └── LocalInvoice.ts
│   │   │   └── database.ts
│   │   ├── hooks/
│   │   │   ├── useLocation.ts
│   │   │   ├── useCheckIn.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useSync.ts
│   │   ├── services/
│   │   │   ├── ApiService.ts
│   │   │   └── SyncService.ts
│   │   └── store/
│   │       └── useAppStore.ts      # Zustand
│   ├── assets/
│   ├── app.json
│   └── package.json
│
├── FieldIQ_FastApi/                # Python AI Microservice
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── domain/
│   │   │   └── schemas.py
│   │   ├── infrastructure/
│   │   │   └── messaging/
│   │   │       ├── rabbitmq_consumer.py
│   │   │       └── result_publisher.py
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   ├── anomaly_service.py
│   │   │   └── forecast_service.py
│   │   ├── workers/
│   │   │   └── invoice_worker.py
│   │   └── main.py
│   ├── models/                     # Persisted ML models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
└── FieldIQ_Dash/                   # React Web Admin
    ├── src/
    │   ├── components/
    │   │   ├── map/
    │   │   │   ├── DispatchMap.tsx
    │   │   │   └── LiveEmployeeMarker.tsx
    │   │   ├── charts/
    │   │   │   ├── CashFlowChart.tsx
    │   │   │   └── AnomalyScatterChart.tsx
    │   │   ├── panels/
    │   │   │   ├── NotificationsPanel.tsx
    │   │   │   └── EmployeeStatusPanel.tsx
    │   │   └── ui/
    │   │       ├── Sidebar.tsx
    │   │       ├── Header.tsx
    │   │       └── StatCard.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Dispatch.tsx
    │   │   └── Reports.tsx
    │   ├── hooks/
    │   │   ├── useSocket.ts
    │   │   └── useDispatch.ts
    │   ├── services/
    │   │   └── ApiService.ts
    │   ├── store/
    │   │   └── useAdminStore.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## Sprint Plan

| Day | Focus | Status |
|-----|-------|--------|
| 1 | Node.js API Gateway, Prisma Schema, TSP Algorithm, Socket.io | ✅ In Progress |
| 2 | React Native App, Maps, Live Tracking, Check-in, WatermelonDB | ⏳ Pending |
| 3 | Python FastAPI AI Engine, OCR, Anomaly Detection, Forecasting | ⏳ Pending |
| 4 | React Web Admin Dashboard, Live Map, ECharts Reports | ⏳ Pending |
