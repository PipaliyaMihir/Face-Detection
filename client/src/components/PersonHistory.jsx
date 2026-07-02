import { useState, useEffect } from 'react';
import { HiOutlineCalendarDays, HiOutlineClock, HiOutlineCheckCircle, HiOutlineArrowRightOnRectangle, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2';
import { getPersonAttendance } from '../api/api';

export default function PersonHistory({ personName, personId }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!personId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await getPersonAttendance(personId);
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch person history:', err);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [personId]);

  if (!personId) return null;

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
          <HiOutlineCheckCircle className="text-white text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-gray-100">
            {personName}
          </h3>
          <p className="text-xs text-gray-500">Attendance & Dual-Punch History</p>
        </div>
        <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
          {history.length} {history.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-6">
          <HiOutlineCalendarDays className="text-3xl text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">First time! No previous records.</p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
          {history.map((record, index) => {
            const status = record.status || 'On Time';
            const isVeryLate = status === 'Very Late';
            const isLate = status === 'Late';
            const checkInTime = record.check_in || record.time || 'N/A';
            const checkOutTime = record.check_out || 'Not punched out';
            const workHours = record.work_hours || 'In Progress';

            return (
              <div
                key={record.id || index}
                className="p-3 rounded-xl bg-dark-700/30 border border-white/5 hover:border-white/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <HiOutlineCalendarDays className="text-cyan-400" />
                    {record.date || 'N/A'}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      isVeryLate
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 font-semibold'
                        : isLate
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-white/5 text-gray-400">
                  <div>
                    <span className="block text-[10px] text-gray-500">Check-In</span>
                    <span className="font-mono text-emerald-400">{checkInTime}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500">Check-Out</span>
                    <span className="font-mono text-cyan-400">{checkOutTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-gray-500">Duration</span>
                    <span className="font-mono text-purple-300">{workHours}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
