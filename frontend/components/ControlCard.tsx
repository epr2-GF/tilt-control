import { ReactNode } from "react";

type Props = {
  controlId?: string;
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  status?: string;
  statusColor?: "green" | "red" | "orange" | "yellow" | "blue" | "gray";
  compact?: boolean;
};

const statusClasses = {
  green: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
  red: "bg-rose-500/10 border border-rose-500/30 text-rose-400",
  orange: "bg-orange-500/10 border border-orange-500/30 text-orange-400",
  yellow: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  blue: "bg-blue-500/10 border border-blue-500/30 text-blue-400",
  gray: "bg-slate-700/40 border border-slate-600 text-slate-300",
};

const statusDots = {
  green: "bg-emerald-400",
  red: "bg-rose-500",
  orange: "bg-orange-400",
  yellow: "bg-amber-400",
  blue: "bg-blue-400",
  gray: "bg-slate-400",
};

export default function ControlCard({
  controlId,
  title,
  description,
  icon,
  children,
  status,
  statusColor = "gray",
  compact = false,
}: Props) {
  return (
    <div
      className={`bg-slate-900/70 border border-slate-700 rounded-xl shadow-lg hover:border-blue-500 hover:shadow-blue-500/20 transition-all duration-300 ${
        compact ? "p-3" : "p-5"
      }`}
    >
      {compact ? (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(90px,1fr)] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="shrink-0 text-blue-400">
                {icon}
              </div>

              <h3 className="text-base font-semibold break-words">
                {title}
              </h3>
            </div>

            {description && (
              <p className="mt-1 text-xs text-slate-400 break-words">
                {description}
              </p>
            )}
          </div>

          <div className="min-w-0 [&>button]:w-full">
            {children}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="text-blue-400">{icon}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>

            {status && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[statusColor]}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusDots[statusColor]}`}
                />
                {status}
              </div>
            )}
          </div>

          {description && (
            <p className="text-sm text-slate-400 mb-4">
              {description}
            </p>
          )}

          <div className="flex gap-3 flex-wrap">
            {children}
          </div>
        </>
      )}
    </div>
  );
}