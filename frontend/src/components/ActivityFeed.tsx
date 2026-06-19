"use client";

interface ActivityItem {
  id: number;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function dotColor(action: string): string {
  switch (action) {
    case "created": return "bg-emerald-500";
    case "updated": return "bg-blue-500";
    case "sold":    return "bg-amber-500";
    case "deleted": return "bg-red-500";
    default:        return "bg-zinc-500";
  }
}

function actionLabel(action: string, entityType: string, entityName: string): string {
  const name = entityName ? `'${entityName}'` : `${entityType}`;
  switch (action) {
    case "created": return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${name} was created`;
    case "updated": return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${name} was updated`;
    case "sold":    return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${name} was sold`;
    case "deleted": return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${name} was deleted`;
    default:        return `${entityType} ${name}: ${action}`;
  }
}

export default function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const items = activities.slice(0, 5);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl shadow-black/20">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-[var(--text-primary)]">Recent Activity</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Last {items.length} actions</p>
      </div>
      <ul className="px-6 py-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor(item.action)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] leading-snug truncate">
                {actionLabel(item.action, item.entityType, item.entityName)}
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)] shrink-0 mt-0.5">{timeAgo(item.createdAt)}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-[var(--text-muted)] text-center py-4">No activity yet.</li>
        )}
      </ul>
    </div>
  );
}
