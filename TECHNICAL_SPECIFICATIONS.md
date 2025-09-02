# DocuTranslate Technical Specifications
## Detailed System Documentation

---

## 🏗️ **SYSTEM ARCHITECTURE DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Port 8082)                                │
│  ├── Document Translator                                   │
│  ├── Voice Translator                                      │
│  ├── Admin Dashboard                                       │
│  ├── Language Practice                                     │
│  └── Rajabasha Module                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Laravel Backend (Port 8000)                               │
│  ├── Authentication (Sanctum)                              │
│  ├── RESTful API Endpoints                                 │
│  ├── File Processing                                       │
│  ├── Translation Services                                  │
│  └── Admin Management                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                   │
├─────────────────────────────────────────────────────────────┤
│  Database (SQLite/MySQL)                                   │
│  ├── Users & Roles                                         │
│  ├── Translations & History                                │
│  ├── Files & Documents                                     │
│  ├── Practice Data                                         │
│  └── System Logs                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 **FRONTEND TECHNICAL DETAILS**

### **Application Structure**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN/UI components
│   ├── AdminSidebar.tsx
│   └── Navigation.tsx
├── pages/              # Route components
│   ├── Admin.tsx       # Admin dashboard
│   ├── DocumentTranslator.tsx
│   ├── VoiceTranslator.tsx
│   ├── LanguagePractice.tsx
│   └── Rajabasha.tsx
├── lib/                # Utilities and services
│   ├── theme.ts        # Blue theme system
│   └── services/       # API services
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── styles/             # Global styles
```

### **Key Frontend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | Core framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Styling framework |
| Radix UI | Latest | Accessible components |
| PDF.js | Latest | PDF processing |
| Lucide React | Latest | Icon library |

### **State Management**
- **React Context API** - Global state management
- **React Hooks** - Local component state
- **Custom Hooks** - Reusable logic
- **Form Handling** - React Hook Form + Zod validation

---

## 🖥️ **BACKEND TECHNICAL DETAILS**

### **Application Structure**
```
app/
├── Http/
│   ├── Controllers/     # API endpoints
│   │   ├── AdminController.php
│   │   ├── AuthController.php
│   │   ├── TranslationController.php
│   │   ├── UserController.php
│   │   ├── VoiceController.php
│   │   ├── PracticeController.php
│   │   └── RajabashaController.php
│   └── Middleware/      # Custom middleware
├── Models/              # Eloquent models
│   ├── User.php
│   ├── Translation.php
│   ├── File.php
│   └── Role.php
├── Services/            # Business logic
└── Providers/           # Service providers
```

### **API Endpoints Overview**

| Endpoint Category | Base Route | Authentication |
|------------------|------------|----------------|
| Authentication | `/api/auth/*` | Public/Protected |
| User Management | `/api/user/*` | Protected |
| Document Translation | `/api/translate/*` | Protected |
| Voice Processing | `/api/voice/*` | Protected |
| Admin Functions | `/api/admin/*` | Admin Only |
| Language Practice | `/api/practice/*` | Protected |
| Rajabasha | `/api/rajabasha/*` | Protected |

### **Database Schema**

```sql
-- Core Tables
├── users (id, name, email, password, created_at, updated_at)
├── roles (id, name, description)
├── user_roles (user_id, role_id)
├── translations (id, user_id, source_text, translated_text, 
│                 source_lang, target_lang, created_at)
├── translation_history (id, user_id, translation_id, action, created_at)
├── files (id, user_id, filename, path, size, type, created_at)
├── languages (id, code, name, native_name, active)
├── system_logs (id, user_id, action, details, ip_address, created_at)
├── user_sessions (id, user_id, token, expires_at, created_at)
├── practice_questions (id, question, answer, difficulty, language)
├── practice_attempts (id, user_id, question_id, answer, correct, created_at)
└── rajabasha_papers (id, title, content, type, status, created_at)
```

---

## 🎨 **THEME SYSTEM SPECIFICATION**

### **Blue Theme Configuration**
```typescript
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',    // Lightest blue
      500: '#3b82f6',   // Primary blue
      900: '#1e3a8a',   // Darkest blue
      950: '#172554'    // Navy blue
    }
  },
  
  gradients: {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    page: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
    card: 'bg-gradient-to-br from-white to-blue-50'
  },
  
  components: {
    card: 'bg-white/80 backdrop-blur-sm border border-blue-200',
    button: {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      outline: 'border-blue-300 text-blue-700'
    }
  }
}
```

### **Component Styling Standards**
- **Cards:** Glass-morphism with backdrop blur
- **Buttons:** Gradient backgrounds with hover effects
- **Forms:** Blue focus states and validation
- **Navigation:** Consistent blue accent colors
- **Icons:** Blue color scheme integration

---

## 🔐 **SECURITY IMPLEMENTATION**

### **Authentication Flow**
```
1. User Login → Credentials Validation
2. Token Generation → Laravel Sanctum
3. Token Storage → Secure HTTP-only cookies
4. API Requests → Bearer token validation
5. Token Refresh → Automatic renewal
6. Logout → Token revocation
```

### **Security Features**
- **CSRF Protection** - Laravel built-in
- **SQL Injection Prevention** - Eloquent ORM
- **XSS Protection** - Input sanitization
- **File Upload Security** - Type and size validation
- **Rate Limiting** - API throttling
- **Password Hashing** - bcrypt encryption

### **Role-Based Access Control**
```php
// Middleware Implementation
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/translate', [TranslationController::class, 'translate']);
    Route::get('/user/profile', [UserController::class, 'profile']);
});
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Frontend Optimizations**
- **Code Splitting** - Lazy loading routes
- **Tree Shaking** - Unused code elimination
- **Asset Optimization** - Image and font compression
- **Caching Strategy** - Browser caching headers
- **Bundle Analysis** - Regular size monitoring

### **Backend Optimizations**
- **Database Indexing** - Optimized query performance
- **Eloquent Optimization** - Eager loading relationships
- **Caching** - Redis/Memcached ready
- **Queue System** - Background job processing
- **API Response Caching** - Faster repeated requests

### **Performance Metrics**
```javascript
// Target Performance Goals
{
  "firstContentfulPaint": "< 1.5s",
  "largestContentfulPaint": "< 2.5s",
  "cumulativeLayoutShift": "< 0.1",
  "firstInputDelay": "< 100ms",
  "apiResponseTime": "< 500ms",
  "databaseQueryTime": "< 100ms"
}
```

---

## 🌐 **DEPLOYMENT SPECIFICATIONS**

### **Development Environment**
```yaml
Frontend:
  - Node.js: 18+
  - npm: 9+
  - Development Server: http://localhost:8082
  - Hot Module Replacement: Enabled

Backend:
  - PHP: 8.2+
  - Composer: 2.0+
  - Development Server: http://localhost:8000
  - Database: SQLite (file-based)
```

### **Production Requirements**
```yaml
Server Specifications:
  - CPU: 2+ cores
  - RAM: 4GB minimum, 8GB recommended
  - Storage: 20GB SSD
  - PHP: 8.2+ with required extensions
  - Web Server: Nginx/Apache
  - Database: MySQL 8.0+ or PostgreSQL 13+
  - SSL Certificate: Required
```

### **Environment Variables**
```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME="DocuTranslate"

# Backend (.env)
APP_NAME="DocuTranslate API"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.docutranslate.com
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=docutranslate
DB_USERNAME=username
DB_PASSWORD=password
```

---

## 🧪 **TESTING STRATEGY**

### **Frontend Testing**
- **Unit Tests** - Component testing with Vitest
- **Integration Tests** - API integration testing
- **E2E Tests** - Playwright/Cypress
- **Visual Testing** - Storybook integration
- **Accessibility Testing** - axe-core integration

### **Backend Testing**
- **Unit Tests** - PHPUnit for individual functions
- **Feature Tests** - API endpoint testing
- **Integration Tests** - Database interactions
- **Performance Tests** - Load testing
- **Security Tests** - Vulnerability scanning

### **Testing Commands**
```bash
# Frontend Testing
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report

# Backend Testing
php artisan test         # All tests
php artisan test --coverage  # Coverage report
```

---

## 📈 **MONITORING & ANALYTICS**

### **Application Monitoring**
- **Error Tracking** - Real-time error reporting
- **Performance Monitoring** - Response time tracking
- **User Analytics** - Usage patterns and metrics
- **System Health** - Server resource monitoring
- **API Monitoring** - Endpoint performance tracking

### **Logging Strategy**
```php
// Laravel Logging Configuration
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['single', 'slack'],
    ],
    'single' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => 'debug',
    ],
]
```

---

## 🔄 **CI/CD PIPELINE**

### **Automated Deployment**
```yaml
# GitHub Actions Workflow
name: Deploy DocuTranslate
on:
  push:
    branches: [main]
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Frontend Tests
        run: npm test
      - name: Run Backend Tests
        run: php artisan test
        
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          npm run build
          php artisan optimize
          # Deploy commands
```

### **Deployment Checklist**
- ✅ Environment variables configured
- ✅ Database migrations run
- ✅ Assets compiled and optimized
- ✅ SSL certificates installed
- ✅ Backup systems in place
- ✅ Monitoring tools configured

---

## 📚 **API DOCUMENTATION**

### **Core Endpoints**

#### Authentication
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

#### Document Translation
```http
POST /api/translate/document
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [PDF/DOC file]
source_language: "auto"
target_language: "si"

Response:
{
  "id": 123,
  "source_text": "Hello world",
  "translated_text": "හෙලෝ වර්ල්ඩ්",
  "source_language": "en",
  "target_language": "si"
}
```

#### Voice Translation
```http
POST /api/voice/transcribe-translate
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [Audio file]
target_language: "en"

Response:
{
  "transcript": "මම ඔබට ආදරෙයි",
  "translation": "I love you",
  "confidence": 0.95
}
```

---

This comprehensive technical documentation provides all the details your supervisor needs to understand the full scope, capabilities, and technical excellence of the DocuTranslate Language Barrier System. The system is production-ready and represents a significant advancement in Sri Lankan language translation technology.
