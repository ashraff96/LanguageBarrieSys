#!/bin/bash

# DocuTranslate VPS Deployment Script
# Usage: curl -sSL https://raw.githubusercontent.com/ashraff96/LanguageBarrieSys/master/deploy.sh | bash

set -e

echo "🚀 DocuTranslate VPS Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get user input
read -p "Enter your domain name (or press Enter for IP access): " DOMAIN_NAME
read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
echo
read -p "Enter application database password: " -s APP_DB_PASSWORD
echo

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing LAMP stack and dependencies..."
sudo apt install -y apache2 mysql-server php8.2 php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-gd php8.2-zip php8.2-intl unzip git curl

# Install Node.js 18
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer
print_status "Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Secure MySQL installation
print_status "Configuring MySQL..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS test;"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "FLUSH PRIVILEGES;"

# Create application database
print_status "Creating application database..."
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE docutranslate;"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE USER 'docutranslate'@'localhost' IDENTIFIED BY '${APP_DB_PASSWORD}';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "GRANT ALL PRIVILEGES ON docutranslate.* TO 'docutranslate'@'localhost';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "FLUSH PRIVILEGES;"

# Clone repository
print_status "Cloning DocuTranslate repository..."
cd /var/www/html
sudo rm -rf html
sudo git clone https://github.com/ashraff96/LanguageBarrieSys.git docutranslate
sudo chown -R $USER:$USER /var/www/html/docutranslate
cd docutranslate

# Setup backend
print_status "Setting up Laravel backend..."
cd docutranslate-be
composer install --optimize-autoloader --no-dev

# Configure environment
cp .env.example .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${APP_DB_PASSWORD}/" .env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=docutranslate/" .env
sed -i "s/APP_ENV=.*/APP_ENV=production/" .env
sed -i "s/APP_DEBUG=.*/APP_DEBUG=false/" .env

if [ ! -z "$DOMAIN_NAME" ]; then
    sed -i "s#APP_URL=.*#APP_URL=https://${DOMAIN_NAME}#" .env
fi

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Setup frontend
print_status "Setting up React frontend..."
cd ../docutranslate-fe
npm install
npm run build

# Configure Apache
print_status "Configuring Apache..."
sudo tee /etc/apache2/sites-available/docutranslate.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName ${DOMAIN_NAME:-_}
    DocumentRoot /var/www/html/docutranslate/docutranslate-fe/dist
    
    # API routes to Laravel backend
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
    
    ErrorLog \${APACHE_LOG_DIR}/docutranslate_error.log
    CustomLog \${APACHE_LOG_DIR}/docutranslate_access.log combined
</VirtualHost>
EOF

# Enable site and modules
sudo a2enmod rewrite
sudo a2dissite 000-default
sudo a2ensite docutranslate
sudo systemctl reload apache2

# Set proper permissions
print_status "Setting file permissions..."
cd /var/www/html/docutranslate
sudo chown -R www-data:www-data docutranslate-be/storage docutranslate-be/bootstrap/cache
sudo chmod -R 775 docutranslate-be/storage docutranslate-be/bootstrap/cache

# Optimize Laravel
print_status "Optimizing Laravel application..."
cd docutranslate-be
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
echo "y" | sudo ufw enable

# Install SSL if domain provided
if [ ! -z "$DOMAIN_NAME" ]; then
    print_status "Installing SSL certificate..."
    sudo apt install -y certbot python3-certbot-apache
    sudo certbot --apache --non-interactive --agree-tos --email admin@${DOMAIN_NAME} -d ${DOMAIN_NAME}
fi

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/docutranslate-backup.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/docutranslate"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Database backup
mysqldump -u docutranslate -p${APP_DB_PASSWORD} docutranslate > \$BACKUP_DIR/database_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/application_\$DATE.tar.gz -C /var/www/html docutranslate

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/docutranslate-backup.sh

# Setup daily backup cron
echo "0 2 * * * root /usr/local/bin/docutranslate-backup.sh" | sudo tee -a /etc/crontab

# Display completion message
print_status "Deployment completed successfully!"
echo
echo "🎉 DocuTranslate is now installed and running!"
echo
echo "📊 Application Details:"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "   🌐 URL: https://${DOMAIN_NAME}"
else
    SERVER_IP=$(curl -s ifconfig.me)
    echo "   🌐 URL: http://${SERVER_IP}"
fi
echo "   📁 Path: /var/www/html/docutranslate"
echo "   🗄️  Database: docutranslate"
echo
echo "🔧 Management Commands:"
echo "   View logs: sudo tail -f /var/log/apache2/docutranslate_error.log"
echo "   Restart Apache: sudo systemctl restart apache2"
echo "   Run backup: sudo /usr/local/bin/docutranslate-backup.sh"
echo
echo "🛡️  Security Notes:"
echo "   - Firewall is enabled (SSH and HTTP/HTTPS only)"
echo "   - Database is secured with custom password"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "   - SSL certificate installed and auto-renewal enabled"
fi
echo
print_warning "Important: Save your database password: ${APP_DB_PASSWORD}"
print_warning "Update your API endpoints in the frontend if needed"
echo
print_status "Happy translating! 🌍"
