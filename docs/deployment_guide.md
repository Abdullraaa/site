# Deployment Guide

This guide provides instructions for deploying the UN533N application (un533nstu.shop) to Hostinger VPS.

## Prerequisites

- A Hostinger VPS plan with root/sudo access
- Domain name configured (un533nstu.shop)
- Local Git installed for pushing code
- Basic knowledge of Linux command line

## 1. Configure Hostinger VPS

### 1.1 SSH Access
Connect to your Hostinger VPS via SSH:
```bash
ssh root@your-vps-ip
```

### 1.2 Install System Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install Git
sudo apt install -y git

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx web server
sudo apt install -y nginx

# Install MariaDB/MySQL
sudo apt install -y mariadb-server mariadb-client

# Secure MariaDB installation
sudo mysql_secure_installation
```

### 1.3 Configure MariaDB
```bash
# Login to MariaDB
sudo mysql -u root -p

# Create database and user
CREATE DATABASE un533n_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'un533n_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON un533n_db.* TO 'un533n_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2. Deploy the Application

### 2.1 Clone Repository
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
git clone https://github.com/Abdullraaa/site.git un533n
cd un533n
```

### 2.2 Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
nano .env
```

Update with your production values:
```env
DB_HOST=localhost
DB_USER=un533n_user
DB_PASSWORD=your_secure_password
DB_NAME=un533n_db
DB_PORT=3306

PORT=4000
NODE_ENV=production

WHATSAPP_NUMBER=your_whatsapp_number_with_country_code

ALLOWED_ORIGINS=https://un533nstu.shop
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env.local
nano .env.local
```

Update with your production values:
```env
NEXT_PUBLIC_API_BASE_URL=https://un533nstu.shop/api
NEXT_PUBLIC_SITE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_NAME=un533n
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number
```

### 2.3 Install Dependencies
```bash
# Install backend dependencies
cd /var/www/un533n/backend
npm install --production

# Install frontend dependencies
cd /var/www/un533n/frontend
npm install
```

### 2.4 Run Database Migrations
```bash
cd /var/www/un533n/backend
npm run migrate

# Verify migrations ran successfully
# Check the database for tables: orders, order_items, products, product_images, reviews
```

## 3. Build and Start Services

### 3.1 Build Frontend
```bash
cd /var/www/un533n/frontend
npm run build
```

### 3.2 Build Backend (TypeScript)
```bash
cd /var/www/un533n/backend
npx tsc
```

### 3.3 Start Services with PM2
```bash
# Start backend
cd /var/www/un533n/backend
pm2 start dist/server.js --name un533n-backend

# Start frontend
cd /var/www/un533n/frontend
pm2 start npm --name un533n-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions from the output command
```

### 3.4 Monitor Services
```bash
# Check status
pm2 status

# View logs
pm2 logs un533n-backend
pm2 logs un533n-frontend

# Restart services
pm2 restart un533n-backend
pm2 restart un533n-frontend
```

## 4. Configure Nginx Reverse Proxy

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/un533n
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name un533nstu.shop www.un533nstu.shop;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS handled by backend
    }

    # Static files cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4.2 Enable Site and Test
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/un533n /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 5. SSL Certificate Setup (Let's Encrypt)

### 5.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate
```bash
# Get certificate for un533nstu.shop and www.un533nstu.shop
sudo certbot --nginx -d un533nstu.shop -d www.un533nstu.shop

# Follow the prompts:
# - Enter your email address
# - Agree to Terms of Service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 5.3 Auto-renewal
Certbot automatically sets up auto-renewal. Test it:
```bash
sudo certbot renew --dry-run
```

### 5.4 Verify SSL
After setup, Nginx config will be automatically updated with SSL. Visit:
- https://un533nstu.shop (should show secure padlock)

## 6. Final Steps & Verification

### 6.1 DNS Configuration
In your domain registrar (e.g., Hostinger panel):
- Add **A Record**: `@` → Your VPS IP address
- Add **A Record**: `www` → Your VPS IP address
- Wait for DNS propagation (up to 48 hours, usually much faster)

### 6.2 Firewall Configuration
```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 6.3 Test Application
```bash
# Check backend health
curl http://localhost:4000/api/health

# Check products endpoint
curl http://localhost:4000/api/products

# Check frontend
curl http://localhost:3000
```

Visit your site:
- https://un533nstu.shop
- Test WhatsApp checkout functionality
- Verify all images load correctly
- Check mobile responsiveness

### 6.4 Monitoring & Maintenance
```bash
# PM2 monitoring
pm2 monit

# View application logs
pm2 logs

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## 7. Deployment Updates

### 7.1 Pull Latest Changes
```bash
cd /var/www/un533n
git pull origin main
```

### 7.2 Update Backend
```bash
cd backend
npm install --production
npx tsc
pm2 restart un533n-backend
```

### 7.3 Update Frontend
```bash
cd ../frontend
npm install
npm run build
pm2 restart un533n-frontend
```

### 7.4 Database Migrations
```bash
cd /var/www/un533n/backend
npm run migrate
```

## 8. Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs un533n-backend --lines 50
pm2 logs un533n-frontend --lines 50

# Verify environment variables
cat backend/.env
cat frontend/.env.local
```

### Database Connection Issues
```bash
# Test database connection
mysql -u un533n_user -p un533n_db

# Check MariaDB status
sudo systemctl status mariadb
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Port Already in Use
```bash
# Find process using port 4000
sudo lsof -i :4000

# Kill process
sudo kill -9 <PID>
```

## 9. Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong database passwords**

3. **Enable firewall (UFW)**

4. **Regular backups:**
   ```bash
   # Backup database
   mysqldump -u un533n_user -p un533n_db > backup_$(date +%Y%m%d).sql
   ```

5. **Monitor logs regularly:**
   ```bash
   pm2 logs
   sudo tail -f /var/log/nginx/error.log
   ```

6. **Set up automated backups** via cron jobs

7. **Keep Node.js and npm updated**

---

## Quick Reference Commands

```bash
# Restart all services
pm2 restart all

# Reload Nginx
sudo systemctl reload nginx

# View all PM2 processes
pm2 list

# Stop services
pm2 stop un533n-backend
pm2 stop un533n-frontend

# Database backup
mysqldump -u un533n_user -p un533n_db > backup.sql

# Restore database
mysql -u un533n_user -p un533n_db < backup.sql
```