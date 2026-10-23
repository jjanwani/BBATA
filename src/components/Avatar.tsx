import { cn, initials } from '@/lib/utils'
import { EyeOff } from 'lucide-react'

export function Avatar({
  name,
  url,
  size = 32,
  anonymous,
  className,
}: {
  name: string | null | undefined
  url?: string | null
  size?: number
  anonymous?: boolean
  className?: string
}) {
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) }
  if (anonymous) {
    return (
      <span style={style} className={cn('grid shrink-0 place-items-center rounded-full bg-gray-200 text-gray-500', className)}>
        <EyeOff style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    )
  }
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={style} referrerPolicy="no-referrer" className={cn('shrink-0 rounded-full object-cover', className)} />
  }
  return (
    <span style={style} className={cn('grid shrink-0 place-items-center rounded-full bg-navy font-semibold text-maize', className)}>
      {initials(name)}
    </span>
  )
}
