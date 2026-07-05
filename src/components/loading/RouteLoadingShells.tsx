import {
  BarChart3,
  BookOpen,
  Boxes,
  FileText,
  MessageSquareText,
  User,
} from "lucide-react";
import {
  LoadingCard,
  LoadingPage,
  SectionSkeleton,
  Skeleton,
} from "@/components/loading/LoadingPrimitives";

export function FeedLoadingShell() {
  return (
    <LoadingPage>
      <div className="mx-auto max-w-7xl">
        <LoadingCard className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-8 w-72 max-w-full" />
            </div>
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>
        </LoadingCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingCard key={index}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                  <div className="mt-4 flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </LoadingCard>
          ))}
        </div>
      </div>
    </LoadingPage>
  );
}

export function AuthLoadingShell() {
  return (
    <LoadingPage className="flex items-center justify-center">
      <LoadingCard className="w-full max-w-sm">
        <Skeleton className="mx-auto h-5 w-32" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full bg-blue-200" />
        </div>
      </LoadingCard>
    </LoadingPage>
  );
}

export function ChatLoadingShell() {
  return (
    <LoadingPage className="px-0 pb-0">
      <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-7xl overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-sm">
        <aside className="hidden w-72 border-r border-gray-200 p-4 md:block">
          <Skeleton className="h-10 w-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-gray-200 p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </div>
          <div className="flex-1 space-y-4 overflow-hidden p-4">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="ml-auto h-14 w-1/2" />
            <Skeleton className="h-24 w-4/5" />
            <Skeleton className="ml-auto h-14 w-3/5" />
          </div>
          <div className="border-t border-gray-200 p-4">
            <Skeleton className="h-11 w-full" />
          </div>
        </section>
        <aside className="hidden w-80 border-l border-gray-200 p-4 lg:block">
          <SectionSkeleton icon={Boxes} rows={4} />
          <div className="mt-4">
            <SectionSkeleton icon={FileText} rows={3} />
          </div>
        </aside>
      </div>
    </LoadingPage>
  );
}

export function ProfileLoadingShell() {
  return (
    <LoadingPage>
      <div className="mx-auto max-w-7xl">
        <LoadingCard className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-300">
                <User className="h-8 w-8" />
              </div>
              <div>
                <Skeleton className="h-6 w-44" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-14 w-20" />
              <Skeleton className="h-14 w-20" />
              <Skeleton className="h-14 w-20" />
            </div>
          </div>
        </LoadingCard>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionSkeleton icon={BookOpen} rows={5} />
          <SectionSkeleton icon={Boxes} rows={5} />
        </div>
      </div>
    </LoadingPage>
  );
}

export function QuizLoadingShell() {
  return (
    <LoadingPage className="flex items-center justify-center">
      <LoadingCard className="w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-56" />
          </div>
          <Skeleton className="h-14 w-24" />
        </div>
        <Skeleton className="mt-8 h-24 w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </LoadingCard>
    </LoadingPage>
  );
}

export function StatisticsLoadingShell() {
  return (
    <LoadingPage>
      <div className="mx-auto max-w-5xl">
        <Skeleton className="mb-6 h-10 w-36" />
        <LoadingCard>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-300" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-64 max-w-full" />
            </div>
          </div>
        </LoadingCard>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionSkeleton icon={BarChart3} rows={3} />
          <SectionSkeleton icon={MessageSquareText} rows={3} />
        </div>
        <div className="mt-4">
          <SectionSkeleton icon={FileText} rows={6} />
        </div>
      </div>
    </LoadingPage>
  );
}
