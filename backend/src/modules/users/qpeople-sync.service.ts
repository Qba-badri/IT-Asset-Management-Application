import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User, UserSource } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Department } from '../../entities/department.entity';
import { IntegrationSettingsService } from '../settings/integration-settings.service';
import 'isomorphic-fetch';

const EMPLOYEES_ENDPOINT =
  '/api/method/hrms.api.employee.get_all_users_details';

@Injectable()
export class QPeopleSyncService {
  private readonly logger = new Logger(QPeopleSyncService.name);

  constructor(
    private readonly integrationSettings: IntegrationSettingsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  private async getConfig() {
    const [apiUrl, apiToken] = await Promise.all([
      this.integrationSettings.get('QPEOPLE_API_URL'),
      this.integrationSettings.get('QPEOPLE_API_TOKEN'),
    ]);
    if (!apiUrl || !apiToken) {
      throw new Error(
        'QPeople is not configured. Set the API URL and API token in Settings → Integrations.',
      );
    }
    return { apiUrl: apiUrl.replace(/\/+$/, ''), apiToken };
  }

  private async fetchEmployees(): Promise<any[]> {
    const { apiUrl, apiToken } = await this.getConfig();
    const response = await fetch(`${apiUrl}${EMPLOYEES_ENDPOINT}`, {
      headers: { Authorization: `token ${apiToken}` },
    });
    if (!response.ok) {
      throw new Error(
        `QPeople API request failed with status ${response.status}`,
      );
    }
    const json: any = await response.json();
    return json.message?.data || [];
  }

  /** Lightweight connectivity/credentials check for the admin UI. */
  async testConnection() {
    const employees = await this.fetchEmployees();
    return {
      success: true,
      message: `Connection successful. ${employees.length} employees visible.`,
    };
  }

  // Departments come from QPeople as free text; match against the master
  // case-insensitively and auto-create missing ones so HR data is never lost.
  private async resolveDepartment(
    name: string,
    cache: Map<string, Department>,
  ): Promise<Department | null> {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const cacheKey = trimmed.toLowerCase();
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    let department = await this.departmentRepository.findOne({
      where: { name: ILike(trimmed) },
    });
    if (!department) {
      department = await this.departmentRepository.save(
        this.departmentRepository.create({
          name: trimmed,
          description: 'Auto-created by QPeople sync',
          isActive: true,
        }),
      );
      this.logger.log(`Auto-created department "${trimmed}"`);
    }
    cache.set(cacheKey, department);
    return department;
  }

  async syncUsers() {
    this.logger.log('Starting QPeople HRMS user sync...');

    const employees = await this.fetchEmployees();

    const employeeRole = await this.roleRepository.findOneBy({
      name: 'Standard User',
    });
    if (!employeeRole) {
      this.logger.warn(
        'Default "Standard User" role not found. New users will be created without a role.',
      );
    }

    const departmentCache = new Map<string, Department>();
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      const name = emp.employee_name || emp.name || '';
      const email =
        emp.user_id || emp.prefered_email || emp.company_email || '';
      const qpeopleId = emp.employee || emp.name || '';

      if (!email || !name) {
        skippedCount++;
        continue;
      }

      const department = await this.resolveDepartment(
        emp.department || emp.department_name || '',
        departmentCache,
      );
      const designation = emp.designation || '';
      const reportingManagerName = emp.reporting_manager_name || '';

      let user = await this.userRepository.findOne({
        where: [
          ...(qpeopleId ? [{ qpeopleId }] : []),
          { email: ILike(email) },
        ],
      });

      if (!user) {
        const nameParts = name.trim().split(/\s+/);
        user = this.userRepository.create({
          email,
          qpeopleId: qpeopleId || null,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || null,
          isActive: true,
          role: employeeRole,
          // Same convention as the Azure sync: an unusable password value so
          // local login can never succeed until SSO login exists or an admin
          // performs a reset.
          passwordHash: `SSO:${randomBytes(32).toString('hex')}`,
          isSsoUser: true,
          isVerified: true,
          source: UserSource.QPEOPLE,
          department: department || null,
          designation: designation || null,
          reportingManagerName: reportingManagerName || null,
        });
        createdCount++;
      } else {
        // Refresh HR-owned fields; never touch role, password or source of a
        // pre-existing manual/Azure account beyond linking the QPeople id.
        user.qpeopleId = qpeopleId || user.qpeopleId;
        if (department) user.department = department;
        user.designation = designation || user.designation;
        user.reportingManagerName =
          reportingManagerName || user.reportingManagerName;
        updatedCount++;
      }

      await this.userRepository.save(user);
    }

    this.logger.log(
      `QPeople sync completed. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`,
    );
    return {
      success: true,
      message: 'QPeople HRMS sync completed successfully',
      createdCount,
      updatedCount,
      skippedCount,
      totalProcessed: employees.length,
    };
  }
}
