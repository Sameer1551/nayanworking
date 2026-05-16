# Development Environment Setup Guide

This guide explains how to automatically start your entire development environment (MySQL, Spring Boot, and Frontend) with a single command.

## 🚀 Quick Start

### Option 1: Full Environment (Recommended)
```bash
npm run dev:full
```

### Option 2: Using Batch File
```bash
npm run dev:batch
```

### Option 3: Using Node.js Script
```bash
node start-dev.js
```

## 📋 What Each Script Does

### 1. **MySQL Management**
- Checks if MySQL service is running
- Automatically starts MySQL if it's stopped
- Tests database connectivity
- Waits for MySQL to be ready

### 2. **Spring Boot Backend**
- Starts the Spring Boot application using Maven
- Waits for the backend to be ready
- Tests the API endpoint
- Runs in a separate terminal window

### 3. **Frontend Development Server**
- Starts the Vite development server
- Opens the application in your browser

## 🛠️ Available Scripts

### Package.json Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start only the frontend (original behavior) |
| `npm run dev:full` | Start everything (MySQL + Spring Boot + Frontend) |
| `npm run dev:batch` | Start everything using batch file |
| `npm run dev:backend` | Start only MySQL and Spring Boot |
| `npm run dev:frontend` | Start only the frontend |
| `npm run start:mysql` | Start only MySQL service |
| `npm run start:springboot` | Start only Spring Boot |
| `npm run start:all` | Start MySQL and Spring Boot (without frontend) |

### Direct Script Execution

| Script | Description |
|--------|-------------|
| `start-dev-environment.bat` | Windows batch script |
| `start-dev-environment.ps1` | PowerShell script (recommended for Windows) |
| `start-dev.js` | Node.js script (cross-platform) |

## 🔧 Prerequisites

### Required Software
1. **MySQL** - Database server
2. **Java 17+** - For Spring Boot
3. **Maven** - Build tool for Spring Boot
4. **Node.js** - For frontend development
5. **npm** - Package manager

### Required Permissions
- **Windows**: Run as Administrator (for MySQL service management)
- **Linux/Mac**: sudo access (for MySQL service management)

## 📁 File Structure

```
project/
├── start-dev-environment.bat      # Windows batch script
├── start-dev-environment.ps1     # PowerShell script
├── start-dev.js                  # Node.js script
├── package.json                  # Updated with new scripts
└── src/main/resources/
    └── application.properties    # Database configuration
```

## 🎯 Usage Examples

### Start Everything
```bash
# Using npm (recommended)
npm run dev:full

# Using PowerShell directly
powershell -ExecutionPolicy Bypass -File start-dev-environment.ps1

# Using batch file
start-dev-environment.bat

# Using Node.js
node start-dev.js
```

### Start Specific Components
```bash
# Start only backend (MySQL + Spring Boot)
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Start only MySQL
npm run start:mysql

# Start only Spring Boot
npm run start:springboot
```

### Skip Components
```bash
# Start without MySQL
node start-dev.js --skip-mysql

# Start without Spring Boot
node start-dev.js --skip-backend

# Start without frontend
node start-dev.js --skip-frontend
```

## ⚙️ Configuration

### Database Credentials
Update `src/main/resources/application.properties` if your MySQL credentials are different:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

### Ports
Default ports (can be changed in the scripts):
- **Frontend**: 5173
- **Backend**: 8080
- **H2 Console**: 8080/h2-console

### MySQL Service Names
The scripts automatically detect common MySQL service names:
- MySQL80
- MySQL
- mysql80
- mysql

## 🚨 Troubleshooting

### MySQL Issues
1. **Service not found**: Ensure MySQL is installed and configured
2. **Access denied**: Check credentials in `application.properties`
3. **Port conflicts**: Ensure port 3306 is available

### Spring Boot Issues
1. **Maven not found**: Add Maven to your PATH
2. **Port conflicts**: Ensure port 8080 is available
3. **Java version**: Ensure Java 17+ is installed

### Frontend Issues
1. **Node.js not found**: Add Node.js to your PATH
2. **Port conflicts**: Ensure port 5173 is available
3. **Dependencies**: Run `npm install` first

### Permission Issues
1. **Windows**: Run as Administrator
2. **Linux/Mac**: Use `sudo` or ensure proper permissions

## 🔄 Manual Startup (Fallback)

If the automated scripts fail, you can start components manually:

### 1. Start MySQL
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo systemctl start mysql
```

### 2. Start Spring Boot
```bash
mvn spring-boot:run
```

### 3. Start Frontend
```bash
npm run dev
```

## 📝 Logs and Monitoring

### MySQL Status
```bash
# Windows
sc query MySQL80

# Linux/Mac
systemctl status mysql
```

### Spring Boot Status
- Check terminal where Spring Boot is running
- Access: http://localhost:8080/actuator/health

### Frontend Status
- Check terminal where npm is running
- Access: http://localhost:5173

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **MySQL**: "MySQL is running and accessible!"
2. **Spring Boot**: "Spring Boot is running successfully!"
3. **Frontend**: Vite dev server running on http://localhost:5173
4. **All URLs accessible** in your browser

## 📞 Support

If you encounter issues:

1. Check the prerequisites
2. Verify all services are running
3. Check port availability
4. Review error messages in the terminal
5. Try running components individually

## 🔄 Updates and Maintenance

The scripts are designed to be:
- **Cross-platform compatible**
- **Configurable** for different environments
- **Robust** with error handling and retries
- **Maintainable** with clear structure and comments

Feel free to modify the scripts to match your specific environment requirements!
