import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itineraryService } from '../services/itineraryService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Calendar, MapPin, Clock, Share2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ItinerariesPage() {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    itineraryService.list()
      .then(res => setItineraries(res.data.data.itineraries))
      .catch(() => toast.error('Failed to load itineraries'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this itinerary?')) return;
    try {
      await itineraryService.delete(id);
      setItineraries(itineraries.filter(i => i._id !== id));
      toast.success('Itinerary deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading itineraries..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Itineraries</h1>
      <p className="text-gray-500 mb-8">All your AI-generated travel plans</p>

      {itineraries.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No itineraries yet</h3>
          <p className="text-gray-400 mb-6">Upload booking documents and generate your first AI itinerary</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {itineraries.map((itin) => (
            <div key={itin._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">{itin.tripName}</h3>
                {itin.isShared && (
                  <span className="badge bg-green-100 text-green-700">Shared</span>
                )}
              </div>

              {itin.tripSummary && (
                <div className="space-y-1.5 mb-4">
                  {itin.tripSummary.destinations?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{itin.tripSummary.destinations.join(' → ')}</span>
                    </div>
                  )}
                  {itin.tripSummary.startDate && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(itin.tripSummary.startDate), 'MMM d')} –{' '}
                        {format(new Date(itin.tripSummary.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {itin.tripSummary.totalDays && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{itin.tripSummary.totalDays} days</span>
                    </div>
                  )}
                  {itin.tripSummary.overview && (
                    <p className="text-sm text-gray-400 line-clamp-2 mt-2">{itin.tripSummary.overview}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/itineraries/${itin._id}`)}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => navigate(`/itineraries/${itin._id}?share=1`)}
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-sm"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(itin._id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
