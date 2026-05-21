const STATUS_CONFIG = {
  created: { label: 'Created', class: 'bg-gray-100 text-gray-700' },
  uploaded: { label: 'Uploaded', class: 'bg-blue-100 text-blue-700' },
  processed: { label: 'Processed', class: 'bg-yellow-100 text-yellow-700' },
  'itinerary-generated': { label: 'Itinerary Ready', class: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', class: 'bg-gray-100 text-gray-600' },
  extracting: { label: 'Extracting', class: 'bg-blue-100 text-blue-600' },
  extracted: { label: 'Extracted', class: 'bg-yellow-100 text-yellow-700' },
  parsed: { label: 'Parsed', class: 'bg-green-100 text-green-700' },
  error: { label: 'Error', class: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}
