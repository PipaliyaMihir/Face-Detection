import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api' });

// Add auth token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (username, password) =>
  API.post('/auth/login', { username, password });
export const verifyAuth = () => API.get('/auth/verify');

// Face recognition
export const recognizeFace = (frameBlob) => {
  const formData = new FormData();
  formData.append('frame', frameBlob, 'frame.jpg');
  return API.post('/attendance/recognize', formData);
};

// People CRUD
export const getPeople = (params) => API.get('/people/', { params });
export const addPerson = (formData) => API.post('/people/', formData);
export const updatePerson = (id, formData) => API.put(`/people/${id}`, formData);
export const deletePerson = (id) => API.delete(`/people/${id}`);

// Departments / Classes CRUD
export const getDepartments = () => API.get('/departments/');
export const addDepartment = (name, startTime = '09:00 AM', lateCutoff = '09:15 AM') => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('start_time', startTime);
  formData.append('late_cutoff', lateCutoff);
  return API.post('/departments/', formData);
};
export const updateDepartment = (id, formData) => API.put(`/departments/${id}`, formData);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);

// Attendance
export const getAttendance = (params) => API.get('/attendance/', { params });
export const getTodayAttendance = () => API.get('/attendance/today');
export const getStats = () => API.get('/attendance/stats');
export const getPersonAttendance = (personId) =>
  API.get(`/attendance/person/${personId}`);
export const exportAttendance = (params) =>
  API.get('/attendance/export', { params, responseType: 'blob' });

export default API;
