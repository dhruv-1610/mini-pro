import { SkeletonLoader } from '../ui/SkeletonLoader';

export function StatsCardsSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <SkeletonLoader width="w-8" height="h-8" rounded="lg" className="mb-3" />
          <SkeletonLoader width="w-16" height="h-8" className="mb-2" />
          <SkeletonLoader width="w-24" height="h-4" />
        </div>
      ))}
    </div>
  );
}

export function UpcomingDrivesSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white p-4">
          <SkeletonLoader width="w-12" height="h-12" rounded="lg" />
          <div className="flex-1">
            <SkeletonLoader width="w-3/4" height="h-5" className="mb-2" />
            <SkeletonLoader width="w-1/2" height="h-3" />
          </div>
          <SkeletonLoader width="w-20" height="h-8" rounded="lg" />
        </div>
      ))}
    </div>
  );
}

export function DonationHistorySkeleton(): React.ReactElement {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-stone-100 bg-white px-4 py-3">
          <SkeletonLoader width="w-32" height="h-4" />
          <SkeletonLoader width="w-20" height="h-5" />
        </div>
      ))}
    </div>
  );
}

export function BadgeDisplaySkeleton(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <SkeletonLoader width="w-16" height="h-16" rounded="full" className="mb-2" />
          <SkeletonLoader width="w-20" height="h-3" className="mb-1" />
          <SkeletonLoader width="w-24" height="h-3" />
        </div>
      ))}
    </div>
  );
}

export function RankingSkeleton(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6">
      <div className="flex items-center gap-4">
        <SkeletonLoader width="w-20" height="h-20" rounded="full" />
        <div className="flex-1">
          <SkeletonLoader width="w-24" height="h-8" className="mb-2" />
          <SkeletonLoader width="w-40" height="h-4" />
        </div>
      </div>
    </div>
  );
}
