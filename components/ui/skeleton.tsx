import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-2",
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <Skeleton className="h-9 w-64 mb-3" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <Skeleton className="h-9 w-9 rounded-lg mb-3" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <Skeleton className="h-10 w-10 rounded-lg mb-4" />
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MasterclassSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <Skeleton className="h-9 w-48 mb-3" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl overflow-hidden border border-border">
            <Skeleton className="h-44 rounded-none" />
            <div className="p-5">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4 mb-4" />
              <div className="pt-3 border-t border-border">
                <Skeleton className="h-3 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpertSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <Skeleton className="h-9 w-48 mb-3" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-12 w-80 rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <Skeleton className="h-3 w-6 mb-2" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-3 w-20 mb-4" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-5/6 mb-4" />
            <div className="flex gap-1.5 mb-4">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-14 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-px w-full mb-3" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
