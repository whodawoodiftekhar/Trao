'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'subtle-success'
  | 'subtle-danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center select-none font-semibold whitespace-nowrap ' +
      'transition-[background-color,border-color,color,transform,box-shadow] duration-200 outline-none ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
      'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ' +
      'motion-reduce:active:scale-100';

    // Solid fills, not gradients — a gradient on every button is decoration and
    // flattens the hierarchy it is supposed to express.
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-brand-700 hover:bg-brand-800 text-white border border-transparent shadow-xs active:scale-[0.98]',
      secondary:
        'bg-surface hover:bg-slate-50 text-slate-700 border border-hairline hover:border-slate-300 shadow-2xs active:scale-[0.98]',
      outline:
        'bg-transparent hover:bg-brand-50 text-brand-700 border border-brand-200 hover:border-brand-300 active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-ink border border-transparent active:scale-[0.98]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-xs active:scale-[0.98]',
      success:
        'bg-signal-600 hover:bg-signal-700 text-white border border-transparent shadow-xs active:scale-[0.98]',
      'subtle-success':
        'bg-signal-50 text-signal-700 border border-signal-200 hover:bg-signal-100 active:scale-[0.98]',
      'subtle-danger':
        'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-[0.98]',
    };

    // Comfortable hit areas: nothing interactive below 32px, primary actions at 40px+.
    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
      sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
      md: 'h-10 px-4 text-base rounded-xl gap-2',
      lg: 'h-12 px-5 text-base rounded-xl gap-2.5',
      icon: 'w-10 h-10 p-0 rounded-xl justify-center shrink-0',
      'icon-sm': 'w-9 h-9 p-0 rounded-lg justify-center shrink-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
