"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const env_validation_1 = require("./config/env.validation");
async function bootstrap() {
    try {
        (0, env_validation_1.validateEnvironment)();
    }
    catch (error) {
        console.error('❌ Environment validation failed:');
        console.error(error.message);
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    app.enableCors({
        origin: corsOrigin.split(',').map((origin) => origin.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const uploadsPath = process.env.UPLOAD_PATH || './uploads';
    const uploadsDir = (0, path_1.join)(process.cwd(), uploadsPath, 'assets');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.useStaticAssets((0, path_1.join)(process.cwd(), uploadsPath), {
        prefix: '/uploads/',
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ Backend running on http://localhost:${port}`);
        console.log(`✅ CORS enabled for ${corsOrigin}`);
        console.log(`✅ Static files served from /uploads/`);
        console.log(`✅ Uploads directory: ${uploadsDir}`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map