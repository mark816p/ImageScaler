import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Download } from 'lucide-react';

export default function Upscaler() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    worker.current = new Worker(new URL('../worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.current.onmessage = (e) => {
      const data = e.data;
      switch (data.status) {
        case 'loading':
          setStatus('loading');
          break;
        case 'progress':
          setProgress(data.progress);
          break;
        case 'processing':
          setStatus('processing');
          setProgress(100);
          break;
        case 'complete':
          handleComplete(data.result);
          break;
        case 'error':
          setStatus('error');
          setErrorMsg(data.error);
          break;
      }
    };

    return () => {
      worker.current?.terminate();
    };
  }, []);

  const handleComplete = useCallback((result: any) => {
    // Draw raw image data to canvas to create a data URL
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData = new ImageData(
        new Uint8ClampedArray(result.data),
        result.width,
        result.height
      );
      ctx.putImageData(imageData, 0, 0);
      const url = canvas.toDataURL('image/png');
      setUpscaledUrl(url);
      setStatus('complete');
    } else {
      setStatus('error');
      setErrorMsg('Failed to create canvas context.');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    setUpscaledUrl(null);
    setStatus('loading');
    setProgress(0);
    setErrorMsg(null);

    // Read as Data URL to pass to worker
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && worker.current) {
        worker.current.postMessage({
          action: 'upscale',
          imageUrl: e.target.result
        });
      }
    };
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl(null);
    setUpscaledUrl(null);
    setStatus('idle');
    setProgress(0);
  };

  const download = () => {
    if (upscaledUrl) {
      const a = document.createElement('a');
      a.href = upscaledUrl;
      a.download = `upscaled-${file?.name || 'image.png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (status === 'idle') {
    return (
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all hover:border-blue-500 hover:bg-blue-500/10"
      >
        <input 
          type="file" 
          onChange={onFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept="image/*" 
        />
        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <div className="p-4 rounded-full bg-white dark:bg-zinc-800 shadow-sm group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Click or drag image to upload</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Supports PNG, JPG, WEBP</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading' || status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-lg font-medium animate-pulse">
          {status === 'loading' ? 'Loading AI model (can take a minute on first run)...' : 'Processing image...'}
        </p>
        <div className="w-full max-w-md bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-500 font-medium">Error: {errorMsg}</p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700">Try Again</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-medium text-zinc-500 dark:text-zinc-400">Original</p>
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 aspect-video flex items-center justify-center">
            {originalUrl && <img src={originalUrl} className="max-w-full max-h-full object-contain" alt="Original" />}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-blue-500">Upscaled (2x)</p>
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 aspect-video flex items-center justify-center">
            {upscaledUrl && <img src={upscaledUrl} className="max-w-full max-h-full object-contain" alt="Upscaled" />}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <button 
          onClick={reset}
          className="px-6 py-2.5 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
        >
          Try Another
        </button>
        <button 
          onClick={download}
          className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Download className="w-4 h-4" /> Download Result
        </button>
      </div>
    </div>
  );
}
