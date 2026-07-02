import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineInboxStack,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineCheck,
} from 'react-icons/hi2';
import PersonCard from '../components/PersonCard';
import AddPersonModal from '../components/AddPersonModal';
import {
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
  getAttendance,
  exportAttendance,
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('people');
  const [people, setPeople] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Department Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptStartTime, setNewDeptStartTime] = useState('09:00 AM');
  const [newDeptLateCutoff, setNewDeptLateCutoff] = useState('09:15 AM');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptStartTime, setEditDeptStartTime] = useState('');
  const [editDeptLateCutoff, setEditDeptLateCutoff] = useState('');

  const [notification, setNotification] = useState(null);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('attendease_token');
    localStorage.removeItem('attendease_user');
    navigate('/login');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    setIsLoadingDepts(true);
    try {
      const res = await getDepartments();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setIsLoadingDepts(false);
    }
  }, []);

  // Fetch people
  const fetchPeople = useCallback(async () => {
    setIsLoadingPeople(true);
    try {
      const params = {};
      if (selectedDeptFilter && selectedDeptFilter !== 'All') {
        params.department = selectedDeptFilter;
      }
      const res = await getPeople(params);
      setPeople(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch people:', err);
      showNotification('Failed to load people', 'error');
    } finally {
      setIsLoadingPeople(false);
    }
  }, [selectedDeptFilter]);

  // Fetch attendance
  const fetchAttendance = useCallback(async () => {
    setIsLoadingAttendance(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedDeptFilter && selectedDeptFilter !== 'All') {
        params.department = selectedDeptFilter;
      }
      const res = await getAttendance(params);
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      showNotification('Failed to load attendance records', 'error');
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [dateFrom, dateTo, selectedDeptFilter]);

  // Initial fetch
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (activeTab === 'people') {
      fetchPeople();
    } else if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, fetchPeople, fetchAttendance]);

  // Add/Edit person submit
  const handlePersonSubmit = async (formData, personId) => {
    if (personId) {
      await updatePerson(personId, formData);
      showNotification('Person updated successfully');
    } else {
      await addPerson(formData);
      showNotification('Person registered successfully');
    }
    fetchPeople();
  };

  // Delete person
  const handleDeletePerson = async (id) => {
    try {
      await deletePerson(id);
      showNotification('Person deleted');
      fetchPeople();
    } catch (err) {
      showNotification('Failed to delete person', 'error');
    }
  };

  // Add Department
  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await addDepartment(
        newDeptName.trim(),
        newDeptStartTime || '09:00 AM',
        newDeptLateCutoff || '09:15 AM'
      );
      setNewDeptName('');
      setNewDeptStartTime('09:00 AM');
      setNewDeptLateCutoff('09:15 AM');
      showNotification('Department saved to MongoDB');
      fetchDepartments();
    } catch (err) {
      showNotification('Failed to add department', 'error');
    }
  };

  // Start Editing Department
  const startEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setEditDeptName(dept.name);
    setEditDeptStartTime(dept.start_time || '09:00 AM');
    setEditDeptLateCutoff(dept.late_cutoff || '09:15 AM');
  };

  // Save Department Edit
  const handleSaveDeptEdit = async (deptId) => {
    try {
      const formData = new FormData();
      formData.append('name', editDeptName.trim());
      formData.append('start_time', editDeptStartTime.trim());
      formData.append('late_cutoff', editDeptLateCutoff.trim());
      await updateDepartment(deptId, formData);
      setEditingDeptId(null);
      showNotification('Department updated in MongoDB');
      fetchDepartments();
    } catch (err) {
      showNotification('Failed to update department', 'error');
    }
  };

  // Delete Department
  const handleDeleteDept = async (id) => {
    try {
      await deleteDepartment(id);
      showNotification('Department removed from MongoDB');
      fetchDepartments();
    } catch (err) {
      showNotification('Failed to delete department', 'error');
    }
  };

  // Export
  const handleExport = async () => {
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedDeptFilter && selectedDeptFilter !== 'All') {
        params.department = selectedDeptFilter;
      }
      const res = await exportAttendance(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Excel Export downloaded');
    } catch (err) {
      showNotification('Failed to export attendance', 'error');
    }
  };

  const handleEditPerson = (person) => {
    setEditPerson(person);
    setIsModalOpen(true);
  };

  // Filtered people by search
  const filteredPeople = people.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-12">
      {/* Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div
            className={`glass-card px-6 py-3 flex items-center gap-3 shadow-lg ${
              notification.type === 'error'
                ? 'border-red-500/30 shadow-red-500/10'
                : 'border-emerald-500/30 shadow-emerald-500/10'
            }`}
          >
            <span className="text-lg">
              {notification.type === 'error' ? '❌' : '✅'}
            </span>
            <p className="text-sm font-medium text-gray-200">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Manage people, departments/shift rules, and view attendance reports (MongoDB synced)
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 bg-dark-800/40 border border-white/5 hover:text-red-400 hover:border-red-500/30 transition-all duration-300"
        >
          <HiOutlineArrowRightOnRectangle className="text-lg" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'people'
              ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-400/10'
              : 'text-gray-400 bg-dark-800/40 border border-white/5 hover:text-gray-200 hover:border-white/10'
          }`}
        >
          <HiOutlineUserGroup className="text-lg" />
          People / Students
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-400/10'
              : 'text-gray-400 bg-dark-800/40 border border-white/5 hover:text-gray-200 hover:border-white/10'
          }`}
        >
          <HiOutlineClipboardDocumentList className="text-lg" />
          Attendance Records
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'departments'
              ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-400/10'
              : 'text-gray-400 bg-dark-800/40 border border-white/5 hover:text-gray-200 hover:border-white/10'
          }`}
        >
          <HiOutlineBuildingOffice className="text-lg" />
          Departments & Shift Rules
        </button>
      </div>

      {/* ============== People Tab ============== */}
      {activeTab === 'people' && (
        <div className="animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Department Filter Dropdown */}
            <div className="w-full md:w-60">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="input-field appearance-none cursor-pointer bg-dark-700/80 text-gray-200"
              >
                <option value="All" className="bg-dark-800">All Departments / Classes</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name} className="bg-dark-800">
                    {d.name} {d.start_time ? `(${d.start_time})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                setEditPerson(null);
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <HiOutlineUserPlus className="text-lg" />
              Add Person
            </button>
          </div>

          {/* Count */}
          <p className="text-xs text-gray-500 mb-4">
            Showing {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'}
          </p>

          {/* People grid */}
          {isLoadingPeople ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <HiOutlineUserGroup className="text-5xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">
                {searchQuery || selectedDeptFilter !== 'All'
                  ? 'No people match your search or filter'
                  : 'No people registered yet'}
              </p>
              <p className="text-gray-600 text-sm">
                Click &quot;Add Person&quot; to register someone
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onEdit={handleEditPerson}
                  onDelete={handleDeletePerson}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============== Attendance Tab ============== */}
      {activeTab === 'attendance' && (
        <div className="animate-fade-in">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-6 items-end">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Filter by Department</label>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="input-field text-sm appearance-none cursor-pointer bg-dark-700/80"
                >
                  <option value="All" className="bg-dark-800">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name} className="bg-dark-800">
                      {d.name} {d.start_time ? `(${d.start_time})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchAttendance}
                className="btn-secondary whitespace-nowrap flex-1 sm:flex-none"
              >
                Apply Filter
              </button>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none"
              >
                <HiOutlineArrowDownTray className="text-lg" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Attendance table */}
          {isLoadingAttendance ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <HiOutlineInboxStack className="text-5xl text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">No attendance records found</p>
              <p className="text-gray-600 text-sm">
                Attendance records will appear here after faces are scanned
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-dark-800/60">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        #
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Name
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Department / Class
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Check-In
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Check-Out
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Work Hours
                      </th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase">
                        Punctuality
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => {
                      const status = record.status || 'On Time';
                      const isVeryLate = status === 'Very Late';
                      const isLate = status === 'Late';
                      return (
                        <tr
                          key={record.id || index}
                          className={`border-b border-white/5 transition-colors hover:bg-dark-700/30 ${
                            index % 2 === 0 ? 'bg-dark-800/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-gray-200 font-medium">
                            {record.name}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            <span className="inline-flex items-center gap-1 text-xs bg-dark-700/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-white/5">
                              {record.department || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {record.date}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-mono text-xs">
                            {record.check_in || record.time || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-cyan-400 font-mono text-xs">
                            {record.check_out || '—'}
                          </td>
                          <td className="py-3 px-4 text-purple-300 font-mono text-xs">
                            {record.work_hours || 'In Progress'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border ${
                                isVeryLate
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20 font-semibold'
                                  : isLate
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============== Departments & Classes Tab ============== */}
      {activeTab === 'departments' && (
        <div className="animate-fade-in max-w-4xl space-y-6">
          {/* Add Department Form */}
          <form onSubmit={handleAddDept} className="glass-card p-6">
            <h3 className="text-base font-display font-bold text-gray-200 mb-4 flex items-center gap-2">
              <HiOutlinePlus className="text-cyan-400" />
              Add New Department / Class Shift Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Department / Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Class 10-A"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                  <HiOutlineClock className="text-emerald-400" />
                  Class / Shift Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={newDeptStartTime}
                  onChange={(e) => setNewDeptStartTime(e.target.value)}
                  className="input-field text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                  <HiOutlineClock className="text-amber-400" />
                  Late Cutoff Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:15 AM"
                  value={newDeptLateCutoff}
                  onChange={(e) => setNewDeptLateCutoff(e.target.value)}
                  className="input-field text-sm font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-500">
                🟢 Before {newDeptStartTime || '09:00 AM'} = On Time | 🟡 Before {newDeptLateCutoff || '09:15 AM'} = Late | 🔴 After = Very Late
              </span>
              <button type="submit" className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                <HiOutlinePlus className="text-lg" />
                Save to MongoDB
              </button>
            </div>
          </form>

          {/* Department List */}
          <div className="glass-card p-6">
            <h3 className="text-base font-display font-bold text-gray-200 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HiOutlineBuildingOffice className="text-cyan-400 text-xl" />
                Configured Departments & Classes in MongoDB ({departments.length})
              </span>
            </h3>

            {isLoadingDepts ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading departments from MongoDB...</p>
              </div>
            ) : departments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No departments found in MongoDB.</p>
            ) : (
              <div className="space-y-3">
                {departments.map((d) => {
                  const isEditing = editingDeptId === d.id;
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-dark-700/40 border border-white/5 hover:border-cyan-400/20 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={editDeptName}
                              onChange={(e) => setEditDeptName(e.target.value)}
                              className="input-field text-sm"
                              placeholder="Department Name"
                            />
                            <input
                              type="text"
                              value={editDeptStartTime}
                              onChange={(e) => setEditDeptStartTime(e.target.value)}
                              className="input-field text-sm font-mono"
                              placeholder="Start Time (e.g. 09:00 AM)"
                            />
                            <input
                              type="text"
                              value={editDeptLateCutoff}
                              onChange={(e) => setEditDeptLateCutoff(e.target.value)}
                              className="input-field text-sm font-mono"
                              placeholder="Late Cutoff (e.g. 09:15 AM)"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleSaveDeptEdit(d.id)}
                              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                              <HiOutlineCheck /> Save Changes
                            </button>
                            <button
                              onClick={() => setEditingDeptId(null)}
                              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                              <HiOutlineXMark /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-400/20">
                              {d.name[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-200">{d.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  🟢 Start: {d.start_time || '09:00 AM'}
                                </span>
                                <span className="flex items-center gap-1 text-amber-400 font-mono">
                                  🟡 Cutoff: {d.late_cutoff || '09:15 AM'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditDept(d)}
                              className="p-2 rounded-lg bg-dark-800 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                              title="Edit Department / Shift Rules"
                            >
                              <HiOutlinePencilSquare className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(d.id)}
                              className="p-2 rounded-lg bg-dark-800 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              title="Delete Department"
                            >
                              <HiOutlineTrash className="text-base" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Person Modal */}
      <AddPersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditPerson(null);
        }}
        onSubmit={handlePersonSubmit}
        editPerson={editPerson}
        departments={departments}
        onDepartmentAdded={fetchDepartments}
      />
    </div>
  );
}
