import { useState } from 'react';
import { itineraryService } from '../../services/itineraryService';
import { Copy, Share2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareModal({ itinerary, onClose, onShared }) {
  const [settings, setSettings] = useState({
    allowComments: itinerary.shareSettings?.allowComments ?? true,
    allowDownload: itinerary.shareSettings?.allowDownload ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    itinerary.shareToken
      ? `${window.location.origin}/shared/${itinerary.shareToken}`
      : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await itineraryService.share(itinerary._id, settings);
      const url = res.data.data.shareUrl;
      setShareUrl(url);
      onShared && onShared(res.data.data.shareToken);
      toast.success('Share link created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('This will disable the current share link. Continue?')) return;
    try {
      await itineraryService.revokeShare(itinerary._id);
      setShareUrl(null);
      onShared && onShared(null);
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            Share Itinerary
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Allow Comments</p>
              <p className="text-xs text-gray-400">Visitors can leave comments</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowComments: !settings.allowComments })}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                settings.allowComments ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                settings.allowComments ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Allow Download</p>
              <p className="text-xs text-gray-400">Visitors can download itinerary</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowDownload: !settings.allowDownload })}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                settings.allowDownload ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                settings.allowDownload ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {shareUrl ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Share Link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="input-field text-xs flex-1"
                />
                <button onClick={copyUrl} className="btn-primary px-3">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <button onClick={handleRevoke} className="text-sm text-red-500 hover:underline">
                Revoke link
              </button>
            </div>
          ) : (
            <button onClick={handleShare} disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating link...' : 'Create Share Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
