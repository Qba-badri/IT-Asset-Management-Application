"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AzureSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureSyncService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const role_entity_1 = require("../entities/role.entity");
const identity_1 = require("@azure/identity");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
require("isomorphic-fetch");
let AzureSyncService = AzureSyncService_1 = class AzureSyncService {
    constructor(configService, userRepository, roleRepository) {
        this.configService = configService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.logger = new common_1.Logger(AzureSyncService_1.name);
    }
    onModuleInit() {
        this.initializeGraphClient();
    }
    initializeGraphClient() {
        const tenantId = this.configService.get('AZURE_TENANT_ID');
        const clientId = this.configService.get('AZURE_CLIENT_ID');
        const clientSecret = this.configService.get('AZURE_CLIENT_SECRET');
        if (!tenantId ||
            !clientId ||
            !clientSecret ||
            tenantId === 'your-tenant-id') {
            this.logger.warn('Azure AD configuration is missing or using placeholders. Sync will not work.');
            return;
        }
        try {
            const credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
            const authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
                scopes: ['https://graph.microsoft.com/.default'],
            });
            this.graphClient = microsoft_graph_client_1.Client.initWithMiddleware({ authProvider });
            this.logger.log('Azure Graph Client initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Azure Graph Client:', error.message);
        }
    }
    async syncUsers() {
        if (!this.graphClient) {
            this.initializeGraphClient();
            if (!this.graphClient) {
                throw new Error('Graph client not initialized. Please configure Azure AD credentials in .env file.');
            }
        }
        this.logger.log('Starting Azure AD user sync...');
        try {
            let allAdUsers = [];
            let response = await this.graphClient
                .api('/users')
                .select('id,displayName,givenName,surname,mail,userPrincipalName,accountEnabled,jobTitle,mobilePhone,officeLocation')
                .get();
            allAdUsers = [...response.value];
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
                this.logger.warn('Default "Employee" role not found. Sync may fail for new users.');
            }
            let createdCount = 0;
            let updatedCount = 0;
            for (const adUser of allAdUsers) {
                const email = adUser.mail || adUser.userPrincipalName;
                if (!email) {
                    this.logger.warn(`Skipping user ${adUser.id} (${adUser.displayName}) as they have no email or UPN.`);
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
                        lastName: adUser.surname ||
                            adUser.displayName.split(' ').slice(1).join(' '),
                        isActive: adUser.accountEnabled !== false,
                        role: employeeRole,
                        passwordHash: 'AZURE_AD_SYNCED',
                        location: adUser.officeLocation || '',
                        phoneNumber: adUser.mobilePhone || '',
                        isVerified: true,
                    });
                    createdCount++;
                }
                else {
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
            this.logger.log(`Sync completed. Created: ${createdCount}, Updated: ${updatedCount}`);
            return {
                success: true,
                message: 'Azure AD sync completed successfully',
                createdCount,
                updatedCount,
                totalProcessed: allAdUsers.length,
            };
        }
        catch (error) {
            this.logger.error('Error during Azure AD sync:', error.message);
            throw new Error(`Azure AD Sync Failed: ${error.message}`);
        }
    }
};
exports.AzureSyncService = AzureSyncService;
exports.AzureSyncService = AzureSyncService = AzureSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AzureSyncService);
//# sourceMappingURL=azure-sync.service.js.map