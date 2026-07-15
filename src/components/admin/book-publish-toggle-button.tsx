'use client';

import React, { useState } from 'react';

interface BookPublishToggleButtonProps {
  published: boolean;
  onToggle: () => Promise<boolean>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookPublishToggleButton({ 
  published, 
  onToggle, 
  disabled = false,
  size = 'md',
  className = '' 
}: BookPublishToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const handleToggle = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const newStatus = await onToggle();
      setFeedback({
        type: 'success',
        message: `Book ${newStatus ? 'published' : 'unpublished'} successfully`
      });
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Error toggling book publication status:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to update publication status'
      });
      
      // Clear error feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = published
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-green-600 hover:bg-green-700 text-white';

  const disabledClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed';

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center rounded-md border border-transparent font-medium
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          transition-colors duration-200
          ${sizeClasses[size]}
          ${disabled || isLoading ? disabledClasses : buttonClasses}
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {published ? 'Unpublishing...' : 'Publishing...'}
          </>
        ) : (
          <>
            {published ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                Unpublish
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Publish
              </>
            )}
          </>
        )}
      </button>

      {/* Feedback Message */}
      {feedback && (
        <div className={`
          absolute top-full left-0 mt-2 px-3 py-2 rounded-md text-sm font-medium z-10
          ${feedback.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}