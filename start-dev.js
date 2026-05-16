#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { platform } from 'os';
import path from 'path';
import net from 'net';

console.log('========================================');
console.log('Starting Nayan Eye Care Development Environment');
console.log('========================================\n');

// Configuration
const config = {
    mysqlServiceNames: ['MySQL80', 'MySQL', 'mysql80', 'mysql'],
    mysqlCredentials: { user: 'root', password: 'root' },
    springBootPort: 8080,
    frontendPort: 5173,
    waitTime: {
        mysql: 3000,
        springBoot: 5000
    }
};

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m',   // Red
        reset: '\x1b[0m'     // Reset
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

function spawnCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

// MySQL Management
async function startMySQL() {
    log('Checking MySQL service status...', 'info');

    let mysqlService = null;

    // Check if any MySQL service is running
    for (const serviceName of config.mysqlServiceNames) {
        try {
            if (platform() === 'win32') {
                const result = await execCommand(`sc query ${serviceName}`);
                if (result.stdout.includes('RUNNING')) {
                    mysqlService = serviceName;
                    log(`Found running MySQL service: ${mysqlService}`, 'success');
                    break;
                }
            } else {
                const result = await execCommand(`systemctl is-active ${serviceName}`);
                if (result.stdout.trim() === 'active') {
                    mysqlService = serviceName;
                    log(`Found running MySQL service: ${mysqlService}`, 'success');
                    break;
                }
            }
        } catch (error) {
            continue;
        }
    }

    // Start MySQL if not running
    if (!mysqlService) {
        log('No MySQL service found. Attempting to start...', 'warning');

        for (const serviceName of config.mysqlServiceNames) {
            try {
                if (platform() === 'win32') {
                    await execCommand(`net start ${serviceName}`);
                    mysqlService = serviceName;
                    log(`MySQL service ${serviceName} started successfully!`, 'success');
                    break;
                } else {
                    await execCommand(`sudo systemctl start ${serviceName}`);
                    mysqlService = serviceName;
                    log(`MySQL service ${serviceName} started successfully!`, 'success');
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (!mysqlService) {
            log('Failed to start MySQL service. Please ensure MySQL is installed and configured.', 'error');
            log('You may need to run as Administrator or start MySQL manually.', 'error');
            return false;
        }
    }

    // Wait for MySQL to be ready
    log('Waiting for MySQL to be ready...', 'info');
    await sleep(config.waitTime.mysql);

    // Test MySQL connection using TCP port
    log('Testing MySQL connection on port 3306...', 'info');
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
        const isUp = await new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1000);
            socket.on('connect', () => { socket.destroy(); resolve(true); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
            socket.on('error', () => { resolve(false); });
            socket.connect(3306, 'localhost');
        });

        if (isUp) {
            log('MySQL is running and accessible on port 3306!', 'success');
            return true;
        }

        retries++;
        log(`MySQL connection attempt ${retries}/${maxRetries}...`, 'warning');
        await sleep(2000);
    }

    log('MySQL connection failed after maximum attempts.', 'error');
    log('Please check your MySQL service.', 'error');
    return false;
}

// Spring Boot Management
async function startSpringBoot() {
    log('Starting Spring Boot backend...', 'info');

    let mvnCommand = 'mvn';
    // Check if Maven is available globally or locally
    try {
        await execCommand(`${mvnCommand} -version`);
        log('Maven found in PATH', 'success');
    } catch (error) {
        mvnCommand = path.join(process.cwd(), 'apache-maven-3.9.9', 'bin', 'mvn.cmd');
        try {
            await execCommand(`"${mvnCommand}" -version`);
            log('Local Maven found', 'success');
        } catch (localError) {
            log('Maven not found globally or locally. Please ensure Maven is installed.', 'error');
            return false;
        }
    }

    // Start Spring Boot in background (not detached - runs in same terminal)
    try {
        log('Launching Spring Boot...', 'info');

        const springBootProcess = spawn(`"${mvnCommand}"`, ['spring-boot:run'], {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });

        springBootProcess.on('error', (error) => {
            log(`Spring Boot process error: ${error.message}`, 'error');
        });

        springBootProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
                log(`Spring Boot exited with code ${code}`, 'warning');
            }
        });

        // Spring Boot is running, now wait for it to be ready
        log('Waiting for Spring Boot to start...', 'info');
        await sleep(config.waitTime.springBoot);

        // Test Spring Boot connection
        log('Testing Spring Boot connection...', 'info');
        let retries = 0;
        const maxRetries = 20;

        while (retries < maxRetries) {
            try {
                const response = await fetch(`http://localhost:${config.springBootPort}/actuator/health`);
                // Spring Security secures /actuator/health, so even 401 means Spring is UP
                // We get any HTTP response (not a network error) means Spring is running
                if (response.status < 500) {
                    // Any status below 500 means the server is responding
                    // 401/403 = authenticated required = Spring is UP
                    // 2xx/3xx = health check passed
                    log(`Spring Boot is running (HTTP ${response.status})!`, 'success');
                    return true;
                }
                // 5xx = server error, still starting maybe
            } catch (error) {
                // Network error means not ready yet
            }

            retries++;
            if (retries <= 15) {
                log(`Spring Boot connection attempt ${retries}/${maxRetries}...`, 'warning');
            }
            await sleep(2000);
        }

        log('Spring Boot may still be starting up. Continuing anyway...', 'warning');
        return true;
    } catch (error) {
        log(`Failed to start Spring Boot: ${error.message}`, 'error');
        return false;
    }
}

