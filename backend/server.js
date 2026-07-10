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

  // Actuator HTML Console Template (Obsidian Redesign)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptInn Actuator Health Console</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #030712;
            --bg-glow: radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
            --card-bg: rgba(15, 23, 42, 0.45);
            --card-border: rgba(255, 255, 255, 0.04);
            --card-border-hover: rgba(99, 102, 241, 0.2);
            --accent-mint: #10b981;
            --accent-mint-glow: rgba(16, 185, 129, 0.25);
            --accent-rose: #f43f5e;
            --accent-primary: #6366f1;
            --accent-cyan: #06b6d4;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #475569;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-main);
            background-image: var(--bg-glow);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 2.5rem;
            overflow-x: hidden;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
        }

        .logo-group {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .logo-icon-wrapper {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            width: 46px;
            height: 46px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
            position: relative;
        }

        .logo-icon-wrapper::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 15px;
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
            z-index: -1;
        }

        .logo-icon-wrapper svg {
            width: 24px;
            height: 24px;
            color: white;
        }

        .logo-title h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, #ffffff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo-title p {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .sys-badge {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.6rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            border: 1px solid rgba(16, 185, 129, 0.2);
            background: rgba(16, 185, 129, 0.06);
            backdrop-filter: blur(10px);
            color: var(--accent-mint);
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
        }

        .sys-badge.degraded {
            border-color: rgba(244, 63, 94, 0.2);
            background: rgba(244, 63, 94, 0.06);
            color: var(--accent-rose);
            box-shadow: 0 4px 20px rgba(244, 63, 94, 0.1);
        }

        .sys-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--accent-mint);
            box-shadow: 0 0 10px var(--accent-mint), 0 0 20px var(--accent-mint);
            animation: pulse-ring 2s infinite ease-in-out;
        }

        .sys-badge.degraded .sys-dot {
            background-color: var(--accent-rose);
            box-shadow: 0 0 10px var(--accent-rose), 0 0 20px var(--accent-rose);
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.7; }
        }

        .main-dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
            flex-grow: 1;
        }

        .dashboard-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-radius: 24px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .dashboard-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        }

        .dashboard-card:hover {
            transform: translateY(-4px);
            border-color: var(--card-border-hover);
            box-shadow: 0 30px 60px -15px rgba(99, 102, 241, 0.12), 0 0 40px -10px rgba(99, 102, 241, 0.05);
        }

        .card-heading-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            padding-bottom: 1rem;
        }

        .card-heading-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--text-primary);
        }

        .card-icon-container {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.03);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.04);
            color: var(--text-secondary);
        }

        .dashboard-card:hover .card-icon-container {
            color: var(--accent-primary);
            background: rgba(99, 102, 241, 0.1);
            border-color: rgba(99, 102, 241, 0.2);
        }

        .status-pill {
            font-size: 0.7rem;
            padding: 3px 10px;
            border-radius: 9999px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .status-pill.up {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--accent-mint);
            border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .status-pill.down {
            background-color: rgba(244, 63, 94, 0.1);
            color: var(--accent-rose);
            border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .stat-details-list {
            display: flex;
            flex-direction: column;
            gap: 1.1rem;
        }

        .stat-detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
        }

        .stat-label-text {
            color: var(--text-secondary);
            font-weight: 450;
        }

        .stat-val-text {
            color: var(--text-primary);
            font-weight: 700;
            font-family: 'Inter', sans-serif;
        }

        .stat-val-text.mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
        }

        .progress-metric-box {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            margin-top: 0.5rem;
        }

        .progress-bar-track {
            width: 100%;
            height: 8px;
            background-color: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1 0%, #06b6d4 100%);
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .progress-meta-text {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }

        .actions-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .toggle-switch-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--text-secondary);
            user-select: none;
        }

        .toggle-switch-container input {
            display: none;
        }

        .custom-toggle {
            width: 38px;
            height: 20px;
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 100px;
            position: relative;
            transition: all 0.3s;
        }

        .custom-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            background-color: var(--text-secondary);
            border-radius: 50%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-switch-container input:checked + .custom-toggle {
            background-color: rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.4);
        }

        .toggle-switch-container input:checked + .custom-toggle::after {
            left: 20px;
            background-color: #818cf8;
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
        }

        .btn-group {
            display: flex;
            gap: 0.75rem;
        }

        .actuator-btn {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
            padding: 0.65rem 1.25rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .actuator-btn:hover {
            background-color: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
        }

        .actuator-btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        }

        .actuator-btn-primary:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
        }

        footer {
            text-align: center;
            margin-top: 3rem;
            font-size: 0.75rem;
            color: var(--text-muted);
            letter-spacing: 0.02em;
        }
    </style>
    <script>
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
            const cb = document.getElementById('auto-refresh-input');
            if (cb) {
                cb.checked = active;
                if (active) toggleRefresh(cb);
            }
        });
    </script>
