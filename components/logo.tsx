import Image from 'next/image'
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
      <Image
        src="/logo-transparent.png"
        alt="ScriptFlow logo"
        width={28}
        height={28}
        className="shrink-0"
        priority
      />
      {showWordmark && (
        <span className="text-foreground text-[13px] font-medium tracking-[-0.02em]">
          ScriptFlow
        </span>
      )}
    </span>
  )
}
