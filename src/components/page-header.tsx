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
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-headline text-primary-foreground bg-primary py-1 px-3 rounded-lg shadow-md break-words">
            {title}
          </h1>
        </div>
        {description && <p className="mt-2 text-sm sm:text-base text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{children}</div>}
    </div>
  );
}
