export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'EMERGENCY':
      return '#ef4444';
    case 'HIGH':
      return '#f97316';
    case 'MEDIUM':
      return '#eab308';
    case 'LOW':
    default:
      return '#22c55e';
  }
};
