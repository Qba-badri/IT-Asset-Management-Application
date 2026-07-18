import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
    describe('the required indicator (AC2)', () => {
        it('renders an asterisk for a required field', () => {
            render(
                <FormField id="assetTag" label="Asset Tag" required>
                    <input />
                </FormField>,
            );

            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('renders no asterisk for an optional field', () => {
            render(
                <FormField id="notes" label="Notes">
                    <input />
                </FormField>,
            );

            expect(screen.queryByText('*')).not.toBeInTheDocument();
        });

        it('marks the control aria-required so assistive tech agrees with the asterisk', () => {
            render(
                <FormField id="assetTag" label="Asset Tag" required>
                    <input />
                </FormField>,
            );

            expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
        });

        // Conditional fields flip required-ness as other values change; the
        // asterisk must follow.
        it('drops the asterisk when required becomes false', () => {
            const { rerender } = render(
                <FormField id="userId" label="Assign To User" required>
                    <input />
                </FormField>,
            );
            expect(screen.getByText('*')).toBeInTheDocument();

            rerender(
                <FormField id="userId" label="Assign To User" required={false}>
                    <input />
                </FormField>,
            );
            expect(screen.queryByText('*')).not.toBeInTheDocument();
        });
    });

    describe('error display', () => {
        it('shows the error message', () => {
            render(
                <FormField id="assetTag" label="Asset Tag" required error="Asset tag is required.">
                    <input />
                </FormField>,
            );

            expect(screen.getByText('Asset tag is required.')).toBeInTheDocument();
        });

        it('marks the control aria-invalid when in error', () => {
            render(
                <FormField id="assetTag" label="Asset Tag" error="Asset tag is required.">
                    <input />
                </FormField>,
            );

            expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
        });

        it('links the control to its message via aria-describedby', () => {
            render(
                <FormField id="assetTag" label="Asset Tag" error="Asset tag is required.">
                    <input />
                </FormField>,
            );

            expect(screen.getByRole('textbox')).toHaveAttribute(
                'aria-describedby',
                'assetTag-error',
            );
        });

        it('is not aria-invalid when there is no error', () => {
            render(
                <FormField id="assetTag" label="Asset Tag">
                    <input />
                </FormField>,
            );

            expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
        });
    });
});
