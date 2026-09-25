'use client';

import { ChevronDown } from 'lucide-react';
import { createContext, useContext, forwardRef, useState, useMemo, useCallback, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[] | undefined) => void;
  className?: string;
  children: ReactNode;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = 'single',
      defaultValue,
      value,
      onValueChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpenValues, setUncontrolledOpenValues] = useState<string[]>(() => {
      const initial = value ?? defaultValue;
      if (initial === undefined) return [];
      return Array.isArray(initial) ? initial : [initial];
    });

    const isControlled = value !== undefined;
    const openValues = useMemo(
      () => (isControlled ? (Array.isArray(value) ? value : [value]) : uncontrolledOpenValues),
      [isControlled, value, uncontrolledOpenValues],
    );

    const toggleValue = useCallback(
      (itemValue: string) => {
        const nextValues = openValues.includes(itemValue)
          ? openValues.filter((v) => v !== itemValue)
          : type === 'single'
            ? [itemValue]
            : [...openValues, itemValue];

        if (!isControlled) {
          setUncontrolledOpenValues(nextValues);
        }
        onValueChange?.(type === 'single' ? nextValues[0] : nextValues);
      },
      [openValues, type, isControlled, onValueChange],
    );

    return (
      <AccordionContext.Provider value={{ openValues, toggleValue, type }}>
        <div
          ref={ref}
          className={cn('w-full', className)}
          data-accordion-type={type}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = 'Accordion';

const AccordionContext = createContext<{
  openValues: string[];
  toggleValue: (value: string) => void;
  type: 'single' | 'multiple';
} | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion compound components must be used within Accordion');
  }
  return context;
}

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openValues, toggleValue } = useAccordionContext();
    const open = openValues.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, open, toggleValue }}>
        <div
          ref={ref}
          className={cn('border-b border-border/50 last:border-0', className)}
          data-accordion-value={value}
          data-state={open ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = 'AccordionItem';

const AccordionItemContext = createContext<{
  value: string;
  open: boolean;
  toggleValue: (value: string) => void;
} | null>(null);

function useAccordionItem() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger/Content must be used within AccordionItem');
  }
  return context;
}

interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value, open, toggleValue } = useAccordionItem();

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          className,
        )}
        aria-expanded={open}
        onClick={() => toggleValue(value)}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
    );
  },
);
AccordionTrigger.displayName = 'AccordionTrigger';

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useAccordionItem();

    return (
      <div
        ref={ref}
        className={cn('accordion-content', className)}
        data-open={open}
        {...props}
      >
        <div className="pb-4 pt-0">
          {children}
        </div>
      </div>
    );
  },
);
AccordionContent.displayName = 'AccordionContent';

export const AccordionHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
});
AccordionHeader.displayName = 'AccordionHeader';