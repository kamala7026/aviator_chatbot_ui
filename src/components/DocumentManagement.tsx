// components/DocumentManagement.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { documentsApi } from '../services/api';
import { DocumentMetadata, DocumentUpdate, CATEGORIES, STATUS_OPTIONS, ACCESS_OPTIONS } from '../types';
import Pagination from './Pagination';

const DocumentManagement: React.FC = () => {
  const { setLoading, setError } = useApp();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DocumentUpdate>({});
  const [documentsToDelete, setDocumentsToDelete] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_previous: false
  });
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    category: CATEGORIES[0],
    status: STATUS_OPTIONS[0],
    access: ACCESS_OPTIONS[0],
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const loadDocuments = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const response = await documentsApi.getAllDocuments(page, 10);
      setDocuments(response.documents);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDocuments(page);
  };

  const handleEdit = (doc: DocumentMetadata) => {
    setEditingDoc(doc.document_id);
    setEditForm({
      description: doc.description,
      category: doc.category,
      status: doc.status,
      access: doc.access,
    });
  };

  const handleCancelEdit = () => {
    setEditingDoc(null);
    setEditForm({});
  };

  const handleSaveEdit = async (documentId: string) => {
    setLoading(true);
    try {
      await documentsApi.updateDocument(documentId, editForm);
      setEditingDoc(null);
      setEditForm({});
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      setError('Failed to update document');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof DocumentUpdate, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDeleteSelection = (documentId: string) => {
    setDocumentsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (documentsToDelete.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${documentsToDelete.size} selected document${documentsToDelete.size > 1 ? 's' : ''}?`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      const deletePromises = Array.from(documentsToDelete).map(docId =>
        documentsApi.deleteDocument(docId)
      );
      
      await Promise.all(deletePromises);
      setDocumentsToDelete(new Set());
      handleRefresh();
    } catch (error) {
      setError('Failed to delete documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    setLoading(true);
    try {
      await documentsApi.deleteDocument(documentId);
      handleRefresh();
    } catch (error) {
      setError('Failed to delete document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Upload Modal Functions
  const handleUploadInputChange = (field: string, value: string) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: value,
    }));
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
    if (uploadSuccess) setUploadSuccess(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    try {
      const result = await documentsApi.uploadDocument({
        file: uploadForm.file,
        description: uploadForm.description,
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

      // Refresh documents list
      handleRefresh();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(null);
      }, 2000);

    } catch (error) {
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadForm({
      file: null,
      description: '',
      category: CATEGORIES[0],
      status: STATUS_OPTIONS[0],
      access: ACCESS_OPTIONS[0],
    });
    setUploadSuccess(null);
    setDragActive(false);
  };

  if (documents.length === 0) {
    return (
      <div className="w-full text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-500 mb-4">
            Upload documents in the 'Document Upload' tab to get started.
          </p>
          <button
            onClick={handleRefresh}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Action Buttons */}
      <div className="flex items-center justify-end mb-6 min-h-0">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="p-3 bg-aviator-blue text-white rounded-lg hover:bg-aviator-dark transition-colors"
            title="Upload Document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
          <button
            onClick={handleRefresh}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {documentsToDelete.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors relative"
              title={`Delete ${documentsToDelete.size} selected document${documentsToDelete.size > 1 ? 's' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {documentsToDelete.size > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {documentsToDelete.size}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden w-full max-w-none">
        <div className="overflow-x-auto w-full" style={{ maxWidth: 'calc(100vw - 320px)' }}>
          <table className="w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={documentsToDelete.size === documents.length && documents.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDocumentsToDelete(new Set(documents.map(doc => doc.document_id)));
                      } else {
                        setDocumentsToDelete(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-aviator-blue focus:ring-aviator-blue"
                  />
                </th>
                <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access
                </th>
                <th className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chunks
                </th>
                <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={documentsToDelete.has(doc.document_id)}
                      onChange={() => toggleDeleteSelection(doc.document_id)}
                      className="rounded border-gray-300 text-aviator-blue focus:ring-aviator-blue"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                    <div className="text-sm text-gray-500">ID: {doc.document_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingDoc === doc.document_id ? (
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {doc.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingDoc === doc.document_id ? (
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => handleFormChange('category', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingDoc === doc.document_id ? (
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doc.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingDoc === doc.document_id ? (
                      <select
                        value={editForm.access || ''}
                        onChange={(e) => handleFormChange('access', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {ACCESS_OPTIONS.map(access => (
                          <option key={access} value={access}>{access}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doc.access === 'Internal' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {doc.access}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.total_chunks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingDoc === doc.document_id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(doc.document_id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Save changes"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Cancel editing"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(doc)}
                          className="text-aviator-blue hover:text-aviator-dark p-1 rounded hover:bg-aviator-light"
                          title="Edit document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(doc.document_id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.items_per_page}
            totalItems={pagination.total_items}
          />
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Total documents: {pagination.total_items}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                <button
                  onClick={closeUploadModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success Message */}
              {uploadSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800">{uploadSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Document *
                  </label>
                  
                  {/* Drag and Drop Area */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-aviator-blue bg-aviator-light' 
                        : 'border-gray-300 hover:border-aviator-blue'
                    }`}
                  >
                    {uploadForm.file ? (
                      <div>
                        <div className="mb-2">
                          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900">{uploadForm.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
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
                          or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supports PDF, TXT, and Markdown files (Max 10MB)
                        </p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      accept=".pdf,.txt,.md"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => handleUploadInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviator-blue focus:border-transparent"
                      required
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={uploadForm.status}
                      onChange={(e) => handleUploadInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviator-blue focus:border-transparent"
                      required
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Level *
                    </label>
                    <select
                      value={uploadForm.access}
                      onChange={(e) => handleUploadInputChange('access', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviator-blue focus:border-transparent"
                      required
                    >
                      {ACCESS_OPTIONS.map((access) => (
                        <option key={access} value={access}>
                          {access}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => handleUploadInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviator-blue focus:border-transparent"
                      placeholder="Optional description for the document..."
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadForm.file}
                    className="px-6 py-2 bg-aviator-blue text-white rounded-lg hover:bg-aviator-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement; 