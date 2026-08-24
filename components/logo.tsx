import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="border-primary/30 from-primary/25 relative flex size-6 items-center justify-center rounded-[7px] border bg-gradient-to-b to-transparent"
      >
        <span className="bg-primary size-1.5 rounded-full" />
        <span className="bg-primary/45 absolute top-1 right-1 size-1 rounded-full" />
        <span className="bg-primary/45 absolute bottom-1 left-1 size-1 rounded-full" />
      </span>
      {showWordmark && (
        <span className="text-foreground text-[13px] font-medium tracking-[-0.02em]">
          ScriptFlora
        </span>
      )}
    </span>
  )
}
