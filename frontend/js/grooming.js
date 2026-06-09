// frontend/js/grooming.js
// ─────────────────────────────────────────────────────────────────────────────
// GROOMING DEPARTMENT
//
// FCFS → Pets are served in the order they were added to the queue (arrival).
// SJF  → If multiple grooming tasks exist, the shortest task is executed first.
//         Predefined task durations:
//           Nail Trim   =  5 min
//           Ear Clean   =  8 min
//           Bath        = 10 min
//           Full Groom  = 20 min
//           Haircut     = 30 min
//
// Both algorithms compute: Gantt chart, waiting time, turnaround time.
// ─────────────────────────────────────────────────────────────────────────────

const TASK_TIMES = {
  'Nail Trim':   5,
  'Ear Clean':   8,
  'Bath':       10,
  'Full Groom': 45,
  'Haircut':    30,
};

// In-memory grooming queue
let GROOM_QUEUE = [];
let GROOM_ID    = 1;
let gAlgo       = 'FCFS';

const COLORS = ['#3D5A3E','#C9973A','#E07A5F','#7BB8C9','#7A9E7E','#8B6344','#5a8fa1','#c45c3a'];

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3500);
}

// ── Auto-fill processing time when task type changes ─────────────────────────
document.getElementById('g-task').addEventListener('change', function () {
  const task = this.value;
  document.getElementById('g-time').value = TASK_TIMES[task] || 10;
});

// ── Add a grooming task ────────────────────────────────────────────────────────
function addTask() {
  const pet_name  = document.getElementById('g-name').value.trim();
  const task_type = document.getElementById('g-task').value;

  if (!pet_name) return toast('Pet name is required', 'error');

  // Always use the predefined canonical time for the selected task
  const processing_time = TASK_TIMES[task_type] || parseInt(document.getElementById('g-time').value) || 10;

  GROOM_QUEUE.push({
    id:            GROOM_ID++,
    pet_name,
    task_type,
    processing_time,
    arrival_time:  Date.now(),
    arrival_label: new Date().toLocaleTimeString(),
    status:        'waiting',
  });

  toast(`✅ ${task_type} added for ${pet_name} (${processing_time} min)`);
  document.getElementById('g-name').value = '';

  loadSchedule(gAlgo);
  loadAll();
}

// ── FCFS: preserve arrival order ──────────────────────────────────────────────
function applyFCFS(queue) {
  return [...queue].sort((a, b) => a.arrival_time - b.arrival_time);
}

// ── SJF: sort by shortest processing_time (burst time) ───────────────────────
// Among tasks available at the same time, pick the shortest burst next.
// We use non-preemptive SJF: once started, a task runs to completion.
function applySJF(queue) {
  return [...queue].sort((a, b) => {
    if (a.processing_time !== b.processing_time) return a.processing_time - b.processing_time;
    return a.arrival_time - b.arrival_time; // tie-break by arrival
  });
}

// ── Build Gantt timeline ───────────────────────────────────────────────────────
function buildTimeline(sorted) {
  let clock = 0;
  return sorted.map((p, i) => {
    const start        = clock;
    const finish       = clock + p.processing_time;
    const waiting_time = start;       // relative wait from t=0
    const turnaround   = finish;
    clock = finish;
    return { ...p, pos: i + 1, start, finish, waiting_time, turnaround };
  });
}

