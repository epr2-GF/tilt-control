import { ReactNode } from "react";

type SensorCardProps = {
  title: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
};

export default function SensorCard({
  title,
  value,
  unit,
  icon,
}: SensorCardProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <div className="text-blue-400">
            {icon}
          </div>
        )}

        <h3 className="text-slate-300 font-medium">
          {title}
        </h3>
      </div>

      <div className="text-3xl font-bold text-white">
        {value}
        {unit && (
          <span className="text-lg text-slate-400 ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}