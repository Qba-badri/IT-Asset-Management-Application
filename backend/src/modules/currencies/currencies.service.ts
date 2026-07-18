import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRate } from '../../entities/currency-rate.entity';

export const BASE_CURRENCY = 'INR';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(CurrencyRate)
    private readonly currencyRepo: Repository<CurrencyRate>,
  ) {}

  async findActive(): Promise<CurrencyRate[]> {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  async findAll(): Promise<CurrencyRate[]> {
    return this.currencyRepo.find({ order: { code: 'ASC' } });
  }

  async create(data: Partial<CurrencyRate>): Promise<CurrencyRate> {
    const code = data.code?.toUpperCase();
    const existing = await this.currencyRepo.findOne({ where: { code } });
    if (existing)
      throw new ConflictException(`Currency "${code}" already exists`);
    return this.currencyRepo.save(this.currencyRepo.create({ ...data, code }));
  }

  async update(id: number, data: Partial<CurrencyRate>): Promise<CurrencyRate> {
    const currency = await this.currencyRepo.findOne({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency #${id} not found`);
    // The base currency's rate is 1 by definition and it must stay selectable
    if (currency.code === BASE_CURRENCY) {
      if (data.rateToBase !== undefined && Number(data.rateToBase) !== 1)
        throw new BadRequestException(`${BASE_CURRENCY} is the base currency; its rate is fixed at 1`);
      if (data.isActive === false)
        throw new BadRequestException(`${BASE_CURRENCY} is the base currency and cannot be deactivated`);
    }
    Object.assign(currency, data);
    return this.currencyRepo.save(currency);
  }

  /** rates[code] = "1 [code] = X INR"; INR is always 1. Includes inactive codes so legacy records still convert. */
  async getRatesMap(): Promise<Record<string, number>> {
    const all = await this.currencyRepo.find();
    const rates: Record<string, number> = {};
    for (const c of all) rates[c.code] = Number(c.rateToBase) || 1;
    rates[BASE_CURRENCY] = 1;
    return rates;
  }
}
