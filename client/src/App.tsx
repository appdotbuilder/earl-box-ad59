
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Upload, Copy, Check, Image, Video, AlertCircle } from 'lucide-react';
import type { UploadStats, FileRecord } from '../../server/src/schema';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
}

function App() {
  const [stats, setStats] = useState<UploadStats>({ total_uploads: 0, total_size: 0 });
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0
  });
  const [recentUpload, setRecentUpload] = useState<FileRecord | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Load upload statistics
  const loadStats = useCallback(async () => {
    try {
      const result = await trpc.getUploadStats.query();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Generate share token (simplified for demo)
  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (200MB limit)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'File size cannot exceed 200MB'
      });
      return;
    }

    // Validate file type (images and videos only)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'Only image and video files are allowed'
      });
      return;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: undefined,
      success: false
    });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadState(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Prepare upload data
      const shareToken = generateShareToken();
      const uploadData = {
        filename: `${Date.now()}_${file.name}`,
        original_name: file.name,
        file_path: `uploads/${Date.now()}_${file.name}`,
        file_size: file.size,
        mime_type: file.type,
        share_token: shareToken
      };

      // Upload file metadata
      const result = await trpc.uploadFile.mutate(uploadData);
      
      setRecentUpload(result);
      setUploadState({
        isUploading: false,
        progress: 100,
        success: true
      });

      // Refresh stats
      await loadStats();

      // Clear success state after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'Upload failed. Please try again.'
      });
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    if (!recentUpload) return;

    try {
      const currentBaseUrl = window.location.origin;
      const shareUrlResponse = await trpc.generateShareUrl.query({
        share_token: recentUpload.share_token,
        base_url: currentBaseUrl
      });

      await navigator.clipboard.writeText(shareUrlResponse.share_url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col">
      <div className="flex-1 max-w-md mx-auto flex flex-col justify-center space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📦 Earl Box
          </h1>
          <p className="text-gray-600 text-sm">
            Share images and videos instantly
          </p>
        </div>

        {/* Upload Stats */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_uploads.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Uploads</div>
            {stats.total_size > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                {formatFileSize(stats.total_size)} stored
              </div>
            )}
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploadState.isUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !uploadState.isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={uploadState.isUploading}
            />

            {uploadState.isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Uploading...</p>
                  <Progress value={uploadState.progress} className="w-full" />
                  <p className="text-xs text-gray-500">{uploadState.progress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  dragActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-6 h-6 ${
                    dragActive ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="text-gray-600 font-medium">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Images & videos up to 200MB
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Image className="w-3 h-3" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Videos</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Status Messages */}
          {uploadState.error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {uploadState.error}
              </AlertDescription>
            </Alert>
          )}

          {uploadState.success && recentUpload && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="space-y-2">
                  <p>✅ Upload successful!</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {recentUpload.mime_type.startsWith('image/') ? '🖼️' : '🎥'} 
                        {formatFileSize(recentUpload.file_size)}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareUrl}
                      className="h-7 text-xs"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">
          Created by Earl Store❤️
        </p>
      </div>
    </div>
  );
}

export default App;
