'use client';

import { useState, useRef, useCallback } from 'react';

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return '请上传 JPG、PNG 或 WEBP 格式的图片';
    }
    if (file.size > 12 * 1024 * 1024) {
      return '图片大小不能超过 12MB';
    }
    return null;
  };

  const handleFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResultUrl(null);
    setState('idle');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const removeBackground = async () => {
    if (!file) return;

    setState('processing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image_file', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '处理失败，请稍后重试');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setState('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理失败，请稍后重试';
      setError(errorMessage);
      setState('error');
    }
  };

  const downloadImage = () => {
    if (!resultUrl) return;

    const link = document.createElement('a');
    link.href = resultUrl;
    const timestamp = new Date().getTime();
    link.download = `removed-bg-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setState('idle');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🖼️ 图片背景移除
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            一键移除图片背景，返回透明背景的 PNG 图片
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="预览"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
            ) : (
              <div>
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  点击或拖拽上传图片
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  支持 JPG、PNG、WEBP 格式，最大 12MB
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Remove Button */}
          {file && state === 'idle' && (
            <button
              onClick={removeBackground}
              className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              移除背景
            </button>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg font-medium text-indigo-700 dark:text-indigo-300">
                  正在处理中...
                </span>
              </div>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && resultUrl && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-lg font-medium text-green-700 dark:text-green-300">
                  处理完成！
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">处理结果：</p>
                <div className="inline-block bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <img
                    src={resultUrl}
                    alt="处理结果"
                    className="max-h-64 rounded-lg shadow-md"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={downloadImage}
                  className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-200"
                >
                  下载图片
                </button>
                <button
                  onClick={reset}
                  className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-lg rounded-xl transition-all duration-200"
                >
                  重新上传
                </button>
              </div>
            </div>
          )}

          {/* Reset Button (Error State) */}
          {state === 'error' && file && (
            <button
              onClick={reset}
              className="w-full mt-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-lg rounded-xl transition-all duration-200"
            >
              重新上传
            </button>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>使用 remove.bg API 进行图片处理</p>
          </div>
        </div>
      </div>
    </main>
  );
}
