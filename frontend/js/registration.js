// frontend/js/registration.js
// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION SYSTEM
//
// FCFS  → All pets served in arrival order regardless of selected services.
// SJF   → ONLY triggered when the user selects BOTH services (Grooming + Vet).
//          The two service times are compared and sorted shortest-first,
//          producing a per-pet service execution flow:
//          e.g.  Vet (8 min) → Grooming (10 min)   [because 8 < 10]
//
// Service times (predefined, fixed):
//   Grooming   = 10 min
//   Veterinary =  8 min
//   Billing    =  2 min  (always appended at the end)
// ─────────────────────────────────────────────────────────────────────────────

const SERVICE_TIMES = {
  grooming:   10,
  veterinary:  8,
  billing:     2,
};

// In-memory registration queue (frontend-only simulation)
// Each entry: { id, pet_name, owner_name, species, age, contact,
//               services, processing_time, arrival_time, status, sjf_flow }
let REG_QUEUE    = [];
let REG_ID_SEQ   = 1;
let currentAlgo  = 'FCFS';

const COLORS = ['#3D5A3E','#C9973A','#E07A5F','#7BB8C9','#7A9E7E','#8B6344','#5a8fa1','#c45c3a'];

// ── Toast helper ────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3500);
}

// ── Service selection UI helper ──────────────────────────────────────────────
// When the user changes the service dropdown, show/hide the SJF preview box.
function onServiceChange() {
  const sel     = document.getElementById('reg-service').value;
  const preview = document.getElementById('sjf-preview');
  const procRow = document.getElementById('proc-time-row');

  if (sel === 'both') {
    // SJF will kick in — show the computed service order
    preview.style.display = 'block';
    renderSJFPreview();
    procRow.style.display = 'none'; // processing_time is auto-computed
  } else {
    preview.style.display = 'none';
    procRow.style.display = 'block';
    // Auto-fill processing_time based on single service
    const t = sel === 'grooming' ? SERVICE_TIMES.grooming : SERVICE_TIMES.veterinary;
    document.getElementById('reg-time').value = t;
  }
}

// ── SJF preview: sort the two services by time and show execution order ──────
function renderSJFPreview() {
  const groomTime = SERVICE_TIMES.grooming;
  const vetTime   = SERVICE_TIMES.veterinary;

  // Sort [grooming, veterinary] by ascending service time (SJF rule)
  const services = [
    { name: 'Grooming',   time: groomTime, icon: '✂️' },
    { name: 'Veterinary', time: vetTime,   icon: '🏥' },
    { name: 'Billing',    time: SERVICE_TIMES.billing, icon: '💰' },
  ].sort((a, b) => a.time - b.time);

  const box = document.getElementById('sjf-preview');
  box.innerHTML = `
    <div style="font-size:.78rem;font-weight:700;color:var(--brown);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem;">
      🔁 SJF Execution Order (shortest first)
    </div>
    <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
      ${services.map((s, i) => `
        <div style="display:flex;align-items:center;gap:.4rem;">
          <div style="background:${COLORS[i]};color:#fff;border-radius:8px;padding:.35rem .75rem;font-size:.8rem;font-weight:700;">
            ${s.icon} ${s.name} <span style="opacity:.8;">(${s.time} min)</span>
          </div>
          ${i < services.length - 1 ? '<span style="color:var(--brown);font-size:1.2rem;">→</span>' : ''}
        </div>`).join('')}
    </div>
    <div style="font-size:.75rem;color:var(--brown);margin-top:.6rem;">
      Total processing time: <strong>${services.reduce((s,x)=>s+x.time,0)} min</strong>
    </div>`;

  return services; // return sorted list for use in registerPet()
}

// ── Compute processing_time from service selection ───────────────────────────
function computeProcessingTime(service) {
  if (service === 'grooming')   return SERVICE_TIMES.grooming;
  if (service === 'veterinary') return SERVICE_TIMES.veterinary;
  if (service === 'both')
    return SERVICE_TIMES.grooming + SERVICE_TIMES.veterinary + SERVICE_TIMES.billing;
  return 5;
}

// ── SJF sort for a single pet's services (used when service === 'both') ──────
function sjfServiceFlow() {
  const services = [
    { name: 'Grooming',   time: SERVICE_TIMES.grooming,   icon: '✂️' },
    { name: 'Veterinary', time: SERVICE_TIMES.veterinary, icon: '🏥' },
    { name: 'Billing',    time: SERVICE_TIMES.billing,    icon: '💰' },
  ];
  return services.sort((a, b) => a.time - b.time);
}

