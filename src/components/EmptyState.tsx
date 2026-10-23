import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-gray-300" />
      <p className="font-semibold text-gray-800">{title}</p>
      {children && <div className="text-sm text-gray-500">{children}</div>}
    </div>
  )
}
