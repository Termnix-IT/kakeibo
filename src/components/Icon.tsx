import type { LucideIcon, LucideProps } from 'lucide-react';

export type IconProps = Omit<LucideProps, 'ref'> & {
  icon: LucideIcon;
};

export function Icon({ icon: Comp, size = 16, strokeWidth = 2, ...rest }: IconProps) {
  return <Comp size={size} strokeWidth={strokeWidth} {...rest} />;
}
