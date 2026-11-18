import React from 'react';

interface FolderCardProps {
  icon: string;
  title: string;
  meta: string;
  goal?: string;
  onClick: () => void;
  onDelete?: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  icon,
  title,
  meta,
  goal,
  onClick,
  onDelete,
}) => {
  return (
    <div className="folder-card clickable" onClick={onClick}>
      <div className="folder-card-top">
        <div className="folder-icon">{icon}</div>
        {onDelete && (
          <button
            type="button"
            className="btn-delete-folder"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Удалить предмет"
          >
            ✕
          </button>
        )}
      </div>
      <h3 className="folder-title">{title}</h3>
      {goal && <p className="subject-goal-text">Цель: {goal}</p>}
      <span className="folder-meta">{meta}</span>
    </div>
  );
};
