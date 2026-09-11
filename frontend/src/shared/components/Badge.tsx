'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'brand'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dotColor?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  tone = 'neutral',
  dotColor,
  icon,
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const toneStyles: Record<BadgeTone, string> = {
    brand: 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200/70',
    neutral: 'bg-sunken text-slate-600 ring-1 ring-inset ring-hairline',
    success: 'bg-signal-50 text-signal-800 ring-1 ring-inset ring-signal-200',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    danger: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200',
    purple: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
    outline: 'bg-surface text-slate-600 ring-1 ring-inset ring-hairline',
  };

  const sizeStyles = {
    sm: 'text-2xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium select-none whitespace-nowrap transition-colors tabular',
        sizeStyles[size],
        toneStyles[tone],
        className
      )}
      {...props}
    >
      {dotColor && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs', dotColor)} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