// ── Register a pet ────────────────────────────────────────────────────────────
function registerPet() {
  const pet_name   = document.getElementById('reg-pet-name').value.trim();
  const owner_name = document.getElementById('reg-owner').value.trim();
  const species    = document.getElementById('reg-species').value;
  const age        = parseFloat(document.getElementById('reg-age').value) || 0;
  const contact    = document.getElementById('reg-contact').value.trim();
  const service    = document.getElementById('reg-service').value;

  if (!pet_name) return toast('Pet name is required', 'error');
  if (!owner_name) return toast('Owner name is required', 'error');

  const processing_time = computeProcessingTime(service);

  // SJF flow only applies when BOTH services are selected
  const sjf_flow = service === 'both' ? sjfServiceFlow() : null;

  const entry = {
    id:              REG_ID_SEQ++,
    pet_name,
    owner_name,
    species,
    age,
    contact,
    service,
    processing_time,
    arrival_time:    Date.now(),
    arrival_label:   new Date().toLocaleTimeString(),
    status:          'waiting',
    sjf_flow,        // null unless "both" was selected
  };

  REG_QUEUE.push(entry);
  toast(`✅ ${pet_name} registered! Service: ${serviceLabel(service)}`);

  // Reset form
  document.getElementById('reg-pet-name').value = '';
  document.getElementById('reg-owner').value    = '';
  document.getElementById('reg-time').value     = '8';
  document.getElementById('sjf-preview').style.display = 'none';

  renderQueue(currentAlgo);
  renderAll();
}

function serviceLabel(s) {
  if (s === 'grooming')   return 'Grooming only';
  if (s === 'veterinary') return 'Veterinary only';
  if (s === 'both')       return 'Grooming + Veterinary (SJF)';
  return s;
}

// ── FCFS: sort by arrival_time ascending ─────────────────────────────────────
function applyFCFS(queue) {
  return [...queue].sort((a, b) => a.arrival_time - b.arrival_time);
}

// ── SJF: sort by processing_time ascending (non-preemptive) ─────────────────
// NOTE: Per spec, SJF at the registration level sorts ALL waiting pets by
//       their total processing_time — pets with shorter total time go first.
function applySJF(queue) {
  return [...queue].sort((a, b) => a.processing_time - b.processing_time);
}

// ── Build Gantt timeline from sorted queue ───────────────────────────────────
function buildTimeline(sorted) {
  let clock = 0;
  return sorted.map((p, i) => {
    const start  = clock;
    const finish = clock + p.processing_time;
    const wt     = start; // waiting time = time before service starts (arrival = 0 offset)
    clock = finish;
    return { ...p, pos: i + 1, start, finish, waiting_time: wt, turnaround: finish };
  });
}

// ── Render the scheduling queue (FCFS or SJF) ────────────────────────────────
function renderQueue(algo) {
  currentAlgo = algo;
  document.getElementById('btn-fcfs').className = algo === 'FCFS' ? 'active' : '';
  document.getElementById('btn-sjf').className  = algo === 'SJF'  ? 'active' : '';

  const waiting  = REG_QUEUE.filter(p => p.status === 'waiting');
  const sorted   = algo === 'SJF' ? applySJF(waiting) : applyFCFS(waiting);
  const timeline = buildTimeline(sorted);

  const ganttEl  = document.getElementById('gantt-reg');
  const tblEl    = document.getElementById('tbl-reg-order');

  // Stats
  const avgWT = timeline.length
    ? (timeline.reduce((s, t) => s + t.waiting_time, 0) / timeline.length).toFixed(1)
    : '–';
  const avgTT = timeline.length
    ? (timeline.reduce((s, t) => s + t.turnaround,   0) / timeline.length).toFixed(1)
    : '–';
  document.getElementById('stat-awt').textContent = avgWT;
  document.getElementById('stat-att').textContent = avgTT;

  // Gantt chart
  if (timeline.length === 0) {
    ganttEl.innerHTML = '<div class="empty"><div class="icon">📭</div><p>Queue is empty — register a pet above.</p></div>';
    tblEl.innerHTML   = '<tr><td colspan="5" class="empty">No pets in queue</td></tr>';
    return;
  }

  const maxTime = timeline[timeline.length - 1].finish;

  ganttEl.innerHTML = timeline.map((t, i) => `
    <div class="gantt-row">
      <div class="gantt-label" title="${serviceLabel(t.service)}">${t.pet_name}</div>
      <div class="gantt-bar-wrap">
        <div class="gantt-bar" style="
          left:${(t.start/maxTime)*100}%;
          width:${((t.finish-t.start)/maxTime)*100}%;
          background:${COLORS[i % COLORS.length]};">
          ${t.finish - t.start}m
        </div>
      </div>
      <div class="gantt-time">${t.finish}m</div>
    </div>`).join('');

  // Table
  tblEl.innerHTML = timeline.map(t => `
    <tr>
      <td>${t.pos}</td>
      <td class="fw-bold">${t.pet_name}</td>
      <td>${t.finish - t.start} min</td>
      <td>${t.waiting_time} min</td>
      <td>
        ${t.service === 'both'
          ? renderServiceFlow(t.sjf_flow)
          : `<span class="status status-waiting">${serviceLabel(t.service)}</span>`}
      </td>
    </tr>`).join('');
}

