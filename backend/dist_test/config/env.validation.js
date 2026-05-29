"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.getEnvironmentConfig = getEnvironmentConfig;
const REQUIRED_ENV_VARS = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
];
const SECURITY_WARNINGS = {
    JWT_SECRET: {
        minLength: 32,
        message: 'JWT_SECRET should be at least 32 characters long for security',
    },
    DB_PASSWORD: {
        minLength: 8,
        message: 'DB_PASSWORD should be at least 8 characters long',
    },
};
function validateEnvironment() {
    const missing = [];
    const warnings = [];
    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\n` +
            `Please check your .env file and ensure all required variables are set.\n` +
            `See .env.example for reference.`);
    }
    for (const [varName, config] of Object.entries(SECURITY_WARNINGS)) {
        const value = process.env[varName];
        if (value && value.length < config.minLength) {
            warnings.push(`⚠️  ${config.message}`);
        }
    }
    if (process.env.NODE_ENV === 'production') {
        const weakValues = [
            'password',
            'secret',
            'changeme',
            'default',
            'your-',
            'generate-',
        ];
        if (process.env.JWT_SECRET) {
            for (const weak of weakValues) {
                if (process.env.JWT_SECRET.toLowerCase().includes(weak)) {
                    warnings.push('⚠️  JWT_SECRET appears to be a default value. Please use a strong random secret!');
                    break;
                }
            }
        }
        if (process.env.DB_PASSWORD) {
            for (const weak of weakValues) {
                if (process.env.DB_PASSWORD.toLowerCase().includes(weak)) {
                    warnings.push('⚠️  DB_PASSWORD appears to be a default value. Please use a strong password!');
                    break;
                }
            }
        }
    }
    if (warnings.length > 0) {
        console.warn('\n' + '='.repeat(60));
        console.warn('SECURITY WARNINGS:');
        console.warn('='.repeat(60));
        warnings.forEach((warning) => console.warn(warning));
        console.warn('='.repeat(60) + '\n');
    }
    console.log('✅ Environment variables validated successfully');
    if (process.env.NODE_ENV) {
        console.log(`📝 Running in ${process.env.NODE_ENV.toUpperCase()} mode`);
    }
}
function getEnvironmentConfig() {
    validateEnvironment();
    return {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        EMAIL_FROM: process.env.EMAIL_FROM,
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880',
        UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
        RATE_LIMIT_TTL: process.env.RATE_LIMIT_TTL || '60',
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    };
}
//# sourceMappingURL=env.validation.js.map