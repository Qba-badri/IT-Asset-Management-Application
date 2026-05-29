import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import 'isomorphic-fetch';

@Injectable()
export class AzureSyncService implements OnModuleInit {
  private readonly logger = new Logger(AzureSyncService.name);
  private graphClient: Client;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  onModuleInit() {
    this.initializeGraphClient();
  }

  private initializeGraphClient() {
    const tenantId = this.configService.get<string>('AZURE_TENANT_ID');
    const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AZURE_CLIENT_SECRET');

    if (
      !tenantId ||
      !clientId ||
      !clientSecret ||
      tenantId === 'your-tenant-id'
    ) {
      this.logger.warn(
        'Azure AD configuration is missing or using placeholders. Sync will not work.',
      );
      return;
    }

    try {
      const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret,
      );
      const authProvider = new TokenCredentialAuthenticationProvider(
        credential,
        {
          scopes: ['https://graph.microsoft.com/.default'],
        },
      );

      this.graphClient = Client.initWithMiddleware({ authProvider });
      this.logger.log('Azure Graph Client initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Azure Graph Client:',
        error.message,
      );
    }
  }

  async syncUsers() {
    if (!this.graphClient) {
      this.initializeGraphClient();
      if (!this.graphClient) {
        throw new Error(
          'Graph client not initialized. Please configure Azure AD credentials in .env file.',
        );
      }
    }

    this.logger.log('Starting Azure AD user sync...');

    try {
      let allAdUsers = [];
      let response = await this.graphClient
        .api('/users')
        .select(
          'id,displayName,givenName,surname,mail,userPrincipalName,accountEnabled,jobTitle,mobilePhone,officeLocation',
        )
        .get();

      allAdUsers = [...response.value];

      // Handle pagination if more than 100 users
      while (response['@odata.nextLink']) {
        response = await this.graphClient
          .api(response['@odata.nextLink'])
          .get();
        allAdUsers = [...allAdUsers, ...response.value];
      }

      const employeeRole = await this.roleRepository.findOneBy({
        name: 'Employee',
      });
      if (!employeeRole) {
        this.logger.warn(
          'Default "Employee" role not found. Sync may fail for new users.',
        );
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const adUser of allAdUsers) {
        const email = adUser.mail || adUser.userPrincipalName;
        if (!email) {
          this.logger.warn(
            `Skipping user ${adUser.id} (${adUser.displayName}) as they have no email or UPN.`,
          );
          continue;
        }

        let user = await this.userRepository.findOne({
          where: [{ azureId: adUser.id }, { email: email }],
        });

        if (!user) {
          user = this.userRepository.create({
            email: email,
            azureId: adUser.id,
            firstName: adUser.givenName || adUser.displayName.split(' ')[0],
            lastName:
              adUser.surname ||
              adUser.displayName.split(' ').slice(1).join(' '),
            isActive: adUser.accountEnabled !== false, // Default to true if not specified
            role: employeeRole,
            passwordHash: 'AZURE_AD_SYNCED', // Placeholder for synced users
            location: adUser.officeLocation || '',
            phoneNumber: adUser.mobilePhone || '',
            isVerified: true,
          });
          createdCount++;
        } else {
          // Update existing user
          user.azureId = adUser.id;
          user.firstName = adUser.givenName || user.firstName;
          user.lastName = adUser.surname || user.lastName;
          user.isActive = adUser.accountEnabled !== false;
          user.location = adUser.officeLocation || user.location;
          user.phoneNumber = adUser.mobilePhone || user.phoneNumber;
          updatedCount++;
        }

        await this.userRepository.save(user);
      }

      this.logger.log(
        `Sync completed. Created: ${createdCount}, Updated: ${updatedCount}`,
      );
      return {
        success: true,
        message: 'Azure AD sync completed successfully',
        createdCount,
        updatedCount,
        totalProcessed: allAdUsers.length,
      };
    } catch (error) {
      this.logger.error('Error during Azure AD sync:', error.message);
      throw new Error(`Azure AD Sync Failed: ${error.message}`);
    }
  }
}
