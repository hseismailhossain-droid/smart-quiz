
import React, { useEffect, useRef } from 'react';
import { AdPlacement } from '../types';

interface AdRendererProps {
  placement: AdPlacement | null | undefined;
  className?: string;
}

const AdRenderer: React.FC<AdRendererProps> = ({ placement, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placement || !placement.active || placement.network === 'none') return;

    // Script injection for AdSense / Adsterra
    if ((placement.adType === 'script' || placement.network === 'adsterra') && containerRef.current) {
      containerRef.current.innerHTML = "";
      const scriptContent = placement.content;
      
      // Creating a range to execute scripts
      const range = document.createRange();
      const documentFragment = range.createContextualFragment(scriptContent);
      containerRef.current.appendChild(documentFragment);
    }

    // AdMob manually handled via slot ID if needed (for specific layout)
    if (placement.network === 'admob' && placement.adType === 'id') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    }
  }, [placement]);

  if (!placement || !placement.active || placement.network === 'none') return null;

  return (
    <div className={`my-4 flex justify-center items-center w-full min-h-[50px] overflow-hidden ${className}`}>
      {placement.adType === 'image' ? (
        <a href={placement.link || "#"} target="_blank" rel="noreferrer" className="w-full">
          <img 
            src={placement.content} 
            alt="Advertisement" 
            className="w-full h-auto rounded-2xl shadow-sm border border-slate-100 object-cover" 
          />
        </a>
      ) : placement.adType === 'video' ? (
        <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-black aspect-video relative">
           {placement.content.includes('youtube.com') || placement.content.includes('youtu.be') ? (
             <iframe 
               className="w-full h-full" 
               src={`https://www.youtube.com/embed/${placement.content.includes('v=') ? placement.content.split('v=')[1]?.split('&')[0] : placement.content.split('/').pop()}`} 
               frameBorder="0" 
               allowFullScreen
             ></iframe>
           ) : (
             <video src={placement.content} controls className="w-full h-full object-contain" />
           )}
           {placement.link && (
             <a href={placement.link} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black text-slate-900 uppercase shadow-lg">বিস্তারিত দেখুন</a>
           )}
        </div>
      ) : placement.adType === 'id' ? (
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-3064118239935067"
             data-ad-slot={placement.content}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      ) : (
        <div ref={containerRef} className="w-full flex justify-center"></div>
      )}
    </div>
  );
};

export default AdRenderer;
