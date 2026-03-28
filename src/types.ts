import { Type } from "@google/genai";

export type StudentType = "topper" | "slow_learner" | "one_day_learner";

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  studentType?: StudentType;
  course?: string;
  onboarded: boolean;
  roadmap?: RoadmapItem[];
  challenges?: DailyChallenge[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  topics: string[];
  resources?: { title: string; url: string }[];
  status: "todo" | "in_progress" | "completed";
}

export interface DailyChallenge {
  id: string;
  task: string;
  completed: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  problemStatement: string;
  starterCode: string;
  language: string;
  constraints: string[];
  examples: { input: string; output: string }[];
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  correct: boolean;
  suggestions: string[];
}

export interface FinalExam {
  quizQuestions: QuizQuestion[];
  codingQuestions: CodingChallenge[];
}

export const RoadmapSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      duration: { type: Type.STRING },
      topics: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      resources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["title", "url"]
        }
      },
      status: { type: Type.STRING }
    },
    required: ["id", "title", "description", "duration", "topics", "status"]
  }
};

export const QuizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      correctAnswer: { type: Type.INTEGER },
      explanation: { type: Type.STRING }
    },
    required: ["question", "options", "correctAnswer", "explanation"]
  }
};

export const CodingChallengeSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    problemStatement: { type: Type.STRING },
    starterCode: { type: Type.STRING },
    language: { type: Type.STRING },
    constraints: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          input: { type: Type.STRING },
          output: { type: Type.STRING }
        },
        required: ["input", "output"]
      }
    }
  },
  required: ["id", "title", "problemStatement", "starterCode", "language", "constraints", "examples"]
};

export const EvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    feedback: { type: Type.STRING },
    correct: { type: Type.BOOLEAN },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["score", "feedback", "correct", "suggestions"]
};

export const FinalExamSchema = {
  type: Type.OBJECT,
  properties: {
    quizQuestions: QuizSchema,
    codingQuestions: {
      type: Type.ARRAY,
      items: CodingChallengeSchema
    }
  },
  required: ["quizQuestions", "codingQuestions"]
};
