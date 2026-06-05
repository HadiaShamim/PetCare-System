
// frontend/js/api.js
const BASE = 'http://localhost:3000/api';
 
async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}
 
const API = {
  // ── Registration ──────────────────────────────────────────
  addPet:            body  => apiCall('POST', '/registration', body),
  getRegQueue:       algo  => apiCall('GET',  `/registration/queue?algorithm=${algo}`),
  getAllReg:         ()    => apiCall('GET',  '/registration/all'),
  markRegDone:       id    => apiCall('PUT',  `/registration/${id}/done`),
 
  // ── Grooming ──────────────────────────────────────────────
  addGrooming:       body  => apiCall('POST', '/grooming', body),
  getGroomSchedule:  algo  => apiCall('GET',  `/grooming/schedule?algorithm=${algo}`),
  getAllGrooming:     ()    => apiCall('GET',  '/grooming/all'),
  markGroomDone:     id    => apiCall('PUT',  `/grooming/${id}/complete`),
 
  // ── Vet ───────────────────────────────────────────────────
  addVet:            body  => apiCall('POST', '/vet', body),
  getVetSchedule:    ()    => apiCall('GET',  '/vet/schedule'),
  getAllVet:         ()    => apiCall('GET',  '/vet/all'),
  dischargeVet:      id    => apiCall('PUT',  `/vet/${id}/discharge`),
 
  // ── Billing ───────────────────────────────────────────────
  addBilling:        body  => apiCall('POST', '/billing', body),
  getBillingSchedule:()    => apiCall('GET',  '/billing/schedule'),
  getAllBilling:     ()    => apiCall('GET',  '/billing/all'),
  markPaid:          id    => apiCall('PUT',  `/billing/${id}/pay`),
  getDaycare:        ()    => apiCall('GET',  '/billing/daycare'),
};
 
window.API = API;
 