import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoleMaster from './RoleMaster';

const mockShowToast = jest.fn();
jest.mock('../../context/ToastContext', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ hasPermission: () => true }),
}));

jest.mock('../../services/rbacService', () => ({
    rbacService: {
        getRoles: jest.fn(),
        getPermissions: jest.fn(),
        setRoleStatus: jest.fn(),
        getRoleImpact: jest.fn(),
    },
}));

// RolePermissionMatrix pulls its own service tree — not under test here.
jest.mock('./RolePermissionMatrix', () => () => <div data-testid="matrix" />);

const { rbacService } = jest.requireMock('../../services/rbacService');

const roles = [
    {
        id: 1,
        name: 'Admin',
        description: 'Built-in',
        permissions: [],
        isActive: true,
        isSystem: true,
    },
    {
        id: 2,
        name: 'Manager',
        description: 'Ops',
        permissions: [],
        isActive: true,
        isSystem: false,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    rbacService.getRoles.mockResolvedValue(roles);
    rbacService.getPermissions.mockResolvedValue([]);
    rbacService.getRoleImpact.mockResolvedValue({
        totalAssignedCount: 5,
        activeAssignedCount: 3,
    });
    rbacService.setRoleStatus.mockResolvedValue({ ...roles[1], isActive: false });
});

describe('RoleMaster status management', () => {
    it('disables the toggle for the protected system role', async () => {
        render(<RoleMaster />);
        const adminToggle = await screen.findByRole('checkbox', { name: 'Toggle status for Admin' });
        expect(adminToggle).toBeDisabled();
    });

    it('deactivation shows the impact dialog, then calls the API and toasts on confirm', async () => {
        render(<RoleMaster />);
        const toggle = await screen.findByRole('checkbox', { name: 'Toggle status for Manager' });
        fireEvent.click(toggle);

        // Impact-aware confirmation: active count leads, preserved total mentioned.
        expect(await screen.findByText(/3 active user\(s\) hold "Manager"/)).toBeInTheDocument();
        expect(screen.getByText(/All 5 assignment\(s\) are preserved/)).toBeInTheDocument();
        expect(rbacService.getRoleImpact).toHaveBeenCalledWith(2);
        expect(rbacService.setRoleStatus).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
        await waitFor(() =>
            expect(rbacService.setRoleStatus).toHaveBeenCalledWith(2, false),
        );
        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('Role "Manager" deactivated', 'success'),
        );
    });

    it('cancelling the dialog makes no API call', async () => {
        render(<RoleMaster />);
        const toggle = await screen.findByRole('checkbox', { name: 'Toggle status for Manager' });
        fireEvent.click(toggle);
        await screen.findByText(/3 active user\(s\) hold "Manager"/);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(rbacService.setRoleStatus).not.toHaveBeenCalled();
    });

    it('rolls back the optimistic update and surfaces the server message on failure', async () => {
        rbacService.setRoleStatus.mockRejectedValue({
            response: { data: { message: 'Cannot deactivate: conflict' } },
        });
        render(<RoleMaster />);
        const toggle = await screen.findByRole('checkbox', { name: 'Toggle status for Manager' });
        fireEvent.click(toggle);
        await screen.findByText(/3 active user\(s\) hold "Manager"/);
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('Cannot deactivate: conflict', 'error'),
        );
        // Rolled back to checked
        expect(screen.getByRole('checkbox', { name: 'Toggle status for Manager' })).toBeChecked();
    });
});
