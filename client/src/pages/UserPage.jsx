import { useState, useEffect, useCallback } from 'react';
import { HiOutlineUsers, HiOutlineChartBar, HiOutlineCalendarDays } from 'react-icons/hi2';
import { HiOutlinePlay, HiOutlineStop } from 'react-icons/hi2';
import CameraFeed from '../components/CameraFeed';
import AttendanceLog from '../components/AttendanceLog';
import StatsCard from '../components/StatsCard';
import PersonHistory from '../components/PersonHistory';
import { getStats, getTodayAttendance } from '../api/api';

export default function UserPage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [stats, setStats] = useState({ today_count: 0, total_people: 0, attendance_rate: 0 });
  const [toast, setToast] = useState(null);
  const [recognizedPerson, setRecognizedPerson] = useState(null); // {name, personId}

  // Fetch stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, todayRes] = await Promise.all([
          getStats().catch(() => ({ data: {} })),
          getTodayAttendance().catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) {
          setStats({
            today_count: statsRes.data.today_count || 0,
            total_people: statsRes.data.total_people || 0,
            attendance_rate: statsRes.data.attendance_rate || 0,
          });
        }

        if (Array.isArray(todayRes.data)) {
          setAttendanceLog(
            todayRes.data.map((entry) => ({
              name: entry.name,
              department: entry.department || 'General',
              status: entry.status || 'Present',
              time: entry.check_out || entry.check_in || entry.time || new Date(entry.timestamp).toLocaleTimeString(),
              type: entry.check_out ? 'check_out' : 'check_in',
            }))
          );
        }
      } catch (err) {
        console.log('Failed to fetch initial data:', err);
      }
    };
    fetchData();
  }, []);

  // Handle attendance marked callback
  const handleAttendanceMarked = useCallback(
    (punchData) => {
      const name = punchData.name || punchData;
      const personId = punchData.person_id;
      const punchType = punchData.type || 'check_in';
      const status = punchData.status || 'On Time';
      const timeStr = punchData.check_out || punchData.check_in || punchData.time || new Date().toLocaleTimeString();
      const workHours = punchData.work_hours;

      // Add to log
      setAttendanceLog((prev) => [
        {
          name,
          department: punchData.department || 'General',
          status,
          time: timeStr,
          type: punchType,
          workHours,
        },
        ...prev,
      ]);

      // Update stats
      if (punchType === 'check_in') {
        setStats((prev) => ({
          ...prev,
          today_count: prev.today_count + 1,
        }));
      }

      // Show recognized person's history
      if (personId) {
        setRecognizedPerson({ name, personId });
      }

      // Show toast
      setToast({
        name,
        type: punchType,
        status,
        time: timeStr,
        workHours,
      });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  return (
    <div className="pb-12">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div
            className={`glass-card px-6 py-3.5 flex items-center gap-3.5 shadow-xl ${
              toast.type === 'check_out'
                ? 'border-cyan-500/40 shadow-cyan-500/10'
                : toast.status === 'Late'
                ? 'border-amber-500/40 shadow-amber-500/10'
                : 'border-emerald-500/40 shadow-emerald-500/10'
            }`}
          >
            <span className="text-xl">
              {toast.type === 'check_out' ? '🚪' : toast.status === 'Late' ? '⏰' : '✅'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-200">
                {toast.type === 'check_out' ? 'Check-Out' : 'Check-In'}:{' '}
                <span className="text-cyan-400 font-bold">{toast.name}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {toast.type === 'check_out' ? (
                  <>Punched out at <span className="text-cyan-300">{toast.time}</span> (Duration: {toast.workHours})</>
                ) : (
                  <>Punched in at <span className="text-emerald-300">{toast.time}</span> — <span className={toast.status === 'Late' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{toast.status}</span></>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
          Smart Attendance System
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
          Dual Punch-In/Out • Real-time Face Recognition • Punctuality Tracking
        </p>
      </div>

      {/* Main layout: Camera + Log */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Camera section */}
        <div className="lg:w-[60%]">
          <CameraFeed
            isActive={cameraActive}
            onAttendanceMarked={handleAttendanceMarked}
          />

          {/* Camera toggle button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setCameraActive((prev) => !prev)}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                cameraActive
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'btn-primary'
              }`}
            >
              {cameraActive ? (
                <>
                  <HiOutlineStop className="text-lg" />
                  Stop Camera
                </>
              ) : (
                <>
                  <HiOutlinePlay className="text-lg" />
                  Start Camera
                </>
              )}
            </button>
          </div>

          {/* Person History — shown below camera when someone is recognized */}
          {recognizedPerson && (
            <div className="mt-6">
              <PersonHistory
                personName={recognizedPerson.name}
                personId={recognizedPerson.personId}
              />
            </div>
          )}
        </div>

        {/* Attendance log */}
        <div className="lg:w-[40%]">
          <AttendanceLog entries={attendanceLog} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
        <StatsCard
          icon={HiOutlineCalendarDays}
          title="Today's Count"
          value={stats.today_count}
          color="cyan"
        />
        <StatsCard
          icon={HiOutlineUsers}
          title="Total People"
          value={stats.total_people}
          color="purple"
        />
        <StatsCard
          icon={HiOutlineChartBar}
          title="Attendance Rate"
          value={`${stats.attendance_rate}%`}
          color="green"
        />
      </div>
    </div>
  );
}
