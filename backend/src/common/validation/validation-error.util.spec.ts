import { ValidationError } from 'class-validator';
import { flattenValidationErrors } from './validation-error.util';
import { buildValidationFailure } from './validation-pipe.factory';
import { VALIDATION_FAILURE } from './validation-exception.filter';
import {
  humanizeFieldName,
  resolveValidationMessage,
  VALIDATION_MESSAGE_KEYS,
} from './validation-messages';

function makeError(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError {
  const error = new ValidationError();
  error.property = property;
  if (constraints) error.constraints = constraints;
  if (children) error.children = children;
  return error;
}

describe('flattenValidationErrors', () => {
  it('maps a flat error to field -> messages', () => {
    const errors = [
      makeError('name', { isNotEmpty: 'Name is required.' }),
      makeError('email', { isEmail: 'Email must be valid.' }),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      name: ['Name is required.'],
      email: ['Email must be valid.'],
    });
  });

  it('collects multiple constraints on one field', () => {
    const errors = [
      makeError('password', {
        minLength: 'Too short.',
        matches: 'Needs a digit.',
      }),
    ];

    expect(flattenValidationErrors(errors).password).toHaveLength(2);
  });

  it('dot-paths nested properties', () => {
    const errors = [
      makeError('address', undefined, [
        makeError('city', { isNotEmpty: 'City is required.' }),
      ]),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      'address.city': ['City is required.'],
    });
  });

  it('keeps array indices in the path so form inputs can be matched', () => {
    const errors = [
      makeError('items', undefined, [
        makeError('0', undefined, [
          makeError('name', { isNotEmpty: 'Name is required.' }),
        ]),
      ]),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      'items.0.name': ['Name is required.'],
    });
  });

  it('returns an empty map for no errors', () => {
    expect(flattenValidationErrors([])).toEqual({});
  });
});

describe('buildValidationFailure', () => {
  it('keeps message as a flat string[] for backward compatibility', () => {
    const payload = buildValidationFailure([
      makeError('name', { isNotEmpty: 'Name is required.' }),
      makeError('email', { isEmail: 'Email must be valid.' }),
    ]);

    expect(Array.isArray(payload.message)).toBe(true);
    expect(payload.message).toEqual([
      'Name is required.',
      'Email must be valid.',
    ]);
  });

  it('marks the payload so the filter can identify it', () => {
    const payload = buildValidationFailure([
      makeError('name', { isNotEmpty: 'Name is required.' }),
    ]);

    expect(payload[VALIDATION_FAILURE]).toBe(true);
    expect(payload.errors).toEqual({ name: ['Name is required.'] });
  });
});

describe('humanizeFieldName', () => {
  it.each([
    ['assetTag', 'Asset tag'],
    ['userId', 'User id'],
    ['name', 'Name'],
    ['purchase_date', 'Purchase date'],
    ['totalSeats', 'Total seats'],
  ])('humanizes %s to %s', (input, expected) => {
    expect(humanizeFieldName(input)).toBe(expected);
  });

  it('returns the original when there is nothing to humanize', () => {
    expect(humanizeFieldName('')).toBe('');
  });
});

describe('resolveValidationMessage', () => {
  it('interpolates the label', () => {
    expect(
      resolveValidationMessage(VALIDATION_MESSAGE_KEYS.required, {
        label: 'Asset tag',
      }),
    ).toBe('Asset tag is required.');
  });

  it('interpolates conditional-required context', () => {
    expect(
      resolveValidationMessage(VALIDATION_MESSAGE_KEYS.requiredWhen, {
        label: 'User',
        whenLabel: 'Target type',
        whenValue: 'PERSON',
      }),
    ).toBe('User is required when Target type is PERSON.');
  });

  it('leaves unknown tokens untouched rather than printing undefined', () => {
    expect(resolveValidationMessage(VALIDATION_MESSAGE_KEYS.required, {})).toBe(
      '{label} is required.',
    );
  });

  it('returns the key when the message is unknown', () => {
    expect(resolveValidationMessage('validation.nope')).toBe('validation.nope');
  });
});
