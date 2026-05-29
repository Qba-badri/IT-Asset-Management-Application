import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async create(data: Partial<Department>): Promise<Department> {
    const existing = await this.deptRepo.findOne({
      where: { name: data.name },
    });
    if (existing)
      throw new ConflictException(`Department "${data.name}" already exists`);
    return this.deptRepo.save(this.deptRepo.create(data));
  }

  async findAll(): Promise<Department[]> {
    return this.deptRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`Department #${id} not found`);
    return dept;
  }

  async update(id: number, data: Partial<Department>): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, data);
    return this.deptRepo.save(dept);
  }
}