</head>
<body>
    <header>
        <div class="logo-group">
            <div class="logo-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            </div>
            <div class="logo-title">
                <h1>PromptInn</h1>
                <p>Actuator Health Monitor</p>
            </div>
        </div>
        <div class="sys-badge ${statusInfo.status === 'UP' ? '' : 'degraded'}">
            <span class="sys-dot"></span>
            <span>SYSTEM: ${statusInfo.status}</span>
        </div>
    </header>

    <div class="main-dashboard-grid">
        <!-- DB Health Card -->
        <div class="dashboard-card">
            <div class="card-heading-row">
                <div class="card-heading-title">
                    <div class="card-icon-container">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    Database Node
                </div>
                <span class="status-pill ${statusInfo.components.db.status === 'UP' ? 'up' : 'down'}">${statusInfo.components.db.status}</span>
            </div>
            <div class="stat-details-list">
                <div class="stat-detail-item">
                    <span class="stat-label-text">Connection State</span>
                    <span class="stat-val-text" style="color: ${statusInfo.components.db.status === 'UP' ? 'var(--accent-mint)' : 'var(--accent-rose)'}">${statusInfo.components.db.details.state}</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Cluster Host</span>
                    <span class="stat-val-text mono" style="max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${statusInfo.components.db.details.host}">${statusInfo.components.db.details.host}</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Hotel Inventory</span>
                    <span class="stat-val-text">${statusInfo.components.db.details.roomsCount} rooms</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Active Bookings</span>
                    <span class="stat-val-text">${statusInfo.components.db.details.bookingsCount} reservations</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Registered Accounts</span>
                    <span class="stat-val-text">${statusInfo.components.db.details.usersCount} users</span>
                </div>
            </div>
        </div>

        <!-- System Stats Card -->
        <div class="dashboard-card">
            <div class="card-heading-row">
                <div class="card-heading-title">
                    <div class="card-icon-container">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    Host Server
                </div>
                <span class="status-pill up">UP</span>
            </div>
            <div class="stat-details-list">
                <div class="stat-detail-item">
                    <span class="stat-label-text">Runtime Engine</span>
                    <span class="stat-val-text mono">${statusInfo.components.system.details.nodeVersion} (${statusInfo.components.system.details.platform}/${statusInfo.components.system.details.arch})</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">CPU Cores</span>
                    <span class="stat-val-text">${statusInfo.components.system.details.cpuCores} Cores</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Load Average</span>
                    <span class="stat-val-text mono">${statusInfo.components.system.details.loadAverage.map(v => v.toFixed(2)).join(', ')}</span>
                </div>
                <div class="progress-metric-box">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span class="stat-label-text">RAM Utilization</span>
                        <span class="stat-val-text">${statusInfo.components.system.details.memory.usedPercent}</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" style="width: ${statusInfo.components.system.details.memory.usedPercent}"></div>
                    </div>
                    <div class="progress-meta-text">
                        <span>Free: ${(statusInfo.components.system.details.memory.freeBytes / (1024*1024*1024)).toFixed(2)} GB</span>
                        <span>Total: ${(statusInfo.components.system.details.memory.totalBytes / (1024*1024*1024)).toFixed(2)} GB</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Telemetry & Metrics Card -->
        <div class="dashboard-card">
            <div class="card-heading-row">
                <div class="card-heading-title">
                    <div class="card-icon-container">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                    API Telemetry
                </div>
                <span class="status-pill up">UP</span>
            </div>
            <div class="stat-details-list">
                <div class="stat-detail-item">
                    <span class="stat-label-text">Process Uptime</span>
                    <span class="stat-val-text" style="color: var(--accent-cyan)">
                        ${Math.floor(statusInfo.components.system.details.uptimeSeconds / 3600)}h 
                        ${Math.floor((statusInfo.components.system.details.uptimeSeconds % 3600) / 60)}m 
                        ${statusInfo.components.system.details.uptimeSeconds % 60}s
                    </span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Total Requests</span>
                    <span class="stat-val-text" style="color: var(--accent-cyan); font-size: 1.2rem; font-weight: 800;">${statusInfo.metrics.totalRequests}</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Startup Time</span>
                    <span class="stat-val-text" style="font-size: 0.8rem;">${new Date(statusInfo.metrics.serverStartupTime).toLocaleString()}</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Heap Used</span>
                    <span class="stat-val-text mono">${(statusInfo.components.system.details.memory.processHeapUsedBytes / (1024*1024)).toFixed(2)} MB</span>
                </div>
                <div class="stat-detail-item">
                    <span class="stat-label-text">Heap Limit</span>
                    <span class="stat-val-text mono">${(statusInfo.components.system.details.memory.processHeapTotalBytes / (1024*1024)).toFixed(2)} MB</span>
                </div>
            </div>
        </div>
    </div>

    <div class="actions-section">
        <label class="toggle-switch-container">
            <input type="checkbox" id="auto-refresh-input" onchange="toggleRefresh(this)">
            <span class="custom-toggle"></span>
            <span>Auto-refresh Console (5s)</span>
        </label>
        <div class="btn-group">
            <a href="/health?format=json" class="actuator-btn">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Raw JSON Payload
            </a>
            <button onclick="window.location.reload()" class="actuator-btn actuator-btn-primary">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
                </svg>
                Sync Metrics
            </button>
        </div>
    </div>

    <footer>
        PromptInn AI Hotel Booking Engine · Powered by Node, Express, MongoDB and Gemini API · ${new Date().getFullYear()}
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
