"use client";

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: any;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone-400" />
      </div>
      <h3 className="text-sm font-semibold text-stone-700 mb-1">{title}</h3>
      <p className="text-xs text-stone-400 mb-5 max-w-xs">{desc}</p>
      {action}
    </div>
  );
}
