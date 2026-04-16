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
      <div className={`flex flex-col gap-4 md:flex-row md:flex-wrap ${className}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex min-w-0 items-start gap-3 md:min-w-[140px] md:flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-800">{step.title}</p>
              <p className="mt-1 text-sm leading-7 text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-1 md:space-y-0 ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 md:gap-4">
          <div className="flex shrink-0 flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-white">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="my-1 min-h-[24px] w-0.5 flex-1 bg-gray-200" />
            )}
          </div>
          <div className="pb-5 md:pb-6">
            <p className="text-base font-semibold text-gray-800">{step.title}</p>
            <p className="mt-1 text-base leading-8 text-gray-600">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