// ── Inline service-flow renderer for "both" SJF entries ──────────────────────
function renderServiceFlow(flow) {
  if (!flow) return '–';
  return `<div style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap;">
    ${flow.map((s, i) => `
      <span style="background:${COLORS[i]};color:#fff;padding:.15rem .5rem;border-radius:6px;font-size:.72rem;font-weight:700;">
        ${s.icon} ${s.name}(${s.time}m)
      </span>
      ${i < flow.length - 1 ? '<span style="font-size:.9rem;color:var(--brown);">→</span>' : ''}
    `).join('')}
  </div>`;
}

// ── Mark a registration as done ───────────────────────────────────────────────
function markDone(id) {
  const entry = REG_QUEUE.find(p => p.id === id);
  if (entry) entry.status = 'done';
  toast(`✔ ${entry ? entry.pet_name : 'Pet'} marked as done`);
  renderQueue(currentAlgo);
  renderAll();
}

// ── All-registrations table ───────────────────────────────────────────────────
function renderAll() {
  const tbl = document.getElementById('tbl-reg-all');
  if (REG_QUEUE.length === 0) {
    tbl.innerHTML = '<tr><td colspan="6" class="empty">No registrations yet</td></tr>';
    return;
  }
  tbl.innerHTML = [...REG_QUEUE].reverse().map(r => `
    <tr>
      <td>${r.id}</td>
      <td class="fw-bold">${r.pet_name}</td>
      <td>${r.processing_time} min</td>
      <td class="text-sm text-muted">${r.arrival_label}</td>
      <td><span class="status status-${r.status === 'done' ? 'done' : 'waiting'}">${r.status}</span></td>
      <td>
        ${r.status !== 'done'
          ? `<button class="btn btn-sm btn-coral" onclick="markDone(${r.id})">✔ Done</button>`
          : ''}
      </td>
    </tr>`).join('');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Pre-load demo pets so the UI is immediately interesting
(function seedDemo() {
  const demos = [
    { pet_name:'Bruno', owner_name:'Ahmed Khan',  species:'Dog',    age:3, contact:'0300-1234567', service:'both'       },
    { pet_name:'Max',   owner_name:'Sara Ali',    species:'Dog',    age:1, contact:'0311-2345678', service:'grooming'   },
    { pet_name:'Tom',   owner_name:'Bilal Raza',  species:'Cat',    age:2, contact:'0321-3456789', service:'veterinary' },
    { pet_name:'Luna',  owner_name:'Ayesha Noor', species:'Cat',    age:4, contact:'0333-4567890', service:'both'       },
    { pet_name:'Rocky', owner_name:'Omar Sheikh', species:'Dog',    age:5, contact:'0345-5678901', service:'grooming'   },
  ];
  demos.forEach(d => {
    const pt      = computeProcessingTime(d.service);
    const sjf_flow = d.service === 'both' ? sjfServiceFlow() : null;
    REG_QUEUE.push({
      id: REG_ID_SEQ++,
      ...d,
      processing_time: pt,
      arrival_time:    Date.now() - (demos.indexOf(d) * 60000), // stagger arrivals
      arrival_label:   new Date(Date.now() - (demos.indexOf(d) * 60000)).toLocaleTimeString(),
      status:          'waiting',
      sjf_flow,
    });
  });
})();

renderQueue('FCFS');
renderAll();