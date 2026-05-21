import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { itineraryService } from '../services/itineraryService';
import ShareModal from '../components/Itinerary/ShareModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import {
  ArrowLeft, Share2, MapPin, Calendar, Clock, Sun, Utensils, Hotel,
  PackageOpen, Lightbulb, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_ICONS = {
  travel: '✈️', sightseeing: '🏛️', food: '🍽️', accommodation: '🏨', other: '📍',
};

export default function ItineraryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(searchParams.get('share') === '1');

  useEffect(() => {
    itineraryService.get(id)
      .then(res => setItinerary(res.data.data.itinerary))
      .catch(() => { toast.error('Itinerary not found'); navigate('/itineraries'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading itinerary..." />
      </div>
    );
  }

  if (!itinerary) return null;

  const { tripSummary, days, tips, packingList, budget } = itinerary;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showShare && (
        <ShareModal
          itinerary={itinerary}
          onClose={() => setShowShare(false)}
          onShared={(token) => setItinerary({ ...itinerary, shareToken: token, isShared: !!token })}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/itineraries')} className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{itinerary.tripName}</h1>
            {tripSummary?.overview && (
              <p className="text-gray-500 mt-1 max-w-2xl">{tripSummary.overview}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Trip summary cards */}
      {tripSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {tripSummary.destinations?.length > 0 && (
            <div className="card text-center py-4">
              <MapPin className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Destinations</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {tripSummary.destinations.join(', ')}
              </p>
            </div>
          )}
          {tripSummary.startDate && (
            <div className="card text-center py-4">
              <Calendar className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Dates</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {format(new Date(tripSummary.startDate), 'MMM d')} – {format(new Date(tripSummary.endDate), 'MMM d')}
              </p>
            </div>
          )}
          {tripSummary.totalDays && (
            <div className="card text-center py-4">
              <Clock className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Duration</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{tripSummary.totalDays} Days</p>
            </div>
          )}
          {budget?.estimatedTotal && (
            <div className="card text-center py-4">
              <DollarSign className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Est. Budget</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {budget.currency} {budget.estimatedTotal.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Day-by-day itinerary */}
      {days?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Day-by-Day Plan</h2>
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

                {/* Activities */}
                {day.activities?.length > 0 && (
                  <div className="mb-4">
                    <div className="space-y-2">
                      {day.activities.map((act, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="text-center w-16 flex-shrink-0">
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded px-1 py-0.5">
                              {act.time || '--:--'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {TYPE_ICONS[act.type] || '📍'} {act.activity}
                            </p>
                            {act.location && <p className="text-xs text-gray-400">{act.location}</p>}
                            {act.duration && <p className="text-xs text-gray-400">{act.duration}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-3">
                  {/* Meals */}
                  {day.meals && Object.entries(day.meals).some(([, m]) => m?.suggestion || m?.restaurant) && (
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-2">
                        <Utensils className="h-3 w-3" /> Meals
                      </p>
                      {['breakfast', 'lunch', 'dinner'].map(meal => {
                        const m = day.meals[meal];
                        if (!m?.suggestion && !m?.restaurant) return null;
                        return (
                          <div key={meal} className="mb-1">
                            <span className="text-xs font-medium text-amber-800 capitalize">{meal}: </span>
                            <span className="text-xs text-amber-700">
                              {m.restaurant || m.suggestion}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Accommodation */}
                  {day.accommodation?.name && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                        <Hotel className="h-3 w-3" /> Stay
                      </p>
                      <p className="text-xs text-blue-700 font-medium">{day.accommodation.name}</p>
                      {day.accommodation.address && (
                        <p className="text-xs text-blue-600 mt-0.5">{day.accommodation.address}</p>
                      )}
                    </div>
                  )}

                  {/* Weather */}
                  {day.weatherNote && (
                    <div className="bg-yellow-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1 mb-2">
                        <Sun className="h-3 w-3" /> Weather
                      </p>
                      <p className="text-xs text-yellow-700">{day.weatherNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips & Packing */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {tips?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Travel Tips
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-indigo-400 font-bold">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {packingList?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <PackageOpen className="h-5 w-5 text-purple-500" /> Packing List
            </h3>
            <ul className="space-y-1">
              {packingList.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Budget breakdown */}
      {budget?.breakdown && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-500" /> Budget Breakdown ({budget.currency})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(budget.breakdown).filter(([, v]) => v).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 capitalize">{key}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
