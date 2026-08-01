# JMS Group - Backend Architecture

Clean, modular, and scalable Node.js, Express, and MongoDB backend boilerplate setup.

## Features
- **ES Modules (`import`/`export`)**: Modern JavaScript syntax.
- **Express.js**: Web server framework.
- **Mongoose**: MongoDB object modeling tool.
- **Security & Headers**: Helmet, CORS, and Express Rate Limiting configured.
- **Logging**: Morgan middleware for HTTP request logging.
- **Parsers**: Cookie Parser & Express JSON parser.
- **Central Error Handling**: Global error handling & 404 handler.
- **Health Check Route**: `GET /api/health`

## Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

## Folder Structure
```
JMS_Group_backend/
│
├── src/
│   ├── config/        # Database configuration
│   ├── controllers/   # Route controllers (future)
│   ├── models/        # Database schemas/models (future)
│   ├── routes/        # API routes (future)
│   ├── middleware/    # Custom middlewares (future)
│   ├── services/      # Business logic services (future)
│   ├── utils/         # Helper functions (future)
│   ├── validators/    # Input validation schemas (future)
│   ├── constants/     # Application constants (future)
│   ├── uploads/       # Storage directory for file uploads (future)
│   ├── app.js         # Express app setup & middleware configuration
│   └── server.js      # Server entrypoint & DB connection
│
├── .env.example
├── .env
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Running the Project
Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Health Check
- Endpoint: `GET http://localhost:5000/api/health`
- Response:
  ```json
  {
    "success": true,
    "message": "Backend Running Successfully"
  }
  ```
