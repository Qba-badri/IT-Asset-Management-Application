import { DepartmentsService } from './departments.service';
import { Department } from '../entities/department.entity';
export declare class DepartmentsController {
    private readonly deptService;
    constructor(deptService: DepartmentsService);
    create(data: Partial<Department>): Promise<Department>;
    findAll(): Promise<Department[]>;
    findOne(id: number): Promise<Department>;
    update(id: number, data: Partial<Department>): Promise<Department>;
}
