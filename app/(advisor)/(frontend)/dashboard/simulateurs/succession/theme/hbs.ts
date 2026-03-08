import Handlebars from 'handlebars';

// Register common helpers
Handlebars.registerHelper('formatCurrency', function (value: any) {
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
});

Handlebars.registerHelper('formatNumber', function (value: any) {
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
});

Handlebars.registerHelper('percent', function (value: any, total: any) {
  const v = Number(value);
  const t = Number(total);
  if (!isFinite(v) || !isFinite(t) || t === 0) return '—';
  return `${Math.round((v / t) * 100)}%`;
});

Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('diff', function (a: any, b: any) {
  const x = Number(a);
  const y = Number(b);
  if (!isFinite(x) || !isFinite(y)) return '—';
  return x - y;
});

Handlebars.registerHelper('abs', function (a: any) {
  const x = Number(a);
  if (!isFinite(x)) return '—';
  return Math.abs(x);
});

Handlebars.registerHelper('gt', function (a: any, b: any) {
  const x = Number(a);
  const y = Number(b);
  if (!isFinite(x) || !isFinite(y)) return false;
  return x > y;
});

Handlebars.registerHelper('and', function (a: any, b: any) {
  return !!a && !!b;
});

Handlebars.registerHelper('or', function (a: any, b: any) {
  return !!a || !!b;
});

export function compileTemplate(templateSource: string, data: any): string {
  const tpl = Handlebars.compile(templateSource, { noEscape: true });
  return tpl(data);
}
