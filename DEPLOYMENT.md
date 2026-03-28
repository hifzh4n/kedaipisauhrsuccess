# VPS Deployment Guide

## Prerequisites
- Ubuntu/Debian-based VPS
- Root or sudo access
- SSH connection: `ssh root@188.166.184.11`

---

## Step 1: System Update & Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install required packages
apt install -y nginx php8.3 php8.3-fpm php8.3-mysql php8.3-bcmath \
  php8.3-ctype php8.3-json php8.3-mbstring php8.3-pdo php8.3-tokenizer \
  php8.3-xml php8.3-curl php8.3-zip php8.3-gd composer git mysql-server \
  nodejs npm curl wget nano
```

---

## Step 2: MySQL Database Setup

```bash
# Start MySQL service
systemctl start mysql
systemctl enable mysql

# Secure MySQL (optional but recommended)
mysql_secure_installation

# Create database and user
mysql -u root -p << EOF
CREATE DATABASE kedai_pisau_hr;
CREATE USER 'kedai_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON kedai_pisau_hr.* TO 'kedai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

** IMPORTANT: Replace `secure_password_here` with a strong password **

---

## Step 3: Deploy Laravel Application

```bash
# Create application directory
mkdir -p /var/www/kedaipisauhrsuccess
cd /var/www/kedaipisauhrsuccess

# Clone from GitHub
git clone https://github.com/hifzh4n/kedaipisauhrsuccess.git .

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Install Node dependencies
npm ci --production

# Set permissions
chown -R www-data:www-data /var/www/kedaipisauhrsuccess
chmod -R 755 /var/www/kedaipisauhrsuccess
chmod -R 775 /var/www/kedaipisauhrsuccess/storage
chmod -R 775 /var/www/kedaipisauhrsuccess/bootstrap/cache
```

---

## Step 4: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with database credentials
nano .env
```

**Update these values in .env:**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kedai_pisau_hr
DB_USERNAME=kedai_user
DB_PASSWORD=secure_password_here

APP_URL=http://188.166.184.11
APP_NAME="Kedai Pisau HR Success"
APP_ENV=production
APP_DEBUG=false
```

---

## Step 5: Run Database Migrations & Seed

```bash
cd /var/www/kedaipisauhrsuccess

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database (optional - adds default data)
php artisan db:seed --class=DatabaseSeeder
```

---

## Step 6: Configure Nginx

```bash
# Remove default Nginx config
rm /etc/nginx/sites-enabled/default

# Create new config for your app
cat > /etc/nginx/sites-available/kedaipisauhrsuccess << 'EOF'
server {
    listen 80;
    server_name 188.166.184.11;
    
    root /var/www/kedaipisauhrsuccess/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/kedaipisauhrsuccess /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart services
systemctl restart nginx
systemctl restart php8.3-fpm
```

---

## Step 7: Build Frontend Assets (if needed)

```bash
cd /var/www/kedaipisauhrsuccess

# Build production assets
npm run build
```

---

## Step 8: Verify Installation

```bash
# Check app is running
curl http://188.166.184.11

# Check Laravel status
cd /var/www/kedaipisauhrsuccess
php artisan about
```

---

## Additional: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot certonly --nginx -d 188.166.184.11

# Update Nginx config to use SSL
sudo certbot --nginx -d 188.166.184.11
```

---

## Useful Commands for Maintenance

```bash
# View application logs
tail -f /var/www/kedaipisauhrsuccess/storage/logs/laravel.log

# Restart services
systemctl restart nginx php8.3-fpm

# Check PHP-FPM status
systemctl status php8.3-fpm

# Check Nginx status
systemctl status nginx

# Clear Laravel cache
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

---

## Troubleshooting

### 502 Bad Gateway
- Check PHP-FPM: `systemctl status php8.3-fpm`
- Check Nginx error logs: `tail -f /var/log/nginx/error.log`

### Database Connection Error
- Verify MySQL is running: `systemctl status mysql`
- Check credentials in `.env` file
- Verify database exists: `mysql -u kedai_user -p -e "SHOW DATABASES;"`

### Permissions Issues
```bash
chown -R www-data:www-data /var/www/kedaipisauhrsuccess
chmod -R 755 /var/www/kedaipisauhrsuccess
chmod -R 775 /var/www/kedaipisauhrsuccess/storage
```

---

## Quick One-Liner Setup Script

Save the following as `deploy.sh` and run with `bash deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."
apt update && apt upgrade -y
apt install -y nginx php8.3 php8.3-fpm php8.3-mysql php8.3-bcmath php8.3-ctype php8.3-json php8.3-mbstring php8.3-pdo php8.3-tokenizer php8.3-xml php8.3-curl php8.3-zip php8.3-gd composer git mysql-server nodejs npm curl wget nano

systemctl start mysql && systemctl enable mysql

mkdir -p /var/www/kedaipisauhrsuccess
cd /var/www/kedaipisauhrsuccess

git clone https://github.com/hifzh4n/kedaipisauhrsuccess.git .
composer install --optimize-autoloader --no-dev
npm ci --production

cp .env.example .env
php artisan key:generate

chown -R www-data:www-data /var/www/kedaipisauhrsuccess
chmod -R 755 /var/www/kedaipisauhrsuccess
chmod -R 775 /var/www/kedaipisauhrsuccess/storage
chmod -R 775 /var/www/kedaipisauhrsuccess/bootstrap/cache

cat > /etc/nginx/sites-available/kedaipisauhrsuccess << 'NGINX'
server {
    listen 80;
    server_name 188.166.184.11;
    root /var/www/kedaipisauhrsuccess/public;
    index index.php;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/kedaipisauhrsuccess /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx && systemctl restart php8.3-fpm

echo "Deployment completed!"
echo "Visit: http://188.166.184.11"
```

---

## Next Steps

1. SSH into your VPS: `ssh root@188.166.184.11`
2. Follow the steps above in order
3. When prompted for `.env` database password, use a strong password
4. Access your app at: `http://188.166.184.11`
