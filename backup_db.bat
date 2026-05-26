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
set TIMESTAMP=%mydate%_%mytime: =0%

:: Backup filename
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_backup_%TIMESTAMP%.sql
set ENCRYPTED_FILE=%BACKUP_DIR%\%DB_NAME%_backup_%TIMESTAMP%.sql.enc

echo Starting database backup...
%MYSQLDUMP_PATH% -u %DB_USER% -p%DB_PASS% %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo Backup completed successfully: %BACKUP_FILE%
    
    :: PHASE 8: Encrypt the backup using OpenSSL
    echo Encrypting backup file...
    openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -in "%BACKUP_FILE%" -out "%ENCRYPTED_FILE%" -pass pass:%BACKUP_ENCRYPTION_PASS%
    
    if exist "%ENCRYPTED_FILE%" (
        echo Encryption successful: %ENCRYPTED_FILE%
        :: Delete the plaintext SQL file securely
        del "%BACKUP_FILE%"
    ) else (
        echo Encryption failed. Retaining plaintext backup.
