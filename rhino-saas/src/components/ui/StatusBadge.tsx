import { MachineStatus } from '@/types';
import { STATUS_CONFIG } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MachineStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={cn('badge', config.bg, config.color, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
