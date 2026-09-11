'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cards are for discrete objects (a kit, a question, a day) — not for page
 * headers or toolbars. `tone` varies elevation with importance so a page isn't
 * one flat field of identical boxes.
 */
export type CardTone = 'raised' | 'flat' | 'outline';

export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; tone?: CardTone }
>(({ className, hoverable = false, tone = 'raised', ...props }, ref) => {
  const tones: Record<CardTone, string> = {
    raised: 'border border-hairline bg-surface shadow-card',
    flat: 'border border-hairline bg-canvas',
    outline: 'border border-hairline bg-surface',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl text-ink transition duration-200',
        tones[tone],
        hoverable &&
          'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-raised motion-reduce:hover:translate-y-0',
        className
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { withTick?: boolean }
>(({ className, withTick, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start justify-between gap-4 border-b border-hairline p-4 pb-3 sm:p-5 sm:pb-3.5',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-display text-lg text-ink', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('mt-1 text-sm leading-relaxed text-muted', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 sm:p-5', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-3 border-t border-hairline p-4 pt-3 sm:p-5 sm:pt-3.5',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

/**
 * A measured proportion — coverage, confidence, days done. Uses the signal
 * colour because it reports readiness, which is the one thing colour means here.
 */
export function Meter({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-muted">{label}</span>
          <span className="tabular text-xs font-semibold text-ink">{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
      >
        <div
          className="h-full rounded-full bg-signal-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
