import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { generatePYQ } from '../api/ai.api';
import { ChevronLeft, Loader2, FileText, CheckCircle } from 'lucide-react';
import BottomNavBar from '../components/layout/BottomNavBar';

const PYQMode = () => {
  const { branch, semester, subjectSlug, section } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPYQ = async () => {
      setLoading(true);
      try {
        const sectionContent = section === 'A' ? state.subjectData?.sections.A : state.subjectData?.sections.B;
        const generated = await generatePYQ({
          subjectName: state.subjectData?.subjectName,
          sectionContent: JSON.stringify(sectionContent),
          section: section
        });
        setQuestions(generated);
      } catch (error) {
        console.error('Failed to load PYQs', error);
      } finally {
        setLoading(false);
      }
    };
    if (state.subjectData) loadPYQ();
  }, [section, state.subjectData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary mb-6" size={48} />
        <h2 className="text-2xl font-bold">Predicting Exam Questions...</h2>
        <p className="text-text-muted mt-2">AI is analyzing historical patterns for Section {section}.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col" style={{ paddingBottom: '64px' }}>
      <header className="p-8 flex items-center justify-between glass sticky top-0 z-10">
        <button
          onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${section}`)}
          className="flex items-center gap-2 text-text-muted hover:text-text"
        >
          <ChevronLeft size={20} /> Back to Chapters
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Section {section} PYQ</h2>
          <p className="text-xs text-text-muted font-bold tracking-widest">{state.subjectData?.subjectName}</p>
        </div>
        <div className="w-20" />
      </header>

      <main className="max-w-4xl mx-auto w-full p-8 space-y-8">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Predicted Important Questions</h3>
            <p className="text-text-muted text-sm">Based on syllabus weightage and standard exam patterns.</p>
          </div>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                {q.type}
              </span>
              <span className="text-xs text-text-muted font-bold">{q.topic}</span>
            </div>
            <h4 className="text-2xl font-bold mb-6 leading-tight">{q.question}</h4>

            <details className="group">
              <summary className="list-none cursor-pointer flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                <CheckCircle size={18} /> View Model Answer
              </summary>
              <div className="mt-6 p-6 bg-white/5 rounded-2xl text-text-muted leading-relaxed text-lg animate-in slide-in-from-top-2">
                {q.modelAnswer}
              </div>
            </details>
          </div>
        ))}
      </main>

      <BottomNavBar />
    </div>
  );
};

export default PYQMode;
