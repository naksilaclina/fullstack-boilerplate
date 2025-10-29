# API Service

This is the REST API service for the Stray Rugs user management system, built with Node.js and Express.

## Features

- User management endpoints (CRUD operations)
- MongoDB integration with Mongoose
- Input validation with express-validator
- Password hashing with bcrypt
- RESTful API design

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- bcrypt for password hashing
- express-validator for input validation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `example.env` to `.env` and configure the necessary variables.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. The API will be available at `http://localhost:3001`.

## API Endpoints

### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get a specific user
- `POST /api/v1/users` - Create a new user

## Project Structure

```
src/
├── api/
│   ├── middlewares/    # Express middlewares
│   ├── responses/      # Response formatting
│   ├── router/         # API routes
│   │   └── UsersRouter/  # User-related routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── bin/                # Executable scripts
├── config.ts           # Configuration
├── App.ts              # Main application class
```

## Database Models

### User

- firstName (string)
- lastName (string)
- email (string)
- password (string, hashed)
- isActive (boolean)
- role (string: "user" | "admin")