// Frontend Management
async function startFrontend() {
    log('========================================', 'info');
    log('Starting Frontend Development Server...', 'info');
    log('========================================', 'info\n');

    // Check if Node.js is available
    try {
        const result = await execCommand('node --version');
        log(`Node.js version: ${result.stdout.trim()}`, 'success');
    } catch (error) {
        log('Node.js not found. Please ensure Node.js is installed and in your PATH.', 'error');
        return false;
    }

    // Start the frontend dev server
    log('Starting npm run dev (vite)...', 'info');
    try {
        const frontendProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });
        
        frontendProcess.on('error', (error) => {
            log(`Frontend process error: ${error.message}`, 'error');
        });
        
        log('Frontend server starting...', 'success');
        return true;
    } catch (error) {
        log(`Frontend failed to start: ${error.message}`, 'error');
        return false;
    }
}

// Main execution
async function main() {
    try {
        // Start MySQL
        const mysqlStarted = await startMySQL();
        if (!mysqlStarted) {
            log('Continuing without MySQL...', 'warning');
        }

        console.log('');

        // Start Spring Boot
        const springBootStarted = await startSpringBoot();
        if (!springBootStarted) {
            log('Continuing without Spring Boot...', 'warning');
        }

        console.log('');

        // Start Frontend
        await startFrontend();

        console.log('');
        log('Development environment startup complete!', 'success');
        console.log('');
        log(`Frontend: http://localhost:${config.frontendPort}`, 'info');
        log(`Backend:  http://localhost:${config.springBootPort}`, 'info');
        log(`MySQL Database: localhost:3306/nayan-db`, 'info');
        console.log('');
        
        log('Press Ctrl+C to stop all services', 'warning');
        
        // Keep the main process alive indefinitely! 
        // This is necessary because Spring Boot and Frontend are spawned as children.
        // If main() exits, the terminal returns control to the user and the child processes get killed.
        await new Promise(() => {});

    } catch (error) {
        log(`Error during startup: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node start-dev.js [options]

Options:
  --skip-mysql      Skip MySQL startup
  --skip-backend    Skip Spring Boot startup
  --skip-frontend   Skip frontend startup
  --help, -h        Show this help message

Examples:
  node start-dev.js                    # Start everything
  node start-dev.js --skip-mysql       # Start without MySQL
  node start-dev.js --skip-backend     # Start without Spring Boot
  node start-dev.js --skip-frontend    # Start without frontend
`);
    process.exit(0);
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    log('Warning: fetch is not available. Installing node-fetch...', 'warning');
    try {
        const { default: fetch } = await import('node-fetch');
        global.fetch = fetch;
    } catch (error) {
        log('Please install node-fetch: npm install node-fetch', 'error');
        process.exit(1);
    }
}

main();
