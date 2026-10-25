import { Plane } from 'lucide-react';
import vaaLogoImg from '../assets/vaa-logo.png';
import vaaLogoHires from '../assets/vaa-logo-hires.png';
import { BRANDING, HIDE_SCHOOL_BRANDING } from '../config/branding';

interface Props {
  className?: string;
  fill?: string;
}

export default function VaaLogo({ className = 'w-7 h-7', fill }: Props) {
  // Ẩn logo trường (Euréka 2026): hiển thị biểu tượng máy bay trung tính, giữ nguyên kích thước.
  if (HIDE_SCHOOL_BRANDING) {
    return (
      <Plane
        className={`select-none pointer-events-none ${className}`}
        color={fill ?? 'currentColor'}
        strokeWidth={2}
        role="img"
        aria-label={BRANDING.logoAlt}
      />
    );
  }

  return (
    <img
      src={vaaLogoImg}
      srcSet={`${vaaLogoImg} 1x, ${vaaLogoHires} 2x`}
      alt={BRANDING.logoAlt}
      className={`object-contain select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}
