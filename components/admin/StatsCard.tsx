import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  loading = false,
  error = false,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("p-4 flex flex-col space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-primary">{icon}</div>
      </div>
      
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : error ? (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-2xl font-bold">Erro</span>
        </div>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </Card>
  );
} 