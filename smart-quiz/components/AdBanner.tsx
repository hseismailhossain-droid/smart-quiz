
import React, { useEffect } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slot, format = 'auto', className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("Adsbygoogle error:", e);
    }
  }, []);

  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-white flex justify-center items-center border border-slate-100 min-h-[100px] ${className}`}>
      {/* 
        data-ad-client: আপনার পাবলিশার আইডি (ca-pub-3064118239935067)
        data-ad-slot: আপনার ব্যানারের স্লট আইডি (8046725911)
      */}
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-3064118239935067"
           data-ad-slot={slot || "8046725911"}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;
