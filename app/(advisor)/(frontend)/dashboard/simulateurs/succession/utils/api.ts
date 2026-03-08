import axios from 'axios';

// CRM integration: les API routes Next.js sont sous /api/advisor/simulators/succession-smp/
// Le store SMP appelle des paths comme '/notarial/partage', '/succession-simulation', etc.
// Ceux-ci sont mappés vers /api/advisor/simulators/succession-smp/notarial/partage, etc.
export const API_BASE_URL = '/api/advisor/simulators/succession-smp';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
