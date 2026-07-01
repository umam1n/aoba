import React from 'react';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  strong?: boolean;
  hoverEffect?: boolean;
  interactive?: boolean;
}

export function GlassPanel({
  children,
  className,
  strong = false,
  hoverEffect = false,
  interactive = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300 relative overflow-hidden',
        strong ? 'glass-strong' : 'glass',
        hoverEffect && 'hover:bg-opacity-10 hover:border-opacity-20 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20',
        interactive && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {/* Subtle top highlight to enhance glass effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}
