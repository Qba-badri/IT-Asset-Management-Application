import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { SelectItem } from '../ui/select';

/**
 * SelectField exists so a Radix Select can live inside FormField. FormField
 * clones the id, aria attributes and className onto its child, but Radix's
 * Select root renders no DOM — without the adapter those props would vanish,
 * leaving the control unlabelled for assistive tech and unstyled when in error.
 */
describe('SelectField inside FormField', () => {
    const renderField = (props: { required?: boolean; error?: string } = {}) =>
        render(
            <FormField id="condition" label="Condition" {...props}>
                <SelectField value="good" onValueChange={() => { }} placeholder="Pick one">
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                </SelectField>
            </FormField>,
        );

    it('lands the id on the focusable trigger', () => {
        renderField();
        expect(document.getElementById('condition')).toHaveAttribute('role', 'combobox');
    });

    it('forwards aria-required to the trigger', () => {
        renderField({ required: true });
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
    });

    it('forwards aria-invalid when in error', () => {
        renderField({ error: 'Condition is required.' });
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('links the trigger to its error message', () => {
        renderField({ error: 'Condition is required.' });
        expect(screen.getByRole('combobox')).toHaveAttribute(
            'aria-describedby',
            'condition-error',
        );
    });

    it('still renders the asterisk and the message', () => {
        renderField({ required: true, error: 'Condition is required.' });
        expect(screen.getByText('*')).toBeInTheDocument();
        expect(screen.getByText('Condition is required.')).toBeInTheDocument();
    });

    it('applies the error styling the field passes down', () => {
        renderField({ error: 'Condition is required.' });
        expect(screen.getByRole('combobox').className).toContain('border-destructive');
    });
});
