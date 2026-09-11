import { UIInterviewPrepKit } from '@/lib/types';

export interface IKitCardProps {
  kit: UIInterviewPrepKit;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export interface IEmptyStateProps {
  onCreateClick?: () => void;
}
