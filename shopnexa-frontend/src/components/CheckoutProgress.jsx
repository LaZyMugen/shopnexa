import React from 'react';

// Steps: 0 = Cart (Bag), 1 = Address selection, 2 = Payment
// Props: currentStep (number 0-2)
// Alignment fix: we render the horizontal line inside a fixed-height row (exact circle height)
// so the line passes through the *center* of each circle regardless of label height below.
export default function CheckoutProgress({ currentStep = 0 }) {
  const steps = [
    { key: 'cart', label: 'BAG' },
    { key: 'address', label: 'ADDRESS' },
    { key: 'payment', label: 'PAYMENT' }
  ];

  const pct = (currentStep / (steps.length - 1)) * 100; // width of black line overlay

  return (
    <div className="w-full mb-6" aria-label="Checkout progress">
      {/* Row holding line & circles (height equals circle diameter) */}
      <div className="relative h-8 flex items-center">
        {/* Base grey line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-gray-300 rounded" />
        {/* Black fill */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded transition-all duration-300"
          style={{ width: pct + '%' }}
        />
        {/* Circles positioned in flex; they sit exactly centered vertically because of items-center on parent */}
        <div className="relative w-full flex justify-between">
          {steps.map((s, idx) => {
            const completed = currentStep > idx;
            const active = currentStep === idx;
            return (
              <div key={s.key} className="z-10" aria-current={active ? 'step' : undefined}>
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                    completed ? 'bg-black text-white' : active ? 'bg-black text-white shadow-sm' : 'bg-gray-300 text-gray-600'
                  ].join(' ')}
                >
                  {completed ? '✓' : active ? (idx + 1) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Labels rendered in separate row so they do not affect vertical centering of the line */}
      <div className="mt-2 flex justify-between">
        {steps.map((s) => (
          <div key={s.key} className="text-[11px] font-semibold tracking-wide text-black w-8 text-center">
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
