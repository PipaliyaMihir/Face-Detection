import { useEffect, useState, useRef } from 'react';

export default function StatsCard({ icon: Icon, title, value, color = 'cyan' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  const colorClasses = {
    cyan: {
      text: 'text-cyan-400',
      border: 'hover:border-cyan-400/30',
      shadow: 'hover:shadow-cyan-400/10',
      iconBg: 'bg-cyan-400/10',
    },
    purple: {
      text: 'text-purple-400',
      border: 'hover:border-purple-400/30',
      shadow: 'hover:shadow-purple-400/10',
      iconBg: 'bg-purple-400/10',
    },
    green: {
      text: 'text-emerald-400',
      border: 'hover:border-emerald-400/30',
      shadow: 'hover:shadow-emerald-400/10',
      iconBg: 'bg-emerald-400/10',
    },
  };

  const c = colorClasses[color] || colorClasses.cyan;

  // Animated count-up
  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = numValue;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 hover:scale-[1.03] ${c.border} hover:shadow-lg ${c.shadow} cursor-default`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          {Icon && <Icon className={`text-xl ${c.text}`} />}
        </div>
        <div>
          <p className={`text-2xl font-display font-bold ${c.text}`}>
            {typeof displayValue === 'number' && !isNaN(displayValue)
              ? displayValue.toLocaleString()
              : value}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider font-medium">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
