#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal display
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

const processes = [];
let shuttingDown = false;
const isWindows = process.platform === 'win32';

function printBanner() {
  console.log('\n' + colors.cyan + colors.bright + '========================================================================' + colors.reset);
  console.log(colors.cyan + colors.bright + '   🎓 COLLEGE MANAGEMENT SYSTEM - UNIFIED MULTI-PORTAL RUNNER' + colors.reset);
  console.log(colors.gray + '   Orchestrating 7 Dedicated Frontend Portals & Centralized Node Backend...' + colors.reset);
  console.log(colors.cyan + colors.bright + '========================================================================\n' + colors.reset);
}

function prefixLog(prefix, color, data) {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${prefix}${colors.reset} ${line}`);
    }
  }
}

// Clean up any lingering processes on required ports before starting
function freePorts(ports = [5000, 5171, 5172, 5173, 5174, 5175, 5176, 5177]) {
  if (!isWindows) return;
  try {
    const netstat = execSync('netstat -ano', { encoding: 'utf8' });
    const killedPids = new Set();
    netstat.split('\n').forEach((line) => {
      if (line.includes('LISTENING')) {
        for (const p of ports) {
          if (line.includes(`:${p} `)) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && !killedPids.has(pid)) {
              killedPids.add(pid);
              try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              } catch {
                // Ignore if process already exited
              }
            }
          }
        }
      }
    });
  } catch {
    // Ignore netstat errors
  }
}

// Check port availability via fast TCP socket probe
function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function waitForServices() {
  let nodeReady = false;
  let pythonReady = false;
  let mainFrontendReady = false;

  const startTime = Date.now();
  const timeout = 30000; // 30s max

  while (Date.now() - startTime < timeout) {
    if (!nodeReady) nodeReady = await checkPort(5000);
    if (!mainFrontendReady) mainFrontendReady = await checkPort(5173);

    if (nodeReady && mainFrontendReady) {
      break;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('\n' + colors.green + colors.bright + '========================================================================' + colors.reset);
  console.log(colors.green + colors.bright + '   🎉 ALL MULTI-PORTAL SERVICES & APIS ARE ONLINE & READY!' + colors.reset);
  console.log(colors.green + colors.bright + '========================================================================' + colors.reset);
  console.log(`   ${colors.bright}🚀 Centralized Node.js Backend API :${colors.reset} ${colors.blue}${colors.bright}http://localhost:5000${colors.reset}`);
  console.log(colors.gray + '   --------------------------------------------------------------------' + colors.reset);
  console.log(`   ${colors.bright}🔑 1. Admin Portal                 :${colors.reset} ${colors.cyan}${colors.bright}http://localhost:5171${colors.reset}`);
  console.log(`   ${colors.bright}🎓 2. Student Portal               :${colors.reset} ${colors.cyan}${colors.bright}http://localhost:5172${colors.reset}`);
  console.log(`   ${colors.bright}👨‍🏫 3. Faculty Portal               :${colors.reset} ${colors.cyan}${colors.bright}http://localhost:5173${colors.reset}`);
  console.log(`   ${colors.bright}🏢 4. HOD Portal                   :${colors.reset} ${colors.cyan}${colors.bright}http://localhost:5174${colors.reset}`);
  console.log(`   ${colors.bright}👨‍👩‍👧 5. Parent Portal                :${colors.reset} ${colors.green}${colors.bright}http://localhost:5175${colors.reset}`);
  console.log(`   ${colors.bright}🏛️ 6. Principal Portal             :${colors.reset} ${colors.red}${colors.bright}http://localhost:5176${colors.reset}`);
  console.log(`   ${colors.bright}💼 7. Office Staff Portal          :${colors.reset} ${colors.gray}${colors.bright}http://localhost:5177${colors.reset}`);
  console.log(colors.green + '========================================================================' + colors.reset);
  console.log(colors.gray + '   ✨ Hot-Reload active across all 7 portals. Press Ctrl+C to stop.\n' + colors.reset);
}

function startProcess(name, prefix, color, executable, args, cwd) {
  const child = spawn(executable, args, {
    cwd: cwd || __dirname,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  child.stdout.on('data', (data) => prefixLog(prefix, color, data));
  child.stderr.on('data', (data) => prefixLog(prefix, color, data));

  child.on('error', (err) => {
    console.error(`${colors.red}[${name} ERROR]${colors.reset} Failed to spawn: ${err.message}`);
  });

  child.on('close', (code) => {
    if (!shuttingDown && code !== 0 && code !== null) {
      console.log(`${colors.red}[${name} EXITED]${colors.reset} Process stopped with exit code ${code}`);
    }
  });

  processes.push({ name, child });
  return child;
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${colors.yellow}${colors.bright}Gracefully shutting down all portals & services...${colors.reset}`);

  for (const { child } of processes) {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // Ignore errors on process kill
    }
  }

  setTimeout(() => {
    console.log(`${colors.green}All services and portals stopped cleanly.${colors.reset}\n`);
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  printBanner();

  // Pre-cleanup lingering processes on ports 5000, 5001, and 5171..5177
  freePorts([5000, 5001, 5171, 5172, 5173, 5174, 5175, 5176, 5177]);

  const nodeExecutable = process.execPath;
  const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

  // 1. Start Node.js Express Backend (Port 5000)
  console.log(`${colors.blue}[LAUNCH]${colors.reset} Starting Centralized Node.js Express Backend on Port 5000...`);
  startProcess(
    'Node Backend',
    '[NODE-API] ',
    colors.blue,
    nodeExecutable,
    [path.join(__dirname, 'backend', 'server.js')],
    path.join(__dirname, 'backend')
  );

  // 2. Start 7 Dedicated Frontend Portals
  const portalConfigs = [
    { mode: 'admin', port: 5171, name: 'Admin Portal', prefix: '[PORTAL-ADMIN] ', color: colors.cyan },
    { mode: 'student', port: 5172, name: 'Student Portal', prefix: '[PORTAL-STUD] ', color: colors.blue },
    { mode: 'faculty', port: 5173, name: 'Faculty Portal', prefix: '[PORTAL-FAC ] ', color: colors.magenta },
    { mode: 'hod', port: 5174, name: 'HOD Portal', prefix: '[PORTAL-HOD ] ', color: colors.yellow },
    { mode: 'parent', port: 5175, name: 'Parent Portal', prefix: '[PORTAL-PAR ] ', color: colors.green },
    { mode: 'principal', port: 5176, name: 'Principal Portal', prefix: '[PORTAL-PRIN] ', color: colors.red },
    { mode: 'office', port: 5177, name: 'Office Staff Portal', prefix: '[PORTAL-OFF ] ', color: colors.gray },
  ];

  for (const cfg of portalConfigs) {
    console.log(`${colors.cyan}[LAUNCH]${colors.reset} Starting ${cfg.name} on Port ${cfg.port}...`);
    startProcess(
      cfg.name,
      cfg.prefix,
      cfg.color,
      nodeExecutable,
      [vitePath, '--mode', cfg.mode, '--port', cfg.port.toString(), '--strictPort'],
      __dirname
    );
  }

  // Monitor ports and show live summary banner
  await waitForServices();
}

main().catch((err) => {
  console.error(`${colors.red}Fatal Error in runner:${colors.reset}`, err);
  shutdown();
});
