import { useState, useCallback } from 'react';
import { resourceService } from '../services/resource.service';

/**
 * useResources
 * Manages resource list state with loading, error, and filter support.
 */
export function useResources(initialFilters = {}) {
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [filters,   setFilters]   = useState(initialFilters);

  const fetch = useCallback(async (overrideFilters) => {
    setLoading(true);
    setError(null);
    try {
      const active = overrideFilters ?? filters;
      const { resources: data } = await resourceService.list(active);
      setResources(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  return { resources, loading, error, filters, fetch, updateFilters, clearFilters };
}
