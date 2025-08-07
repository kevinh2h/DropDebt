import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Minus } from 'lucide-react';
import type { PriorityBadgeProps, PriorityLevel } from '@/types/bills';
import { getPriorityColor, getPriorityLabel } from '@/types/bills';

export function PriorityBadge({
  level,
  score,
  showScore = false,
  size = 'md',
  showPulse = false,
  className = '',
  'aria-label': ariaLabel,
}: PriorityBadgeProps) {
  // Get priority-specific colors and styling
  const colorClass = getPriorityColor(level);
  const label = getPriorityLabel(level);
  
  // Size-specific classes
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs',
    },
    md: {
      badge: 'px-3 py-1 text-sm',
      icon: 'w-4 h-4', 
      text: 'text-sm',
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base',
    },
  };
  
  const sizes = sizeClasses[size];
  
  // Priority-specific styling
  const priorityStyles = {
    urgent: {
      bg: `bg-${colorClass}-100`,
      border: `border-${colorClass}-300`,
      text: `text-${colorClass}-800`,
      icon: `text-${colorClass}-600`,
      ring: showPulse ? `animate-gentle-pulse ring-2 ring-${colorClass}-200` : '',
    },
    high: {
      bg: `bg-${colorClass}-100`,
      border: `border-${colorClass}-300`,
      text: `text-${colorClass}-800`,
      icon: `text-${colorClass}-600`,
      ring: '',
    },
    medium: {
      bg: `bg-${colorClass}-50`,
      border: `border-${colorClass}-200`,
      text: `text-${colorClass}-700`,
      icon: `text-${colorClass}-500`,
      ring: '',
    },
    low: {
      bg: `bg-${colorClass}-50`,
      border: `border-${colorClass}-200`,
      text: `text-${colorClass}-700`,
      icon: `text-${colorClass}-500`,
      ring: '',
    },
  };
  
  const styles = priorityStyles[level];
  
  // Get appropriate icon for priority level
  const getIcon = (priorityLevel: PriorityLevel) => {
    const iconClass = `${sizes.icon} ${styles.icon}`;
    
    switch (priorityLevel) {
      case 'urgent':
        return <AlertTriangle className={iconClass} aria-hidden="true" />;
      case 'high':
        return <Clock className={iconClass} aria-hidden="true" />;
      case 'medium':
        return <Minus className={iconClass} aria-hidden="true" />;
      case 'low':
        return <CheckCircle className={iconClass} aria-hidden="true" />;
      default:
        return <Minus className={iconClass} aria-hidden="true" />;
    }
  };
  
  // Compute final classes
  const badgeClasses = [
    'inline-flex items-center justify-center space-x-1',
    'font-medium rounded-full border transition-all duration-200',
    sizes.badge,
    styles.bg,
    styles.border,
    styles.text,
    styles.ring,
    className,
  ].filter(Boolean).join(' ');
  
  // Score formatting
  const formatScore = (score: number): string => {
    return Math.round(score).toString();
  };
  
  // Accessibility label
  const accessibilityLabel = ariaLabel || `Priority: ${label}${showScore ? `, Score: ${formatScore(score)}` : ''}`;
  
  return (
    <span
      className={badgeClasses}
      role="status"
      aria-label={accessibilityLabel}
      title={`${label} priority${showScore ? ` (Score: ${formatScore(score)})` : ''}`}
    >
      {/* Priority Icon */}
      {getIcon(level)}
      
      {/* Priority Label */}
      <span className={`font-semibold ${sizes.text}`}>
        {label}
      </span>
      
      {/* Optional Score Display */}
      {showScore && (
        <span className={`font-mono font-bold ${sizes.text} opacity-75`}>
          {formatScore(score)}
        </span>
      )}
      
      {/* Screen reader only text for better accessibility */}
      <span className="sr-only">
        Priority level: {label}
        {showScore && `, Priority score: ${formatScore(score)}`}
      </span>
    </span>
  );
}

