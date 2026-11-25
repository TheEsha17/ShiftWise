import { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { TYPES, fmt } from './data';

export const Pill = ({ s }) => {
  const k = { Confirmed: 'ok', Approved: 'ok', Accepted: 'ok', Open: 'ok', Pending: 'wait', 'Pending swap': 'wait', Requested: 'wait', Urgent: 'hot', Rejected: 'no', Cancelled: 'no' }[s] || 'ok';
  return <span className={`pill ${k}`}>{s}</span>;
};

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="ov-bg" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mh"><h3>{title}</h3><button className="ib" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ text }) => <div className="empty"><Check size={20} />{text}</div>;

export function Skeleton() {
  return <div className="skel"><i /><i /><i /><i /></div>;
}

export function ShiftCard({ s, action }) {
  const t = TYPES[s.type];
  const startTime = s.startTime || t.s;
  const endTime = s.endTime || t.e;
  const duration = Math.max(0, (Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5)) - Number(startTime.slice(0, 2)) * 60 - Number(startTime.slice(3, 5)) - (s.breakDuration || 0)) / 60);
  return (
    <article className={`shift t-${t.c}`}>
      <div className="dt"><small>{fmt(s.date, { weekday: 'short' })}</small><b>{s.date.getDate()}</b><small>{fmt(s.date, { month: 'short' })}</small></div>
      <div className="mid">
        <h4>{startTime} – {endTime}</h4>
        <p>{t.label} shift · {duration}h · {s.dept}</p>
        <p className="loc">{s.loc}</p>
      </div>
      <div className="end"><Pill s={s.status} />{action}</div>
    </article>
  );
}
