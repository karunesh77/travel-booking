import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, LogOut, LayoutDashboard, Calendar } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <MapPin className="h-6 w-6" />
            <span>TripCraft</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/itineraries"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/itineraries')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Itineraries
              </Link>

              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
