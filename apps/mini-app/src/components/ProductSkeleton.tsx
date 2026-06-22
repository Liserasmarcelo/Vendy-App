export default function ProductSkeleton() {
  return (
    <div className="telegram-card flex gap-4 animate-pulse">
      <div className="w-20 h-20 bg-dark-2 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-dark-2 rounded w-3/4" />
        <div className="h-3 bg-dark-2 rounded w-full" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-dark-2 rounded w-16" />
          <div className="h-8 bg-dark-2 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
