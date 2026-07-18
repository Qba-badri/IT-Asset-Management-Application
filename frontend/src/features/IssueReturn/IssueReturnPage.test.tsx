import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IssueReturnPage from './IssueReturnPage';
import { catalogService } from '../../services/catalogService';
import { assetUnitsService } from '../../services/assetUnitsService';
import { assignmentsService } from '../../services/assignmentsService';
import { locationsService } from '../../services/lookupService';
import { fetchFormSchema, FormSchema } from '../../services/schemaService';

jest.mock('../../services/catalogService');
jest.mock('../../services/assetUnitsService');
jest.mock('../../services/assignmentsService');
jest.mock('../../services/lookupService');
jest.mock('../../services/schemaService', () => ({
    ...jest.requireActual('../../services/schemaService'),
    fetchFormSchema: jest.fn(),
}));

// `mock`-prefixed so jest.mock's factory may reference it (the factory is
// hoisted above the declarations).
const mockShowToast = jest.fn();
jest.mock('../../context/ToastContext', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

/** Mirrors what ValidationSchemaService reflects from IssueDto. */
const issueSchema: FormSchema = {
    formKey: 'assignment.issue',
    buildId: 'test',
    fields: [
        { name: 'catalogItemId', type: 'number', required: true, rules: {} },
        { name: 'assetUnitId', type: 'number', required: false, rules: {} },
        { name: 'assigneeId', type: 'number', required: true, rules: { min: 1 } },
        { name: 'quantity', type: 'number', required: false, rules: { min: 1 } },
        { name: 'locationId', type: 'number', required: false, rules: {} },
        { name: 'departmentId', type: 'number', required: false, rules: {} },
        { name: 'dueDate', type: 'date', required: false, rules: {} },
        { name: 'notes', type: 'text', required: false, rules: {} },
    ],
};

/** Mirrors what ValidationSchemaService reflects from ReturnDto. */
const returnSchema: FormSchema = {
    formKey: 'assignment.return',
    buildId: 'test',
    fields: [
        { name: 'assignmentId', type: 'number', required: true, rules: {} },
        { name: 'quantity', type: 'number', required: false, rules: { min: 1 } },
        {
            name: 'condition',
            type: 'select',
            required: false,
            rules: { options: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'] },
        },
        { name: 'returnToLocationId', type: 'number', required: false, rules: {} },
        { name: 'notes', type: 'text', required: false, rules: {} },
    ],
};

const serializedItem = {
    id: 1, sku: 'LAP-01', name: 'ThinkPad', trackMode: 'serialized',
    returnPolicy: 'returnable', brand: 'Lenovo', model: 'T14',
};
const bulkItem = {
    id: 2, sku: 'CBL-01', name: 'USB Cable', trackMode: 'bulk_qty',
    returnPolicy: 'consumable', brand: 'Generic', model: 'C',
};

const mockFetchSchema = fetchFormSchema as jest.MockedFunction<typeof fetchFormSchema>;

beforeEach(() => {
    jest.clearAllMocks();

    mockFetchSchema.mockImplementation(async (formKey: string) =>
        formKey === 'assignment.issue' ? issueSchema : returnSchema,
    );

    (catalogService.getAll as jest.Mock).mockResolvedValue({
        data: [serializedItem, bulkItem],
    });
    (locationsService.getAll as jest.Mock).mockResolvedValue([
        { id: 10, name: 'Main Warehouse' },
        { id: 11, name: 'Branch Office' },
    ]);
    (assetUnitsService.getAll as jest.Mock).mockResolvedValue({
        data: [{ id: 100, assetTag: 'LAP-0001', serialNumber: 'SN1', condition: 'good' }],
    });
    (assignmentsService.issue as jest.Mock).mockResolvedValue({});
    (assignmentsService.processReturn as jest.Mock).mockResolvedValue({});
    (assignmentsService.getHoldings as jest.Mock).mockResolvedValue({ data: [] });
});

/** Picks a catalog item through the search box, as a user would. */
async function selectCatalogItem(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.type(screen.getByPlaceholderText(/search catalog/i), name);
    await user.click(await screen.findByRole('button', { name: new RegExp(name, 'i') }));
    // The schema drives required-ness, so wait for it before interacting.
    await waitFor(() => expect(document.getElementById('assigneeId')).toBeInTheDocument());
}

/**
 * Submits the form the named button belongs to.
 *
 * jsdom 16 (pinned by react-scripts) does not implement form submission, so a
 * click on a submit button never fires onSubmit — verified directly. Dispatching
 * the submit event on the button's own form is the closest faithful stand-in
 * without reshaping the component around the test.
 */
function submitForm(name: RegExp) {
    const button = screen.getByRole('button', { name });
    fireEvent.submit(button.closest('form')!);
}

describe('IssueReturnPage — issue form', () => {
    it('marks Assign To as required with an asterisk', async () => {
        const user = userEvent.setup();
        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'ThinkPad');

        const label = await screen.findByText(/Assign To \(Employee ID\)/i);
        expect(within(label.closest('label')!).getByText('*')).toBeInTheDocument();
    });

    it('marks the assignee input aria-required', async () => {
        const user = userEvent.setup();
        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'ThinkPad');

        await waitFor(() =>
            expect(document.getElementById('assigneeId')).toHaveAttribute('aria-required', 'true'),
        );
    });

    // Previously these fields carried a bare HTML `required` attribute, which
    // blocks submit with a browser tooltip and no in-page message.
    it('blocks submit and shows a field message when the assignee is empty', async () => {
        const user = userEvent.setup();
        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'ThinkPad');

        submitForm(/issue item/i);

        expect(await screen.findByText('Assign To (Employee ID) is required.')).toBeInTheDocument();
        expect(assignmentsService.issue).not.toHaveBeenCalled();
    });

    /**
     * The assignee input coerces an empty value to 0, and 0 is a legitimate
     * number in general — so required alone cannot catch it. The DTO's @Min(1)
     * reaches the client through the schema and does.
     */
    it('rejects an assignee id of 0 via the schema min rule', async () => {
        const user = userEvent.setup();
        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'ThinkPad');

        await user.type(document.getElementById('assigneeId')!, '0');
        submitForm(/issue item/i);

        expect(
            await screen.findByText('Assign To (Employee ID) must be at least 1.'),
        ).toBeInTheDocument();
        expect(assignmentsService.issue).not.toHaveBeenCalled();
    });

    describe('serialized items', () => {
        it('requires an asset unit, mirroring the server rule', async () => {
            const user = userEvent.setup();
            render(<IssueReturnPage />);
            await selectCatalogItem(user, 'ThinkPad');

            await user.type(document.getElementById('assigneeId')!, '5');
            submitForm(/issue item/i);

            expect(
                await screen.findByText('Select Asset Unit is required for serialized items.'),
            ).toBeInTheDocument();
            expect(assignmentsService.issue).not.toHaveBeenCalled();
        });

        it('does not ask for a bulk quantity or location', async () => {
            const user = userEvent.setup();
            render(<IssueReturnPage />);
            await selectCatalogItem(user, 'ThinkPad');

            await waitFor(() => expect(document.getElementById('assigneeId')).toBeInTheDocument());
            expect(document.getElementById('locationId')).not.toBeInTheDocument();
        });
    });

    describe('bulk_qty items', () => {
        it('requires quantity and location, mirroring the server rule', async () => {
            const user = userEvent.setup();
            render(<IssueReturnPage />);
            await selectCatalogItem(user, 'USB Cable');

            await user.type(document.getElementById('assigneeId')!, '5');
            submitForm(/issue item/i);

            expect(await screen.findByText('Quantity is required.')).toBeInTheDocument();
            expect(
                screen.getByText('Issue From Location is required for bulk items.'),
            ).toBeInTheDocument();
            expect(assignmentsService.issue).not.toHaveBeenCalled();
        });

        it('reports a quantity of 0 with the min message, not the required one', async () => {
            const user = userEvent.setup();
            render(<IssueReturnPage />);
            await selectCatalogItem(user, 'USB Cable');

            await user.type(document.getElementById('quantity')!, '0');
            submitForm(/issue item/i);

            expect(await screen.findByText('Quantity must be at least 1.')).toBeInTheDocument();
        });

        it('does not ask for an asset unit', async () => {
            const user = userEvent.setup();
            render(<IssueReturnPage />);
            await selectCatalogItem(user, 'USB Cable');

            await waitFor(() => expect(document.getElementById('quantity')).toBeInTheDocument());
            expect(document.getElementById('assetUnitId')).not.toBeInTheDocument();
        });
    });

    it('maps a server 400 back onto the field that caused it', async () => {
        const user = userEvent.setup();
        (assignmentsService.issue as jest.Mock).mockRejectedValue({
            fieldErrors: { assigneeId: 'Assignee #99 not found.' },
            friendlyMessage: 'Assignee #99 not found.',
        });

        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'USB Cable');

        await user.type(document.getElementById('assigneeId')!, '99');
        await user.type(document.getElementById('quantity')!, '2');
        await user.click(document.getElementById('locationId')!);
        // Radix renders both a listbox option and a hidden native <option>, so
        // the text alone is ambiguous — target the one a user can click.
        await user.click(await screen.findByRole('option', { name: 'Main Warehouse' }));
        submitForm(/issue item/i);

        expect(await screen.findByText('Assignee #99 not found.')).toBeInTheDocument();
    });

    it('submits a valid bulk issue', async () => {
        const user = userEvent.setup();
        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'USB Cable');

        await user.type(document.getElementById('assigneeId')!, '5');
        await user.type(document.getElementById('quantity')!, '3');
        await user.click(document.getElementById('locationId')!);
        // Radix renders both a listbox option and a hidden native <option>, so
        // the text alone is ambiguous — target the one a user can click.
        await user.click(await screen.findByRole('option', { name: 'Main Warehouse' }));
        submitForm(/issue item/i);

        await waitFor(() => expect(assignmentsService.issue).toHaveBeenCalled());
        expect((assignmentsService.issue as jest.Mock).mock.calls[0][0]).toMatchObject({
            catalogItemId: 2,
            assigneeId: 5,
            quantity: 3,
            locationId: 10,
        });
    });

    // The schema is a UX optimization, not the enforcement boundary.
    it('stays usable when the schema cannot be loaded', async () => {
        const user = userEvent.setup();
        mockFetchSchema.mockResolvedValue(null);

        render(<IssueReturnPage />);
        await selectCatalogItem(user, 'ThinkPad');

        await waitFor(() => expect(document.getElementById('assigneeId')).toBeInTheDocument());
        // Cross-field rules still apply; the server validates the rest.
        submitForm(/issue item/i);
        expect(
            await screen.findByText('Select Asset Unit is required for serialized items.'),
        ).toBeInTheDocument();
    });
});

