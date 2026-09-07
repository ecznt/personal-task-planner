import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, eyebrow, description, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-gradient text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
