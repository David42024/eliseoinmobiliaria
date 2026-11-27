import data from '../../content/prices.json';

type Approval = { approved: boolean; validFrom: string | null; validTo?: string };
export type Price = Approval & {
  scope: string;
  id: string;
  amount: number;
  from?: boolean;
  approximate?: boolean;
  perM2?: number;
  stage?: string;
};
type PriceRecord = Omit<Price, 'amount'> & { amount: number | null };
type StageRecord = Approval & { name: string; lotPerM2: number; apartmentPerM2: number };
type AdjustmentRecord = Approval & { location: string; percent: number };
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' }).format(new Date());
const isEffective = (record: Approval) =>
  record.approved && !!record.validFrom && /^\d{4}-\d{2}-\d{2}$/.test(record.validFrom) &&
  record.validFrom <= today && (!record.validTo || today <= record.validTo);
const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const publicPrice = (scope: string, id: string) =>
  (data.prices as PriceRecord[])
    .filter((item): item is Price => item.scope === scope && item.id === id && isEffective(item) &&
      isPositive(item.amount))
    .sort((a, b) => b.validFrom!.localeCompare(a.validFrom!))[0];

export function dollars(amount: number) {
  return `US$ ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
}

export const priceLabel = (price?: Price) => price
  ? `${price.from ? 'Desde ' : price.approximate ? 'Aprox. ' : ''}${dollars(price.amount)}`
  : 'Consultar precio';
export const priceDetails = (price: Price) => [
  isPositive(price.perM2) ? `${dollars(price.perM2)}/m²` : '',
  price.stage?.trim() || '',
].filter(Boolean).join(' · ');

export const publicStages = ((data.proposedRates ?? []) as StageRecord[]).filter(record =>
  isEffective(record) && record.name.trim() && isPositive(record.lotPerM2) && isPositive(record.apartmentPerM2));
export const publicAdjustments = ((data.proposedAdjustments ?? []) as AdjustmentRecord[]).filter(record =>
  isEffective(record) && record.location.trim() && isPositive(record.percent));

const initial: Approval & { percent: number | null } = data.initial;
export const financing = {
  initial: isEffective(initial) && initial.percent !== null && initial.percent >= 0 && initial.percent <= 100 ? initial.percent : null,
  modalities: data.modalities.filter(isEffective),
};

const terms = data.installments as Approval & { annualEffectiveRate: number | null; months: number | null; rule: string | null };
export const installmentTerms = isEffective(terms) && terms.rule === 'cuota-fija-tea'
  && terms.annualEffectiveRate !== null && Number.isFinite(terms.annualEffectiveRate) && terms.annualEffectiveRate >= 0
  && terms.months !== null && Number.isInteger(terms.months) && terms.months > 0
  ? { annualEffectiveRate: terms.annualEffectiveRate, months: terms.months }
  : null;
