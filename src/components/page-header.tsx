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
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <h1 className="text-3xl font-bold tracking-tight font-headline text-primary-foreground bg-primary py-1 px-3 rounded-lg shadow-md">{title}</h1>
        </div>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
