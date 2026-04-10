import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-light rounded-xl ${className}`} />
  );
};

export const MovieCardSkeleton = () => (
  <div className="flex-none w-[160px] md:w-[220px] aspect-[2/3] space-y-3">
    <Skeleton className="w-full h-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const HeroSkeleton = () => (
  <div className="relative h-[85vh] w-full bg-surface animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent" />
    <div className="absolute bottom-20 left-8 md:left-16 space-y-4 w-full max-w-xl">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-12 w-40 rounded-full" />
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
    </div>
  </div>
);
