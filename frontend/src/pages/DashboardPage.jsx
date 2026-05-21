import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { itineraryService } from '../services/itineraryService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/Bookings/StatusBadge';
import UploadZone from '../components/Bookings/UploadZone';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import {
  Plus, Trash2, Upload, Wand2, FolderOpen, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [generating, setGenerating] = useState({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await bookingService.list();
      setBookings(res.data.data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) return;
    setCreating(true);
    try {
      const res = await bookingService.create({ tripName });
      setBookings([res.data.data.booking, ...bookings]);
      setShowCreateModal(false);
      setTripName('');
      toast.success('Trip created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (bookingId) => {
    const bookingFiles = files[bookingId] || [];
    if (bookingFiles.length === 0) return toast.error('Please add files first');
    setUploading({ ...uploading, [bookingId]: true });
    try {
      await bookingService.uploadDocuments(bookingId, bookingFiles);
      toast.success('Documents uploaded! Processing in background...');
      setFiles({ ...files, [bookingId]: [] });
      await fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading({ ...uploading, [bookingId]: false });
    }
  };

  const handleGenerate = async (bookingId) => {
    setGenerating({ ...generating, [bookingId]: true });
    try {
      const res = await itineraryService.generate(bookingId);
      toast.success('Itinerary generated!');
      navigate(`/itineraries/${res.data.data.itinerary._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating({ ...generating, [bookingId]: false });
    }
  };

  const handleDelete = async (bookingId) => {
    if (!confirm('Delete this trip and all its documents?')) return;
    try {
      await bookingService.delete(bookingId);
      setBookings(bookings.filter(b => b._id !== bookingId));
      toast.success('Trip deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your trips..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Manage your travel bookings and itineraries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBookings} className="btn-secondary p-2">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Trip
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Create New Trip</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Europe Summer 2026"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state */}
      {bookings.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No trips yet</h3>
          <p className="text-gray-400 mb-6">Create a trip and upload your booking documents to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expandedId === booking._id;
            const processedDocs = booking.documents?.filter(d => d.processingStatus === 'parsed') || [];
            const canGenerate = processedDocs.length > 0 && !booking.itinerary;

            return (
              <div key={booking._id} className="card">
                {/* Booking header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.tripName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={booking.status} />
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                        </span>
                        {booking.documents?.length > 0 && (
                          <span className="text-xs text-gray-400">{booking.documents.length} doc(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.itinerary && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/itineraries/${booking.itinerary._id}`); }}
                        className="btn-primary text-xs py-1.5 flex items-center gap-1"
                      >
                        <Wand2 className="h-3 w-3" />
                        View Itinerary
                      </button>
                    )}
                    {canGenerate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerate(booking._id); }}
                        disabled={generating[booking._id]}
                        className="btn-primary text-xs py-1.5 flex items-center gap-1"
                      >
                        <Wand2 className="h-3 w-3" />
                        {generating[booking._id] ? 'Generating...' : 'Generate AI Itinerary'}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(booking._id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                    {/* Existing documents */}
                    {booking.documents?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Uploaded Documents</p>
                        <div className="space-y-1.5">
                          {booking.documents.map((doc) => (
                            <div key={doc._id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <span className="flex-1 truncate text-gray-700">{doc.originalName || doc.fileName}</span>
                              <StatusBadge status={doc.processingStatus} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload zone */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Upload More Documents</p>
                      <UploadZone
                        files={files[booking._id] || []}
                        onChange={(f) => setFiles({ ...files, [booking._id]: f })}
                      />
                      {(files[booking._id]?.length > 0) && (
                        <button
                          onClick={() => handleUpload(booking._id)}
                          disabled={uploading[booking._id]}
                          className="btn-primary mt-3 flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {uploading[booking._id] ? 'Uploading...' : `Upload ${files[booking._id].length} File(s)`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
