import React from 'react';

export interface Step {
  title: string;
  description: string;
}

interface ProcessStepperProps {
  steps: Step[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function ProcessStepper({
  steps,
  orientation = 'vertical',
  className = '',
}: ProcessStepperProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 min-w-[140px] flex-1">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {i + 1}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{step.title}</p>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200 my-1" />
            )}
          </div>
          <div className="pb-6">
            <p className="font-semibold text-gray-800">{step.title}</p>
            <p className="text-gray-600 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
