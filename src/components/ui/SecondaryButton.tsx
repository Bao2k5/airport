import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'surface' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function SecondaryButton({
  children,
  icon,
  variant = 'surface',
  size = 'md',
  className = '',
  disabled,
  ...props
}: SecondaryButtonProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-xs' : size === 'lg' ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs';

  const variantClasses =
    variant === 'danger'
      ? 'bg-[#F43F5E] hover:bg-[#E11D48] active:bg-[#BE123C] text-white border-transparent'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-[#131E2E] active:bg-[#18263A] text-[#94A3B8] hover:text-[#F1F5F9] border-transparent'
      : 'bg-[#131E2E] hover:bg-[#18263A] active:bg-[#20324D] text-[#CBD5E1] hover:text-white border-[rgba(148,163,184,0.16)]';

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-[10px] border transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
