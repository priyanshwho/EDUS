export const initialState = {
  // Navigation state
  branch: null,
  semester: null,
  selectedSemesters: [],
  subject: null,
  subjectData: null,
  viewMode: 'normal',

  // Session state
  selectedSection: null,
  currentChapterId: null,
  currentMode: null,

  // Cross-mode continuity
  lastActiveChapterId: null,

  // Flashcard progress per chapter
  flashcardProgress: {},

  // MCQ progress per chapter
  mcqProgress: {},

  // AI Interaction progress per chapter
  aiProgress: {},

  // PYQ progress
  pyqProgress: {},

  // Session control
  sessionPaused: false,
  sessionActive: false,
};

export const sessionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BRANCH':
      return {
        ...state,
        branch: action.payload,
        semester: null,
        selectedSemesters: [],
        viewMode: 'normal',
      };
    case 'SET_SEMESTER':
      return {
        ...state,
        semester: action.payload,
        selectedSemesters: action.payload ? [action.payload] : [],
        viewMode: 'normal',
      };
    case 'SET_SEMESTERS':
      return {
        ...state,
        selectedSemesters: Array.isArray(action.payload) ? action.payload : [],
        semester: (Array.isArray(action.payload) && action.payload[0]) || null,
        viewMode: 'normal',
      };
    case 'TOGGLE_SEMESTER': {
      const sem = action.payload;
      const current = Array.isArray(state.selectedSemesters)
        ? [...state.selectedSemesters]
        : (state.semester ? [state.semester] : []);
      const exists = current.includes(sem);
      const updated = exists ? current.filter((s) => s !== sem) : [...current, sem];
      return {
        ...state,
        selectedSemesters: updated,
        semester: updated[0] || null,
        viewMode: 'normal',
      };
    }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SUBJECT':
      return { ...state, subject: action.payload };
    case 'SET_SUBJECT_DATA':
      return { ...state, subjectData: action.payload };
    case 'SET_SECTION':
      return { ...state, selectedSection: action.payload };
    case 'SET_MODE':
      return { ...state, currentMode: action.payload };
    case 'SET_CHAPTER':
      return {
        ...state,
        currentChapterId: action.payload,
        lastActiveChapterId: action.payload
      };
    case 'UPDATE_FLASHCARD_PROGRESS':
      return {
        ...state,
        flashcardProgress: {
          ...state.flashcardProgress,
          [action.payload.chapterId]: action.payload.progress
        }
      };
    case 'UPDATE_MCQ_PROGRESS':
      return {
        ...state,
        mcqProgress: {
          ...state.mcqProgress,
          [action.payload.chapterId]: action.payload.progress
        }
      };
    case 'UPDATE_AI_PROGRESS':
      return {
        ...state,
        aiProgress: {
          ...state.aiProgress,
          [action.payload.chapterId]: action.payload.progress
        }
      };
    case 'UPDATE_PYQ_PROGRESS':
      return {
        ...state,
        pyqProgress: {
          ...state.pyqProgress,
          [action.payload.section]: action.payload.progress
        }
      };
    case 'PAUSE_SESSION':
      return { ...state, sessionPaused: true };
    case 'RESUME_SESSION':
      return { ...state, sessionPaused: false };
    case 'STOP_SESSION':
      return { ...state, sessionActive: false, currentMode: null };
    case 'SWITCH_MODE':
      return { ...state, currentMode: action.payload };
    case 'CLEAR_FILTERS':
      return { ...state, branch: null, semester: null, selectedSemesters: [], subject: null, subjectData: null, viewMode: 'normal' };
    default:
      return state;
  }
};
