import { cn } from '@/lib/utils'

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-maize text-sm font-black text-navy">R</span>
      <span className={light ? 'text-white' : 'text-navy'}>
        Ross<span className="text-maize">Reddit</span>
      </span>
    </span>
  )
}
