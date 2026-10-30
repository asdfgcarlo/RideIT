import React, { useEffect, useRef, useState } from 'react';
import { leafletDocument, type LeafletMapProps } from './leafletDocument';

export default function LeafletMap({ position, recenter, direction, overview, destination }: LeafletMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.rideitMap === 'ready') { setReady(true); setFailed(false); }
      if (event.data?.rideitMap === 'error') setFailed(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ rideitLocation: { position, recenter, direction, overview, destination } }, '*');
  }, [ready, position, recenter, direction, overview, destination]);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [ready, generation]);
  return <div style={{ height: '100%', position: 'relative' }}>
    <iframe key={generation} ref={frame} title="Live location map" srcDoc={leafletDocument}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ height: '100%', width: '100%', border: 0 }} />
    {failed && <button style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => {
      setReady(false); setFailed(false); setGeneration(value => value + 1);
    }}>Reload map</button>}
  </div>;
}

