import { create } from 'zustand';
import { analyticsService, userService, subjectService } from '../services';
import { resourceService } from '../services/resource.service';

const CACHE_TTL_MS = 60 * 1000;

function isFresh(ts) {
  return ts && Date.now() - ts < CACHE_TTL_MS;
}

export const useAdminDashboardStore = create((set, get) => ({
  platformAnalytics: null,
  users: [],
  subjects: [],
  resources: [],

  loadingPlatformAnalytics: false,
  loadingUsers: false,
  loadingSubjects: false,
  loadingResources: false,

  platformAnalyticsFetchedAt: 0,
  usersFetchedAt: 0,
  subjectsFetchedAt: 0,
  resourcesFetchedAt: 0,

  fetchPlatformAnalytics: async (force = false) => {
    const state = get();
    if (!force && state.platformAnalytics && isFresh(state.platformAnalyticsFetchedAt)) {
      return state.platformAnalytics;
    }

    set({ loadingPlatformAnalytics: true });

    try {
      const data = await analyticsService.platformAnalytics();
      set({
        platformAnalytics: data,
        loadingPlatformAnalytics: false,
        platformAnalyticsFetchedAt: Date.now(),
      });
      return data;
    } catch (err) {
      set({ loadingPlatformAnalytics: false });
      throw err;
    }
  },

  fetchUsers: async (force = false) => {
    const state = get();
    if (!force && state.users.length > 0 && isFresh(state.usersFetchedAt)) return state.users;

    set({ loadingUsers: true });

    try {
      const { users } = await userService.listAll();
      const nextUsers = users || [];
      set({
        users: nextUsers,
        loadingUsers: false,
        usersFetchedAt: Date.now(),
      });
      return nextUsers;
    } catch (err) {
      set({ loadingUsers: false });
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
      set({ loadingSubjects: false });
      throw err;
    }
  },

  fetchResources: async (force = false) => {
    const state = get();
    if (!force && state.resources.length > 0 && isFresh(state.resourcesFetchedAt)) return state.resources;

    set({ loadingResources: true });

    try {
      const { resources } = await resourceService.list({});
      const nextResources = resources || [];
      set({
        resources: nextResources,
        loadingResources: false,
        resourcesFetchedAt: Date.now(),
      });
      return nextResources;
    } catch (err) {
      set({ loadingResources: false });
      throw err;
    }
  },

  setUserRole: (id, role) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
      usersFetchedAt: Date.now(),
    }));
  },

  removeUserById: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      usersFetchedAt: Date.now(),
    }));
  },

  removeUserAndResources: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      resources: state.resources.filter((r) => r.uploaded_by !== userId),
      usersFetchedAt: Date.now(),
      resourcesFetchedAt: Date.now(),
    }));
  },

  renameUser: (id, newUsername) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, username: newUsername } : u)),
      usersFetchedAt: Date.now(),
    }));
  },

  addSubject: (subject) => {
    set((state) => ({
      subjects: [...state.subjects, subject],
      subjectsFetchedAt: Date.now(),
    }));
  },

  removeSubjectById: (id) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
      subjectsFetchedAt: Date.now(),
    }));
  },

  prependResource: (resource) => {
    set((state) => ({
      resources: [resource, ...state.resources],
      resourcesFetchedAt: Date.now(),
    }));
  },

  updateResource: (resource) => {
    set((state) => ({
      resources: state.resources.map((r) => (r.id === resource.id ? { ...r, ...resource } : r)),
      resourcesFetchedAt: Date.now(),
    }));
  },

  removeResourceById: (id) => {
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== id),
      resourcesFetchedAt: Date.now(),
    }));
  },
}));
