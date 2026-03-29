/**
 * Skeleton Loader for Tables
 * 
 * Provides a shimmering placeholder effect while data is being fetched.
 * Improves perceived performance by reducing visual jarring during layout shifts.
 */

import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50 flex items-center px-6 gap-4 border-b border-gray-100">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded-full flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 border-b border-gray-50 flex items-center px-6 gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-3 bg-gray-100 rounded-full flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
