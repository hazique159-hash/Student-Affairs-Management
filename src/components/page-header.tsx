import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, icon: Icon, className, children }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 bg-[#4F46E5] px-4 py-1.5 rounded-xl shadow-lg w-fit">
          {Icon && <Icon className="h-5 w-5 text-white" />}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-headline whitespace-nowrap">
            {title}
          </h1>
        </div>
        {children}
      </div>
      {description && <p className="text-xs sm:text-sm text-muted-foreground font-medium pl-1">{description}</p>}
    </div>
  );
}
