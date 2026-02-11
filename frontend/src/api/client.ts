import axios from "axios";

// =======================================================
// API BASE URL
// =======================================================
// Priority:
// 1️⃣ Environment variable (Vite build-time variable)
// 2️⃣ Hardcoded Azure App Service backend URL (fallback)
// =======================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE ||
  "https://smart-factory-backend-huc4avf8a8djc0fw.eastus2-01.azurewebsites.net";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================================================
// Interfaces (Types used across frontend)
// =======================================================

export interface Trace {
  trace_id: string;
  session_id: string;
  timestamp: string;
  question: string;
  input?: string;
  latency_ms: number;
  latency?: number;
  tokens: number;
  cost: number;
  scores?: Record<string, number>;
  [key: string]: any;
}

export interface Session {
  session_id: string;
  user: string;
  user_id?: string;
  trace_count: number;
  total_tokens: number;
  total_cost: number;
  created_at: string;
}

export interface Evaluator {
  evaluator_id: string;
  name: string;
  active: boolean;
  template_id: string;
  score_name: string;
  target: string;
  sampling: number;
  created_at: string;
}

export interface Template {
  template_id: string;
  name: string;
  template_name?: string;
  description: string;
  template: string;
  model: string;
  inputs: string[];
  input_variables?: string[];
  version: string;
  updated_at: string;
  last_updated?: string;
}

export interface EvaluationLog {
  timestamp: string;
  evaluator_name: string;
  trace_id: string;
  score: number;
  duration: number;
  status: string;
}
