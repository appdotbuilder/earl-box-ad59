
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileImage, Share2, Heart } from 'lucide-react';
import type { FileRecord, UploadFileInput, UploadStats } from '../../server/src/schema';

function App() {
  const [stats, setStats] = useState<UploadStats>({ total_uploads: 0, total_size: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileRecord | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 200 * 1024 * 1024) {
      alert('❌ Fail melebihi 200MB! Sila pilih fail yang lebih kecil.');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('❌ Hanya fail imej dan video dibenarkan!');
      return;
    }

    setIsUploading(true);
    
    try {
      const shareToken = generateShareToken();
      const filename = `${shareToken}_${file.name}`;
      const filePath = `uploads/${filename}`;

      const uploadInput: UploadFileInput = {
        filename,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        share_token: shareToken
      };

      const result = await trpc.uploadFile.mutate(uploadInput);
      setUploadedFile(result);
      
      // Refresh stats after upload
      await loadStats();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Muat naik gagal! Cuba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleShareClick = async () => {
    if (!uploadedFile) return;

    try {
      const baseUrl = window.location.origin;
      const shareResponse = await trpc.generateShareUrl.query({
        share_token: uploadedFile.share_token,
        base_url: baseUrl
      });

      await navigator.clipboard.writeText(shareResponse.share_url);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('❌ Gagal menyalin pautan!');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 Earl Box
          </h1>
          <p className="text-gray-600">Kongsi fail imej dan video dengan mudah</p>
        </div>

        {/* Upload Area */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className={`w-12 h-12 ${isUploading ? 'animate-bounce' : ''} text-gray-400`} />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isUploading ? '⏳ Memuat naik...' : '📁 Seret & lepas fail atau klik untuk pilih'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Imej dan video sahaja • Maksimum 200MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Success & Share */}
        {uploadedFile && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <FileImage className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-green-900">
                    ✅ Berjaya dimuat naik!
                  </h3>
                  <p className="text-sm text-green-700 truncate">
                    {uploadedFile.original_name} • {formatFileSize(uploadedFile.file_size)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={handleShareClick}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Kongsi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Copy Confirmation Popup */}
        {showCopiedMessage && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
            ✨ Disalin!
          </div>
        )}

        {/* Stats */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">📊 Statistik</h3>
              <div className="flex justify-center space-x-6">
                <div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {stats.total_uploads} fail
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">Jumlah muat naik</p>
                </div>
                {stats.total_size > 0 && (
                  <div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {formatFileSize(stats.total_size)}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">Jumlah saiz</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 flex items-center justify-center space-x-1">
            <span>Created by Earl Store</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
