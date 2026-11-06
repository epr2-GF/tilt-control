import { ReactNode } from "react";

type ZoneHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function ZoneHeader({
  title,
  subtitle,
  icon,
  action,
}: ZoneHeaderProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <div className="shrink-0 text-blue-400">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white whitespace-normal break-words">
  {title}
</h1>

            {subtitle && (
              <p className="text-xs text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}