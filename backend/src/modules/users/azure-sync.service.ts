import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserSource } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { IntegrationSettingsService } from '../settings/integration-settings.service';
import 'isomorphic-fetch';

@Injectable()
export class AzureSyncService {
  private readonly logger = new Logger(AzureSyncService.name);

  constructor(
    private readonly integrationSettings: IntegrationSettingsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // Credentials are admin-configurable at runtime (Settings → Integrations),
  // so the Graph client is built fresh for every sync rather than cached at
  // module init.
  private async buildGraphClient(): Promise<Client> {
    const [tenantId, clientId, clientSecret] = await Promise.all([
      this.integrationSettings.get('AZURE_TENANT_ID'),
      this.integrationSettings.get('AZURE_CLIENT_ID'),
      this.integrationSettings.get('AZURE_CLIENT_SECRET'),
    ]);

    if (
      !tenantId ||
      !clientId ||
      !clientSecret ||
      tenantId === 'your-tenant-id'
    ) {
      throw new Error(
        'Azure AD is not configured. Set the tenant ID, client ID and client secret in Settings → Integrations.',
      );
    }

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });
    return Client.initWithMiddleware({ authProvider });
  }

  /** Lightweight connectivity/credentials check for the admin UI. */
  async testConnection() {
    const client = await this.buildGraphClient();
    await client.api('/users').select('id').top(1).get();
    return { success: true, message: 'Connection successful.' };
  }

  async syncUsers() {
    const graphClient = await this.buildGraphClient();

    this.logger.log('Starting Azure AD user sync...');

    try {
      let allAdUsers = [];
      let response = await graphClient
        .api('/users')
        .select(
          'id,displayName,givenName,surname,mail,userPrincipalName,accountEnabled,jobTitle,mobilePhone,officeLocation',
        )
        .get();

      allAdUsers = [...response.value];

      // Handle pagination if more than 100 users
      while (response['@odata.nextLink']) {
        response = await graphClient.api(response['@odata.nextLink']).get();
        allAdUsers = [...allAdUsers, ...response.value];
      }

      const employeeRole = await this.roleRepository.findOneBy({
        name: 'Standard User',
      });
      if (!employeeRole) {
        this.logger.warn(
          'Default "Standard User" role not found. Sync may fail for new users.',
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
            // SSO-only account: random unusable value (never a valid bcrypt
            // hash, so local login can never succeed) + explicit flag that
            // blocks local password reset/change.
            passwordHash: `SSO:${randomBytes(32).toString('hex')}`,
            isSsoUser: true,
            source: UserSource.AZURE_AD,
            location: adUser.officeLocation || '',
            phoneNumber: adUser.mobilePhone || '',
            isVerified: true,
          });
          createdCount++;
        } else {
          // Update existing user
          // Only flag as SSO-only if the account was originally provisioned by
          // sync (legacy placeholder or SSO marker). A pre-existing local
          // account matched by email keeps its local password.
          if (
            user.isSsoUser ||
            user.passwordHash === 'AZURE_AD_SYNCED' ||
            user.passwordHash?.startsWith('SSO:')
          ) {
            user.isSsoUser = true;
          }
          user.azureId = adUser.id;
          user.firstName = adUser.givenName || user.firstName;
          user.lastName = adUser.surname || user.lastName;
          const nowActive = adUser.accountEnabled !== false;
          // Disabling in Azure AD must immediately revoke any live sessions,
          // mirroring the manual deactivation path in UsersService.update().
          if (user.isActive && !nowActive) {
            user.tokenVersion += 1;
          }
          user.isActive = nowActive;
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
