import { ReactNode } from "react";

type Props = {
  controlId?: string; // 👈 Add the "?" here to make it optional!
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
};

export default function ControlCard({
  controlId,
  title,
  description,
  icon,
  children,
}: Props) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 shadow-lg hover:shadow-blue-500/20 transition">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-blue-400">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {description && (
        <p className="text-sm text-slate-400 mb-4">
          {description}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        {children}
      </div>
    </div>
  );
}