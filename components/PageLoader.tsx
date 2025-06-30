export default function PageLoader() {
  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="page-container mx-auto px-4 py-5 max-w-screen-sm" dir="rtl">
        {/* Header Skeleton */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Logo skeleton */}
              <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
              
              <div>
                <div className="h-5 w-24 bg-muted rounded animate-pulse mb-1.5" />
                <div className="h-3 w-36 bg-muted rounded animate-pulse" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4"></div>
        </header>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Banner skeleton */}
          <div className="h-24 bg-muted rounded-xl animate-pulse mb-6" />
          
          {/* Main content skeleton */}
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
} 