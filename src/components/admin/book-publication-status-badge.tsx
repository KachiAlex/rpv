'use client';

import React from 'react';

interface BookPublicationStatusBadgeProps {
  published: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookPublicationStatusBadge({ 
  published, 
  size = 'md', 
  className = '' 
}: BookPublicationStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const statusClasses = published
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        ${statusClasses}
        ${className}
      `}
    >
      <span
        className={`
          w-2 h-2 rounded-full mr-2
          ${published ? 'bg-green-500' : 'bg-gray-400'}
        `}
      />
      {published ? 'Published' : 'Unpublished'}
    </span>
  );
}