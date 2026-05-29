import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("../entities/user.entity").User[]>;
    getMe(req: any): Promise<import("../entities/user.entity").User>;
    create(body: CreateUserDto): Promise<import("../entities/user.entity").User>;
    updateMe(req: any, body: UpdateProfileDto): Promise<import("../entities/user.entity").User>;
    update(id: number, body: UpdateUserDto): Promise<import("../entities/user.entity").User>;
    getInventory(id: number): Promise<import("../entities/user.entity").User>;
    remove(id: number): Promise<void>;
}
