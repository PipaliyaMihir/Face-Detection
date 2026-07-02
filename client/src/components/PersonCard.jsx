import { useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBuildingOffice } from 'react-icons/hi2';

const BACKEND_URL = 'http://localhost:8000';

export default function PersonCard({ person, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const imageUrl = person.image_url
    ? person.image_url.startsWith('http')
      ? person.image_url
      : person.image_url.startsWith('/')
      ? `${BACKEND_URL}${person.image_url}`
      : `${BACKEND_URL}/known_faces/${person.image_url}`
    : null;

  const formattedDate = person.created_at
    ? new Date(person.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="glass-card-hover relative overflow-hidden group">
      {/* Confirmation overlay */}
      {showConfirm && (
        <div className="absolute inset-0 z-20 bg-dark-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in rounded-2xl">
          <p className="text-sm text-gray-300 mb-1">Delete this person?</p>
          <p className="text-xs text-gray-500 mb-4">This action cannot be undone</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onDelete?.(person.id);
                setShowConfirm(false);
              }}
              className="btn-danger text-sm"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-center gap-3.5">
          {/* Person photo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-dark-700 border border-white/10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={person.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full items-center justify-center text-gray-500 text-base font-display font-bold ${
                imageUrl ? 'hidden' : 'flex'
              }`}
            >
              {person.name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>

          {/* Name, department & date */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-200 truncate">
              {person.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                <HiOutlineBuildingOffice className="text-xs flex-shrink-0" />
                {person.department || 'General'}
              </span>
              <span className="text-[10px] text-gray-500">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit?.(person)}
              className="p-1.5 rounded-lg bg-dark-700/50 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all duration-200"
              title="Edit"
            >
              <HiOutlinePencilSquare className="text-sm" />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1.5 rounded-lg bg-dark-700/50 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
              title="Delete"
            >
              <HiOutlineTrash className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
