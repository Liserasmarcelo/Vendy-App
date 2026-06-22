interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

const COLOR_CLASSES = {
  primary: 'bg-vendy-primary/20 text-vendy-primary',
  success: 'bg-vendy-success/20 text-vendy-success',
  warning: 'bg-vendy-warning/20 text-vendy-warning',
  danger: 'bg-vendy-danger/20 text-vendy-danger',
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  return (
    <div className="telegram-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-1">{title}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${COLOR_CLASSES[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-vendy-success' : 'text-vendy-danger'}`}>
          {change} vs mes anterior
        </p>
      )}
    </div>
  );
}
