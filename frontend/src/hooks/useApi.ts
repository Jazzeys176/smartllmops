import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const useApi = {
  // GET /traces
  traces: async () => {
    const res = await axios.get(`${API_BASE}/traces`);
    return res.data;
  },

  // GET /evaluations
  evaluations: async () => {
    const res = await axios.get(`${API_BASE}/evaluations`);
    return res.data;
  },

  // GET /evaluators
  evaluators: async () => {
    const res = await axios.get(`${API_BASE}/evaluators`);
    return res.data;
  },

  // GET /templates
  templates: async () => {
    const res = await axios.get(`${API_BASE}/templates`);
    return res.data;
  },

  // GET /sessions
  sessions: async () => {
    const res = await axios.get(`${API_BASE}/sessions`);
    return res.data;
  }
};
