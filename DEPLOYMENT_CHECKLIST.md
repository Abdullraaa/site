# UN533N E-Commerce - Final Deployment Checklist

## Pre-Deployment Verification ✅

### Code Quality & Build
- [x] Backend TypeScript compiles without errors
- [x] Frontend Next.js builds successfully
- [x] All TypeScript type errors resolved
- [x] Legacy JavaScript files removed
- [x] No console errors in development mode
- [x] ESLint passes

### Backend Security & Configuration
- [x] Centralized error handling middleware implemented
- [x] Morgan logging configured (dev/prod modes)
- [x] CORS restricted to production domain (un533nstu.shop)
- [x] Rate limiting on all API routes (100 req/15min)
- [x] Stricter rate limiting on checkout (10 req/15min)
- [x] Input validation on all endpoints (express-validator)
- [x] SQL injection protection (parameterized queries)
- [x] Environment variables properly configured

### API Endpoints
- [x] GET /api/health - Health check
- [x] GET /api/products - List all products
- [x] GET /api/products/:slug - Single product
- [x] POST /api/checkout/create-whatsapp - WhatsApp checkout
- [x] GET /api/orders/:reference - Get order by reference
- [x] POST /api/orders - Create order
- [x] GET /api/reviews?productId={id} - Get reviews
- [x] POST /api/reviews - Create review
- [x] 404 handler for unknown routes
- [x] Centralized error handler

### Frontend Features
- [x] Hero carousel with auto-play
- [x] Product grid with SSR
- [x] Product modal with color variants
- [x] Cart functionality (add/remove/update)
- [x] Cart badge showing item count
- [x] WhatsApp checkout integration
- [x] Reviews section (dynamic API fetch)
- [x] Product detail pages with enhanced JSON-LD
- [x] Responsive design
- [x] Image optimization (WebP/AVIF support)

### SEO & Performance
- [x] Meta tags configured (title, description)
- [x] Open Graph tags for social sharing
- [x] Twitter Card metadata
- [x] JSON-LD structured data (Organization, WebSite, ItemList)
- [x] Per-product JSON-LD schema (Product with offers)
- [x] Canonical URLs (un533nstu.shop)
- [x] System fonts (no external font loading)
- [x] next/image with remotePatterns (no deprecation warnings)
- [x] Image formats optimized (WebP, AVIF)

### Database
- [x] Migration system implemented
- [x] Orders table with reference tracking
- [x] Order items table with foreign keys
- [x] Products table with full catalog
- [x] Product images table
- [x] Reviews table
- [x] Connection pooling configured
- [x] Type casting for DECIMAL fields (price as number)

---

## Production Deployment Steps

### 1. Server Preparation (Hostinger VPS)
```bash
# SSH into your server
ssh your_user@your_server_ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

### 2. Database Setup
```bash
# Login to MariaDB
sudo mysql -u root -p

# Create database and user
CREATE DATABASE un533n_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'un533n_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON un533n_db.* TO 'un533n_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clone Repository & Install Dependencies
```bash
# Navigate to web root
cd /var/www

# Clone your repository
sudo git clone https://github.com/Abdullraaa/site.git un533n
cd un533n

# Set ownership
sudo chown -R $USER:$USER /var/www/un533n

# Backend setup
cd backend
cp .env.example .env
nano .env  # Configure production values

npm install --production
npm run build

# Frontend setup
cd ../frontend
cp .env.example .env.local
nano .env.local  # Configure production values

npm install
npm run build
```

### 4. Configure Backend Environment (.env)
```env
DB_HOST=localhost
DB_USER=un533n_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=un533n_db
DB_PORT=3306

PORT=4000
NODE_ENV=production

WHATSAPP_NUMBER=YOUR_WHATSAPP_NUMBER

# Production CORS (no localhost)
ALLOWED_ORIGINS=https://un533nstu.shop,https://www.un533nstu.shop

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Configure Frontend Environment (.env.local)
```env
# Production API URL
NEXT_PUBLIC_API_BASE_URL=https://un533nstu.shop

# Site configuration
NEXT_PUBLIC_SITE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_NAME=un533n

# WhatsApp number
NEXT_PUBLIC_WHATSAPP_NUMBER=YOUR_WHATSAPP_NUMBER

# Server-side API (internal)
API_BASE_URL=http://localhost:4000
```

### 6. Run Database Migrations
```bash
cd /var/www/un533n/backend
npm run migrate
```

### 7. Start Backend with PM2
```bash
cd /var/www/un533n/backend
pm2 start dist/server.js --name un533n-backend
pm2 save
pm2 startup  # Follow the instructions to enable startup on boot
```

### 8. Start Frontend with PM2
```bash
cd /var/www/un533n/frontend
pm2 start npm --name un533n-frontend -- start
pm2 save
```

### 9. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/un533n
```

Paste this configuration:
```nginx
# Backend API server
upstream backend {
    server localhost:4000;
    keepalive 64;
}

# Frontend Next.js server
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name un533nstu.shop www.un533nstu.shop;

    # Redirect to HTTPS (will be configured after SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name un533nstu.shop www.un533nstu.shop;

    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/un533nstu.shop/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/un533nstu.shop/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API routes
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/un533n /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 10. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d un533nstu.shop -d www.un533nstu.shop

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 11. Firewall Setup
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Post-Deployment Testing

### Health Check
```bash
curl https://un533nstu.shop/api/health
# Expected: {"success":true,"status":"ok","timestamp":"..."}
```

### Products Endpoint
```bash
curl https://un533nstu.shop/api/products
# Expected: {"success":true,"products":[...]}
```

### Frontend Accessibility
- Visit https://un533nstu.shop
- Verify homepage loads
- Check product grid displays
- Test cart functionality
- Attempt checkout flow
- Verify WhatsApp redirect works

### Reviews API
```bash
# Get all reviews
curl https://un533nstu.shop/api/reviews

# Get reviews for product ID 1
curl https://un533nstu.shop/api/reviews?productId=1
```

### Monitor Logs
```bash
# Backend logs
pm2 logs un533n-backend

# Frontend logs
pm2 logs un533n-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Ongoing Maintenance

### Update Deployment
```bash
cd /var/www/un533n
git pull origin main

# Backend
cd backend
npm install --production
npm run build
pm2 restart un533n-backend

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart un533n-frontend
```

### Database Backup
```bash
# Create backup
mysqldump -u un533n_user -p un533n_db > ~/backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u un533n_user -p un533n_db < ~/backup_20251107.sql
```

### Monitor PM2 Processes
```bash
pm2 status
pm2 monit
pm2 logs
```

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs un533n-backend
# Check for database connection errors
# Verify .env file has correct credentials
```

### Frontend 502 Bad Gateway
```bash
pm2 logs un533n-frontend
# Ensure frontend is running on port 3000
# Check Next.js build completed successfully
```

### Database connection issues
```bash
# Test database connection
mysql -u un533n_user -p un533n_db
# Verify credentials in backend/.env
# Check MariaDB is running: sudo systemctl status mariadb
```

### SSL certificate issues
```bash
sudo certbot certificates  # View certificate info
sudo certbot renew        # Manually renew
```

---

## Success Criteria ✅

- [ ] All URLs resolve correctly (http → https redirect)
- [ ] Homepage loads in < 2 seconds
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] WhatsApp checkout flow completes
- [ ] Reviews load from database
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] SSL certificate valid (A+ rating on SSL Labs)
- [ ] Lighthouse Performance Score > 85
- [ ] No 404 errors in Nginx logs
- [ ] PM2 processes stable for 24 hours

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Version:** v1.0.0
**Status:** Ready for Production 🚀
