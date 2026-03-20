interface Props {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  onClick?: () => void;
}

export default function StatCard({ label, value, icon, color = 'bg-navy-50', onClick }: Props) {
  return (
    <div
      className={`${color} rounded-xl p-6 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-navy-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