describe('IssueReturnPage — return form', () => {
    const bulkAssignment = {
        id: 50,
        quantity: 10,
        returnedQuantity: 4,
        status: 'active',
        createdAt: new Date().toISOString(),
        catalogItem: { name: 'USB Cable', trackMode: 'bulk_qty' },
        assignee: { firstName: 'Ann', lastName: 'Lee', email: 'ann@x.com' },
    };

    async function openReturnForm(user: ReturnType<typeof userEvent.setup>) {
        (assignmentsService.getHoldings as jest.Mock).mockResolvedValue({
            data: [bulkAssignment],
        });
        render(<IssueReturnPage />);
        await user.click(screen.getByRole('button', { name: /^return$/i }));
        await user.type(screen.getByPlaceholderText(/search by employee/i), 'Ann');
        await user.click(screen.getByRole('button', { name: /^search$/i }));
        await user.click(await screen.findByText(/USB Cable/));
    }

    it('rejects returning more than the remaining quantity', async () => {
        const user = userEvent.setup();
        await openReturnForm(user);

        const quantity = document.getElementById('quantity')!;
        await user.clear(quantity);
        await user.type(quantity, '7'); // remaining is 6

        submitForm(/process return/i);

        expect(
            await screen.findByText('Cannot return more than the 6 remaining.'),
        ).toBeInTheDocument();
        expect(assignmentsService.processReturn).not.toHaveBeenCalled();
    });

    it('accepts a partial return within the remaining quantity', async () => {
        const user = userEvent.setup();
        await openReturnForm(user);

        const quantity = document.getElementById('quantity')!;
        await user.clear(quantity);
        await user.type(quantity, '2');
        submitForm(/process return/i);

        await waitFor(() => expect(assignmentsService.processReturn).toHaveBeenCalled());
        expect((assignmentsService.processReturn as jest.Mock).mock.calls[0][0]).toMatchObject({
            assignmentId: 50,
            quantity: 2,
        });
    });

    it('requires a quantity when cleared', async () => {
        const user = userEvent.setup();
        await openReturnForm(user);

        await user.clear(document.getElementById('quantity')!);
        submitForm(/process return/i);

        expect(await screen.findByText('Return Quantity is required.')).toBeInTheDocument();
    });

    it('maps a server 400 back onto the field', async () => {
        const user = userEvent.setup();
        (assignmentsService.processReturn as jest.Mock).mockRejectedValue({
            fieldErrors: { quantity: 'Only 6 items remain to be returned.' },
            friendlyMessage: 'Only 6 items remain to be returned.',
        });
        await openReturnForm(user);

        submitForm(/process return/i);

        expect(
            await screen.findByText('Only 6 items remain to be returned.'),
        ).toBeInTheDocument();
    });
});
