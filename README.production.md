# Telegram Secrets - Production Ready 🚀

A secure, scalable e-commerce platform for digital content delivery with PIX payment integration.

## 🔒 Security Features

### Application Security
- ✅ Helmet.js security headers
- ✅ Rate limiting (5 login attempts per 15 min)
- ✅ CORS configuration
- ✅ NoSQL injection protection
- ✅ HTTP Parameter Pollution (HPP) prevention
- ✅ JWT authentication
- ✅ HTTPS enforcement
- ✅ XSS protection headers
- ✅ Content Security Policy
- ✅ Environment validation

### Infrastructure Security
- ✅ Docker containerization
- ✅ Non-root user execution
- ✅ Nginx reverse proxy
- ✅ UFW firewall
- ✅ Fail2Ban intrusion prevention
- ✅ SSL/TLS encryption (Let's Encrypt)
- ✅ Automated security updates
- ✅ Log rotation and monitoring

### Database Security
- ✅ PostgreSQL with password authentication
- ✅ Connection pooling
- ✅ Automated backups (30-day retention)
- ✅ Point-in-time recovery
- ✅ Query optimization

## 📦 Production Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 14+ |
| Backend | Node.js/Express | 18+ |
| Database | PostgreSQL | 15+ |
| Reverse Proxy | Nginx | 1.24+ |
| Container | Docker | 24+ |
| OS | Debian | 12 |

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx ufw fail2ban
```

### 2. Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/telegram_secrets.git
cd telegram_secrets

# Create environment file
cp .env.production.example .env.production

# Generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
openssl rand -base64 32  # POSTGRES_PASSWORD

# Edit configuration
nano .env.production
```

### 3. Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

### 4. Setup SSL
```bash
# Update nginx config with your domain
sudo nano /etc/nginx/sites-available/telegram-secrets

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Configuration

### Environment Variables

#### Required
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/db
JWT_SECRET=your_64_char_random_string
PUSHINPAY_TOKEN=your_pushinpay_token
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
```

#### Optional
```env
NODE_ENV=production
PORT=3001
POSTGRES_USER=telegram_secrets
POSTGRES_DB=telegram_secrets_db
```

### Nginx Configuration

Key features:
- Rate limiting: 100 req/15min general, 5 req/15min auth
- SSL/TLS 1.2+ only
- HSTS enabled
- Gzip compression
- Static file caching (1 year)
- Security headers

Location: `nginx/telegram-secrets.conf`

## 📊 Monitoring

### Health Checks

#### Backend
```bash
curl https://yourdomain.com/api/health
```

#### Frontend
```bash
curl https://yourdomain.com
```

#### Database
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Logs

```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f

# Nginx logs
sudo tail -f /var/log/nginx/telegram-secrets-access.log
sudo tail -f /var/log/nginx/telegram-secrets-error.log

# System logs
sudo journalctl -u docker -f
```

### Metrics

```bash
# Container stats
docker stats

# Disk usage
df -h
docker system df

# Memory usage
free -h

# Network connections
ss -tuln
```

## 🔄 Backup & Recovery

### Automatic Backups

Configured via cron (daily at 2 AM):
```bash
0 2 * * * /home/telegram/telegram_secrets/scripts/backup-database.sh
```

Backups stored in: `/var/backups/telegram-secrets/`
Retention: 30 days

### Manual Backup
```bash
./scripts/backup-database.sh
```

### Restore Database
```bash
# From latest backup
./scripts/restore-database.sh

# From specific backup
./scripts/restore-database.sh /var/backups/telegram-secrets/backup_file.sql.gz
```

## 🔐 Security Best Practices

### SSH
- Use SSH keys only
- Change default port (2222)
- Disable root login
- Configure fail2ban

### Firewall
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 2222/tcp  # SSH
```

### Secrets Management
- Never commit `.env.production`
- Rotate JWT_SECRET monthly
- Use strong passwords (32+ chars)
- Enable 2FA for admin accounts

### Updates
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Docker images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Application
git pull origin main
./scripts/deploy.sh
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check environment
docker compose -f docker-compose.prod.yml config

# Rebuild
docker compose -f docker-compose.prod.yml build --no-cache
```

### Database Connection Issues
```bash
# Check database
docker compose -f docker-compose.prod.yml exec postgres psql -U telegram_secrets

# Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Reset connection pool
docker compose -f docker-compose.prod.yml restart backend
```

### High Memory Usage
```bash
# Check container resources
docker stats

# Restart services
docker compose -f docker-compose.prod.yml restart

# Clear Docker cache
docker system prune -a
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Check certificate
sudo certbot certificates
```

## 📈 Performance Optimization

### Database
- Connection pooling enabled
- Query optimization with indexes
- Regular VACUUM ANALYZE
- Optimized PostgreSQL settings

### Caching
- Nginx static file caching (1 year)
- Next.js static generation
- API response caching headers

### CDN (Optional)
Configure CloudFlare or similar:
1. Add domain to CDN
2. Update DNS
3. Enable caching rules
4. Configure security settings

## 🔍 Compliance

### Data Protection
- HTTPS enforced
- Secure cookie handling
- Password hashing (bcrypt)
- PCI DSS compatible (via PushinPay)

### Logging
- Access logs (14-day retention)
- Error logs (30-day retention)
- Audit trails for admin actions

### Privacy
- No unnecessary data collection
- GDPR-ready architecture
- User data encryption at rest

## 📞 Support

### Production Issues
1. Check logs first
2. Review health checks
3. Verify environment variables
4. Restart services
5. Contact support

### Monitoring Alerts
Setup email alerts for:
- Disk usage > 80%
- Service down
- Failed backups
- SSL expiration (30 days)

### Documentation
- Full deployment guide: `DEPLOYMENT.md`
- API documentation: `API.md`
- Architecture: `ARCHITECTURE.md`

## 🎯 Performance Benchmarks

### Expected Performance
- Response time: < 200ms (p95)
- Throughput: 1000 req/min
- Uptime: 99.9%
- Database queries: < 50ms

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test backend
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Test frontend
ab -n 1000 -c 10 https://yourdomain.com/
```

## 📝 Maintenance Schedule

### Daily
- Automated backups (2 AM)
- Log rotation
- Health checks

### Weekly
- Review error logs
- Check disk space
- Update packages

### Monthly
- Rotate secrets
- Review access logs
- Security audit
- Performance review

## 🎉 Success Criteria

✅ All health checks passing
✅ SSL certificate valid
✅ Backups running daily
✅ Monitoring alerts configured
✅ Rate limiting working
✅ No security warnings
✅ Response times < 200ms
✅ Zero downtime deployments

---

**Production deployment completed successfully!** 🚀

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
