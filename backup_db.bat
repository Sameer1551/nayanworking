@echo off
setlocal

:: =========================================
:: PHASE 6: Automated MySQL Database Backup
:: =========================================

:: Configuration
set DB_USER=root
set DB_PASS=root
set DB_NAME=nayan-db
set BACKUP_DIR=D:\nayan\databackuptest
set MYSQLDUMP_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
:: PHASE 8: Backup Encryption Password
set BACKUP_ENCRYPTION_PASS=SuperSecretBackupKey2026!

:: Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Generate timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
