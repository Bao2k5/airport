import vaaLogoImg from '../assets/vaa-logo.png';
import vaaLogoHires from '../assets/vaa-logo-hires.png';

interface Props {
  className?: string;
  fill?: string;
}

export default function VaaLogo({ className = 'w-7 h-7' }: Props) {
  return (
    <img
      src={vaaLogoImg}
      srcSet={`${vaaLogoImg} 1x, ${vaaLogoHires} 2x`}
      alt="Học viện Hàng không Việt Nam — VAA Logo"
      className={`object-contain select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
}
