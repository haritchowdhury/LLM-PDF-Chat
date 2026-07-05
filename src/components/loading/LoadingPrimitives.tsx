import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
    />
  );
}

type LoadingPageProps = {
  children: React.ReactNode;
  className?: string;
};

export function LoadingPage({ children, className }: LoadingPageProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 pb-10 pt-24",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {children}
    </main>
  );
}

type LoadingCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function LoadingCard({ children, className }: LoadingCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

type SectionSkeletonProps = {
  icon?: ComponentType<{ className?: string }>;
  rows?: number;
};

export function SectionSkeleton({ icon: Icon, rows = 3 }: SectionSkeletonProps) {
  return (
    <LoadingCard>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
          {Icon ? <Icon className="h-4 w-4" /> : <Skeleton className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-40 max-w-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn("h-4", index === rows - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </LoadingCard>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}
