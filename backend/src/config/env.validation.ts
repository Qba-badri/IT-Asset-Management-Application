/**
 * Environment Variable Validation Utility
 * 
 * This module validates that all required environment variables are set
 * and provides helpful error messages if they're missing.
 */

interface EnvironmentConfig {
    // Database
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRATION?: string;

    // Application
    NODE_ENV: string;
    PORT: string;
    FRONTEND_URL?: string;

    // Email (Optional)
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    EMAIL_FROM?: string;

    // Azure AD (Optional)
    AZURE_TENANT_ID?: string;
    AZURE_CLIENT_ID?: string;
    AZURE_CLIENT_SECRET?: string;

    // File Upload
    MAX_FILE_SIZE?: string;
    UPLOAD_PATH?: string;

    // Security
    RATE_LIMIT_TTL?: string;
    RATE_LIMIT_MAX?: string;
    CORS_ORIGIN?: string;
}

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

/**
 * Validates that all required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateEnvironment(): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check for missing required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\n` +
            `Please check your .env file and ensure all required variables are set.\n` +
            `See .env.example for reference.`,
        );
    }

    // Security warnings
    for (const [varName, config] of Object.entries(SECURITY_WARNINGS)) {
        const value = process.env[varName];
        if (value && value.length < config.minLength) {
            warnings.push(`⚠️  ${config.message}`);
        }
    }

    // Check for default/weak values in production
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
                    warnings.push(
                        '⚠️  JWT_SECRET appears to be a default value. Please use a strong random secret!',
                    );
                    break;
                }
            }
        }

        if (process.env.DB_PASSWORD) {
            for (const weak of weakValues) {
                if (process.env.DB_PASSWORD.toLowerCase().includes(weak)) {
                    warnings.push(
                        '⚠️  DB_PASSWORD appears to be a default value. Please use a strong password!',
                    );
                    break;
                }
            }
        }
    }

    // Display warnings
    if (warnings.length > 0) {
        console.warn('\n' + '='.repeat(60));
        console.warn('SECURITY WARNINGS:');
        console.warn('='.repeat(60));
        warnings.forEach((warning) => console.warn(warning));
        console.warn('='.repeat(60) + '\n');
    }

    // Log successful validation
    console.log('✅ Environment variables validated successfully');
    if (process.env.NODE_ENV) {
        console.log(`📝 Running in ${process.env.NODE_ENV.toUpperCase()} mode`);
    }
}

/**
 * Gets a validated environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
    validateEnvironment();

    return {
        // Database
        DB_HOST: process.env.DB_HOST!,
        DB_PORT: process.env.DB_PORT!,
        DB_USERNAME: process.env.DB_USERNAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
        DB_NAME: process.env.DB_NAME!,

        // JWT
        JWT_SECRET: process.env.JWT_SECRET!,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',

        // Application
        NODE_ENV: process.env.NODE_ENV!,
        PORT: process.env.PORT!,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

        // Email (Optional)
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        EMAIL_FROM: process.env.EMAIL_FROM,

        // Azure AD (Optional)
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,

        // File Upload
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880',
        UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

        // Security
        RATE_LIMIT_TTL: process.env.RATE_LIMIT_TTL || '60',
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    };
}
