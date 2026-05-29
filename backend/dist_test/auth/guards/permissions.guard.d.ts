import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private userRepository;
    constructor(reflector: Reflector, userRepository: Repository<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
