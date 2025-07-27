// components/DocumentUpload.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { documentsApi } from '../services/api';
import { CATEGORIES, STATUS_OPTIONS, ACCESS_OPTIONS } from '../types';

const DocumentUpload: React.FC = () => {
  const { setLoading, setError } = useApp();
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    category: CATEGORIES[0],
    status: STATUS_OPTIONS[0],
    access: ACCESS_OPTIONS[0],
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear success message when form changes
    if (uploadSuccess) setUploadSuccess(null);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.txt', '.md'];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      setError('Please select a PDF, TXT, or Markdown file.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return;
    }

    setUploadForm(prev => ({
      ...prev,
      file,
    }));
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.description.trim()) {
      setError('Please select a file and provide a description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await documentsApi.uploadDocument({
        file: uploadForm.file,
        description: uploadForm.description.trim(),
        category: uploadForm.category,
        status: uploadForm.status,
        access: uploadForm.access,
      });

              setUploadSuccess(`Document "${result.filename}" uploaded successfully!`);
      
      // Reset form
      setUploadForm({
        file: null,
        description: '',
        category: CATEGORIES[0],
        status: STATUS_OPTIONS[0],
        access: ACCESS_OPTIONS[0],
      });

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">


        {/* Success Message */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{uploadSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Document
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? 'border-aviator-blue bg-aviator-light'
                  : uploadForm.file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="text-center">
                {uploadForm.file ? (
                  <div>
                    <div className="mb-2">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                    <p className="text-lg font-medium text-gray-900">{uploadForm.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadForm.file.size)} • {uploadForm.file.type || 'Unknown type'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                    <p className="text-lg font-medium text-gray-900">
                      Drag and drop your document here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: PDF, TXT, Markdown (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Document Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Document Metadata</h3>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                placeholder="A brief summary of the document's content..."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Provide a clear description of what this document contains.
              </p>
            </div>

            {/* Category, Status, Access - 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={uploadForm.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={uploadForm.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="access" className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  id="access"
                  value={uploadForm.access}
                  onChange={(e) => handleInputChange('access', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                >
                  {ACCESS_OPTIONS.map(access => (
                    <option key={access} value={access}>{access}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!uploadForm.file || !uploadForm.description.trim()}
              className="w-full md:w-auto px-8 py-3 bg-aviator-blue text-white font-medium rounded-lg hover:bg-aviator-dark focus:outline-none focus:ring-2 focus:ring-aviator-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUpload; 