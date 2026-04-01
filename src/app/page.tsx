'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

interface UserStats {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
  };
  usage: {
    images_processed: number;
    last_processed_at: string;
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user stats on login
  useEffect(() => {
    if (session?.user) {
      fetchUserStats();
    }
  }, [session]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.result);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

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

    // 检查是否登录
    if (!session) {
      setError('请先登录后再使用');
      return;
    }

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

      // Refresh stats after successful processing
      await fetchUserStats();
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
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              🖼️ 图片背景移除
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              一键移除图片背景，返回透明背景的 PNG 图片
            </p>
          </div>
          <div className="ml-4">
            {status === 'loading' ? (
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.user?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </div>
                  {userStats && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      已处理 {userStats.usage.images_processed} 张图片
                    </div>
                  )}
                </div>
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-indigo-500"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg shadow-md transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google 登录
              </button>
            )}
          </div>
        </div>

        {/* Login Required Notice */}
        {!session && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              需要登录
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              请使用 Google 账号登录后使用背景移除功能
            </p>
          </div>
        )}

        {/* User Stats Card */}
        {session && userStats && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                  使用统计
                </div>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
                  {userStats.usage.images_processed} 张
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                  上次使用
                </div>
                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                  {new Date(userStats.usage.last_processed_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
            } ${!session ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => session && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={!session}
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
                  {session ? '点击或拖拽上传图片' : '请先登录'}
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
          {file && state === 'idle' && session && (
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
