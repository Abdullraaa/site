# Production Deployment Guide

## 🚀 Quick Deploy Checklist

### Pre-Deployment
- [x] All changes committed to git
- [x] Production build tested locally
- [x] Error boundaries added
- [x] 404 and loading pages created
- [x] Image fallbacks implemented
- [x] Console logs removed from production
- [x] Product images updated and committed

### On Production Server

#### 1. Pull Latest Code
```bash
ssh your-server
cd /path/to/un533n
git pull origin chore/nov-2025-updates
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Build backend
npm run build

# Update database with new prices and categories
sudo mysql -u root -p
```

```sql
USE un533n;

-- Update prices
UPDATE products SET price = 149000.0 WHERE sku = 'UN-100';
UPDATE products SET price = 120000.0 WHERE sku = 'UN-200';
UPDATE products SET price = 75000.0 WHERE sku = 'UN-300';
UPDATE products SET price = 91000.0 WHERE sku = 'UN-400';
UPDATE products SET price = 54000.0 WHERE sku = 'UN-500';

-- Update category
UPDATE products SET category = 'Hoodie' WHERE sku = 'UN-100';

-- Verify
SELECT sku, title, price, category FROM products;
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Create production environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_NAME=un533n
NEXT_PUBLIC_WHATSAPP_NUMBER=2348148018170
EOF

# Install dependencies
npm install

# Build frontend
npm run build
```

#### 4. Restart Services
```bash
# If using PM2
pm2 restart all
pm2 save

# If using systemd
sudo systemctl restart un533n-backend
sudo systemctl restart un533n-frontend

# Verify services are running
pm2 status
# or
sudo systemctl status un533n-backend un533n-frontend
```

#### 5. Verify Deployment
```bash
# Check backend health
curl https://un533nstu.shop/api/products

# Check frontend
curl -I https://un533nstu.shop

# Check SSL certificate
curl -vI https://un533nstu.shop 2>&1 | grep -i ssl
```

### Post-Deployment Testing

#### Frontend Tests
- [ ] Homepage loads correctly
- [ ] All product images display
- [ ] Product modals work
- [ ] Image auto-cycling works
- [ ] Cart functionality works
- [ ] Quantity counter works
- [ ] Image and color selection in cart
- [ ] Prices display with ₦ symbol and commas
- [ ] WhatsApp checkout opens correctly

#### Backend Tests
- [ ] API responds to /api/products
- [ ] Products show correct prices
- [ ] WhatsApp checkout creates orders
- [ ] Database connections stable

#### Mobile Tests
- [ ] Responsive design works on mobile
- [ ] WhatsApp opens mobile app (not web)
- [ ] Touch interactions work smoothly

### Monitoring

```bash
# Watch logs
pm2 logs

# Or for systemd
sudo journalctl -u un533n-backend -f
sudo journalctl -u un533n-frontend -f
```

## 🆘 Rollback Plan

If something goes wrong:

```bash
# Rollback code
git checkout main
git pull

# Rebuild
cd backend && npm run build
cd ../frontend && npm run build

# Restart
pm2 restart all
```

## 📊 Performance Optimization (Optional)

### Enable Caching
Add to nginx config:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Indexes
```sql
USE un533n;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
```

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Site loads at https://un533nstu.shop
- ✅ All 6 products display with correct images
- ✅ Prices show in Naira with correct formatting
- ✅ Cart works with quantity controls
- ✅ WhatsApp checkout redirects to +2348148018170
- ✅ No console errors in browser
- ✅ No server errors in logs
- ✅ Mobile experience is smooth

## 🔧 Environment Variables Reference

### Backend (.env)
```bash
DB_HOST=127.0.0.1
DB_USER=un533n_user
DB_PASSWORD=your_secure_password
DB_NAME=un533n
PORT=4000
WHATSAPP_NUMBER=+2348148018170
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_URL=https://un533nstu.shop
NEXT_PUBLIC_SITE_NAME=un533n
NEXT_PUBLIC_WHATSAPP_NUMBER=2348148018170
```

## 📱 Contact Support

If you encounter issues during deployment:
1. Check logs first: `pm2 logs` or `journalctl`
2. Verify environment variables are set correctly
3. Ensure database is accessible
4. Check SSL certificate validity
5. Verify DNS settings point to correct server
