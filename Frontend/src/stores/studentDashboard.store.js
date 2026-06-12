import { create } from 'zustand';
import { resourceService } from '../services/resource.service';
import { getStaticResources } from '../utils/staticResources';

const CACHE_TTL_MS = 60 * 1000;

function normalizeFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function getFilterKey(filters = {}) {
  const normalized = normalizeFilters(filters);
  const sorted = Object.keys(normalized)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalized[key];
      return acc;
    }, {});

  return JSON.stringify(sorted);
}

export const useStudentDashboardStore = create((set, get) => ({
  resources: [],
  filters: {},
  loading: false,
  error: null,
  cacheByFilter: {},

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  fetchResources: async (overrideFilters, { force = false } = {}) => {
    const activeFilters = normalizeFilters(overrideFilters ?? get().filters);
    const key = getFilterKey(activeFilters);
    const cached = get().cacheByFilter[key];

    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      set({ resources: cached.resources, loading: false, error: null, filters: activeFilters });
      return cached.resources;
    }

    set({ loading: true, error: null, filters: activeFilters });

    try {
      const { resources } = await resourceService.list(activeFilters);
      
      // 1. Fetch and filter static resources
      const allStatic = getStaticResources();
      const filteredStatic = allStatic.filter((res) => {
        if (activeFilters.resource_type && res.resource_type !== activeFilters.resource_type) return false;
        if (activeFilters.semester && String(res.subjects?.semester) !== String(activeFilters.semester)) return false;
        if (activeFilters.branch && res.subjects?.branch !== activeFilters.branch) return false;
        if (activeFilters.q && !res.title.toLowerCase().includes(activeFilters.q.toLowerCase())) return false;
        return true;
      });

      // 2. Combine and sort
      const nextResources = [...(resources || []), ...filteredStatic].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      set((state) => ({
        resources: nextResources,
        loading: false,
        error: null,
        cacheByFilter: {
          ...state.cacheByFilter,
          [key]: {
            resources: nextResources,
            fetchedAt: Date.now(),
          },
        },
      }));

      return nextResources;
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to load resources' });
      throw err;
    }
  },

  invalidateResourcesCache: () => {
    set({ cacheByFilter: {} });
  },
}));
