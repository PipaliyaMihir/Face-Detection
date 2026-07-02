import { useState, useEffect, useRef, useCallback } from 'react';
import { HiOutlineXMark, HiOutlineCloudArrowUp, HiOutlineBuildingOffice, HiOutlineClock } from 'react-icons/hi2';
import { ImSpinner8 } from 'react-icons/im';
import { addDepartment } from '../api/api';

export default function AddPersonModal({ isOpen, onClose, onSubmit, editPerson, departments = [], onDepartmentAdded }) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [customDept, setCustomDept] = useState('');
  const [customStartTime, setCustomStartTime] = useState('09:00 AM');
  const [customLateCutoff, setCustomLateCutoff] = useState('09:15 AM');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editPerson) {
      setName(editPerson.name || '');
      setDepartment(editPerson.department || 'General');
      setIsCustomDept(false);
      setImageFile(null);
      setImagePreview(null);
      setError(null);
    } else {
      setName('');
      if (departments.length > 0) {
        setDepartment(departments[0].name);
      } else {
        setDepartment('Computer Science');
      }
      setIsCustomDept(false);
      setCustomDept('');
      setCustomStartTime('09:00 AM');
      setCustomLateCutoff('09:15 AM');
      setImageFile(null);
      setImagePreview(null);
      setError(null);
    }
  }, [editPerson, isOpen, departments]);

  // Handle image file selection
  const handleImageChange = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageChange(file);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!editPerson && !imageFile) {
      setError('Please select an image');
      return;
    }

    let targetDept = department;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isCustomDept) {
        if (!customDept.trim()) {
          setError('Department name is required');
          setIsSubmitting(false);
          return;
        }
        targetDept = customDept.trim();
        // Register new department with start time and late cutoff
        await addDepartment(targetDept, customStartTime || '09:00 AM', customLateCutoff || '09:15 AM');
        onDepartmentAdded?.();
      }

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('department', targetDept);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await onSubmit(formData, editPerson?.id);
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'An error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md p-6 animate-slide-up max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-gray-200">
            {editPerson ? 'Edit Person / Student' : 'Add Person / Student'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
          >
            <HiOutlineXMark className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter person's full name"
              className="input-field text-sm"
              autoFocus
            />
          </div>

          {/* Department / Class Selection & Shift Times */}
          <div className="p-3.5 rounded-xl bg-dark-700/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <HiOutlineBuildingOffice className="text-cyan-400 text-sm" />
                Department / Class
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDept(!isCustomDept)}
                className="text-[11px] text-cyan-400 hover:underline font-medium"
              >
                {isCustomDept ? 'Select Existing' : '+ Add New Department'}
              </button>
            </div>

            {isCustomDept ? (
              <div className="space-y-3 animate-fade-in pt-1">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    placeholder="e.g. Class 10-A, Mechanical, HR"
                    className="input-field text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                      <HiOutlineClock className="text-emerald-400" />
                      Class Start Time
                    </label>
                    <input
                      type="text"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      className="input-field text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                      <HiOutlineClock className="text-amber-400" />
                      Late Cutoff Time
                    </label>
                    <input
                      type="text"
                      value={customLateCutoff}
                      onChange={(e) => setCustomLateCutoff(e.target.value)}
                      placeholder="e.g. 09:15 AM"
                      className="input-field text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-800/80 border border-white/5 text-[10px] text-gray-400 space-y-0.5">
                  <p>🟢 <b>On Time</b>: Scans before {customStartTime || '09:00 AM'}</p>
                  <p>🟡 <b>Late</b>: Scans between {customStartTime || '09:00 AM'} and {customLateCutoff || '09:15 AM'}</p>
                  <p>🔴 <b>Very Late</b>: Scans after {customLateCutoff || '09:15 AM'}</p>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input-field appearance-none cursor-pointer bg-dark-700/80 text-gray-200 text-sm"
                >
                  {departments.length > 0 ? (
                    departments.map((d) => (
                      <option key={d.id || d.name} value={d.name} className="bg-dark-800 text-gray-200">
                        {d.name} {d.start_time ? `(Start: ${d.start_time}, Late: ${d.late_cutoff || 'N/A'})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Computer Science" className="bg-dark-800 text-gray-200">Computer Science (Start: 09:00 AM, Late: 09:15 AM)</option>
                      <option value="Information Technology" className="bg-dark-800 text-gray-200">Information Technology (Start: 09:15 AM, Late: 09:30 AM)</option>
                      <option value="Electrical Engineering" className="bg-dark-800 text-gray-200">Electrical Engineering (Start: 09:30 AM, Late: 09:45 AM)</option>
                      <option value="Class 10-A" className="bg-dark-800 text-gray-200">Class 10-A (Start: 08:30 AM, Late: 08:45 AM)</option>
                      <option value="Class 12-A" className="bg-dark-800 text-gray-200">Class 12-A (Start: 08:30 AM, Late: 08:45 AM)</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Image upload area */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Photo {editPerson && <span className="text-gray-600">(optional when editing)</span>}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-cyan-400/60 bg-cyan-400/5'
                  : 'border-white/10 hover:border-cyan-400/30 hover:bg-dark-700/30'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 mx-auto rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-0 right-1/2 translate-x-[3.5rem] -translate-y-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <HiOutlineXMark />
                  </button>
                  <p className="text-[11px] text-gray-500 mt-1.5">Click to change photo</p>
                </div>
              ) : (
                <>
                  <HiOutlineCloudArrowUp className="text-2xl text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">
                    Drag & drop face photo here
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    or click to browse
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 py-2.5 text-sm"
          >
            {isSubmitting ? (
              <>
                <ImSpinner8 className="animate-spin" />
                {editPerson ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              editPerson ? 'Update Person' : 'Save & Register'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
