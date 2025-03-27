import React from 'react';
import { 
  SparklesPreview, 
  SparklesPreviewDark, 
  SparklesPreviewColorful 
} from '@/components/demos/sparkles-demo';

export default function SparklesPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-white mb-8">Sparkles Demos</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Demo</h2>
            <SparklesPreview />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Dark Theme Demo</h2>
            <SparklesPreviewDark />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Colorful Demo</h2>
            <SparklesPreviewColorful />
          </section>
        </div>
      </div>
    </div>
  );
}