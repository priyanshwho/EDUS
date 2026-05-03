const { callGroq } = require('../utils/groqClient');

function calculateFlashcardCount(notesContent) {
  if (!notesContent) return 4;
  const wordCount = notesContent.split(' ').length;
  if (wordCount < 200) return 4;
  if (wordCount < 500) return 6;
  if (wordCount < 900) return 8;
  return 10;
}

/**
 * Robustly extract a JSON array from an LLM response that may be
 * wrapped in markdown code fences.
 */
function extractJSON(text) {
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the first [ and the matching last ]
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in response');
  return JSON.parse(stripped.slice(start, end + 1));
}

exports.generateFlashcards = async (req, res) => {
  const { chapterTitle, subjectName, notesContent, notesExist, topics } = req.body;
  const count = calculateFlashcardCount(notesContent);

  const noNotesPrefix = notesExist
    ? ''
    : `No notes are available for this chapter. Generate content based solely on the chapter title and topics listed: ${(topics || []).join(', ')}. Use your general knowledge about ${subjectName} to fill in.\n\n`;

  const systemPrompt = `${noNotesPrefix}You are an expert academic assistant for ${subjectName}.
Generate exactly ${count} high-quality flashcards for the chapter "${chapterTitle}".
Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
Format: [{"question": "...", "answer": "..."}]`;

  const userPrompt = notesExist && notesContent
    ? `Chapter notes:\n${notesContent}`
    : `Topics: ${(topics || []).join(', ')}`;

  try {
    const raw = await callGroq({ systemPrompt, userPrompt });
    const cards = extractJSON(raw);
    res.json(cards);
  } catch (error) {
    console.error('[Flashcards Error]', error.message);
    res.status(500).json({ error: 'Flashcard generation failed', detail: error.message });
  }
};

exports.generateMCQ = async (req, res) => {
  const { chapterTitle, subjectName, notesContent, notesExist, difficulty, topics } = req.body;

  const difficultyInstructions = {
    easy: 'Generate 10 straightforward definition and recall MCQs. Questions should test basic understanding.',
    medium: 'Generate 10 application-level MCQs. Questions should require students to apply concepts to scenarios.',
    hard: 'Generate 10 advanced MCQs involving multi-step reasoning, tradeoffs, and edge cases. Include tricky distractors.',
  };

  const noNotesPrefix = notesExist
    ? ''
    : `No notes are available. Use general knowledge about ${subjectName} covering these topics: ${(topics || []).join(', ')}.\n\n`;

  const systemPrompt = `${noNotesPrefix}You are an expert professor in ${subjectName}.
${difficultyInstructions[difficulty] || difficultyInstructions.medium}
Chapter: "${chapterTitle}".

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
IMPORTANT: "correct" must be EXACTLY one of the strings "A", "B", "C", or "D" matching the option prefix.
Format:
[{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": "A",
  "explanation": "...",
  "difficulty": "${difficulty}"
}]`;

  const userPrompt = notesExist && notesContent
    ? `Chapter notes:\n${notesContent}`
    : `Topics: ${(topics || []).join(', ')}`;

  try {
    const raw = await callGroq({ systemPrompt, userPrompt });
    const questions = extractJSON(raw);

    // Normalize the "correct" field — LLM sometimes returns 0,1,2,3 or "A.","B." etc.
    const letters = ['A', 'B', 'C', 'D'];
    const normalized = questions.map(q => {
      let correct = String(q.correct).trim();
      // If it's a number 0-3, convert to letter
      if (/^[0-3]$/.test(correct)) correct = letters[parseInt(correct)];
      // Strip trailing period/dot
      correct = correct.replace(/[^A-D]/g, '').toUpperCase();
      if (!correct) correct = 'A';
      return { ...q, correct };
    });

    res.json(normalized);
  } catch (error) {
    console.error('[MCQ Error]', error.message);
    res.status(500).json({ error: 'MCQ generation failed', detail: error.message });
  }
};

exports.interact = async (req, res) => {
  const { chapterTitle, subjectName, notesContent, notesExist, messages, mode, topics } = req.body;

  const noNotesNote = notesExist
    ? ''
    : `\nNote: No specific notes are available for this chapter. Tell the student this upfront and teach based on standard curriculum.\n`;

  let systemPrompt;
  if (mode === 'tutor') {
    systemPrompt = `You are a structured professor teaching "${chapterTitle}" from ${subjectName}.${noNotesNote}
Teach topic by topic in this order: ${(topics || []).join(', ')}.
For each topic: explain in 2-3 sentences, then ask ONE comprehension question.
Wait for the student's response before moving to the next topic.
Reference notes: ${notesContent || 'Use standard curriculum knowledge.'}
Keep each response under 150 words.`;
  } else {
    systemPrompt = `You are a knowledgeable, friendly tutor for ${subjectName}.${noNotesNote}
The student wants to discuss "${chapterTitle}".
Answer any question they have about this chapter freely and clearly.
Reference material: ${notesContent || 'Use standard curriculum knowledge.'}
Keep responses concise and student-friendly. Use simple examples where helpful.`;
  }

  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []),
  ];

  try {
    // SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const streamResponse = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: conversationMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 600,
    });

    for await (const chunk of streamResponse) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[AI Interact Error]', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI interaction failed', detail: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

exports.generatePYQ = async (req, res) => {
  const { subjectName, sectionContent, section } = req.body;

  const systemPrompt = `You are an expert exam paper setter for ${subjectName}.
Generate 8 important exam questions for Section ${section} based on the syllabus topics provided.
Return ONLY a valid JSON array — no markdown, no code fences.
Format:
[{
  "question": "...",
  "type": "long" | "short" | "numerical",
  "topic": "...",
  "modelAnswer": "..."
}]`;

  const userPrompt = `Syllabus content for Section ${section}:\n${sectionContent}`;

  try {
    const raw = await callGroq({ systemPrompt, userPrompt });
    const questions = extractJSON(raw);
    res.json(questions);
  } catch (error) {
    console.error('[PYQ Error]', error.message);
    res.status(500).json({ error: 'PYQ generation failed', detail: error.message });
  }
};

exports.evaluate = async (req, res) => {
  const { question, userAnswer, correctAnswer, context } = req.body;

  const systemPrompt = `You are an academic evaluator. Evaluate the student's answer fairly.
Return ONLY a valid JSON object — no markdown, no code fences.
Format: {"score": 0-10, "feedback": "...", "correct": true/false}`;

  const userPrompt = `Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Context: ${context || ''}`;

  try {
    const raw = await callGroq({ systemPrompt, userPrompt });
    // For a single object, find { ... }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const result = JSON.parse(raw.slice(start, end + 1));
    res.json(result);
  } catch (error) {
    console.error('[Evaluate Error]', error.message);
    res.status(500).json({ error: 'Evaluation failed', detail: error.message });
  }
};
