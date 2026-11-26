import { track, attribution } from './analytics';

type Lot = { id: string; type: string; demo: boolean; amount?: number };
type Type = { id: string; label: string; amount?: number; from?: boolean };

export function setupLead(root: HTMLElement) {
  const mode = root.dataset.mode;
  const params = new URLSearchParams(location.search);
  const lots: Lot[] = JSON.parse(root.dataset.lots || '[]');
  const types: Type[] = JSON.parse(root.dataset.types || '[]');
  let lot = lots.find(item => item.id === params.get('lote'));
  let type = types.find(item => item.id === (lot?.type || params.get('tipo')));
  const typeInput = root.querySelector<HTMLSelectElement>('[data-type]');
  const purposeInput = root.querySelector<HTMLSelectElement>('[data-purpose]');
  const summary = root.querySelector<HTMLElement>('[data-selection-summary]')!;
  const simulator = root.querySelector<HTMLElement>('[data-simulator]')!;
  const quotePrice = root.querySelector<HTMLElement>('[data-quote-price]')!;
  const quoteInquiry = root.querySelector<HTMLAnchorElement>('[data-quote-inquiry]')!;
  const form = root.querySelector<HTMLFormElement>('[data-form]');
  const feedback = root.querySelector<HTMLElement>('[data-feedback]');
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  let purpose = mode === 'quote' ? 'cotizacion' : params.get('finalidad') === 'visita' ? 'visita' : 'informacion';
  if (typeInput && type) typeInput.value = type.id;
  if (purposeInput) purposeInput.value = purpose;
  const money = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  const format = (amount: number) => `US$ ${money.format(amount)}`;
  let requestId: string | undefined;
  let submittedBody = '';
  const put = (selector: string, value: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  function update() {
    const context = lot ? `Lote ${lot.id}${lot.demo ? ' (demostración)' : ''}` : type?.label || '';
    summary.hidden = !context;
    summary.textContent = context;
    const amount = lot ? lot.amount : type?.amount;
    simulator.hidden = mode !== 'quote' || !type;
    quotePrice.hidden = !amount;
    quotePrice.textContent = amount ? `${!lot && type?.from ? 'Desde ' : ''}${format(amount)}` : '';
    quoteInquiry.hidden = !!amount;
    const initialPercent = Number(root.dataset.initial);
    const showInitial = !!amount && !!root.dataset.initial && (!type?.from || !!lot);
    root.querySelectorAll<HTMLElement>('[data-initial-row]').forEach(element => { element.hidden = !showInitial; });
    const initial = showInitial ? Math.round(amount * initialPercent) / 100 : 0;
    const balance = showInitial ? amount - initial : 0;
    put('[data-quote-initial]', format(initial));
    put('[data-quote-balance]', format(balance));
    const installments = root.querySelector<HTMLElement>('[data-installments-row]')!;
    installments.hidden = !(showInitial && root.dataset.terms);
    if (!installments.hidden && root.dataset.terms) {
      const { annualEffectiveRate, months } = JSON.parse(root.dataset.terms);
      const rate = Math.expm1(Math.log1p(annualEffectiveRate / 100) / 12);
      const payment = rate ? balance * rate / -Math.expm1(-months * Math.log1p(rate)) : balance / months;
      put('[data-quote-installment]', format(payment));
      put('[data-installment-label]', `Cuota estimada a ${months} meses · TEA ${annualEffectiveRate} %`);
    }
    const action = purpose === 'visita' ? 'coordinar una visita a' : purpose === 'cotizacion' ? 'solicitar una cotización de' : 'pedir información sobre';
    const message = lot?.demo ? `Hola, estoy probando el cotizador de La Nueva Estancia para el lote ficticio ${lot.id}.` :
      `Hola, quisiera ${action} La Nueva Estancia${context ? ` (${context})` : ''}.`;
    root.querySelectorAll<HTMLAnchorElement>('[data-channel]').forEach(link => {
      link.href = `https://wa.me/${link.dataset.channel}?text=${encodeURIComponent(message)}`;
    });
    if (form) form.hidden = !!lot?.demo;
  }
  if (submit) submit.disabled = false;
  update();
  typeInput?.addEventListener('change', () => {
    type = types.find(item => item.id === typeInput.value);
    lot = undefined;
    update();
  });
  purposeInput?.addEventListener('change', () => { purpose = purposeInput.value; update(); });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!feedback || !submit || submit.disabled || lot?.demo) return;
    const fields = new FormData(form);
    const payload = {
      purpose, project: 'la-nueva-estancia', type: type?.id, lot: lot?.id,
      name: fields.get('name'), phone: fields.get('phone'), email: fields.get('email'),
      consent: fields.get('consent') === 'on', website: fields.get('website'), attribution,
    };
    const body = JSON.stringify(payload);
    if (submittedBody !== body || !requestId) requestId = crypto.randomUUID();
    submittedBody = body;
    submit.disabled = true;
    if (typeInput) typeInput.disabled = true;
    if (purposeInput) purposeInput.disabled = true;
    feedback.textContent = 'Enviando solicitud…';
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
        body,
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (result.confirmed !== true) throw new Error();
      if (purpose === 'visita') track('visit_requested');
      if (purpose === 'cotizacion') track('quote_confirmed');
      feedback.textContent = purpose === 'visita' ? 'Solicitud registrada. El equipo de Elíseo te contactará para coordinar la visita.' :
        'Solicitud registrada. Un asesor de Elíseo se comunicará contigo.';
      form.reset();
      if (purposeInput) purposeInput.value = purpose;
      if (typeInput && type) typeInput.value = type.id;
      requestId = undefined;
    } catch {
      feedback.textContent = 'No pudimos confirmar el registro. Reintenta o comunícate por WhatsApp.';
    } finally {
      submit.disabled = false;
      if (typeInput) typeInput.disabled = false;
      if (purposeInput) purposeInput.disabled = false;
    }
  });
}
