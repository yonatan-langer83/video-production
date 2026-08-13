module.exports = {
  apps: [
    {
      name: 'video-planner',
      cwd: '/var/www/video-planner',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3010 -H 127.0.0.1',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SERVER_URL: 'https://videos.kabbalah.co.il',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
    },
  ],
}
