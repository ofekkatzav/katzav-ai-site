#!/bin/bash
# VPS Security & Setup Script for Katzav AI
# This script installs and configures essential security and server components

set -e

echo "🔒 Katzav AI - VPS Security Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# 1. Update system
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# 2. Install essential tools
echo -e "${GREEN}[2/10] Installing essential tools...${NC}"
apt install -y curl wget git ufw fail2ban unattended-upgrades apt-listchanges

# 3. Configure Firewall (UFW)
echo -e "${GREEN}[3/10] Configuring firewall (UFW)...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# Allow n8n if needed (adjust port if different)
ufw allow 5678/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# 4. Configure Fail2Ban
echo -e "${GREEN}[4/10] Configuring Fail2Ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF
systemctl restart fail2ban
echo -e "${GREEN}✓ Fail2Ban configured${NC}"

# 5. Install and configure Nginx (if not already installed)
echo -e "${GREEN}[5/10] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi
echo -e "${GREEN}✓ Nginx installed${NC}"

# 6. Install Certbot for SSL
echo -e "${GREEN}[6/10] Installing Certbot (Let's Encrypt)...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot installed${NC}"
echo -e "${YELLOW}Note: Run 'certbot --nginx -d yourdomain.com' to get SSL certificate${NC}"

# 7. Configure automatic security updates
echo -e "${GREEN}[7/10] Configuring automatic security updates...${NC}"
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
echo -e "${GREEN}✓ Automatic updates configured${NC}"

# 8. Install monitoring tools
echo -e "${GREEN}[8/10] Installing monitoring tools...${NC}"
apt install -y htop iotop netstat-nat
# Optional: Install monitoring agent (uncomment if needed)
# wget -qO- https://repos.influxdata.com/influxdb.key | apt-key add -
# echo "deb https://repos.influxdata.com/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/influxdb.list
# apt update && apt install -y telegraf
echo -e "${GREEN}✓ Monitoring tools installed${NC}"

# 9. Configure SSH security
echo -e "${GREEN}[9/10] Configuring SSH security...${NC}"
if [ ! -f /etc/ssh/sshd_config.backup ]; then
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
fi

# Disable root login via password (keep key-based auth)
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH (be careful - make sure you have key-based access!)
echo -e "${YELLOW}⚠ SSH config updated. Make sure you have SSH key access before restarting!${NC}"
echo -e "${YELLOW}To apply: systemctl restart sshd${NC}"

# 10. Create non-root user (optional but recommended)
echo -e "${GREEN}[10/10] Creating non-root user...${NC}"
read -p "Create a non-root user? (y/n): " create_user
if [ "$create_user" = "y" ]; then
    read -p "Enter username: " username
    adduser --disabled-password --gecos "" $username
    usermod -aG sudo $username
    mkdir -p /home/$username/.ssh
    chmod 700 /home/$username/.ssh
    echo -e "${GREEN}✓ User $username created${NC}"
    echo -e "${YELLOW}Add your SSH public key to /home/$username/.ssh/authorized_keys${NC}"
fi

# 11. Setup backup script
echo -e "${GREEN}[11/11] Creating backup script...${NC}"
cat > /usr/local/bin/backup-katzav.sh <<'BACKUP_SCRIPT'
#!/bin/bash
# Backup script for Katzav AI
BACKUP_DIR="/var/backups/katzav-ai"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup website files
tar -czf $BACKUP_DIR/website_$DATE.tar.gz /var/www/katzav-ai

# Backup n8n data (if using Docker)
docker exec n8n tar -czf /tmp/n8n_backup_$DATE.tar.gz /home/node/.n8n 2>/dev/null || true

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
BACKUP_SCRIPT
chmod +x /usr/local/bin/backup-katzav.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-katzav.sh") | crontab -

echo -e "${GREEN}✓ Backup script created and scheduled${NC}"

# Summary
echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Get SSL certificate: certbot --nginx -d yourdomain.com"
echo "2. Configure Nginx for your site"
echo "3. Set up regular backups (already scheduled)"
echo "4. Review SSH config before restarting: /etc/ssh/sshd_config"
echo "5. Test firewall: ufw status"
echo ""
echo "🔒 Security Checklist:"
echo "✓ Firewall (UFW) configured"
echo "✓ Fail2Ban installed"
echo "✓ Automatic updates enabled"
echo "✓ SSH security hardened"
echo "✓ Backup script created"
echo ""

