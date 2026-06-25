import { ReactNode } from "react";

type DeviceCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: string;
  children?: ReactNode;
};

export default function DeviceCard({
  title,
  description,
  icon,
  status,
  children,
}: DeviceCardProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 shadow-lg hover:shadow-blue-500/10 transition">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-blue-400">
              {icon}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-white">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

{status && (
  <span
    className={`
      text-xs px-2 py-1 rounded-full
      ${
        status.toLowerCase() === "on" ||
        status.toLowerCase() === "open" ||
        status.toLowerCase() === "running"
          ? "bg-green-600"
          : "bg-slate-700"
      }
    `}
  >
    {status}
  </span>
)}
      </div>

      {/* Actions */}
      {children && (
        <div className="flex flex-wrap gap-2 mt-4">
          {children}
        </div>
      )}
    </div>
  );
}