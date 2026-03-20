// PM2 Process Manager Configuration
// This keeps the KARTAL MART app running 24/7 and auto-restarts on crash/reboot
module.exports = {
  apps: [{
    name: 'kartal-mart',
    script: 'server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Auto-restart on crash
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    // Watch for file changes (disable in production)
    watch: false,
    // Logging
    log_file: './logs/kartal-mart.log',
    error_file: './logs/kartal-mart-error.log',
    out_file: './logs/kartal-mart-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // Memory limit (restart if exceeds)
    max_memory_restart: '500M',
  }]
};
