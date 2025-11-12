# 🔒 מדריך הגדרת אבטחה ל-VPS - Katzav AI

מדריך מקיף להתקנה והגדרה של כל רכיבי האבטחה והשרת ב-VPS.

## 📋 רשימת רכיבים נדרשים

### ✅ רכיבי חובה

1. **מערכת הפעלה** - Ubuntu 24.04 LTS (כבר מותקן)
2. **שרת אינטרנט** - Nginx
3. **חומת אש** - UFW (Uncomplicated Firewall)
4. **אבטחת SSH** - Fail2Ban
5. **תעודת SSL** - Let's Encrypt (Certbot)
6. **עדכונים אוטומטיים** - unattended-upgrades
7. **גיבויים** - סקריפט אוטומטי
8. **ניטור** - כלי ניטור בסיסיים

### 🔧 רכיבים אופציונליים

- **מסד נתונים** - MySQL/MariaDB/PostgreSQL (אם נדרש)
- **אנטי-וירוס** - ClamAV (אם נדרש)
- **ניטור מתקדם** - Grafana + InfluxDB (אופציונלי)

---

## 🚀 התקנה מהירה

### שיטה 1: סקריפט אוטומטי

```bash
# העתק את הסקריפט לשרת
scp vps-security-setup.sh root@148.230.108.80:/root/

# התחבר לשרת
ssh root@148.230.108.80

# הרץ את הסקריפט
chmod +x vps-security-setup.sh
./vps-security-setup.sh
```

### שיטה 2: התקנה ידנית

עקוב אחרי השלבים למטה.

---

## 📝 שלבי התקנה מפורטים

### 1. עדכון המערכת

```bash
apt update && apt upgrade -y
```

### 2. התקנת כלים בסיסיים

```bash
apt install -y curl wget git ufw fail2ban unattended-upgrades
```

### 3. הגדרת חומת אש (UFW)

```bash
# איפוס הגדרות
ufw --force reset

# הגדרת ברירת מחדל
ufw default deny incoming
ufw default allow outgoing

# פתיחת פורטים נדרשים
ufw allow ssh          # SSH
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 5678/tcp     # n8n (אם נדרש)

# הפעלת חומת האש
ufw --force enable

# בדיקה
ufw status
```

### 4. התקנת והגדרת Fail2Ban

```bash
# התקנה
apt install -y fail2ban

# יצירת קובץ הגדרות
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

# הפעלה
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban
```

### 5. התקנת Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
systemctl status nginx
```

### 6. התקנת תעודת SSL (Let's Encrypt)

```bash
# התקנת Certbot
apt install -y certbot python3-certbot-nginx

# קבלת תעודת SSL (החלף את yourdomain.com)
certbot --nginx -d srv942917.hstgr.cloud

# בדיקה של חידוש אוטומטי
certbot renew --dry-run
```

### 7. הגדרת עדכונים אוטומטיים

```bash
# יצירת קובץ הגדרות
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
```

### 8. התקנת כלי ניטור

```bash
apt install -y htop iotop netstat-nat

# שימוש
htop          # ניטור CPU/RAM
iotop         # ניטור דיסק
netstat-nat   # ניטור רשת
```

### 9. אבטחת SSH

```bash
# גיבוי קובץ הגדרות
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# עריכה
nano /etc/ssh/sshd_config

# שינויים מומלצים:
# PermitRootLogin prohibit-password  (או no אם יש משתמש אחר)
# PasswordAuthentication no
# PubkeyAuthentication yes
# Port 2222  (שינוי פורט - אופציונלי)

# הפעלה מחדש (⚠️ ודא שיש לך גישה דרך מפתח SSH!)
systemctl restart sshd
```

### 10. יצירת משתמש לא-root (מומלץ)

```bash
# יצירת משתמש חדש
adduser katzav-admin
usermod -aG sudo katzav-admin

# העתקת מפתח SSH
mkdir -p /home/katzav-admin/.ssh
chmod 700 /home/katzav-admin/.ssh
cp ~/.ssh/authorized_keys /home/katzav-admin/.ssh/
chown -R katzav-admin:katzav-admin /home/katzav-admin/.ssh
chmod 600 /home/katzav-admin/.ssh/authorized_keys
```

### 11. הגדרת גיבויים אוטומטיים

```bash
# יצירת סקריפט גיבוי
cat > /usr/local/bin/backup-katzav.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/katzav-ai"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# גיבוי קבצי האתר
tar -czf $BACKUP_DIR/website_$DATE.tar.gz /var/www/katzav-ai

# גיבוי n8n (אם משתמשים ב-Docker)
docker exec n8n tar -czf /tmp/n8n_backup_$DATE.tar.gz /home/node/.n8n 2>/dev/null || true

# שמירת 7 ימים בלבד
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-katzav.sh

# הוספה ל-crontab (יומי בשעה 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-katzav.sh") | crontab -
```

---

## 🔍 בדיקות אבטחה

### בדיקת חומת אש

```bash
ufw status verbose
```

### בדיקת Fail2Ban

```bash
fail2ban-client status
fail2ban-client status sshd
```

### בדיקת SSL

```bash
certbot certificates
```

### בדיקת עדכונים

```bash
unattended-upgrades --dry-run --debug
```

---

## 📊 ניטור שרת

### כלים מובנים

```bash
# שימוש בזמן אמת
htop              # CPU/RAM
df -h             # דיסק
free -h            # זיכרון
netstat -tulpn    # פורטים פתוחים
```

### בדיקת לוגים

```bash
# לוגי Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# לוגי SSH
tail -f /var/log/auth.log

# לוגי Fail2Ban
tail -f /var/log/fail2ban.log
```

---

## 🛡️ רשימת בדיקות אבטחה

- [ ] חומת אש (UFW) מופעלת
- [ ] Fail2Ban מופעל ופועל
- [ ] SSL מוגדר ופועל
- [ ] עדכונים אוטומטיים מופעלים
- [ ] SSH מאובטח (מפתח בלבד)
- [ ] גיבויים אוטומטיים מוגדרים
- [ ] משתמש לא-root נוצר (אופציונלי)
- [ ] כלי ניטור מותקנים

---

## 🆘 פתרון בעיות

### בעיה: לא יכול להתחבר דרך SSH

```bash
# בדוק את חומת האש
ufw status
ufw allow ssh

# בדוק את שירות SSH
systemctl status sshd
```

### בעיה: SSL לא מתחדש

```bash
# בדוק את ה-cron
systemctl status certbot.timer

# הרץ חידוש ידני
certbot renew
```

### בעיה: Fail2Ban חוסם אותי

```bash
# הסרת חסימה
fail2ban-client set sshd unbanip YOUR_IP

# בדיקת IP חסום
fail2ban-client status sshd
```

---

## 📚 משאבים נוספים

- [UFW Documentation](https://help.ubuntu.com/community/UFW)
- [Fail2Ban Documentation](https://www.fail2ban.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**⚠️ חשוב:** לפני ביצוע שינויים ב-SSH, ודא שיש לך גישה דרך מפתח SSH!

