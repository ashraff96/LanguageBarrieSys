# Quick Deployment Scripts

## 🚀 One-Click Vercel + Railway Deployment

### deploy-frontend.sh (Vercel)
```bash
#!/bin/bash
echo "🚀 Deploying DocuTranslate Frontend to Vercel..."

cd docutranslate-fe

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

echo "✅ Frontend deployment complete!"
echo "🔗 Remember to set VITE_API_URL in Vercel dashboard"
```

### deploy-backend.sh (Railway)
```bash
#!/bin/bash
echo "🚀 Deploying DocuTranslate Backend to Railway..."

cd docutranslate-be

# Install dependencies
echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev

# Clear and cache
echo "🧹 Optimizing Laravel..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

echo "✅ Backend deployment complete!"
echo "🔗 Remember to configure environment variables in Railway dashboard"
```

## 🐳 Docker Quick Start

### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./docutranslate-fe
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000/api
    depends_on:
      - backend

  backend:
    build:
      context: ./docutranslate-be
      dockerfile: Dockerfile
    ports:
      - "8000:80"
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - DB_CONNECTION=mysql
      - DB_HOST=mysql
      - DB_DATABASE=docutranslate
      - DB_USERNAME=root
      - DB_PASSWORD=password
    depends_on:
      - mysql
    volumes:
      - ./docutranslate-be/storage:/var/www/html/storage

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=docutranslate
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Frontend Dockerfile
```dockerfile
# docutranslate-fe/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

### Backend Dockerfile
```dockerfile
# docutranslate-be/Dockerfile
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY . .

# Install PHP dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy Apache configuration
COPY .docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
```

### Apache Configuration
```apache
# .docker/apache.conf
<VirtualHost *:80>
    DocumentRoot /var/www/html/public

    <Directory /var/www/html/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

## 🔧 Environment Configuration Templates

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_APP_NAME=DocuTranslate
VITE_APP_VERSION=1.0.0
```

### Backend (.env.production)
```env
APP_NAME=DocuTranslate
APP_ENV=production
APP_KEY=base64:your_generated_key_here
APP_DEBUG=false
APP_URL=https://your-backend-url.railway.app

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=your_db_host
DB_PORT=3306
DB_DATABASE=docutranslate
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# Google Translate API (Optional)
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.vercel.app
SESSION_DOMAIN=your-backend-domain.railway.app
```

## 🚀 Quick Commands

### Start with Docker
```bash
# Clone and start
git clone https://github.com/ashraff96/LanguageBarrieSys.git
cd LanguageBarrieSys
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Deploy to Cloud
```bash
# Vercel (Frontend)
cd docutranslate-fe
npx vercel --prod

# Railway (Backend)
cd docutranslate-be
npx @railway/cli up
```

### VPS Deployment
```bash
# Single command deployment
curl -sSL https://raw.githubusercontent.com/your-repo/deploy.sh | bash
```
