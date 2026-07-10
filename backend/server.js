import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import Room from './models/Room.js';
import User from './models/User.js';
import Booking from './models/Booking.js';
import initialRooms from './config/initialRooms.js';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Request metrics tracking for Actuator endpoint
let totalRequests = 0;
const startupTime = new Date().toISOString();

// Middleware to count requests
app.use((req, res, next) => {
  totalRequests++;
  next();
});

// Enable CORS and JSON body parsing with large payload limit for Base64 images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register API Routes
app.use('/api', apiRoutes);

// Rich Actuator-like Health and Metrics check
app.get('/health', async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  
  let dbDetails = {
    state: dbConnected ? 'connected' : 'disconnected',
    roomsCount: 0,
    bookingsCount: 0,
    usersCount: 0
  };

  if (dbConnected) {
    try {
      const [roomsCount, bookingsCount, usersCount] = await Promise.all([
        Room.countDocuments(),
        Booking.countDocuments(),
        User.countDocuments()
      ]);
      dbDetails.roomsCount = roomsCount;
      dbDetails.bookingsCount = bookingsCount;
      dbDetails.usersCount = usersCount;
    } catch (err) {
      console.error('Failed to fetch DB stats for health check:', err.message);
    }
  }

  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memoryUsedPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(2) + '%';
  const memUsage = process.memoryUsage();

  const statusInfo = {
    status: dbConnected ? 'UP' : 'DEGRADED',
    components: {
      db: {
        status: dbConnected ? 'UP' : 'DOWN',
        details: {
          ...dbDetails,
          host: mongoose.connection.host || 'unknown'
        }
      },
      system: {
        status: 'UP',
        details: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptimeSeconds: Math.floor(process.uptime()),
          systemUptimeSeconds: Math.floor(os.uptime()),
          cpuCores: os.cpus().length,
          memory: {
            totalBytes: totalMem,
            freeBytes: freeMem,
            usedPercent: memoryUsedPercent,
            processHeapUsedBytes: memUsage.heapUsed,
            processHeapTotalBytes: memUsage.heapTotal,
            processRssBytes: memUsage.rss
          },
          loadAverage: os.loadavg()
        }
      },
      metrics: {
        totalRequests,
        serverStartupTime: startupTime
      }
    }
  };

  // Content Negotiation: Serve beautiful HTML page to browsers, raw JSON to API clients
  if (req.query.format === 'json' || (req.headers.accept && !req.headers.accept.includes('text/html'))) {
    return res.json(statusInfo);
  }

  // Actuator HTML Console Template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptInn Actuator Health Console</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #0b0f19;
            --bg-card: #131b2e;
            --border-color: rgba(255, 255, 255, 0.06);
            --accent-success: #10b981;
            --accent-success-glow: rgba(16, 185, 129, 0.15);
            --accent-error: #ef4444;
            --accent-primary: #6366f1;
            --accent-cyan: #06b6d4;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-main);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 2rem;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-icon {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            width: 42px;
            height: 42px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.35);
        }

        .logo-icon svg {
            width: 22px;
            height: 22px;
            color: white;
        }

        .logo-text h1 {
            font-size: 1.35rem;
            font-weight: 800;
            background: linear-gradient(90deg, #f8fafc 30%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo-text p {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border: 1px solid rgba(16, 185, 129, 0.25);
            background-color: var(--accent-success-glow);
            color: var(--accent-success);
            box-shadow: 0 0 15px var(--accent-success-glow);
        }

        .status-badge.degraded {
            border-color: rgba(239, 68, 68, 0.25);
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--accent-error);
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.1);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--accent-success);
            box-shadow: 0 0 8px var(--accent-success);
            animation: pulse 2s infinite;
        }

        .status-badge.degraded .status-dot {
            background-color: var(--accent-error);
            box-shadow: 0 0 8px var(--accent-error);
        }

        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
            flex-grow: 1;
        }

        .card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s, border-color 0.2s;
        }

        .card:hover {
            border-color: rgba(99, 102, 241, 0.2);
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.75rem;
        }

        .card-title {
            font-size: 1.05rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-primary);
        }

        .card-icon {
            color: var(--accent-primary);
        }

        .card-badge {
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .card-badge.up {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--accent-success);
        }

        .card-badge.down {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--accent-error);
        }

        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
        }

        .metric-label {
            color: var(--text-secondary);
            font-weight: 500;
        }

        .metric-value {
            color: var(--text-primary);
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }

        .progress-container {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-top: 0.5rem;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #06b6d4);
            border-radius: 10px;
        }

        .action-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }

        .btn:hover {
            background-color: rgba(255, 255, 255, 0.07);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .btn-primary-actuator {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .btn-primary-actuator:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .footer-text {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.75rem;
            color: var(--text-muted);
        }
    </style>
    <script>
        // Simple auto refresh controller
        let refreshInterval = null;
        function toggleRefresh(checkbox) {
            if (checkbox.checked) {
                refreshInterval = setInterval(() => window.location.reload(), 5000);
                localStorage.setItem('health_autorefresh', 'true');
            } else {
                clearInterval(refreshInterval);
                localStorage.removeItem('health_autorefresh');
            }
        }
        
        window.addEventListener('load', () => {
            const active = localStorage.getItem('health_autorefresh') === 'true';
            const cb = document.getElementById('auto-refresh');
            if (cb) {
                cb.checked = active;
                if (active) toggleRefresh(cb);
            }
        });
    </script>
</head>
<body>
    <header>
        <div class="logo-section">
            <div class="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            </div>
            <div class="logo-text">
                <h1>PromptInn</h1>
                <p>Actuator Health Monitor</p>
            </div>
        </div>
        <div class="status-badge \${statusInfo.status === 'UP' ? '' : 'degraded'}">
            <span class="status-dot"></span>
            <span>SYSTEM: \${statusInfo.status}</span>
        </div>
    </header>

    <div class="grid-container">
        <!-- DB Card -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Database Health
                </div>
                <span class="card-badge \${statusInfo.components.db.status === 'UP' ? 'up' : 'down'}">\${statusInfo.components.db.status}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Status State</span>
                <span class="metric-value" style="color: \${statusInfo.components.db.status === 'UP' ? 'var(--accent-success)' : 'var(--accent-error)'}">\${statusInfo.components.db.details.state}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Host Node</span>
                <span class="metric-value" style="font-size: 0.75rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${statusInfo.components.db.details.host}">\${statusInfo.components.db.details.host}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Hotel Listings</span>
                <span class="metric-value">\${statusInfo.components.db.details.roomsCount}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Active Bookings</span>
                <span class="metric-value">\${statusInfo.components.db.details.bookingsCount}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Registered Users</span>
                <span class="metric-value">\${statusInfo.components.db.details.usersCount}</span>
            </div>
        </div>

        <!-- System Stats -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    System Information
                </div>
                <span class="card-badge up">UP</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Node Runtime</span>
                <span class="metric-value">\${statusInfo.components.system.details.nodeVersion} (\${statusInfo.components.system.details.platform}/\${statusInfo.components.system.details.arch})</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">CPU Core Allocation</span>
                <span class="metric-value">\${statusInfo.components.system.details.cpuCores} Cores</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">System Load Average</span>
                <span class="metric-value">\${statusInfo.components.system.details.loadAverage.map(v => v.toFixed(2)).join(', ')}</span>
            </div>
            <div class="progress-container">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                    <span style="color: var(--text-secondary);">RAM Utilization</span>
                    <span style="font-weight: bold;">\${statusInfo.components.system.details.memory.usedPercent}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: \${statusInfo.components.system.details.memory.usedPercent}"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted);">
                    <span>Free: \${(statusInfo.components.system.details.memory.freeBytes / (1024*1024*1024)).toFixed(2)} GB</span>
                    <span>Total: \${(statusInfo.components.system.details.memory.totalBytes / (1024*1024*1024)).toFixed(2)} GB</span>
                </div>
            </div>
        </div>

        <!-- Metrics -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    API Telemetry
                </div>
                <span class="card-badge up">UP</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Uptime (Process)</span>
                <span class="metric-value" style="color: var(--accent-cyan)">
                    \${Math.floor(statusInfo.components.system.details.uptimeSeconds / 3600)}h 
                    \${Math.floor((statusInfo.components.system.details.uptimeSeconds % 3600) / 60)}m 
                    \${statusInfo.components.system.details.uptimeSeconds % 60}s
                </span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Processed Requests</span>
                <span class="metric-value" style="color: var(--accent-cyan); font-size: 1.15rem; font-weight: 800;">\${statusInfo.metrics.totalRequests}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Startup Timestamp</span>
                <span class="metric-value" style="font-size: 0.75rem;">\${new Date(statusInfo.metrics.serverStartupTime).toLocaleString()}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Heap Memory Used</span>
                <span class="metric-value">\${(statusInfo.components.system.details.memory.processHeapUsedBytes / (1024*1024)).toFixed(2)} MB</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Heap Memory Limit</span>
                <span class="metric-value">\${(statusInfo.components.system.details.memory.processHeapTotalBytes / (1024*1024)).toFixed(2)} MB</span>
            </div>
        </div>
    </div>

    <div class="action-row">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="auto-refresh" onchange="toggleRefresh(this)" style="cursor: pointer;">
            <label for="auto-refresh" style="cursor: pointer; user-select: none;">Auto-refresh every 5s</label>
        </div>
        <div>
            <a href="/health?format=json" class="btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                View Raw JSON
            </a>
            <button onclick="window.location.reload()" class="btn btn-primary-actuator">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
                </svg>
                Refresh Status
            </button>
        </div>
    </div>

    <footer class="footer-text">
        PromptInn AI Hotel Booking Engine · System Actuator Console · \${new Date().getFullYear()}
    </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

// Serve Static Frontend Files (production build) with custom headers to prevent browser caching of index.html
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Fallback all other routes to index.html for Single Page App (SPA) routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server after establishing DB connection
const startServer = async () => {
  // Connect to live MongoDB
  const conn = await connectDB();
  
  if (conn) {
    try {
      // Auto-seed admin user if not present
      const adminUser = await User.findOne({ username: 'aakrisht' });
      if (!adminUser) {
        console.log('🌱 Seeding admin user...');
        const newAdmin = new User({
          username: 'aakrisht',
          password: '12345678',
          role: 'admin'
        });
        await newAdmin.save();
        console.log('✅ Admin user "aakrisht" seeded successfully.');
      } else {
        console.log('📊 Admin user "aakrisht" already exists.');
      }

      // Auto-seed rooms if database is empty, doesn't have Indian hotels, or lacks photo galleries
      const roomCount = await Room.countDocuments();
      const hasIndianHotels = await Room.findOne({ location: /India/i });
      const hasGallery = await Room.findOne({ images: { $exists: true, $not: { $size: 0 } } });
      if (roomCount < 10 || !hasIndianHotels || !hasGallery) {
        console.log('🌱 Clearing old inventory and auto-seeding premium Indian hotels with galleries...');
        await Room.deleteMany({});
        await Booking.deleteMany({}); // Clear old mock bookings to avoid orphaned references
        await Room.insertMany(initialRooms);
        console.log('✅ Auto-seeding completed. 26 premium Indian hotels inserted.');
      } else {
        console.log(`📊 Database has ${roomCount} active room listings.`);
      }
    } catch (err) {
      console.error('⚠️ Seeding on startup failed:', err.message);
    }
  } else {
    console.log('⚠️ Running in offline/disconnected mode. Please configure MONGODB_URI to enable persistent queries.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 PromptInn Backend Server running on http://localhost:${PORT}`);
  });
};

startServer();
