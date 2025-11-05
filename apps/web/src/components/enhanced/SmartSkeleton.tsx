import { cn } from '@/lib/utils'

interface SmartSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'post'
  width?: string | number
  height?: string | number
  className?: string
  animate?: boolean
  count?: number
}

export function SmartSkeleton({
  variant = 'text',
  width,
  height,
  className,
  animate = true,
  count = 1
}: SmartSkeletonProps) {
  const baseClasses = cn(
    'bg-muted',
    animate && 'animate-pulse',
    className
  )

  const skeletonElement = () => {
    switch (variant) {
      case 'circular':
        return (
          <div
            className={cn(baseClasses, 'rounded-full')}
            style={{
              width: width || '40px',
              height: height || '40px'
            }}
          />
        )

      case 'rectangular':
        return (
          <div
            className={cn(baseClasses, 'rounded-md')}
            style={{
              width: width || '100%',
              height: height || '200px'
            }}
          />
        )

      case 'card':
        return (
          <div className={cn(baseClasses, 'rounded-lg p-4 space-y-3')}>
            <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
            <div className="h-3 bg-muted-foreground/10 rounded w-full" />
            <div className="h-3 bg-muted-foreground/10 rounded w-5/6" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-muted-foreground/10 rounded w-20" />
              <div className="h-8 bg-muted-foreground/10 rounded w-20" />
            </div>
          </div>
        )

      case 'avatar':
        return (
          <div className="flex items-center gap-3">
            <div className={cn(baseClasses, 'rounded-full w-10 h-10')} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, 'h-4 rounded w-24')} />
              <div className={cn(baseClasses, 'h-3 rounded w-32')} />
            </div>
          </div>
        )

      case 'post':
        return (
          <div className={cn(baseClasses, 'rounded-lg p-4 space-y-4')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-32" />
                <div className="h-3 bg-muted-foreground/10 rounded w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted-foreground/10 rounded w-full" />
              <div className="h-3 bg-muted-foreground/10 rounded w-4/5" />
            </div>
            <div className="h-48 bg-muted-foreground/10 rounded-lg" />
            <div className="flex gap-4">
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
            </div>
          </div>
        )

      default:
        return (
          <div
            className={cn(baseClasses, 'rounded')}
            style={{
              width: width || '100%',
              height: height || '1em'
            }}
          />
        )
    }
  }

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{skeletonElement()}</div>
        ))}
      </div>
    )
  }

  return skeletonElement()
}

export function PostSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="post" />
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="card" />
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="avatar" />
      ))}
    </div>
  )
}
