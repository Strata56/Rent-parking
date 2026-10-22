export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calcPrice = (durationHours, pricePerHour) => {
  return (Math.max(1, durationHours) * pricePerHour).toFixed(2);
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'OCCUPIED':
      return 'bg-rose-50 text-rose-700 border-rose-300';
    case 'RESERVED':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'MAINTENANCE':
      return 'bg-slate-100 text-slate-500 border-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
