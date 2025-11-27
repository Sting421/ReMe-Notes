# ReMe - Remember Me Notes Application

## Overview

ReMe (Remember Me) is a modern note-taking application built with a Spring Boot backend and React frontend. It provides users with a secure and intuitive platform to create, manage, and organize their notes. The application features user authentication, real-time note editing, and a responsive design for seamless use across devices.

## Features

- **User Authentication**: Secure signup and login functionality with JWT token-based authentication
- **Note Management**: Create, read, update, and delete notes
- **Real-time Search**: Instantly search through notes by title or content
- **Responsive Design**: Modern UI that works across desktop and mobile devices
- **Auto-save Indicator**: Visual feedback for unsaved changes
- **Secure API**: RESTful API with proper authentication and authorization

## Tech Stack

### Backend

- **Framework**: Spring Boot 3.5.5
- **Language**: Java 17
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT authentication
- **ORM**: Spring Data JPA
- **Validation**: Jakarta Bean Validation
- **Environment Variables**: spring-dotenv

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router Dom
- **UI Components**: Shadcn UI (based on Radix UI)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Project Structure

### Backend

```
Backend/
├── src/main/java/com/ReMe/ReMe/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST API controllers
│   ├── dto/             # Data Transfer Objects
│   ├── entity/          # JPA entity classes
│   ├── exception/       # Custom exceptions
│   ├── repository/      # Spring Data repositories
│   ├── service/         # Business logic
│   ├── util/            # Utility classes
│   └── ReMeApplication.java  # Main application class
└── src/main/resources/
    └── application.properties  # Application configuration
```

### Frontend

```
Frontend/
├── public/             # Static assets
└── src/
    ├── components/     # Reusable UI components
    │   └── ui/         # Shadcn UI components
    ├── contexts/       # React contexts
    ├── hooks/          # Custom React hooks
    ├── lib/            # Utilities and API clients
    ├── pages/          # Application pages
    └── App.tsx         # Main application component
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL database

### Backend Setup

1. Clone the repository
2. Navigate to the Backend directory
3. Create a `.env` file in the project root with the following variables:
   ```
   DB_URL=jdbc:postgresql://localhost:5432/reme_db
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=86400000
   ```
4. Run the application:
   ```
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. Navigate to the Frontend directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/validate` - Validate JWT token
- `POST /api/auth/refresh` - Refresh JWT token

### Notes

- `GET /api/notes` - Get all notes for current user
- `GET /api/notes/{id}` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/{id}` - Update an existing note
- `DELETE /api/notes/{id}` - Delete a note
- `GET /api/notes/search?title={query}` - Search notes by title

## Security

The application implements the following security measures:

- Password encryption using BCrypt
- JWT token-based authentication
- Protected API endpoints with Spring Security
- CORS configuration for frontend access
- Input validation to prevent injection attacks

## Future Enhancements

- Note categories and tags
- Rich text editor with formatting options
- File attachments
- Collaborative editing
- Dark/light theme toggle
- Mobile applications

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- Ben David Cadayona
- Jiv Tuban
- Aldrin John Vitorillo

---

© 2025 ReMe Notes Application
