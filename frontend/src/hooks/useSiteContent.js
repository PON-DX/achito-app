import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function useSiteContent(section) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const res = await axios.get(`/api/content/${section}`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      });
      setContent(res.data || {});
    } catch {}
    setLoading(false);
  }, [section]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  return { content, loading, refetch: fetchContent };
}
