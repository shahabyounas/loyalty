# Self-Hosted Runner Setup Guide

This guide covers setting up a self-hosted GitHub Actions runner to host your backend API alongside GitHub Pages for the frontend.

## 🏗️ Architecture Overview

```
GitHub Repository
├── Frontend (GitHub Pages)
│   └── https://username.github.io/repository-name
└── Backend (Self-hosted Runner)
    └── http://your-server-ip:3001/api
```

## 🚀 Quick Setup

### Option 1: Local Development Server

#### Prerequisites
- Node.js 18+ installed
- Git installed
- Port 3001 available

#### Setup Steps
```bash
# 1. Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 2. Install dependencies
npm ci --legacy-peer-deps
cd server && npm ci --only=production && cd ..

# 3. Create environment file
cat > server/.env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-username.github.io/your-repo
EOF

# 4. Start the server
cd server && node server.js
```

### Option 2: VPS/Cloud Server

#### Prerequisites
- Ubuntu 20.04+ server
- SSH access
- Public IP address
- Domain name (optional)

#### Setup Steps

##### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install PM2 for process management
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/loyalty
sudo chown $USER:$USER /opt/loyalty
```

##### 2. Set up Self-Hosted Runner
```bash
# Go to your GitHub repository
# Settings → Actions → Runners → New self-hosted runner

# Download and configure runner
cd /opt/loyalty
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner (use token from GitHub)
./config.sh --url https://github.com/your-username/your-repo --token YOUR_RUNNER_TOKEN

# Install runner as service
sudo ./svc.sh install
sudo ./svc.sh start
```

##### 3. Configure Firewall
```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow API port
sudo ufw allow 3001

# Enable firewall
sudo ufw enable
```

##### 4. Set up Nginx (Optional)
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/loyalty-api << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/loyalty-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

##### 5. Set up SSL with Let's Encrypt (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Configuration

### Environment Variables

#### Required Secrets in GitHub
```bash
# Repository Settings → Secrets and variables → Actions
REACT_APP_API_URL=https://your-domain.com/api
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-username.github.io/your-repo
```

#### Server Environment File
```bash
# /opt/loyalty/server/.env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-username.github.io/your-repo
```

### Process Management

#### Using PM2
```bash
# Create PM2 ecosystem file
cat > /opt/loyalty/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'loyalty-api',
    script: 'server/server.js',
    cwd: '/opt/loyalty',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using Systemd
```bash
# Create systemd service
sudo tee /etc/systemd/system/loyalty-api.service << EOF
[Unit]
Description=Loyalty API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/loyalty
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable loyalty-api
sudo systemctl start loyalty-api
```

## 🔄 Deployment Process

### Automatic Deployment
The GitHub Actions workflow will automatically:
1. Build the application
2. Run tests and security scans
3. Deploy frontend to GitHub Pages
4. Deploy backend to self-hosted runner

### Manual Deployment
```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to application directory
cd /opt/loyalty

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --legacy-peer-deps
cd server && npm ci --only=production && cd ..

# Restart service
sudo systemctl restart loyalty-api
# or
pm2 restart loyalty-api
```

## 📊 Monitoring

### Health Checks
```bash
# Check API health
curl http://localhost:3001/api/health

# Check service status
sudo systemctl status loyalty-api
# or
pm2 status

# Check logs
sudo journalctl -u loyalty-api -f
# or
pm2 logs loyalty-api
```

### Monitoring Script
```bash
#!/bin/bash
# /opt/loyalty/monitor.sh

API_URL="http://localhost:3001/api/health"
LOG_FILE="/opt/loyalty/monitor.log"

# Check API health
if curl -f $API_URL > /dev/null 2>&1; then
    echo "$(date): API is healthy" >> $LOG_FILE
else
    echo "$(date): API is down, restarting..." >> $LOG_FILE
    sudo systemctl restart loyalty-api
    # or pm2 restart loyalty-api
fi
```

### Set up Cron Job
```bash
# Add to crontab
crontab -e

# Check every 5 minutes
*/5 * * * * /opt/loyalty/monitor.sh
```

## 🔒 Security

### Firewall Configuration
```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001
sudo ufw enable
```

### SSL/TLS Setup
```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Environment Security
```bash
# Secure environment file
chmod 600 /opt/loyalty/server/.env

# Use strong JWT secret
openssl rand -base64 32
```

## 🚨 Troubleshooting

### Common Issues

#### Runner Not Starting
```bash
# Check runner status
sudo systemctl status actions.runner.*

# Check logs
sudo journalctl -u actions.runner.* -f

# Reinstall runner
cd /opt/loyalty
./svc.sh stop
./svc.sh uninstall
./config.sh --url https://github.com/your-username/your-repo --token NEW_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

#### API Not Accessible
```bash
# Check if service is running
sudo systemctl status loyalty-api

# Check port
sudo netstat -tlnp | grep :3001

# Check firewall
sudo ufw status

# Check logs
sudo journalctl -u loyalty-api -f
```

#### Build Failures
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci --legacy-peer-deps
```

### Debugging Commands
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tlnp

# Check service logs
sudo journalctl -u loyalty-api -n 50
```

## 📈 Scaling

### Load Balancing
```bash
# Set up multiple instances
pm2 start ecosystem.config.js -i max

# Use Nginx for load balancing
upstream api_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

### Database Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb loyalty_db
sudo -u postgres createuser loyalty_user

# Update environment variables
echo "DATABASE_URL=postgresql://loyalty_user:password@localhost/loyalty_db" >> server/.env
```

## 🎯 Best Practices

### Performance
- Use PM2 for process management
- Set up monitoring and alerting
- Implement proper logging
- Use SSL/TLS encryption

### Security
- Keep system updated
- Use strong passwords
- Implement rate limiting
- Regular security audits

### Maintenance
- Regular backups
- Monitor disk space
- Update dependencies
- Review logs regularly

## 📞 Support

For issues with self-hosted runner:
1. Check GitHub Actions logs
2. Verify runner configuration
3. Check server connectivity
4. Review system logs

## 🎉 Success Checklist

- [ ] Self-hosted runner is running
- [ ] API is accessible
- [ ] SSL certificate is installed
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Security measures are in place
- [ ] Documentation is updated
- [ ] Team is trained on deployment 