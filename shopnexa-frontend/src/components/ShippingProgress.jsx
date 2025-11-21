import React from 'react';

// Refined shipping progress visualization
// Requirements:
//  - Green bar with THREE circles (start, transit, delivered)
//  - Only show a check mark when order is completed/delivered (final circle)
//  - Midway circles should NOT display ticks; they can be hollow or filled depending on progress
//  - More sophisticated styling (gradient fill & subtle ring when completed)
export default function ShippingProgress({ status }) {
  // Map backend status to a coarse phase index: 0=start, 1=transit, 2=delivered
  const phaseMap = {
    pending: 0,
    paid: 0,
    confirmed: 0,
    shipped: 1,
    shipping: 1,
    out_for_delivery: 1,
    completed: 2,
    delivered: 2,
    cancelled: -1,
  };
  const phase = phaseMap[status] ?? 0;
  if (status === 'cancelled') {
    return <div className="text-xs text-rose-600 font-medium">Cancelled</div>;
  }

  // Positions for three circles (percent along bar)
  const positions = [0, 50, 100];
  // Determine fill width: halfway (50%) when phase >=1, full (100%) when phase ===2
  const fillWidth = phase === 0 ? '0%' : phase === 1 ? '50%' : '100%';

  return (
    <div className="flex items-center w-full gap-2">
      {/* Ultra thin variant: height h-2 */}
      <div className="flex-1 relative h-2">
        {/* Bar background */}
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        {/* Filled portion with gradient for a more polished look */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-500 via-green-500 to-green-600 transition-all"
          style={{ width: fillWidth }}
        />
        {/* Circles */}
        {positions.map((pos, i) => {
          const reached = phase >= i;
          const isFinal = i === positions.length - 1;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${pos}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={[
                  // Ultra thin circle size w-3 h-3; keep tick legible with text-[8px]
                  'w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold transition-colors transition-shadow duration-300',
                  reached ? 'bg-green-500 text-white' : 'bg-white text-slate-400',
                  'border',
                  reached ? 'border-green-600' : 'border-slate-300',
                  isFinal && phase === 2 ? 'shadow-[0_0_0_3px_rgba(16,185,129,0.35)]' : ''
                ].join(' ')}
              >
                {isFinal && phase === 2 ? '✓' : ''}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-600 w-24 truncate capitalize">{status.replace(/_/g,' ')}</div>
    </div>
  );
}
