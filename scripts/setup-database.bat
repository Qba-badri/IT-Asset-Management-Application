@echo off
REM PostgreSQL Setup Script for IT Asset Management
REM Set your PostgreSQL password below
SET PGPASSWORD=postgres
SET PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe

echo Creating IT Asset Management database...
"%PSQL_PATH%" -U postgres -h localhost -c "CREATE DATABASE \"IT Asset Management\" ENCODING 'UTF8';"

if %ERRORLEVEL% NEQ 0 (
    echo Error creating database. Please check your PostgreSQL installation and password.
    pause
    exit /b 1
)

echo Database created successfully!
echo Creating tables from init.sql...

"%PSQL_PATH%" -U postgres -h localhost -d "IT Asset Management" -f database\init.sql

if %ERRORLEVEL% NEQ 0 (
    echo Error creating tables. Please check your init.sql file.
    pause
    exit /b 1
)

echo All done! Database setup complete.
pause
