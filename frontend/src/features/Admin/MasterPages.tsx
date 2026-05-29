import React from 'react';
import MasterManagement from './MasterManagement';

export const BrandMaster: React.FC = () => (
    <MasterManagement type="Brand" title="Brand" description="Manage asset brands and manufacturers" />
);

export const VendorMaster: React.FC = () => (
    <MasterManagement type="Vendor" title="Vendor" description="Manage suppliers and service providers" />
);

export const ConditionMaster: React.FC = () => (
    <MasterManagement type="Lookup" title="Asset Condition" description="Manage asset physical condition labels" lookupType="ASSET_CONDITION" />
);

export const StatusMaster: React.FC = () => (
    <MasterManagement type="Lookup" title="Asset Status" description="Manage asset lifecycle status labels" lookupType="ASSET_STATUS" />
);

export const DisposalMethodMaster: React.FC = () => (
    <MasterManagement type="Lookup" title="Disposal Method" description="Manage asset disposal methods" lookupType="DISPOSAL_METHOD" />
);

export const PlanMaster: React.FC = () => (
    <MasterManagement type="Plan" title="Plan / Product" description="Manage software license plans and product families" />
);
