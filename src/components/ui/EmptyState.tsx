import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from './icons';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        {body && <p>{body}</p>}
      </div>
      {action}
    </div>
  );
}
