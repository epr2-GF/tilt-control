
import { ReactNode } from "react";

type SensorCardProps = {
  title: string;
  description?: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
};

export default function SensorCard({
  title,
  description,
  value,
  unit,
  icon,
}: SensorCardProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 shadow-lg hover:border-blue-500 hover:shadow-blue-500/20 transition-all duration-300">

      <div className="flex items-center gap-3 mb-2">

        {icon && (
          <div className="text-blue-400">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>

      </div>

      {description && (
        <p className="text-sm text-slate-400 mb-4">
          {description}
        </p>
      )}

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

