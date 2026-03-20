# KARTAL MART — AWS EC2 Deployment Guide (Free Tier)

This guide deploys KARTAL MART on AWS EC2 for **$0/month for 12 months**.

---

## Prerequisites
- AWS Account (free to create at https://aws.amazon.com)
- A terminal/SSH client (PuTTY on Windows, or Terminal on Mac/Linux)

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:
   - **Name:** `kartal-mart`
   - **AMI:** Amazon Linux 2023 *(Free tier eligible)*
   - **Instance type:** `t2.micro` *(Free tier — 750 hrs/month)*
   - **Key pair:** Click "Create new key pair"
     - Name: `kartal-mart-key`
     - Type: RSA
     - Format: `.pem`
     - **Download and save the `.pem` file safely!**
   - **Network settings → Edit:**
     - ✅ Allow SSH traffic (port 22) — from "My IP"
     - ✅ Allow HTTP traffic (port 80) — from "Anywhere"
     - ✅ Allow HTTPS traffic (port 443) — from "Anywhere"
   - **Storage:** 8 GB gp3 *(Free tier gives up to 30 GB)*
3. Click **Launch Instance**

---

## Step 2: Get a Static IP (Elastic IP)

Without this, your IP changes every time the instance restarts!

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Click **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Choose your `kartal-mart` instance → **Associate**
5. **Write down this IP** — this is your permanent app URL

> ⚠️ Elastic IPs are free ONLY when attached to a running instance.
> If you stop the instance, the IP costs ~$0.005/hr. Release it if not using.

---

## Step 3: Connect to Your Server

### From Windows (using PuTTY):
1. Convert `.pem` to `.ppk` using PuTTYgen
2. Connect with PuTTY: Host = your Elastic IP, Port = 22, User = `ec2-user`
3. In Connection → SSH → Auth, browse to your `.ppk` file

### From Mac/Linux/Windows Terminal:
```bash
chmod 400 kartal-mart-key.pem
ssh -i "kartal-mart-key.pem" ec2-user@YOUR_ELASTIC_IP
```

---

## Step 4: Install Node.js & Dependencies

Run these commands on your EC2 instance:

```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Verify installation
node --version    # Should show v20.x
npm --version     # Should show 10.x

# Install PM2 (keeps app running 24/7)
sudo npm install -g pm2
```

---

## Step 5: Deploy the App

```bash
# Clone your repository
git clone https://github.com/Ahmad3132/KartalMart-Deploy.git
cd KartalMart-Deploy

# Install dependencies
npm install

# Build the frontend
npm run build

# Create environment file
cp .env.example .env
# Edit the JWT secret:
nano .env
# Change JWT_SECRET to a random string, save with Ctrl+X, Y, Enter
```

---

## Step 6: Start the App with PM2

```bash
# Start using PM2 config
pm2 start ecosystem.config.cjs

# Verify it's running
pm2 status

# View logs
pm2 logs kartal-mart

# Make PM2 auto-start on server reboot
pm2 startup
# Run the command it outputs (starts with "sudo env PATH=...")
pm2 save
```

---

## Step 7: Route Port 80 → 3000

So users can visit `http://YOUR_IP` instead of `http://YOUR_IP:3000`:

```bash
# Redirect port 80 to 3000
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

# Make it persist after reboot
sudo yum install -y iptables-services
sudo service iptables save
sudo systemctl enable iptables
```

---

## Step 8: Access Your App! 🎉

Open in any browser (mobile or desktop):
```
http://YOUR_ELASTIC_IP
```

### Default Login:
- **Admin:** `admin@example.com` / `admin123`
- **User:** `user@example.com` / `user123`

> ⚠️ **IMPORTANT:** Change the admin password immediately after first login!

---

## Useful PM2 Commands

```bash
pm2 status              # Check if app is running
pm2 logs kartal-mart    # View logs
pm2 restart kartal-mart # Restart the app
pm2 stop kartal-mart    # Stop the app
pm2 delete kartal-mart  # Remove from PM2
```

---

## Updating the App

When you push new code to GitHub:

```bash
cd ~/KartalMart-Deploy
git pull
npm install
npm run build
pm2 restart kartal-mart
```

---

## Backup Your Database

The SQLite database is at `data/lucky_draw.db`. Back it up regularly:

```bash
# Manual backup
cp data/lucky_draw.db data/backup-$(date +%Y%m%d).db

# Auto backup every day at midnight (add to crontab)
crontab -e
# Add this line:
# 0 0 * * * cp /home/ec2-user/KartalMart-Deploy/data/lucky_draw.db /home/ec2-user/KartalMart-Deploy/data/backup-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### App not loading?
```bash
pm2 logs kartal-mart --lines 50  # Check for errors
```

### Port 80 not working?
```bash
# Check if iptables rule exists
sudo iptables -t nat -L -n | grep 3000
# If not, re-run the iptables commands from Step 7
```

### Can't connect via SSH?
- Check Security Group in AWS Console → ensure port 22 is allowed for your IP
- Make sure you're using the correct `.pem` key file

### Database reset?
The database auto-seeds with default data on first run. If you need to reset:
```bash
pm2 stop kartal-mart
rm data/lucky_draw.db
pm2 start kartal-mart
```

---

## AWS Free Tier Limits (12 Months)

| Service | Free Limit | Your Usage |
|---------|-----------|------------|
| EC2 t2.micro | 750 hrs/month | ~730 hrs ✅ |
| EBS Storage | 30 GB | 8 GB ✅ |
| Data Transfer | 100 GB/month | Well under ✅ |
| Elastic IP | 1 free (attached) | 1 ✅ |

**Total cost: $0/month** 💰

---

## After 12 Months

When the free tier expires, options:
1. **AWS Lightsail** — $3.50/month (cheapest AWS option)
2. **Oracle Cloud** — Always-free tier (2 VMs, 24 GB RAM!)
3. **Continue EC2** — ~$8.50/month for t2.micro on-demand
