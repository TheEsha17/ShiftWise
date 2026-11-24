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
const mk = (id, off, type, dept, loc, status = 'Confirmed') => ({ id, date: addDays(TODAY, off), type, dept, loc, status });
export const MY_SHIFTS = [
  mk('s1', 0, 'early', 'Floor Service', 'Downtown Café'), mk('s2', 1, 'early', 'Floor Service', 'Downtown Café'),
  mk('s3', 3, 'late', 'Bar', 'Harbour Branch'), mk('s4', 4, 'mid', 'Floor Service', 'Downtown Café', 'Pending swap'),
  mk('s5', 6, 'early', 'Floor Service', 'Downtown Café'), mk('s6', 7, 'late', 'Bar', 'Harbour Branch'),
  mk('s7', 9, 'mid', 'Floor Service', 'Downtown Café'), mk('s8', 11, 'early', 'Floor Service', 'Downtown Café'),
];
export const OPEN_SHIFTS = [
  mk('o1', 2, 'late', 'Bar', 'Harbour Branch', 'Open'), mk('o2', 5, 'early', 'Kitchen', 'Downtown Café', 'Open'),
  mk('o3', 5, 'mid', 'Floor Service', 'Airport Kiosk', 'Open'), mk('o4', 8, 'late', 'Floor Service', 'Downtown Café', 'Urgent'),
  mk('o5', 10, 'early', 'Bar', 'Harbour Branch', 'Open'), mk('o6', 12, 'mid', 'Kitchen', 'Airport Kiosk', 'Open'),
];
export const SWAPS = [
  { id: 'w1', dir: 'mine', who: 'Omar T.', mine: 's3', theirs: 'Fri · Mid 11:00–19:00', status: 'Pending' },
  { id: 'w2', dir: 'mine', who: 'Jon L.', mine: 's1', theirs: 'Sat · Early 07:00–15:00', status: 'Approved' },
  { id: 'w3', dir: 'mine', who: 'Maya R.', mine: 's6', theirs: 'Mon · Mid 11:00–19:00', status: 'Rejected' },
  { id: 'w4', dir: 'in', who: 'Aisha K.', mine: 's5', theirs: 'Thu · Late 15:00–23:00', status: 'Pending' },
  { id: 'w5', dir: 'in', who: 'Jon L.', mine: 's8', theirs: 'Wed · Early 07:00–15:00', status: 'Pending' },
];
export const LEAVES = [
  { id: 'l1', type: 'Annual leave', from: addDays(TODAY, 20), to: addDays(TODAY, 24), reason: 'Family trip', status: 'Approved' },
  { id: 'l2', type: 'Sick leave', from: addDays(TODAY, -30), to: addDays(TODAY, -29), reason: 'Flu', status: 'Approved' },
  { id: 'l3', type: 'Personal', from: addDays(TODAY, -60), to: addDays(TODAY, -60), reason: 'Appointment', status: 'Rejected' },
  { id: 'l4', type: 'Annual leave', from: addDays(TODAY, 40), to: addDays(TODAY, 41), reason: 'Long weekend', status: 'Pending' },
];
export const NOTIFS = [
  { id: 'n1', title: 'New shift assigned', body: 'Late shift at Harbour Branch added to your schedule.', time: '10 min ago', read: false },
  { id: 'n2', title: 'Shift swap approved', body: 'Jon L. accepted your Early shift swap.', time: '2 h ago', read: false },
  { id: 'n3', title: 'Leave request updated', body: 'Your annual leave request was approved.', time: 'Yesterday', read: false },
  { id: 'n4', title: 'Upcoming shift reminder', body: 'Your Early shift starts tomorrow at 07:00.', time: 'Yesterday', read: true },
];
export const ATT = [
  { id: 'a1', date: addDays(TODAY, -1), in: '06:58', out: '15:04', late: false },
  { id: 'a2', date: addDays(TODAY, -2), in: '15:12', out: '23:01', late: true },
  { id: 'a3', date: addDays(TODAY, -4), in: '07:00', out: '15:00', late: false },
  { id: 'a4', date: addDays(TODAY, -5), in: '11:03', out: '19:10', late: true },
  { id: 'a5', date: addDays(TODAY, -6), in: '06:55', out: '15:02', late: false },
];
export const hrs = () => 8;
 
