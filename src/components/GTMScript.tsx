import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const GTMScript = () => {
  const { data: settings } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('gtm_id').single();

      if (error) {
        console.error('Error fetching GTM settings:', error);
        return null;
      }
      return data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  useEffect(() => {
    const gtmId = settings?.gtm_id;

    if (!gtmId) return;

    // Check if GTM is already loaded
    if (window.dataLayer && document.querySelector(`script[src*="${gtmId}"]`)) {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });

    // Load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    // Add noscript iframe
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    return () => {
      // Cleanup on unmount (optional)
      const existingScript = document.querySelector(`script[src*="${gtmId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [settings?.gtm_id]);

  return null;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}
