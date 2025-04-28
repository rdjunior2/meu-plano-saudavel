import React from 'react';
import AppCard from './AppCard';

interface LoadingPlanosProps {
  qtd?: number;
}

const LoadingPlanos: React.FC<LoadingPlanosProps> = ({ qtd = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(qtd).fill(0).map((_, index) => (
        <div key={index} className="animate-pulse">
          <AppCard>
            <div className="h-40 bg-primary-50 rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-5 bg-primary-100/70 rounded w-2/3" />
              <div className="h-4 bg-primary-50 rounded w-full" />
              <div className="h-4 bg-primary-50 rounded w-3/4" />
              <div className="h-2 bg-primary-100/50 rounded-full w-full mt-4" />
              <div className="flex justify-between mt-4">
                <div className="h-10 w-16 bg-primary-100/70 rounded-full" />
                <div className="h-10 w-24 bg-primary-100/70 rounded-lg" />
              </div>
            </div>
          </AppCard>
        </div>
      ))}
    </div>
  );
};

export default LoadingPlanos; 