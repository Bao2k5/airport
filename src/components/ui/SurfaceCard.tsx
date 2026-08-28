import type { HTMLAttributes, ReactNode } from 'react';

interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'inset' | 'active';
}

export default function SurfaceCard({
  children,
  className = '',
  variant = 'default',
  ...props
}: SurfaceCardProps) {
  const bgClass =
    variant === 'inset'
      ? 'bg-[#070B13] border-[rgba(148,163,184,0.12)]'
      : variant === 'active'
      ? 'bg-[#131E2E] border-[rgba(56,189,248,0.38)]'
      : 'bg-[#0E1523] border-[rgba(148,163,184,0.16)]';

  return (
    <div
      className={`rounded-[10px] border text-[#F1F5F9] shadow-xs ${bgClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
