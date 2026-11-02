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
        className={`glass-panel rounded-2xl border border-white/12 shadow-studio-card ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: 472,
        height: 742
      }}
      className={`glass-panel rounded-2xl flex flex-col overflow-hidden shadow-studio-card border border-white/12 relative ${className}`}
    >
      {/* If task has an uploaded image (screenshot from exam sheet / textbook) */}
      {task.imageUrl ? (
        <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
          <img
            src={task.imageUrl}
            alt="Treść zadania"
            className="max-w-full max-h-full object-contain rounded-xl shadow-lg block select-none pointer-events-none"
          />
        </div>
      ) : (
        /* Pure text / LaTeX statement */
        <div className="flex-1 overflow-y-auto p-6 text-slate-100 text-[16px] leading-relaxed select-text font-normal">
          <MathFormula math={task.statementLatex || ''} block={true} />
        </div>
      )}
    </div>
  );
};
