import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { InventoryManagementService } from './inventory-mgmt.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
    CreateInventoryCategoryDto,
    CreateInventoryItemDto,
    CreateInventoryPurchaseDto,
    CreateInventoryAssignmentDto,
    CreateInventoryReturnDto,
} from './dto/inventory-mgmt.dto';

@Controller('api/inventory-management')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryManagementController {
    constructor(private readonly service: InventoryManagementService) { }

    @Get('dashboard')
    @Permissions('inventory-mgmt.view')
    async getDashboard() {
        return this.service.getDashboardStats();
    }

    // --- Categories ---
    @Post('categories')
    @Permissions('inventory-mgmt.manage')
    async createCategory(@Body() dto: CreateInventoryCategoryDto) {
        return this.service.createCategory(dto);
    }

    @Get('categories')
    @Permissions('inventory-mgmt.view')
    async getCategories() {
        return this.service.findAllCategories();
    }

    @Get('categories/:id')
    @Permissions('inventory-mgmt.view')
    async getCategory(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOneCategory(id);
    }

    @Put('categories/:id')
    @Permissions('inventory-mgmt.manage')
    async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateInventoryCategoryDto) {
        return this.service.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @Permissions('inventory-mgmt.manage')
    async deleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.service.deleteCategory(id);
    }

    // --- Items ---
    @Post('items')
    @Permissions('inventory-mgmt.manage')
    async createItem(@Body() dto: CreateInventoryItemDto) {
        return this.service.createItem(dto);
    }

    @Get('items')
    @Permissions('inventory-mgmt.view')
    async getItems() {
        return this.service.findAllItems();
    }

    @Get('items/:id')
    @Permissions('inventory-mgmt.view')
    async getItem(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOneItem(id);
    }

    @Put('items/:id')
    @Permissions('inventory-mgmt.manage')
    async updateItem(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateInventoryItemDto) {
        return this.service.updateItem(id, dto);
    }

    @Delete('items/:id')
    @Permissions('inventory-mgmt.manage')
    async deleteItem(@Param('id', ParseIntPipe) id: number) {
        return this.service.deleteItem(id);
    }

    // --- Purchases ---
    @Post('purchases')
    @Permissions('inventory-mgmt.manage')
    async createPurchase(@Body() dto: CreateInventoryPurchaseDto, @Req() req: any) {
        return this.service.createPurchase(dto, req.user.id);
    }

    @Get('purchases')
    @Permissions('inventory-mgmt.view')
    async getPurchases() {
        return this.service.getPurchases();
    }

    // --- Assignments ---
    @Post('assignments')
    @Permissions('inventory-mgmt.manage')
    async createAssignment(@Body() dto: CreateInventoryAssignmentDto, @Req() req: any) {
        return this.service.createAssignment(dto, req.user.id);
    }

    @Get('assignments')
    @Permissions('inventory-mgmt.view')
    async getAssignments(@Query('userId') userId?: string, @Req() req?: any) {
        // If user is not admin/manager, they can only see their own assignments
        const userRole = req.user.role?.name;
        const currentUserId = req.user.id;

        if (userRole !== 'Admin' && userRole !== 'Manager') {
            return this.service.getAssignments(currentUserId);
        }

        return this.service.getAssignments(userId ? parseInt(userId) : undefined);
    }

    @Post('assignments/:id/return')
    @Permissions('inventory-mgmt.manage')
    async returnAssignment(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: { condition?: string; remarks?: string },
        @Req() req: any
    ) {
        return this.service.returnAssignment(id, dto, req.user.id);
    }

    // --- Returns ---
    @Post('returns')
    @Permissions('inventory-mgmt.manage')
    async createReturn(@Body() dto: CreateInventoryReturnDto, @Req() req: any) {
        return this.service.createReturn(dto, req.user.id);
    }

    // --- Transactions ---
    @Get('transactions')
    @Permissions('inventory-mgmt.view')
    async getTransactions(@Query('itemId') itemId?: string) {
        return this.service.getStockHistory(itemId ? parseInt(itemId) : undefined);
    }
}
