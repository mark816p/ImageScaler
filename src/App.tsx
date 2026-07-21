import { useEffect, useState } from 'react';
import { ImagePlus, Sun, Moon, ExternalLink } from 'lucide-react';
import Upscaler from './components/Upscaler';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setTheme(isDark ? 'dark' : 'light');
    } catch (e) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      try { localStorage.theme = 'dark'; } catch(e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.theme = 'light'; } catch(e) {}
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex flex-col flex-1 items-center w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-200">
      <div className="max-w-4xl flex flex-col flex-1 w-full h-full px-6 md:px-8">
        <header className="relative z-50 pt-8 pb-4">
          <nav className="flex justify-between items-center w-full">
            <a href="#" className="group flex items-center gap-3">
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black p-2 rounded-xl group-hover:scale-105 transition-transform">
                <ImagePlus className="w-6 h-6" />
              </div>
              <span className="text-2xl font-semibold tracking-tight">ImageScaler</span>
            </a>
            <div className="flex gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <a href="https://github.com/mark816p/ImageScaler" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </nav>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-2xl flex flex-col gap-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Enhance images <span className="text-blue-500">locally.</span>
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Upscale your images privately on your own device using advanced AI. No uploads required.
              </p>
            </div>

            <Upscaler />
            
          </div>
        </main>
        
        <footer className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>Powered by Transformers.js & Web Workers • Running 100% locally in your browser</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
