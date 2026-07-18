import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the currency_rates table and seeds it with the currencies the app
 * already supports (previously a hardcoded map in the frontend, with rates
 * kept in the EXCHANGE_RATES system_settings JSON blob).
 *
 * Rate semantics: rate_to_base = "1 [code] = X INR" (INR is the base, always 1).
 * Rates found in the legacy EXCHANGE_RATES setting take precedence over the
 * seed defaults so existing orgs keep their configured values.
 */
export class AddCurrencyRates1785000000000 implements MigrationInterface {
    name = 'AddCurrencyRates1785000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "currency_rates" (
                "id" SERIAL NOT NULL,
                "code" character varying(3) NOT NULL,
                "name" character varying(100) NOT NULL,
                "symbol" character varying(10) NOT NULL,
                "rate_to_base" numeric(18,8) NOT NULL DEFAULT '1',
                "is_active" boolean NOT NULL DEFAULT true,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_currency_rates_code" UNIQUE ("code"),
                CONSTRAINT "PK_currency_rates_id" PRIMARY KEY ("id")
            )
        `);

        const seed: [string, string, string, number][] = [
            ['INR', 'Indian Rupee', '₹', 1],
            ['USD', 'US Dollar', '$', 88.5],
            ['EUR', 'Euro', '€', 96.4],
            ['GBP', 'British Pound', '£', 112.3],
            ['JPY', 'Japanese Yen', '¥', 0.58],
            ['AUD', 'Australian Dollar', 'A$', 57.8],
            ['CAD', 'Canadian Dollar', 'C$', 63.2],
            ['SGD', 'Singapore Dollar', 'S$', 65.6],
            ['AED', 'UAE Dirham', 'AED ', 24.1],
        ];

        // Prefer rates already configured in the legacy EXCHANGE_RATES setting
        let legacyRates: Record<string, number> = {};
        try {
            const rows: { value: string }[] = await queryRunner.query(
                `SELECT "value" FROM "system_settings" WHERE "key" = 'EXCHANGE_RATES'`,
            );
            if (rows?.[0]?.value) {
                const parsed = JSON.parse(rows[0].value);
                if (parsed && typeof parsed === 'object') legacyRates = parsed;
            }
        } catch {
            // system_settings missing or malformed JSON — fall back to seed defaults
        }

        for (const [code, name, symbol, defaultRate] of seed) {
            const rate = code === 'INR' ? 1 : Number(legacyRates[code]) || defaultRate;
            await queryRunner.query(
                `INSERT INTO "currency_rates" ("code", "name", "symbol", "rate_to_base") VALUES ($1, $2, $3, $4)`,
                [code, name, symbol, rate],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "currency_rates"`);
    }
}
