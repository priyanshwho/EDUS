import { create } from 'zustand';
import { analyticsService, subjectService } from '../services';
import { resourceService } from '../services/resource.service';

const CACHE_TTL_MS = 60 * 1000;

function isFresh(ts) {
  return ts && Date.now() - ts < CACHE_TTL_MS;
}


export const useProfessorDashboardStore = create((set, get) => ({
  analytics: null,
  subjects: [],

  myResources: [],



  loadingAnalytics: false,
  loadingSubjects: false,
  loadingResources: false,

  analyticsFetchedAt: 0,
  subjectsFetchedAt: 0,
  resourcesFetchedAt: 0,
  resourcesOwnerId: null,

  error: null,

  fetchAnalytics: async (force = false) => {
    const state = get();
    if (!force && state.analytics && isFresh(state.analyticsFetchedAt)) return state.analytics;

    set({ loadingAnalytics: true });

    try {
      const data = await analyticsService.myAnalytics();
      set({
        analytics: data,
        loadingAnalytics: false,
        analyticsFetchedAt: Date.now(),
      });
      return data;
    } catch (err) {
      set({ loadingAnalytics: false, error: err.message || 'Failed to load analytics' });
      throw err;
    }
  },

  fetchSubjects: async (force = false) => {
    const state = get();
    if (!force && state.subjects.length > 0 && isFresh(state.subjectsFetchedAt)) return state.subjects;

    set({ loadingSubjects: true });

    try {
      const { subjects } = await subjectService.list();
      const nextSubjects = subjects || [];
      set({
        subjects: nextSubjects,
        loadingSubjects: false,
        subjectsFetchedAt: Date.now(),
      });
      return nextSubjects;
    } catch (err) {
      set({ loadingSubjects: false, error: err.message || 'Failed to load subjects' });
      throw err;
    }
  },

  fetchMyResources: async (userId, force = false) => {
    if (!userId) return [];

    const state = get();
    if (
      !force &&
      state.resourcesOwnerId === userId &&
      state.myResources.length > 0 &&
      isFresh(state.resourcesFetchedAt)
    ) {
      return state.myResources;
    }

    set({ loadingResources: true });

    try {
      const { resources } = await resourceService.list({ uploaded_by: userId });
      const nextResources = resources || [];

      set({
        myResources: nextResources,
        loadingResources: false,
        resourcesFetchedAt: Date.now(),
        resourcesOwnerId: userId,
      });

      return nextResources;
    } catch (err) {
      set({ loadingResources: false, error: err.message || 'Failed to load resources' });
      throw err;
    }
  },

  prependSubject: (subject) => {
    set((state) => ({
      subjects: [subject, ...state.subjects.filter((s) => s.id !== subject.id)],
      subjectsFetchedAt: Date.now(),
    }));
  },

  removeSubjectById: (subjectId) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== subjectId),
      subjectsFetchedAt: Date.now(),
    }));
  },

  removeResourceById: (resourceId) => {
    set((state) => ({
      myResources: state.myResources.filter((r) => r.id !== resourceId),
      resourcesFetchedAt: Date.now(),
    }));
  },

  refreshAfterUpload: async (userId) => {
    await Promise.all([
      get().fetchAnalytics(true),
      get().fetchMyResources(userId, true),
    ]);
  },
}));
