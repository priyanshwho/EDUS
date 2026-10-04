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
    : `\nNote: No specific notes are available for this chapter. State this directly in one brief sentence and teach based on standard curriculum.\n`;

  const unslopRules = `
CRITICAL STRUCTURE, VOICE AND WRITING RULES:
1. MANDATORY STRUCTURE AND BULLET POINTS:
   - NEVER write long unbroken essays or walls of text.
   - Start with ONE concise introductory sentence directly answering the core question.
   - Present the main points as 3 to 4 clean, structured bullet points (each starting with a bullet symbol • on a new line).
   - Each bullet point must be strictly 1 to 2 short, crisp sentences covering key concepts or exam takeaways.
   - End with ONE short concluding question or sentence.
   - STRICT LENGTH: Keep the entire answer between 60 and 100 words total. Be concise and structured.
2. VOICE AND SPEECH FORMATTING:
   - NEVER use emojis anywhere.
   - NEVER use em dashes (—), en dashes (–), or hyphens as dashes (-- or -). Use periods or commas only.
   - NEVER hyphenate compound words. Write words separately so voice synthesis does not say "dash" (e.g., write "full stack", "front end", "real time", "step by step", "object oriented").
   - Do NOT use markdown code fences, headers (#), or asterisks (**bold**). Use clean bullet points with • and plain text.
3. TONE AND COMMUNICATION (UNSLOP):
   - No chatbot filler or sycophancy. NEVER say "Certainly!", "Of course!", "Great question!", "I hope this helps!", or "You're absolutely right!". Answer directly.
   - AI vocabulary to avoid: Do NOT use "additionally", "crucial", "delve", "enduring", "enhance", "fostering", "garner", "interplay", "intricate", "landscape", "pivotal", "showcase", "tapestry", "testament", "underscore", "vibrant". Use plain everyday words.
   - Fancy ways to say "is": Do not say "serves as", "stands as", "boasts", or "features". Just say "is" or "has".
   - "Not just X, but Y": State the point directly instead.
   - Filler phrases: Use "To" instead of "In order to". Use "Because" instead of "Due to the fact that". Cut "It is important to note that".
   - Plain speech: Use "use" instead of "utilize" or "leverage". Use "help" instead of "facilitate". Use active voice.`;

  let systemPrompt;
  if (mode === 'tutor') {
    systemPrompt = `You are a structured professor teaching "${chapterTitle}" from ${subjectName}.${noNotesNote}
Teach topic by topic in this order: ${(topics || []).join(', ')}.
For each topic: give 2 to 3 concise bullet points with •, then ask one focused comprehension question.
Wait for the student's response before moving to the next topic.
Reference notes: ${notesContent || 'Use standard curriculum knowledge.'}
Keep the response under 100 words.
${unslopRules}`;
  } else {
    systemPrompt = `You are a knowledgeable tutor for ${subjectName}.${noNotesNote}
The student wants to discuss "${chapterTitle}".
Answer any question they have directly and clearly in structured bullet points (using •).
Reference material: ${notesContent || 'Use standard curriculum knowledge.'}
Keep responses concise, well-structured, and student-friendly. Max 100 words total.
${unslopRules}`;
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
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: conversationMessages,
      stream: true,
      temperature: 0.6,
      max_tokens: 300,
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
