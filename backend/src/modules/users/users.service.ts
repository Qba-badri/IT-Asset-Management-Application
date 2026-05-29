import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: any): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Find role
    const role = await this.rolesRepository.findOneBy({ id: data.roleId });
    if (!role) throw new NotFoundException('Role not found');

    const newUser = this.usersRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role,
      isActive: true,
    });

    return this.usersRepository.save(newUser);
  }

  async update(id: number, data: any): Promise<User> {
    const user = await this.findOne(id);

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.email) user.email = data.email;

    if (data.roleId) {
      const role = await this.rolesRepository.findOneBy({ id: data.roleId });
      if (role) user.role = role;
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }

  async getUserInventory(id: number): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
      relations: [
        'assignedAssets',
        'licenseAssignments',
        'licenseAssignments.license',
      ],
    });
  }
}
