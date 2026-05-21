import { useDropzone } from 'react-dropzone';
import { Upload, File, X, FileText, Image } from 'lucide-react';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export default function UploadZone({ files, onChange }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => onChange([...files, ...accepted]),
  });

  const remove = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP — up to 10MB each</p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              {file.type === 'application/pdf' ? (
                <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : (
                <Image className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
              <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
