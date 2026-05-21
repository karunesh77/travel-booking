import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { itineraryService } from '../services/itineraryService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { MapPin, Calendar, Clock, Utensils, Hotel, Sun, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  travel: '✈️', sightseeing: '🏛️', food: '🍽️', accommodation: '🏨', other: '📍',
};

export default function SharedItineraryPage() {
  const { shareToken } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [shareSettings, setShareSettings] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState({ visitorName: '', visitorEmail: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itinRes, commentsRes] = await Promise.all([
          itineraryService.getShared(shareToken),
          itineraryService.getComments(shareToken),
        ]);
        setItinerary(itinRes.data.data.itinerary);
        setShareSettings(itinRes.data.data.shareSettings);
        setComments(commentsRes.data.data.comments);
      } catch (err) {
        setError(err.response?.data?.error || 'Itinerary not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shareToken]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.visitorName || !comment.message) return;
    setSubmitting(true);
    try {
      const res = await itineraryService.addComment(shareToken, comment);
      setComments([res.data.data.comment, ...comments]);
      setComment({ visitorName: '', visitorEmail: '', message: '' });
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading shared itinerary..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Itinerary Not Found</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const { tripSummary, days, tips, packingList } = itinerary;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5" />
            <span className="text-sm opacity-80">Shared Travel Itinerary</span>
          </div>
          <h1 className="text-3xl font-bold">{itinerary.tripName}</h1>
          {tripSummary?.overview && <p className="mt-2 opacity-80 max-w-2xl">{tripSummary.overview}</p>}

          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {tripSummary?.destinations?.length > 0 && (
              <span className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1">
                📍 {tripSummary.destinations.join(' → ')}
              </span>
            )}
            {tripSummary?.totalDays && (
              <span className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1">
                🗓️ {tripSummary.totalDays} Days
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Days */}
        {days?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.day} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                      {day.day}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {day.date ? format(new Date(day.date), 'EEEE, MMMM d') : `Day ${day.day}`}
                      </p>
                      <p className="text-sm text-gray-500">{day.location} {day.theme && `— ${day.theme}`}</p>
                    </div>
                  </div>

                  {day.activities?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {day.activities.map((act, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5 h-fit mt-0.5 whitespace-nowrap">
                            {act.time || '--:--'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {TYPE_ICONS[act.type] || '📍'} {act.activity}
                            </p>
                            {(act.location || act.duration) && (
                              <p className="text-xs text-gray-400">{[act.location, act.duration].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {day.meals && Object.entries(day.meals).some(([, m]) => m?.suggestion || m?.restaurant) && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-2">
                          <Utensils className="h-3 w-3" /> Meals
                        </p>
                        {['breakfast', 'lunch', 'dinner'].map(meal => {
                          const m = day.meals[meal];
                          if (!m?.suggestion && !m?.restaurant) return null;
                          return (
                            <p key={meal} className="text-xs text-amber-700">
                              <span className="font-medium capitalize">{meal}: </span>
                              {m.restaurant || m.suggestion}
                            </p>
                          );
                        })}
                      </div>
                    )}
                    {day.accommodation?.name && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                          <Hotel className="h-3 w-3" /> Stay
                        </p>
                        <p className="text-xs text-blue-700 font-medium">{day.accommodation.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {tips?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Travel Tips</h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comments */}
        {shareSettings?.allowComments && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-indigo-600" />
              Comments ({comments.length})
            </h3>

            <form onSubmit={handleComment} className="space-y-3 mb-6 pb-6 border-b border-gray-100">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="John Doe"
                    value={comment.visitorName}
                    onChange={(e) => setComment({ ...comment, visitorName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    className="input-field text-sm"
                    placeholder="john@example.com"
                    value={comment.visitorEmail}
                    onChange={(e) => setComment({ ...comment, visitorEmail: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                <textarea
                  className="input-field text-sm resize-none"
                  rows={3}
                  placeholder="Looks amazing! Have a great trip 🌍"
                  value={comment.message}
                  onChange={(e) => setComment({ ...comment, message: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                <Send className="h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                      {c.visitorName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{c.visitorName}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{c.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pb-4">
          Powered by TripCraft — AI-powered travel itineraries
        </div>
      </div>
    </div>
  );
}
