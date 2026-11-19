import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import AiLayout from './AiLayout';
import Home from './pages/Home';
import SubjectDetail from './pages/SubjectDetail';
import ChapterSelector from './pages/ChapterSelector';
import FlashcardMode from './pages/FlashcardMode';
import MCQMode from './pages/MCQMode';
import AIInteractMode from './pages/AIInteractMode';
import PYQMode from './pages/PYQMode';
import StudyLibrary from './pages/StudyLibrary';
import StudyWorkspace from './pages/StudyWorkspace';
import { useAuth } from '../context/AuthContext';

function ScopedStudyWorkspace() {
  const { user } = useAuth();
  const { workspaceId } = useParams();
  return <StudyWorkspace key={`${user?.id}:${workspaceId}`} />;
}

const AiRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<AiLayout />}>
        <Route index element={<Home />} />
        <Route path="study" element={<StudyLibrary key={`study-${user?.id}`} />} />
        <Route path="study/:workspaceId" element={<ScopedStudyWorkspace />} />
        <Route path="subject/:branch/:semester/:subjectSlug" element={<SubjectDetail />} />
        <Route path="learn/:branch/:semester/:subjectSlug" element={<ChapterSelector />} />
        <Route path="flashcards/:branch/:semester/:subjectSlug/:chapterId" element={<FlashcardMode />} />
        <Route path="mcq/:branch/:semester/:subjectSlug/:chapterId" element={<MCQMode />} />
        <Route path="ai/:branch/:semester/:subjectSlug/:chapterId" element={<AIInteractMode />} />
        <Route path="pyq/:branch/:semester/:subjectSlug/:section" element={<PYQMode />} />
      </Route>
    </Routes>
  );
};

export default AiRoutes;
