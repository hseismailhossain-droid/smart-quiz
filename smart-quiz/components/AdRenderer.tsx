
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AdUnit } from '../types';

interface AdRendererProps {
  placementId: string;
  className?: string;
}

const AdRenderer: React.FC<AdRendererProps> = ({ placementId, className = "" }) => {
  const [ads, setAds] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query by placementId
    const q = query(
      collection(db, 'ad_units'), 
      where('placementId', '==', placementId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allAds = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdUnit));
      
      // Perform filtering and sorting on the client side
      const filteredSorted = allAds
        .filter(ad => ad.active)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      setAds(filteredSorted);
      setLoading(false);
    }, (err) => {
      console.error("Ad Load Error:", err);
      setLoading(false);
    });

    return unsub;
  });

  if (loading || ads.length === 0) return null;

  return (
    <div className={`flex flex-col gap-6 my-6 w-full ${className}`}>
      {ads.map(ad => (
        <AdItem key={ad.id} ad={ad} />
      ))}
    </div>
  );
};

const AdItem: React.FC<{ ad: AdUnit }> = ({ ad }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ad.adType === 'script' && containerRef.current) {
      containerRef.current.innerHTML = "";
      try {
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(ad.content);
        containerRef.current.appendChild(documentFragment);
        
        const scripts = containerRef.current.querySelectorAll("script");
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach((attr: Attr) => newScript.setAttribute(attr.name, attr.value));
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      } catch (err) { console.error(err); }
    }

    if (ad.adType === 'id' && (ad.network === 'adsense' || ad.network === 'admob')) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    }
  }, [ad]);

  return (
    <div className="w-full flex justify-center items-center overflow-hidden animate-in fade-in duration-500">
      {ad.adType === 'image' ? (
        <a href={ad.link || "#"} target="_blank" rel="noreferrer" className="w-full group">
          <img 
            src={ad.content} 
            alt="Ad" 
            className="w-full h-auto rounded-[28px] shadow-sm border border-slate-100 object-cover group-hover:scale-[1.01] transition-transform duration-500" 
          />
        </a>
      ) : ad.adType === 'video' ? (
        <div className="w-full rounded-[28px] overflow-hidden shadow-sm border border-slate-100 bg-black aspect-video relative">
           {ad.content.includes('youtube.com') || ad.content.includes('youtu.be') ? (
             <iframe 
               className="w-full h-full" 
               src={`https://www.youtube.com/embed/${ad.content.includes('v=') ? ad.content.split('v=')[1]?.split('&')[0] : ad.content.split('/').pop()}`} 
               frameBorder="0" 
               allowFullScreen
             ></iframe>
           ) : (
             <video src={ad.content} controls className="w-full h-full object-contain" />
           )}
        </div>
      ) : ad.adType === 'id' ? (
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-3064118239935067"
             data-ad-slot={ad.content}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      ) : (
        <div ref={containerRef} className="w-full flex justify-center"></div>
      )}
    </div>
  );
};

export default AdRenderer;
