import React from 'react';
import { CheckCircle, Circle, TrendingUp } from 'lucide-react';
import type { ProgressSectionProps } from '@/types/dashboard';

export function ProgressSection({ progress, loading }: ProgressSectionProps) {
  const { currentCount, totalCount, description, nextMilestone, timelineToStability } = progress;
  
  // Create visual dots for progress (max 10, then use bar)
  const showDots = totalCount <= 10;
  const progressPercent = totalCount > 0 ? (currentCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="card">
        <div className="space-y-4">
          <div className="loading-text" />
          <div className="loading-skeleton h-6 w-full" />
          <div className="loading-text w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
        <TrendingUp className="w-5 h-5 text-stable-500" />
      </div>

      {/* Main Progress Display */}
      <div className="space-y-4">
        {/* Progress Description */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {description}
          </div>
          <p className="text-gray-600">bills are current</p>
        </div>

        {/* Visual Progress */}
        {showDots ? (
          /* Progress Dots for small counts */
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: totalCount }, (_, i) => {
              const isComplete = i < currentCount;
              return (
                <div key={i} className="flex items-center">
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6 text-stable-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Progress Bar for larger counts */
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentCount} current</span>
              <span>{totalCount - currentCount} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-stable-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Next Milestone</h3>
            <p className="text-gray-600">{nextMilestone}</p>
          </div>
        )}

        {/* Timeline */}
        {timelineToStability && (
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600">Timeline to stability:</div>
            <div className="font-medium text-gray-900">{timelineToStability}</div>
          </div>
        )}
      </div>
    </div>
  );
}