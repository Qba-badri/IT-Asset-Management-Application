import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
export declare class UsersService {
    private usersRepository;
    private rolesRepository;
    constructor(usersRepository: Repository<User>, rolesRepository: Repository<Role>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(data: any): Promise<User>;
    update(id: number, data: any): Promise<User>;
    remove(id: number): Promise<void>;
    getUserInventory(id: number): Promise<User>;
}
