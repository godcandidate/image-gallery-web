import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const Loader: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="w-full">
          <Skeleton height={256} className="rounded-lg" />
        </div>
      ))}
    </div>
  );
};