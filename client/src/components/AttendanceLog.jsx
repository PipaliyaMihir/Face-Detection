import { HiOutlineCheckCircle } from 'react-icons/hi2';
import { TbGhost2 } from 'react-icons/tb';

export default function AttendanceLog({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <TbGhost2 className="text-4xl text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No attendance recorded yet</p>
        <p className="text-gray-600 text-xs mt-1">
          Recognized people will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 max-h-[400px] overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={`${entry.name}-${entry.time}-${index}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-700/30 border border-white/5 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <HiOutlineCheckCircle className="text-emerald-400 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {entry.name}
              </p>
            </div>
            <span className="text-xs text-gray-500 font-mono flex-shrink-0">
              {entry.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
