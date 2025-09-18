# ReMe Backend API

A Spring Boot REST API for the ReMe note-taking application with JWT authentication.

## Features

- User registration and authentication with JWT
- CRUD operations for notes
- PostgreSQL database integration
- Spring Security with JWT tokens
- Global exception handling
- Input validation

## Prerequisites

- Java 17 or higher
- PostgreSQL database
- Maven 3.6+

## Setup

1. **Environment Variables**
   - The application uses environment variables for configuration
   - Create a `.env.example` file in the project root as a template
   - Create a `.env` file in the project root with your actual values
   - Alternatively, you can directly configure values in `application.properties`
   
   Example `.env` file:
   ```properties
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=password
   JWT_SECRET=mySecretKey123456789012345678901234567890
   JWT_EXPIRATION=86400000
   ```
   
   **Configuration Classes:**
   - `EnvConfig`: Loads environment variables from `env.properties` file
   - `AppConfig`: Provides configuration values as beans for dependency injection

2. **Database Configuration**
   - Create a PostgreSQL database named `remedb`
   - Update database credentials in `application.properties` if needed:
     ```properties
     spring.datasource.url=jdbc:postgresql://localhost:5432/remedb
     spring.datasource.username=postgres
     spring.datasource.password=password
     ```

3. **Build and Run**
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

4. **Application will start on port 8081**

## API Endpoints

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "username": "john_doe",
    "email": "john@example.com"
  }
  ```

### Note Endpoints (Requires Authentication)

All note endpoints require the `Authorization` header with Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

#### Get All Notes
- **GET** `/api/notes`

#### Get Note by ID
- **GET** `/api/notes/{id}`

#### Create Note
- **POST** `/api/notes`
- **Body:**
  ```json
  {
    "title": "My Note Title",
    "content": "Note content here..."
  }
  ```

#### Update Note
- **PUT** `/api/notes/{id}`
- **Body:**
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content..."
  }
  ```

#### Delete Note
- **DELETE** `/api/notes/{id}`

#### Search Notes by Title
- **GET** `/api/notes/search?title=searchterm`

## Project Structure

```
src/main/java/com/ReMe/ReMe/
├── config/           # Configuration classes
│   ├── AppConfig.java        # Application configuration
│   ├── EnvConfig.java        # Environment variables configuration
│   └── SecurityConfig.java   # Security configuration
├── controller/       # REST controllers
├── dto/             # Data Transfer Objects
├── entity/          # JPA entities
├── exception/       # Global exception handling
├── repository/      # JPA repositories
├── service/         # Business logic services
└── util/            # Utility classes (JWT)
```

```
src/main/resources/
├── application.properties   # Main application properties
├── env.properties          # Environment-specific properties
└── ...                     # Other resource files
```

## Security

- Passwords are encrypted using BCrypt
- JWT tokens expire after 24 hours
- CORS is configured for frontend integration
- All note endpoints require authentication

## Error Handling

The API returns structured error responses:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed error message",
  "timestamp": "2025-09-16T12:10:00"
}
```

For validation errors:
```json
{
  "status": 400,
  "error": "Validation failed",
  "errors": {
    "username": "Username is required",
    "email": "Email should be valid"
  },
  "timestamp": "2025-09-16T12:10:00"
}
```
