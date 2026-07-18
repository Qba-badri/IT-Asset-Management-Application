import * as fs from 'fs';
import * as path from 'path';
import { PERMISSION_CATALOG, PERMISSION_MODULES } from './permission-catalog';

/** Every .ts file under src, minus specs. */
const sourceFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return sourceFiles(full);
        return e.isFile() && full.endsWith('.ts') && !full.endsWith('.spec.ts') ? [full] : [];
    });

/** Strip block and line comments, so documented examples aren't read as code. */
const stripComments = (text: string): string =>
    text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** Slugs referenced by @Permissions(...) decorators across the codebase. */
const decoratorSlugs = (): Map<string, string> => {
    const found = new Map<string, string>();
    for (const file of sourceFiles(path.join(__dirname, '..'))) {
        const text = stripComments(fs.readFileSync(file, 'utf8'));
        for (const call of text.match(/@Permissions\(([^)]*)\)/g) ?? []) {
            for (const quoted of call.match(/'[^']+'/g) ?? []) {
                found.set(quoted.slice(1, -1), path.relative(path.join(__dirname, '..'), file));
            }
        }
    }
    return found;
};

describe('permission catalog', () => {
    const slugs = PERMISSION_CATALOG.map((p) => p.slug);

    it('has no duplicate slugs', () => {
        expect(slugs).toHaveLength(new Set(slugs).size);
    });

    it('uses lowercase dotted slugs', () => {
        expect(slugs.filter((s) => !/^[a-z-]+(\.[a-z-]+)+$/.test(s))).toEqual([]);
    });

    it('gives every entry a module and a description', () => {
        expect(PERMISSION_CATALOG.filter((p) => !p.module || !p.description)).toEqual([]);
    });

    // The point of the catalog: the admin UI can only offer slugs listed here, so
    // a slug enforced in code but missing here is unreachable through the UI.
    it('contains every slug enforced by a @Permissions decorator', () => {
        const missing = [...decoratorSlugs().entries()]
            .filter(([slug]) => !slugs.includes(slug))
            .map(([slug, file]) => `${slug} (enforced in ${file})`);

        expect(missing).toEqual([]);
    });

    it('finds the decorators at all, so the check above cannot pass vacuously', () => {
        expect(decoratorSlugs().size).toBeGreaterThan(20);
    });

    it('derives modules from the catalog', () => {
        expect(PERMISSION_MODULES).toContain('Dashboard');
        expect(PERMISSION_MODULES).toContain('Vendors');
        expect(PERMISSION_MODULES).toEqual([...PERMISSION_MODULES].sort());
    });
});
