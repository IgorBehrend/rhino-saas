import { Production } from '@/types';
import { PRODUCTION_STATUS_CONFIG } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  'pending', 'mechanical', 'electrical', 'checklist', 'packaging', 'ready', 'shipped'
] as const;

export default function ProductionTimeline({ production }: { production: Production }) {
  const currentStep = PRODUCTION_STATUS_CONFIG[production.status].step;

  return (
    <div className="relative">
      {/* Line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
      <div
        className="absolute top-4 left-4 h-0.5 bg-orange-500 transition-all duration-500"
        style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - 8)}%` }}
      />

      <div className="relative flex justify-between">
        {STEPS.map((step, idx) => {
          const config = PRODUCTION_STATUS_CONFIG[step];
          const done = idx < currentStep;
          const active = idx === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                done    ? 'bg-orange-600 border-orange-600 text-white' :
                active  ? 'bg-white border-orange-600 text-orange-600' :
                          'bg-white border-slate-300 text-slate-400'
              }`}>
                {done
                  ? <Check className="w-4 h-4" />
                  : <span className="text-xs font-bold">{idx + 1}</span>
                }
              </div>
              <span className={`text-xs font-medium text-center max-w-[64px] leading-tight ${
                active ? 'text-orange-600' : done ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
