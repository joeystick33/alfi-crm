import { Check } from 'lucide-react';

export function Stepper({ steps = [], currentStep = 0, onStepClick }: { steps?: { label: string; description?: string }[]; currentStep?: number; onStepClick?: (index: number) => void }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center flex-1
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium
                      transition-all
                      ${isCompleted
                        ? 'bg-primary-600 text-white'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        flex-1 h-1 mx-2
                        ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${isCurrent
                      ? 'text-primary-600'
                      : isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
