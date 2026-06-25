import { ReactNode } from "react";

type ZoneHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
};

export default function ZoneHeader({
  title,
  subtitle,
  icon,
}: ZoneHeaderProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className="text-blue-400">
            {icon}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white">
          {title}
        </h1>
      </div>

      {subtitle && (
        <p className="text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}