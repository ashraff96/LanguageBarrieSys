# DocuTranslate Deployment Guide

## 🚀 Quick Deployment (Recommended)

### Frontend Deployment (Vercel)

#### 1. Prepare Frontend for Production
```bash
cd docutranslate-fe

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Configure environment variables in Vercel dashboard:
# VITE_API_URL=https://your-backend-url.railway.app
```

### Backend Deployment (Railway)

#### 1. Prepare Laravel Backend
```bash
cd docutranslate-be

# Install dependencies
composer install --optimize-autoloader --no-dev

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 2. Deploy to Railway
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard:
# APP_ENV=production
# APP_DEBUG=false
# APP_URL=https://your-app.railway.app
# DB_CONNECTION=mysql
# (Railway will provide database credentials)
```

## 🛠️ Alternative: VPS Deployment

### Prerequisites
- VPS with Ubuntu 22.04
- Domain name (optional)
- Basic Linux knowledge

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install LAMP stack
sudo apt install apache2 mysql-server php8.2 php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-gd php8.2-zip -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2. Deploy Application
```bash
# Clone repository
cd /var/www/html
sudo git clone https://github.com/ashraff96/LanguageBarrieSys.git docutranslate
cd docutranslate

# Setup backend
cd docutranslate-be
sudo composer install --optimize-autoloader --no-dev
sudo cp .env.example .env
sudo php artisan key:generate

# Setup frontend
cd ../docutranslate-fe
sudo npm install
sudo npm run build

# Configure Apache virtual host
sudo nano /etc/apache2/sites-available/docutranslate.conf
```

### 3. Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/docutranslate/docutranslate-fe/dist
    
    # API routes
    Alias /api /var/www/html/docutranslate/docutranslate-be/public
    
    <Directory /var/www/html/docutranslate/docutranslate-fe/dist>
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    <Directory /var/www/html/docutranslate/docutranslate-be/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 4. Database Setup
```bash
# Configure MySQL
sudo mysql_secure_installation

# Create database
sudo mysql -u root -p
CREATE DATABASE docutranslate;
CREATE USER 'docutranslate'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON docutranslate.* TO 'docutranslate'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update .env file
sudo nano docutranslate-be/.env
```

### 5. Environment Configuration
```env
# docutranslate-be/.env
APP_NAME="DocuTranslate"
APP_ENV=production
APP_KEY=base64:your_generated_key
APP_DEBUG=false
APP_URL=http://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=docutranslate
DB_USERNAME=docutranslate
DB_PASSWORD=your_password

# Google Translate API (if using)
GOOGLE_TRANSLATE_API_KEY=your_api_key
```

## 🔒 Security & SSL

### 1. Install Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d your-domain.com
```

### 2. Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw enable
```

## 📊 Performance Optimization

### 1. Enable Compression
```apache
# Add to Apache config
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>
```

### 2. Laravel Optimizations
```bash
# Production optimizations
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Set proper permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## 🐳 Docker Deployment (Advanced)

### 1. Create Dockerfiles
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```dockerfile
# Backend Dockerfile
FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html/storage
```

### 2. Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./docutranslate-fe
    ports:
      - "3000:3000"
  
  backend:
    build: ./docutranslate-be
    ports:
      - "8000:80"
    environment:
      - DB_HOST=mysql
  
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: docutranslate
      MYSQL_ROOT_PASSWORD: password
```

## 🔍 Monitoring & Maintenance

### 1. Setup Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup log rotation
sudo nano /etc/logrotate.d/docutranslate
```

### 2. Backup Strategy
```bash
# Database backup script
#!/bin/bash
mysqldump -u docutranslate -p docutranslate > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/html/docutranslate
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Test application locally
- [ ] Configure environment variables
- [ ] Setup database migrations
- [ ] Configure API endpoints
- [ ] Test translation functionality

### Deployment
- [ ] Choose hosting provider
- [ ] Setup domain (if applicable)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configure SSL certificate
- [ ] Test production deployment

### Post-deployment
- [ ] Monitor application performance
- [ ] Setup backup strategy
- [ ] Configure monitoring
- [ ] Document maintenance procedures
- [ ] Plan update strategy

## 📞 Support

For hosting issues:
1. Check server logs: `sudo tail -f /var/log/apache2/error.log`
2. Check Laravel logs: `tail -f storage/logs/laravel.log`
3. Test API endpoints: `curl http://your-domain.com/api/health`
4. Monitor resource usage: `htop`

Remember to keep your API keys secure and never commit them to version control!
