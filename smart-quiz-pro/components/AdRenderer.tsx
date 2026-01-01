
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
    // Query active ads for the specific placement slot
    const q = query(
      collection(db, 'ad_units'), 
      where('placementId', '==', placementId),
      where('active', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allAds = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdUnit));
      const sorted = allAds.sort((a, b) => (a.order || 0) - (b.order || 0));
      setAds(sorted);
      setLoading(false);
    }, (err) => {
      console.error(`Ad Load Error for ${placementId}:`, err);
      setLoading(false);
    });

    return () => unsub();
  }, [placementId]);

  if (loading || ads.length === 0) return null;

  return (
    <div className={`flex flex-col gap-0 w-full animate-in fade-in duration-700 ${className}`}>
      {ads.map(ad => (
        <AdItem key={ad.id} ad={ad} />
      ))}
    </div>
  );
};

const AdItem: React.FC<{ ad: AdUnit }> = ({ ad }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pushed, setPushed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if AdSense slot is actually filled
    const checkAdStatus = () => {
      if (ad.adType === 'id' && containerRef.current) {
        const ins = containerRef.current.querySelector('ins.adsbygoogle');
        if (ins) {
          const status = ins.getAttribute('data-ad-status');
          // If AdSense explicitly says "unfilled", hide the container
          if (status === 'unfilled') {
            setIsVisible(false);
          }
        }
      }
    };

    const interval = setInterval(checkAdStatus, 2000);
    return () => clearInterval(interval);
  }, [ad.adType]);

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
          Array.from(oldScript.attributes).forEach((attr: Attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        if (containerRef.current.querySelector('ins.adsbygoogle') && !pushed) {
           try {
             // @ts-ignore
             (window.adsbygoogle = window.adsbygoogle || []).push({});
             setPushed(true);
           } catch (e) {}
        }
      } catch (err) { 
        console.error("Script Ad Injected Error:", err); 
      }
    }

    if (ad.adType === 'id' && !pushed) {
      const timeout = setTimeout(() => {
        try {
          const insElements = document.querySelectorAll('ins.adsbygoogle:not([data-ad-status="filled"]):not([data-ad-status="unfilled"])');
          if (insElements.length > 0) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setPushed(true);
          }
        } catch (e) {}
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [ad, pushed]);

  if (!isVisible) return null;

  return (
    <div ref={containerRef} className="w-full flex justify-center items-center overflow-hidden transition-all duration-500">
      {ad.adType === 'image' ? (
        <a href={ad.link || "#"} target="_blank" rel="noreferrer" className="w-full mb-4 block">
          <img 
            src={ad.content} 
            alt={ad.label} 
            loading="eager"
            className="w-full h-auto rounded-[24px] shadow-sm border border-slate-100 object-cover" 
          />
        </a>
      ) : ad.adType === 'video' ? (
        <div className="w-full rounded-[24px] overflow-hidden shadow-sm border border-slate-100 bg-black aspect-video relative mb-4">
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
        /* Removed all backgrounds and min-heights. The container will naturally be 0px height if AdSense fails */
        <div className="w-full flex justify-center overflow-hidden clear-both">
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', minWidth: '250px' }}
               data-ad-client="ca-pub-3064118239935067"
               data-ad-slot={ad.content}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      ) : (
        /* Custom HTML wrapper */
        <div className="w-full flex justify-center overflow-hidden"></div>
      )}
    </div>
  );
};

export default AdRenderer;
      
