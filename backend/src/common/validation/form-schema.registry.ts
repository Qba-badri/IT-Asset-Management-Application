import {
  CreateInventoryAssignmentDto,
  CreateInventoryItemDto,
  CreateInventoryPurchaseDto,
  CreateInventoryReturnDto,
} from '../../modules/consumable-inventory/dto/inventory-mgmt.dto';
import {
  DeployAssetDto,
  UndeployAssetDto,
} from '../../modules/assets/dto/asset.dto';
import {
  IssueDto,
  ReturnDto,
} from '../../modules/assignments/dto/assignment.dto';

/**
 * Maps a stable `formKey` to the DTO that defines its rules.
 *
 * A form's rules are whatever its DTO says — so a form that needs different
 * rules for a different audience gets its own DTO and its own key here, rather
 * than the schema becoming dynamic. Keeping rules static per key is what makes
 * them cacheable and reflectable.
 *
 * Forms are added here as they are migrated; an unregistered form simply has
 * no schema endpoint and keeps its existing client-side behaviour.
 */
export const FORM_SCHEMA_REGISTRY: Record<string, Function> = {
  'asset.deploy': DeployAssetDto,
  'asset.undeploy': UndeployAssetDto,
  'assignment.issue': IssueDto,
  'assignment.return': ReturnDto,
  'inventory-assignment.create': CreateInventoryAssignmentDto,
  'inventory-item.create': CreateInventoryItemDto,
  'inventory-purchase.create': CreateInventoryPurchaseDto,
  'inventory-return.create': CreateInventoryReturnDto,
};
