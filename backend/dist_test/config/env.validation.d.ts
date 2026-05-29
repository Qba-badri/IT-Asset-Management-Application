interface EnvironmentConfig {
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRATION?: string;
    NODE_ENV: string;
    PORT: string;
    FRONTEND_URL?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    EMAIL_FROM?: string;
    AZURE_TENANT_ID?: string;
    AZURE_CLIENT_ID?: string;
    AZURE_CLIENT_SECRET?: string;
    MAX_FILE_SIZE?: string;
    UPLOAD_PATH?: string;
    RATE_LIMIT_TTL?: string;
    RATE_LIMIT_MAX?: string;
    CORS_ORIGIN?: string;
}
export declare function validateEnvironment(): void;
export declare function getEnvironmentConfig(): EnvironmentConfig;
export {};
