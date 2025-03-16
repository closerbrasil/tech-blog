import { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  loading?: boolean
}

export function StatsCard({ title, value, icon, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-6 w-16" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
} 