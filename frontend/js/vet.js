// frontend/js/vet.js
// ─────────────────────────────────────────────────────────────────────────────
// VETERINARY DEPARTMENT — Priority Scheduling
//
// Rules:
//   Emergency cases → priority 1 (highest) → Emergency Treatment Room
//   Normal cases    → priority 2            → General Checkup Room
//
// Algorithm (non-preemptive Priority Scheduling):
//   1. At each decision point, pick the case with the lowest priority number.
//   2. Ties in priority are broken by arrival order (earlier arrival first).
//   3. Once a case starts treatment, it runs to completion.
//
// Room allocation is automatic:
//   Emergency → Emergency Treatment Room
//   Normal    → General Checkup Room
// ─────────────────────────────────────────────────────────────────────────────

let VET_QUEUE = [];
let VET_ID    = 1;

const VET_COLORS = {
  Emergency: '#E07A5F',
  Normal:    '#7BB8C9',
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3500);
}

// ── Room preview when case type changes ────────────────────────────────────────
function onTypeChange() {
  const type    = document.getElementById('v-type').value;
  const preview = document.getElementById('v-room-preview');
  if (type === 'Emergency') {
    preview.textContent       = '🚨 Room: Emergency Treatment Room (Priority 1)';
    preview.style.background  = '#fee2e2';
    preview.style.color       = '#991b1b';
  } else {
    preview.textContent       = '🏠 Room: General Checkup Room (Priority 2)';
    preview.style.background  = 'var(--sage-light)';
    preview.style.color       = 'var(--forest)';
  }
}

// ── Add a vet case ─────────────────────────────────────────────────────────────
function addCase() {
  const pet_name        = document.getElementById('v-name').value.trim();
  const case_type       = document.getElementById('v-type').value;  // 'Emergency' | 'Normal'
  const condition_desc  = document.getElementById('v-desc').value.trim();
  const processing_time = parseInt(document.getElementById('v-time').value) || 15;

  if (!pet_name) return toast('Pet name is required', 'error');

  // Priority: Emergency = 1, Normal = 2
  const priority     = case_type === 'Emergency' ? 1 : 2;
  const room_assigned = case_type === 'Emergency' ? 'Emergency Treatment Room' : 'General Checkup Room';

  VET_QUEUE.push({
    id:             VET_ID++,
    pet_name,
    case_type,
    condition_desc: condition_desc || 'Not specified',
    priority,
    room_assigned,
    processing_time,
    arrival_time:   Date.now(),
    arrival_label:  new Date().toLocaleTimeString(),
    status:         'waiting',
  });

  toast(`✅ ${case_type} case added for ${pet_name} → ${room_assigned}`);

  document.getElementById('v-name').value = '';
  document.getElementById('v-desc').value = '';

  loadSchedule();
  loadAll();
}

// ── Priority Scheduling (non-preemptive) ──────────────────────────────────────
// Sort by priority ASC, then by arrival_time ASC for ties.
function applyPrioritySchedule(queue) {
  return [...queue].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.arrival_time - b.arrival_time;
  });
}

// ── Build Gantt timeline ───────────────────────────────────────────────────────
function buildTimeline(sorted) {
  let clock = 0;
  return sorted.map((p, i) => {
    const start        = clock;
    const finish       = clock + p.processing_time;
    const waiting_time = start;
    const turnaround   = finish;
    clock = finish;
    return { ...p, pos: i + 1, start, finish, waiting_time, turnaround };
  });
}

