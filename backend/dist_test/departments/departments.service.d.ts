import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
export declare class DepartmentsService {
    private readonly deptRepo;
    constructor(deptRepo: Repository<Department>);
    create(data: Partial<Department>): Promise<Department>;
    findAll(): Promise<Department[]>;
    findOne(id: number): Promise<Department>;
    update(id: number, data: Partial<Department>): Promise<Department>;
}
