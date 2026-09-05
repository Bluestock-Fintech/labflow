export function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded-md ${className}`} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
