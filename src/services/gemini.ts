import { GoogleGenAI } from "@google/genai";
import { RoadmapSchema, QuizSchema, CodingChallengeSchema, EvaluationSchema, FinalExamSchema, StudentType } from "../types";
import { authService } from "./auth";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Check multiple sources for the API key
    const key = process.env.GEMINI_API_KEY || 
                (import.meta.env as any).VITE_GEMINI_API_KEY || 
                (import.meta.env as any).GEMINI_API_KEY;
    
    if (!key) {
      console.warn("GEMINI_API_KEY is missing. AI features will not work.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

const callGemini = async (prompt: any, config?: any, model: string = "gemini-3-flash-preview", retries = 2): Promise<any> => {
  if (!authService.isAuthenticated()) throw new Error("Unauthorized: Please login first.");

  const ai = getAI();
  if (!ai) throw new Error("GEMINI_API_KEY is missing in .env file. Please add it to use AI features.");

  try {
    const response = await ai.models.generateContent({
      model,
      contents: typeof prompt === 'string' ? [{ parts: [{ text: prompt }] }] : prompt,
      config: config || {},
    });

    return response;
  } catch (err: any) {
    const errorMessage = err.message || String(err);
    
    // Handle rate limits (429) with retry
    if ((errorMessage.includes("429") || errorMessage.includes("quota")) && retries > 0) {
      console.warn(`Rate limit hit, retrying in 3 seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return callGemini(prompt, config, model, retries - 1);
    }

    console.error("Gemini error:", err);
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      throw new Error("AI Rate Limit Reached: The free tier of Gemini has a limit of 5 requests per minute. Please wait a moment and try again.");
    }
    
    throw new Error(errorMessage || "AI service error");
  }
};

export const geminiService = {
  async generateRoadmap(course: string, studentType: StudentType) {
    const prompt = `Generate a detailed learning roadmap for a course titled "${course}". 
    The student's learning style is: ${studentType.replace("_", " ")}.
    - Topper: Fast-paced, deep dive, advanced concepts.
    - Slow Learner: Gradual progression, simplified explanations, focus on fundamentals.
    - One Day Learner: High-yield, exam-focused, core concepts only.
    Return an array of roadmap items. Each item should have a unique ID and at least 2-3 high-quality learning resources (articles, videos, or documentation URLs).`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: RoadmapSchema,
    });

    return JSON.parse(response.text || "[]");
  },

  async generateDailyChallenges(course: string, studentType: StudentType, currentTopics: string[]) {
    const prompt = `Generate 3 daily challenges for a student studying "${course}". 
    Learning style: ${studentType.replace("_", " ")}.
    Current topics being covered: ${currentTopics.join(", ")}.
    The challenges should be actionable and specific.
    Return a JSON array of strings.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
    });

    return JSON.parse(response.text || "[]");
  },

  async generateQuiz(course: string, topic: string) {
    const prompt = `Generate a 5-question multiple-choice quiz for the topic "${topic}" in the course "${course}".
    Include options, the index of the correct answer (0-3), and a brief explanation.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: QuizSchema,
    });

    return JSON.parse(response.text || "[]");
  },

  async generateWeeklyTest(course: string, topics: string[]) {
    const prompt = `Generate a weekly assignment test for the course "${course}".
    The test should cover the following topics: ${topics.join(", ")}.
    
    INSTRUCTIONS:
    1. If this is a coding/programming course:
       - Section 1: 10 multiple-choice quiz questions.
       - Section 2: 8 coding questions.
    2. If this is NOT a coding course (e.g., History, Biology, Business):
       - Section 1: 18 multiple-choice quiz questions.
       - Section 2: Empty array of coding questions.
    
    For quiz questions, include options, the index of the correct answer (0-3), and a brief explanation.
    For coding questions, include a problem statement, starter code, constraints, and examples.
    
    DIFFICULTY LEVEL: Intermediate/Medium. 
    - Quiz questions should test solid understanding of core concepts and practical application.
    - Coding questions should require logical thinking and standard algorithmic patterns.
    Make the test highly relevant to the topics.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: FinalExamSchema,
    });

    return JSON.parse(response.text || "{}");
  },

  async generateFinalExam(course: string, allTopics: string[]) {
    const prompt = `Generate a comprehensive final exam for the entire course "${course}".
    The exam MUST have TWO sections:
    1. Section 1: 20 multiple-choice quiz questions. Each question should have options, the index of the correct answer (0-3), and a brief explanation.
    2. Section 2: 9 coding questions. Each should have a problem statement, starter code, constraints, and examples.
    The exam must cover all major topics: ${allTopics.join(", ")}.
    
    DIFFICULTY LEVEL: Intermediate/Medium.
    - This is a final assessment, so it should cover the breadth of the course with a mix of conceptual and applied questions.
    - Focus on solid understanding of core concepts and practical problem-solving.
    - Coding questions should be of moderate complexity, testing standard patterns and logic.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: FinalExamSchema,
    });

    return JSON.parse(response.text || "{}");
  },

  async generateCodingChallenge(course: string, topic: string, difficulty: "easy" | "medium" | "hard" = "medium") {
    const prompt = `Generate a ${difficulty} difficulty coding challenge for the topic "${topic}" in the course "${course}".
    The challenge should include a problem statement, starter code, constraints, and examples.
    Detect the most appropriate programming language for this course.
    - Easy: Focus on basic syntax and simple logic.
    - Medium: Involves data structures, algorithms, or multiple steps.
    - Hard: Complex logic, optimization, or advanced concepts.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: CodingChallengeSchema,
    });

    return JSON.parse(response.text || "{}");
  },

  async evaluateCode(problemStatement: string, code: string, language: string) {
    const prompt = `Evaluate the following ${language} code for the problem: "${problemStatement}".
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    Provide a score (0-100), feedback, whether it's correct, and suggestions for improvement.`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
      responseSchema: EvaluationSchema,
    });

    return JSON.parse(response.text || "{}");
  },

  async chat(message: string, context: { course: string; studentType: StudentType; history: { role: string; parts: { text: string }[] }[] }) {
    const prompt = {
      contents: [
        { 
          role: "user", 
          parts: [{ text: `System: You are an AI Study Buddy helping a student with their course: ${context.course}. Their learning style is ${context.studentType.replace("_", " ")}. Adapt your explanations to their style. Be encouraging, clear, and helpful. If they ask for doubts, explain them step-by-step.` }] 
        },
        ...context.history.map(h => ({
          role: h.role === "model" ? "model" : "user",
          parts: h.parts
        })),
        { role: "user", parts: [{ text: message }] }
      ]
    };

    const response = await callGemini(prompt.contents);
    return response.text;
  },

  async generateLearningSuggestions(course: string, studentType: StudentType) {
    const prompt = `Provide 5 personalized learning suggestions for a student studying "${course}".
    The student's learning style is: ${studentType.replace("_", " ")}.
    - Topper: Focus on advanced research, peer teaching, and high-complexity projects.
    - Slow Learner: Focus on visual aids, mnemonic devices, and frequent small breaks.
    - One Day Learner: Focus on summary sheets, past papers, and high-yield topics.
    Return a JSON array of objects, each with a 'title', 'description', and 'icon' (one of: 'book', 'video', 'brain', 'clock', 'users', 'zap').`;

    const response = await callGemini(prompt, {
      responseMimeType: "application/json",
    });

    return JSON.parse(response.text || "[]");
  }
};
