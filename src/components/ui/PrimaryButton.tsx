import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PrimaryButton({
  children,
  icon,
  loading = false,
  loadingText = 'Đang xử lý...',
  disabled,
  className = '',
  size = 'md',
  ...props
}: PrimaryButtonProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 min-h-[36px] sm:min-h-[38px] text-xs'
      : size === 'lg'
      ? 'px-4 py-2.5 min-h-[44px] sm:min-h-[48px] text-sm'
      : 'px-3.5 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm';

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-[10px] bg-[#06B6D4] hover:bg-[#22D3EE] active:bg-[#0891B2] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : icon}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
