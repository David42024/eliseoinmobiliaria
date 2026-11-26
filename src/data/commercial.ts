import data from '../../content/prices.json';

type Approval = { approved: boolean; validFrom: string | null; validTo?: string };
export type Price = Approval & { scope: string; id: string; amount: number; from?: boolean };
type PriceRecord = Omit<Price, 'amount'> & { amount: number | null };
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' }).format(new Date());
const isEffective = (record: Approval) =>
  record.approved && !!record.validFrom && /^\d{4}-\d{2}-\d{2}$/.test(record.validFrom) &&
  record.validFrom <= today && (!record.validTo || today <= record.validTo);

export const publicPrice = (scope: string, id: string) =>
  (data.prices as PriceRecord[])
    .filter((item): item is Price => item.scope === scope && item.id === id && isEffective(item) &&
      typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0)
    .sort((a, b) => b.validFrom!.localeCompare(a.validFrom!))[0];

export function dollars(amount: number) {
  return `US$ ${new Intl.NumberFormat('de-DE', { minimumGroupingDigits: 1, maximumFractionDigits: 2 } as Intl.NumberFormatOptions).format(amount)}`;
}

export const priceLabel = (price?: Price) => price
  ? `${price.from ? 'Desde ' : ''}${dollars(price.amount)}`
  : 'Consultar precio';

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
