import React from 'react';
import { TaskItem } from '../types/math';
import { MathFormula } from './MathFormula';

interface TaskCardProps {
  task?: TaskItem;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  className = ''
}) => {
  if (!task) {
    return (
      <div
        style={{ width: 472, height: 742 }}
        className={`task-card-panel rounded-2xl ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: 472,
        height: 742
      }}
      className={`task-card-panel rounded-2xl flex flex-col overflow-hidden relative shadow-2xl ${className}`}
    >
      {/* If task has an uploaded image (screenshot from exam sheet / textbook) */}
      {task.imageUrl ? (
        <div className="w-full h-full p-4 flex items-center justify-center overflow-y-auto">
          <img
            src={task.imageUrl}
            alt="Treść zadania"
            className="w-full max-h-full object-contain rounded-xl shadow-lg block select-none pointer-events-none task-image-crisp"
          />
        </div>
      ) : (
        /* Pure text / LaTeX statement with crystal-clear 1080p broadcast typography */
        <div className="flex-1 overflow-y-auto p-7 task-text-crisp select-text">
          <MathFormula math={task.statementLatex || ''} block={true} />
        </div>
      )}
    </div>
  );
};
