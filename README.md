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
├── database/              # Database migrations and seeds
└── docs/                  # Documentation
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the variables with your configuration

4. Set up the database:
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm run dev
   ```

## API Documentation

API documentation is available at `/api/docs` when running the server.

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License. 