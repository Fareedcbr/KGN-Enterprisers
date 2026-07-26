import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col justify-between h-full">
      <div>
        <div className="h-48 relative overflow-hidden bg-surface-container-low">
          <div className="w-full h-full bg-surface-container/50 rounded animate-pulse" />
          {/* Status badge skeleton */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-secondary-container/50 text-on-secondary-container/50 font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider animate-pulse">
            Loading
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-headline-md text-[20px] text-on-surface group-hover:text-primary-container transition-colors h-6 w-full bg-surface-container/50 rounded animate-pulse" />
            <span className="text-xs text-outline font-label-sm h-4 w-16 bg-surface-container/50 rounded animate-pulse" />
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-primary-container text-lg font-bold h-5 w-20 bg-surface-container/50 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed text-sm h-5 w-5 bg-surface-container/50 rounded animate-pulse" />
              <span className="text-xs text-on-surface-variant h-4 w-20 bg-surface-container/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
        <button className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all opacity-50">
          <span className="material-symbols-outlined text-sm block">info</span>
        </button>
        <button className="px-3 bg-surface-container-high hover:bg-secondary-container/20 hover:text-secondary-fixed text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all opacity-50">
          <span className="material-symbols-outlined text-sm block">ride</span>
        </button>
      </div>
    </div>
  );
};

export default SkeletonCard;