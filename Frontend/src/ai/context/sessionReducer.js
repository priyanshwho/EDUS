export const initialState = {
  // Navigation state
  branch: null,
  semester: null,
  subject: null,
  subjectData: null,

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
      return { ...state, branch: action.payload };
    case 'SET_SEMESTER':
      return { ...state, semester: action.payload };
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
      return { ...state, branch: null, semester: null, subject: null, subjectData: null };
    default:
      return state;
  }
};
