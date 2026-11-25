const t0 = new Date(); t0.setHours(0, 0, 0, 0);
export const TODAY = t0;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const monday = (d) => addDays(d, -((d.getDay() + 6) % 7));
export const key = (d) => d.toLocaleDateString('en-CA');
export const fmt = (d, o) => d.toLocaleDateString('en-GB', o);
export const TYPES = {
  early: { label: 'Early', s: '07:00', e: '15:00', c: 'a' },
  mid: { label: 'Mid', s: '11:00', e: '19:00', c: 'c' },
  late: { label: 'Late', s: '15:00', e: '23:00', c: 'b' },
};
