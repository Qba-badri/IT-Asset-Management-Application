import { isEmptyValue } from './isEmpty';

describe('isEmptyValue', () => {
    describe.each(['text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file'] as const)(
        '%s',
        (type) => {
            it('treats null as empty', () => {
                expect(isEmptyValue(null, type)).toBe(true);
            });
            it('treats undefined as empty', () => {
                expect(isEmptyValue(undefined, type)).toBe(true);
            });
        },
    );

    describe('text', () => {
        it('is empty for an empty string', () => {
            expect(isEmptyValue('', 'text')).toBe(true);
        });
        it('is empty for whitespace only', () => {
            expect(isEmptyValue('   ', 'text')).toBe(true);
        });
        it('is not empty for real text', () => {
            expect(isEmptyValue('LAPTOP-01', 'text')).toBe(false);
        });
        it('is not empty for text with surrounding spaces', () => {
            expect(isEmptyValue('  a  ', 'text')).toBe(false);
        });
    });

    describe('number', () => {
        // The classic bug: `if (!value)` treats 0 as missing.
        it('does NOT treat 0 as empty', () => {
            expect(isEmptyValue(0, 'number')).toBe(false);
        });
        it('does not treat a negative number as empty', () => {
            expect(isEmptyValue(-1, 'number')).toBe(false);
        });
        it('treats NaN as empty', () => {
            expect(isEmptyValue(NaN, 'number')).toBe(true);
        });
        it('treats an empty string as empty', () => {
            expect(isEmptyValue('', 'number')).toBe(true);
        });
        it('treats a non-numeric string as empty', () => {
            expect(isEmptyValue('abc', 'number')).toBe(true);
        });
        it('accepts a numeric string from an uncoerced input', () => {
            expect(isEmptyValue('0', 'number')).toBe(false);
        });
    });

    describe('checkbox', () => {
        // Required checkbox means "must be checked" — distinct from unset.
        it('treats false as empty', () => {
            expect(isEmptyValue(false, 'checkbox')).toBe(true);
        });
        it('does not treat true as empty', () => {
            expect(isEmptyValue(true, 'checkbox')).toBe(false);
        });
    });

    describe('multiselect', () => {
        it('treats an empty array as empty', () => {
            expect(isEmptyValue([], 'multiselect')).toBe(true);
        });
        it('does not treat a populated array as empty', () => {
            expect(isEmptyValue(['a'], 'multiselect')).toBe(false);
        });
        it('treats a non-array as empty', () => {
            expect(isEmptyValue('a', 'multiselect')).toBe(true);
        });
    });

    describe('date', () => {
        it('treats an empty string as empty', () => {
            expect(isEmptyValue('', 'date')).toBe(true);
        });
        it('treats an unparseable string as empty', () => {
            expect(isEmptyValue('not-a-date', 'date')).toBe(true);
        });
        it('treats an Invalid Date as empty', () => {
            expect(isEmptyValue(new Date('nope'), 'date')).toBe(true);
        });
        it('does not treat an ISO string as empty', () => {
            expect(isEmptyValue('2026-07-16', 'date')).toBe(false);
        });
        it('does not treat a valid Date as empty', () => {
            expect(isEmptyValue(new Date('2026-07-16'), 'date')).toBe(false);
        });
        it('does not treat the unix epoch as empty', () => {
            expect(isEmptyValue(new Date(0), 'date')).toBe(false);
        });
    });

    describe('select', () => {
        it('treats an empty string as empty', () => {
            expect(isEmptyValue('', 'select')).toBe(true);
        });
        it('treats the placeholder option as empty', () => {
            expect(isEmptyValue('-- Select --', 'select')).toBe(true);
        });
        it('does not treat a real option as empty', () => {
            expect(isEmptyValue('PERSON', 'select')).toBe(false);
        });
        it('does not treat a numeric id as empty', () => {
            expect(isEmptyValue(3, 'select')).toBe(false);
        });
    });

    describe('file', () => {
        it('treats an empty file list as empty', () => {
            expect(isEmptyValue([], 'file')).toBe(true);
        });
        it('treats a zero-byte file as empty', () => {
            const file = new File([], 'empty.png', { type: 'image/png' });
            expect(isEmptyValue(file, 'file')).toBe(true);
        });
        it('does not treat a real file as empty', () => {
            const file = new File(['data'], 'photo.png', { type: 'image/png' });
            expect(isEmptyValue(file, 'file')).toBe(false);
        });
        it('does not treat an existing upload URL as empty', () => {
            expect(isEmptyValue('/uploads/assets/a.png', 'file')).toBe(false);
        });
    });
});