// ── Render the priority schedule ───────────────────────────────────────────────
function loadSchedule() {
  const waiting  = VET_QUEUE.filter(p => p.status === 'waiting');
  const sorted   = applyPrioritySchedule(waiting);
  const timeline = buildTimeline(sorted);

  const ganttEl  = document.getElementById('v-gantt');

  // Stats
  const avgWT = timeline.length
    ? (timeline.reduce((s, t) => s + t.waiting_time, 0) / timeline.length).toFixed(1) : '–';
  const avgTT = timeline.length
    ? (timeline.reduce((s, t) => s + t.turnaround,   0) / timeline.length).toFixed(1) : '–';
  document.getElementById('v-stat-awt').textContent = avgWT;
  document.getElementById('v-stat-att').textContent = avgTT;

  if (timeline.length === 0) {
    ganttEl.innerHTML = '<div class="empty"><div class="icon">🏥</div><p>No vet cases in queue.</p></div>';
    document.getElementById('v-room-emergency').innerHTML = '<em class="text-sm">None</em>';
    document.getElementById('v-room-general').innerHTML   = '<em class="text-sm">None</em>';
    return;
  }

  const maxTime = timeline[timeline.length - 1].finish;

  // ── Gantt chart — Emergency bars in coral, Normal in sky ──────────────────
  ganttEl.innerHTML = timeline.map(t => `
    <div class="gantt-row">
      <div class="gantt-label">${t.pet_name}</div>
      <div class="gantt-bar-wrap">
        <div class="gantt-bar" style="
          left:${(t.start / maxTime) * 100}%;
          width:${((t.finish - t.start) / maxTime) * 100}%;
          background:${VET_COLORS[t.case_type]};">
          ${t.case_type === 'Emergency' ? '🚨' : '🏥'} P${t.priority} · ${t.finish - t.start}m
        </div>
      </div>
      <div class="gantt-time">${t.finish}m</div>
    </div>`).join('');

  // ── Room allocation grid ──────────────────────────────────────────────────
  const emergency = timeline.filter(t => t.case_type === 'Emergency');
  const general   = timeline.filter(t => t.case_type === 'Normal');

  document.getElementById('v-room-emergency').innerHTML = emergency.length
    ? emergency.map(t => `
        <div class="room-pet">
          🐾 <strong>${t.pet_name}</strong>
          <span class="text-sm text-muted"> — ${t.condition_desc}</span>
        </div>`).join('')
    : '<em class="text-sm">No emergency cases</em>';

  document.getElementById('v-room-general').innerHTML = general.length
    ? general.map(t => `
        <div class="room-pet">
          🐾 <strong>${t.pet_name}</strong>
          <span class="text-sm text-muted"> — ${t.condition_desc}</span>
        </div>`).join('')
    : '<em class="text-sm">No general cases</em>';
}

// ── Discharge a pet ────────────────────────────────────────────────────────────
function discharge(id) {
  const entry = VET_QUEUE.find(p => p.id === id);
  if (entry) entry.status = 'discharged';
  toast(`✔ ${entry ? entry.pet_name : 'Pet'} discharged`);
  loadSchedule();
  loadAll();
}

// ── All-cases log ──────────────────────────────────────────────────────────────
function loadAll() {
  const tbl = document.getElementById('v-tbl-all');
  if (VET_QUEUE.length === 0) {
    tbl.innerHTML = '<tr><td colspan="8" class="empty">No vet cases yet</td></tr>';
    return;
  }
  // Show sorted by priority for the table as well
  const sorted = applyPrioritySchedule(VET_QUEUE);
  tbl.innerHTML = sorted.map(r => `
    <tr>
      <td>${r.id}</td>
      <td class="fw-bold">${r.pet_name}</td>
      <td>
        <span class="status status-${r.case_type === 'Emergency' ? 'emergency' : 'normal'}">
          ${r.case_type}
        </span>
      </td>
      <td class="text-sm">${r.condition_desc}</td>
      <td class="fw-bold" style="color:${r.priority === 1 ? 'var(--coral)' : 'var(--sky)'};">
        P${r.priority}
      </td>
      <td class="text-sm">${r.room_assigned}</td>
      <td>
        <span class="status status-${r.status === 'discharged' ? 'done' : r.status === 'in-treatment' ? 'processing' : 'waiting'}">
          ${r.status}
        </span>
      </td>
      <td>
        ${r.status !== 'discharged'
          ? `<button class="btn btn-sm btn-gold" onclick="discharge(${r.id})">Discharge</button>`
          : ''}
      </td>
    </tr>`).join('');
}

// ── Seed demo data ─────────────────────────────────────────────────────────────
(function seedDemo() {
  const demos = [
    { pet_name:'Bruno', case_type:'Emergency', condition_desc:'Leg injury from fall',         processing_time:20 },
    { pet_name:'Max',   case_type:'Normal',    condition_desc:'Routine vaccination',           processing_time:10 },
    { pet_name:'Tom',   case_type:'Normal',    condition_desc:'Annual checkup',                processing_time:15 },
    { pet_name:'Rocky', case_type:'Emergency', condition_desc:'Allergic reaction — swelling', processing_time:25 },
    { pet_name:'Luna',  case_type:'Normal',    condition_desc:'Skin rash examination',        processing_time:12 },
  ];
  demos.forEach((d, i) => {
    const priority     = d.case_type === 'Emergency' ? 1 : 2;
    const room_assigned = d.case_type === 'Emergency' ? 'Emergency Treatment Room' : 'General Checkup Room';
    VET_QUEUE.push({
      id:             VET_ID++,
      ...d,
      priority,
      room_assigned,
      arrival_time:  Date.now() - (demos.length - i) * 60000,
      arrival_label: new Date(Date.now() - (demos.length - i) * 60000).toLocaleTimeString(),
      status:        'waiting',
    });
  });
})();

loadSchedule();
loadAll();