// ── Render schedule ────────────────────────────────────────────────────────────
function loadSchedule(algo) {
  gAlgo = algo;
  document.getElementById('g-btn-fcfs').className = algo === 'FCFS' ? 'active' : '';
  document.getElementById('g-btn-sjf').className  = algo === 'SJF'  ? 'active' : '';

  const waiting  = GROOM_QUEUE.filter(p => p.status === 'waiting');
  const sorted   = algo === 'SJF' ? applySJF(waiting) : applyFCFS(waiting);
  const timeline = buildTimeline(sorted);

  const ganttEl  = document.getElementById('g-gantt');
  const tblEl    = document.getElementById('g-tbl-order');

  // Stats
  const avgWT = timeline.length
    ? (timeline.reduce((s, t) => s + t.waiting_time, 0) / timeline.length).toFixed(1) : '–';
  const avgTT = timeline.length
    ? (timeline.reduce((s, t) => s + t.turnaround,   0) / timeline.length).toFixed(1) : '–';
  document.getElementById('g-stat-awt').textContent = avgWT;
  document.getElementById('g-stat-att').textContent = avgTT;

  if (timeline.length === 0) {
    ganttEl.innerHTML = '<div class="empty"><div class="icon">✂️</div><p>No grooming tasks in queue.</p></div>';
    tblEl.innerHTML   = '<tr><td colspan="5" class="empty">Queue is empty</td></tr>';
    return;
  }

  const maxTime = timeline[timeline.length - 1].finish;

  // ── Gantt chart ────────────────────────────────────────────────────────────
  ganttEl.innerHTML = timeline.map((t, i) => `
    <div class="gantt-row">
      <div class="gantt-label" title="${t.task_type}">${t.pet_name}</div>
      <div class="gantt-bar-wrap">
        <div class="gantt-bar" style="
          left:${(t.start / maxTime) * 100}%;
          width:${((t.finish - t.start) / maxTime) * 100}%;
          background:${COLORS[i % COLORS.length]};">
          ${t.task_type} (${t.finish - t.start}m)
        </div>
      </div>
      <div class="gantt-time">${t.finish}m</div>
    </div>`).join('');

  // ── Order table ────────────────────────────────────────────────────────────
  tblEl.innerHTML = timeline.map(t => `
    <tr>
      <td>${t.pos}</td>
      <td class="fw-bold">${t.pet_name}</td>
      <td><span class="status status-waiting">${t.task_type}</span></td>
      <td>${t.finish - t.start} min</td>
      <td>
        <button class="btn btn-sm btn-coral" onclick="markDone(${t.id})">✔ Done</button>
      </td>
    </tr>`).join('');
}

// ── Mark task complete ────────────────────────────────────────────────────────
function markDone(id) {
  const entry = GROOM_QUEUE.find(p => p.id === id);
  if (entry) entry.status = 'completed';
  toast(`✔ Grooming completed for ${entry ? entry.pet_name : 'pet'}`);
  loadSchedule(gAlgo);
  loadAll();
}

// ── All-tasks log ─────────────────────────────────────────────────────────────
function loadAll() {
  const tbl = document.getElementById('g-tbl-all');
  if (GROOM_QUEUE.length === 0) {
    tbl.innerHTML = '<tr><td colspan="7" class="empty">No grooming tasks yet</td></tr>';
    return;
  }
  tbl.innerHTML = [...GROOM_QUEUE].reverse().map(r => `
    <tr>
      <td>${r.id}</td>
      <td class="fw-bold">${r.pet_name}</td>
      <td>${r.task_type}</td>
      <td>${r.processing_time}</td>
      <td class="text-sm text-muted">${r.arrival_label}</td>
      <td>
        <span class="status status-${r.status === 'completed' ? 'done' : 'waiting'}">
          ${r.status}
        </span>
      </td>
      <td>
        ${r.status !== 'completed'
          ? `<button class="btn btn-sm btn-coral" onclick="markDone(${r.id})">✔</button>`
          : ''}
      </td>
    </tr>`).join('');
}

// ── Seed demo data ─────────────────────────────────────────────────────────────
(function seedDemo() {
  const demos = [
    { pet_name: 'Bruno', task_type: 'Haircut'   },
    { pet_name: 'Max',   task_type: 'Nail Trim' },
    { pet_name: 'Tom',   task_type: 'Bath'      },
    { pet_name: 'Luna',  task_type: 'Ear Clean' },
    { pet_name: 'Rocky', task_type: 'Full Groom'},
  ];
  demos.forEach((d, i) => {
    GROOM_QUEUE.push({
      id:            GROOM_ID++,
      pet_name:      d.pet_name,
      task_type:     d.task_type,
      processing_time: TASK_TIMES[d.task_type],
      arrival_time:  Date.now() - (demos.length - i) * 60000,
      arrival_label: new Date(Date.now() - (demos.length - i) * 60000).toLocaleTimeString(),
      status:        'waiting',
    });
  });
})();

loadSchedule('FCFS');
loadAll();