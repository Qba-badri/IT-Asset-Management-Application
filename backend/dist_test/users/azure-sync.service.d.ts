import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import 'isomorphic-fetch';
export declare class AzureSyncService implements OnModuleInit {
    private configService;
    private userRepository;
    private roleRepository;
    private readonly logger;
    private graphClient;
    constructor(configService: ConfigService, userRepository: Repository<User>, roleRepository: Repository<Role>);
    onModuleInit(): void;
    private initializeGraphClient;
    syncUsers(): Promise<{
        success: boolean;
        message: string;
        createdCount: number;
        updatedCount: number;
        totalProcessed: number;
    }>;
}
