# DocuTranslate Backend API Documentation

## Overview
This document describes the API endpoints for the DocuTranslate backend system, which provides document translation services with user management and admin dashboard functionality.

## Base URL
```
http://localhost:8000/api
```

## Authentication
The API uses Laravel Sanctum for authentication. Most endpoints require a valid authentication token.

### Getting an Auth Token
```http
POST /api/login
Content-Type: application/json

{
    "email": "admin@docutranslate.com",
    "password": "password"
}
```

### Using the Token
Include the token in the Authorization header:
```http
Authorization: Bearer {your-token-here}
```

## Public Endpoints

### Health Check
```http
GET /api/health
```

### Get Supported Languages
```http
GET /api/languages
```

## Authentication Endpoints

### Login
```http
POST /api/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password"
}
```

### Logout
```http
POST /api/logout
Authorization: Bearer {token}
```

### Get Current User Info
```http
GET /api/me
Authorization: Bearer {token}
```

### Refresh Session
```http
POST /api/refresh
Authorization: Bearer {token}
```

## User Endpoints

### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer {token}
```

### Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "New Name",
    "email": "newemail@example.com",
    "current_password": "oldpassword",
    "new_password": "newpassword"
}
```

### Get User Translations
```http
GET /api/user/translations?status=completed&per_page=20
Authorization: Bearer {token}
```

### Get User Translation History
```http
GET /api/user/translation-history?action_type=translation&per_page=50
Authorization: Bearer {token}
```

## Translation Endpoints

### Create Translation
```http
POST /api/translations
Authorization: Bearer {token}
Content-Type: application/json

{
    "original_text": "Hello world",
    "translated_text": "Hola mundo",
    "source_language": "en",
    "target_language": "es",
    "file_name": "document.txt",
    "file_type": "txt",
    "file_size": 1024,
    "metadata": {
        "confidence": 0.95,
        "engine": "google"
    }
}
```

### Get Translation Details
```http
GET /api/translations/{id}
Authorization: Bearer {token}
```

### Update Translation
```http
PUT /api/translations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "translated_text": "Updated translation",
    "status": "completed"
}
```

### Delete Translation
```http
DELETE /api/translations/{id}
Authorization: Bearer {token}
```

### Get Translation Statistics
```http
GET /api/translations/stats?user_id=1
Authorization: Bearer {token}
```

### Get Translation History
```http
GET /api/translations/history?user_id=1&action_type=translation&per_page=50
Authorization: Bearer {token}
```

## Admin Endpoints (Admin Role Required)

### Dashboard Statistics
```http
GET /api/admin/dashboard-stats
Authorization: Bearer {token}
```

### Database Statistics
```http
GET /api/admin/database-stats
Authorization: Bearer {token}
```

### System Logs
```http
GET /api/admin/system-logs?level=error&category=system&per_page=50
Authorization: Bearer {token}
```

### System Performance
```http
GET /api/admin/system-performance
Authorization: Bearer {token}
```

### Get All Users
```http
GET /api/admin/users?role=admin&status=active&search=john&per_page=15
Authorization: Bearer {token}
```

### Get User Statistics
```http
GET /api/admin/users/stats
Authorization: Bearer {token}
```

### Create User
```http
POST /api/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "status": "active"
}
```

### Get User Details
```http
GET /api/admin/users/{id}
Authorization: Bearer {token}
```

### Update User
```http
PUT /api/admin/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "role": "translator"
}
```

### Update User Status
```http
PATCH /api/admin/users/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "suspended"
}
```

### Delete User
```http
DELETE /api/admin/users/{id}
Authorization: Bearer {token}
```

### Get All Translations (Admin)
```http
GET /api/admin/translations?status=completed&user_id=1&per_page=15
Authorization: Bearer {token}
```

## Query Parameters

### Pagination
- `per_page`: Number of items per page (default: 15 for users, 50 for logs/history)

### User Filters
- `role`: Filter by user role (admin, translator, user)
- `status`: Filter by user status (active, inactive, suspended)
- `search`: Search in name and email fields

### Translation Filters
- `status`: Filter by translation status (completed, processing, failed)
- `user_id`: Filter by user ID
- `source_language`: Filter by source language code
- `target_language`: Filter by target language code
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)

### System Log Filters
- `level`: Filter by log level (info, warning, error, debug)
- `category`: Filter by log category (system, user, translation, performance)
- `user_id`: Filter by user ID

## Response Format

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Optional success message"
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        // Validation errors (if applicable)
    }
}
```

### Paginated Response
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [
            // Items
        ],
        "first_page_url": "...",
        "from": 1,
        "last_page": 5,
        "last_page_url": "...",
        "next_page_url": "...",
        "path": "...",
        "per_page": 15,
        "prev_page_url": null,
        "to": 15,
        "total": 75
    }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `status` - Account status (active, inactive, suspended)
- `email_verified_at` - Email verification timestamp
- `remember_token` - Remember me token
- `created_at`, `updated_at` - Timestamps

### Roles Table
- `id` - Primary key
- `name` - Role name (admin, translator, user)
- `display_name` - Human-readable role name
- `description` - Role description
- `created_at`, `updated_at` - Timestamps

### User Roles Table (Pivot)
- `id` - Primary key
- `user_id` - Foreign key to users table
- `role_id` - Foreign key to roles table
- `created_at`, `updated_at` - Timestamps

### Translations Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `original_text` - Original text content
- `translated_text` - Translated text content
- `source_language` - Source language code
- `target_language` - Target language code
- `file_name` - Original file name
- `file_type` - File type
- `file_size` - File size in bytes
- `status` - Translation status (completed, processing, failed)
- `error_message` - Error message if failed
- `metadata` - JSON metadata
- `created_at`, `updated_at` - Timestamps

### Translation History Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `translation_id` - Foreign key to translations table
- `original_text` - Original text at time of action
- `translated_text` - Translated text at time of action
- `source_language` - Source language code
- `target_language` - Target language code
- `action_type` - Type of action (translation, edit, review)
- `metadata` - JSON metadata
- `created_at` - Timestamp

### Languages Table
- `id` - Primary key
- `code` - ISO language code
- `name` - Language name in English
- `native_name` - Language name in native language
- `is_active` - Whether language is active
- `priority` - Display priority
- `created_at`, `updated_at` - Timestamps

### System Logs Table
- `id` - Primary key
- `level` - Log level (info, warning, error, debug)
- `category` - Log category (system, user, translation, performance)
- `message` - Log message
- `context` - JSON context data
- `user_agent` - User agent string
- `ip_address` - IP address
- `user_id` - Foreign key to users table
- `created_at` - Timestamp

### User Sessions Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `session_id` - Session identifier
- `ip_address` - IP address
- `user_agent` - User agent string
- `last_activity` - Last activity timestamp
- `is_active` - Whether session is active
- `created_at`, `updated_at` - Timestamps

## Setup Instructions

1. Install dependencies:
   ```bash
   composer install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Generate application key:
   ```bash
   php artisan key:generate
   ```

4. Configure database in `.env` file

5. Run migrations:
   ```bash
   php artisan migrate
   ```

6. Seed the database:
   ```bash
   php artisan db:seed
   ```

7. Start the server:
   ```bash
   php artisan serve
   ```

## Default Admin User
After seeding, you can login with:
- Email: `admin@docutranslate.com`
- Password: `password`

## Notes

- All timestamps are in UTC
- File sizes are stored in bytes
- Language codes follow ISO 639-1 standard
- The API supports CORS for frontend integration
- Rate limiting is implemented for security
- All database queries are optimized with proper indexing 