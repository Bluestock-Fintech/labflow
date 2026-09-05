export function daysLeft(endDate) {
  const ms = new Date(endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function planStatus(endDate) {
  const d = daysLeft(endDate);
  if (d < 0) return 'expired';
  if (d <= 7) return 'expiring';
  return 'active';
}

export function expiryLabel(endDate) {
  const d = daysLeft(endDate);
  if (d < 0) return `Expired ${Math.abs(d)}d ago`;
  if (d === 0) return 'Expires today';
  return `${d}d left`;
}

export function expiryStyle(endDate) {
  const status = planStatus(endDate);
  return {
    expired: 'bg-red-100 text-red-700',
    expiring: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
  }[status];
}
