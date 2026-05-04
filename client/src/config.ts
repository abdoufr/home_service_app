// Centralized API base URL
// In production, points to the deployed server on Vercel
// In development, uses the Vite proxy (empty string = same origin)
export const API_BASE = import.meta.env.VITE_API_URL || '';
