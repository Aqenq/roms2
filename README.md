# Restaurant Order Management System (ROMS)

A comprehensive restaurant management system that streamlines operations through digital automation of table management, order processing, kitchen workflows, and payment systems.

## Features

- Digital menu management
- Real-time order tracking
- Table management
- Kitchen order management
- Payment processing
- Staff management
- Inventory tracking
- Customer feedback system

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT
- Real-time updates: Socket.IO

## Project Structure

```
roms/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js application
└── docs/                  # Documentation
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/Aqenq/roms2.git
   cd roms2
   ```

2. Set up the database:
   ```bash
   # Create a PostgreSQL database named 'roms'
   createdb roms
   ```

3. Set up environment variables:

   Create `.env` file in the server directory:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=roms
   DB_USER=postgres
   DB_PASSWORD=postgres

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # Client URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

   Create `.env` file in the client directory:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_SOCKET_URL=http://localhost:3000
   ```

4. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

5. Initialize the database:
   ```bash
   cd server
   # Run the database initialization script
   psql -d roms -f src/db/init.sql
   ```

6. Start the development servers:
   ```bash
   # Start backend server (in server directory)
   npm run dev

   # Start frontend server (in client directory)
   cd ../client
   npm run dev
   ```

7. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Default Login Credentials

- Admin:
  - Email: admin@roms.com
  - Password: admin123

- Waiter:
  - Email: waiter@roms.com
  - Password: waiter123

## Troubleshooting

1. If you get database connection errors:
   - Make sure PostgreSQL is running
   - Check if the database credentials in `.env` match your PostgreSQL setup
   - Verify the database 'roms' exists

2. If you get CORS errors:
   - Make sure both frontend and backend servers are running
   - Check if the CLIENT_URL in server's `.env` matches your frontend URL

3. If you get socket connection errors:
   - Verify the VITE_SOCKET_URL in client's `.env` matches your backend URL

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License. 