// Priority Level Indicator Component (simplified version)
export function PriorityIndicator({ level, className = '' }: { level: PriorityLevel; className?: string }) {
  const colorClass = getPriorityColor(level);
  
  const indicatorStyles = {
    urgent: `bg-${colorClass}-500 animate-gentle-pulse`,
    high: `bg-${colorClass}-500`,
    medium: `bg-${colorClass}-400`,
    low: `bg-${colorClass}-400`,
  };
  
  return (
    <div
      className={`w-3 h-3 rounded-full ${indicatorStyles[level]} ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

// Priority Progress Bar Component
interface PriorityProgressBarProps {
  score: number;
  maxScore?: number;
  level: PriorityLevel;
  showScore?: boolean;
  className?: string;
}

export function PriorityProgressBar({ 
  score, 
  maxScore = 100, 
  level, 
  showScore = false,
  className = '' 
}: PriorityProgressBarProps) {
  const colorClass = getPriorityColor(level);
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const progressStyles = {
    urgent: `bg-${colorClass}-500`,
    high: `bg-${colorClass}-500`,
    medium: `bg-${colorClass}-400`,
    low: `bg-${colorClass}-400`,
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showScore && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-700">Priority Score</span>
          <span className="text-xs font-bold text-gray-900">{Math.round(score)}</span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${progressStyles[level]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={maxScore}
          aria-label={`Priority score: ${Math.round(score)} out of ${maxScore}`}
        />
      </div>
    </div>
  );
}

// Compact Priority Chip Component
interface PriorityChipProps {
  level: PriorityLevel;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function PriorityChip({ 
  level, 
  onClick, 
  isActive = false,
  className = '' 
}: PriorityChipProps) {
  const colorClass = getPriorityColor(level);
  const label = getPriorityLabel(level);
  
  const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-all duration-200';
  
  const chipStyles = isActive ? {
    urgent: `bg-${colorClass}-500 text-white border-${colorClass}-600`,
    high: `bg-${colorClass}-500 text-white border-${colorClass}-600`,
    medium: `bg-${colorClass}-400 text-white border-${colorClass}-500`,
    low: `bg-${colorClass}-400 text-white border-${colorClass}-500`,
  } : {
    urgent: `bg-${colorClass}-100 text-${colorClass}-800 border-${colorClass}-300 hover:bg-${colorClass}-200`,
    high: `bg-${colorClass}-100 text-${colorClass}-800 border-${colorClass}-300 hover:bg-${colorClass}-200`,
    medium: `bg-${colorClass}-50 text-${colorClass}-700 border-${colorClass}-200 hover:bg-${colorClass}-100`,
    low: `bg-${colorClass}-50 text-${colorClass}-700 border-${colorClass}-200 hover:bg-${colorClass}-100`,
  };
  
  const chipClass = [
    baseClasses,
    'border',
    chipStyles[level],
    onClick ? 'cursor-pointer hover:shadow-sm active:scale-95' : '',
    className,
  ].filter(Boolean).join(' ');
  
  if (onClick) {
    return (
      <button
        type="button"
        className={chipClass}
        onClick={onClick}
        aria-label={`Filter by ${label} priority`}
      >
        {label}
      </button>
    );
  }
  
  return (
    <span className={chipClass}>
      {label}
    </span>
  );
}

// Priority Legend Component for user education
export function PriorityLegend({ className = '' }: { className?: string }) {
  const priorities: Array<{ level: PriorityLevel; description: string }> = [
    { level: 'urgent', description: 'Immediate action required - essential services at risk' },
    { level: 'high', description: 'High priority - significant consequences if delayed' },
    { level: 'medium', description: 'Medium priority - should be addressed soon' },
    { level: 'low', description: 'Low priority - can wait if necessary' },
  ];
  
  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority Levels</h3>
      <div className="space-y-2">
        {priorities.map(({ level, description }) => (
          <div key={level} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <PriorityIndicator level={level} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {getPriorityLabel(level)}
              </div>
              <div className="text-xs text-gray-600">
                {description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PriorityBadge;