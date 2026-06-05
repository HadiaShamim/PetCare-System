// frontend/js/billing.js
// ─────────────────────────────────────────────────────────────────────────────
// BILLING & DAYCARE DEPARTMENT — Round Robin Scheduling
//
// BILLING — Round Robin:
//   • Each pet gets exactly one time quantum (default 2 s) of billing attention.
//   • After its quantum the next pet gets a turn.
//   • The cycle repeats until all billing amounts are cleared.
//   • Visualisation shows each round and which pets are in it.
//
// DAYCARE — Round Robin:
//   • Activities: Play Area → Training → Ball Area
//   • Every pet gets equal time (quantum = 2 s) per activity.
//   • After all pets finish one activity, the next activity round begins.
//   • Pets rotate through all activities in equal time slices.
// ─────────────────────────────────────────────────────────────────────────────

const TIME_QUANTUM  = 2;   // seconds — fixed as per spec
const ACTIVITIES    = ['Play Area', 'Training', 'Ball Area'];

// ── In-memory queues ───────────────────────────────────────────────────────────
let BILL_QUEUE = [];   // billing entries
let DAY_QUEUE  = [];   // daycare pets
let BILL_ID    = 1;
let DAY_ID     = 1;

const SLOT_COLORS = ['#3D5A3E','#C9973A','#E07A5F','#7BB8C9','#7A9E7E','#8B6344','#5a8fa1','#c45c3a'];
const ACT_STYLE = {
  'Play Area': { bg:'#dcfce7', color:'#166534', icon:'🎾' },
  'Training':  { bg:'#dbeafe', color:'#1e40af', icon:'🎯' },
  'Ball Area': { bg:'#fef3c7', color:'#92400e', icon:'⚽' },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3500);
}

// ── Tab switcher ──────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', ['billing','daycare'][i] === name)
  );
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${name}`)
  );
  if (name === 'daycare') loadDaycare();
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────────────────────────────────────

// ── Add billing entry ──────────────────────────────────────────────────────────
function addBilling() {
  const pet_name     = document.getElementById('b-name').value.trim();
  const total_amount = parseFloat(document.getElementById('b-amount').value);
  const quantum      = parseInt(document.getElementById('b-quantum').value) || TIME_QUANTUM;

  if (!pet_name)        return toast('Pet name is required', 'error');
  if (!total_amount || total_amount <= 0) return toast('Amount must be greater than 0', 'error');

  BILL_QUEUE.push({
    id:               BILL_ID++,
    pet_name,
    total_amount,
    remaining_amount: total_amount,
    time_quantum:     quantum,
    arrival_time:     Date.now(),
    arrival_label:    new Date().toLocaleTimeString(),
    status:           'pending',
  });

  toast(`✅ Billing entry added for ${pet_name} — PKR ${total_amount.toLocaleString()}`);
  document.getElementById('b-name').value   = '';
  document.getElementById('b-amount').value = '';

  loadBillingSchedule();
  loadBillingAll();
}

// ── Round Robin Billing Simulation ────────────────────────────────────────────
// Each pending pet gets one quantum of "billing CPU time" per round.
// We don't actually deduct money — we simulate equal time slices.
// Returns: { rounds, avg_waiting, avg_turnaround }
function simulateBillingRR(pets, quantum) {
  if (!pets.length) return { rounds: [], avg_waiting: 0, avg_turnaround: 0 };

  // Give each pet a "remaining" counter representing its relative service weight
  // (we use a normalised integer so rounds are tractable for display)
  const procs = pets.map(p => ({
    ...p,
    remaining:   Math.ceil(p.total_amount / 500), // 1 unit = 500 PKR slice
    first_start: null,
    finish_time: null,
  }));

  const rounds    = [];
  let   time      = 0;
  let   roundNum  = 1;
  const queue     = [...procs];
  const done      = [];

  while (queue.length > 0) {
    const roundSlots = [];

    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      if (p.first_start === null) p.first_start = time;

      const slice = Math.min(quantum, p.remaining);
      roundSlots.push({ pet_name: p.pet_name, id: p.id, start: time, end: time + slice });
      p.remaining -= slice;
      time        += slice;

      if (p.remaining <= 0) {
        p.finish_time = time;
        done.push(p);
        queue.splice(i, 1);
        i--;
      }
    }

    rounds.push({ round: roundNum++, slots: roundSlots });
  }

  const avg_waiting    = done.length ? done.reduce((s, p) => s + (p.finish_time - p.remaining - 0), 0) / done.length : 0;
  const avg_turnaround = done.length ? done.reduce((s, p) => s + p.finish_time, 0) / done.length : 0;

  return { rounds, avg_waiting, avg_turnaround };
}

// ── Render billing Round Robin schedule ───────────────────────────────────────
function loadBillingSchedule() {
  const roundsEl = document.getElementById('b-rounds');
  const pending  = BILL_QUEUE.filter(p => p.status === 'pending');

  if (pending.length === 0) {
    document.getElementById('b-stat-awt').textContent = '–';
    document.getElementById('b-stat-att').textContent = '–';
    roundsEl.innerHTML = '<div class="empty"><div class="icon">💰</div><p>No billing entries yet.</p></div>';
    return;
  }

  const quantum = pending[0].time_quantum || TIME_QUANTUM;
  const { rounds, avg_waiting, avg_turnaround } = simulateBillingRR(pending, quantum);

  document.getElementById('b-stat-awt').textContent = avg_waiting.toFixed(1);
  document.getElementById('b-stat-att').textContent = avg_turnaround.toFixed(1);

  roundsEl.innerHTML = rounds.map(r => `
    <div class="rr-round">
      <div class="rr-round-header">
        Round ${r.round} &nbsp;—&nbsp; Quantum: ${quantum}s &nbsp;·&nbsp; ${r.slots.length} pet${r.slots.length!==1?'s':''}
      </div>
      <div class="rr-slots">
        ${r.slots.map((s, i) => `
          <div class="rr-slot">
            <div class="dot" style="background:${SLOT_COLORS[i % SLOT_COLORS.length]};"></div>
            <strong>${s.pet_name}</strong>
            <span class="text-muted text-sm">&nbsp;${s.start}s → ${s.end}s</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── Mark a billing entry as paid ──────────────────────────────────────────────
function markPaid(id) {
  const entry = BILL_QUEUE.find(p => p.id === id);
  if (entry) { entry.status = 'paid'; entry.remaining_amount = 0; }
  toast(`✔ Payment completed for ${entry ? entry.pet_name : 'pet'} ✅`);
  loadBillingSchedule();
  loadBillingAll();
}

// ── All-billing records table ─────────────────────────────────────────────────
function loadBillingAll() {
  const tbl = document.getElementById('b-tbl-all');
  if (BILL_QUEUE.length === 0) {
    tbl.innerHTML = '<tr><td colspan="6" class="empty">No billing records yet</td></tr>';
    return;
  }
  tbl.innerHTML = [...BILL_QUEUE].reverse().map(r => `
    <tr>
      <td>${r.id}</td>
      <td class="fw-bold">${r.pet_name}</td>
      <td>PKR ${r.total_amount.toLocaleString()}</td>
      <td>PKR ${r.remaining_amount.toLocaleString()}</td>
      <td>
        <span class="status status-${r.status === 'paid' ? 'paid' : 'pending'}">
          ${r.status}
        </span>
      </td>
      <td>
        ${r.status !== 'paid'
          ? `<button class="btn btn-sm btn-gold" onclick="markPaid(${r.id})">Mark Paid</button>`
          : ''}
      </td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// DAYCARE — Round Robin over activities
// ─────────────────────────────────────────────────────────────────────────────

// ── Add pet to daycare ─────────────────────────────────────────────────────────
function addDaycarePet() {
  const name = document.getElementById('dc-name').value.trim();
  if (!name) return toast('Pet name is required', 'error');
  if (DAY_QUEUE.find(p => p.pet_name.toLowerCase() === name.toLowerCase()))
    return toast(`${name} is already in daycare`, 'error');

  DAY_QUEUE.push({ id: DAY_ID++, pet_name: name });
  document.getElementById('dc-name').value = '';
  toast(`✅ ${name} added to daycare`);
  loadDaycare();
}

// ── Round Robin Daycare Simulation ─────────────────────────────────────────────
// Activities: Play Area → Training → Ball Area
// In each activity-round, every pet gets TIME_QUANTUM seconds.
// After all pets finish activity N, they move to activity N+1.
function simulateDaycareRR(pets) {
  if (!pets.length) return [];

  return ACTIVITIES.map((activity, actIdx) => {
    let time = actIdx * pets.length * TIME_QUANTUM; // offset so times are sequential
    const slots = pets.map(p => {
      const start = time;
      const end   = time + TIME_QUANTUM;
      time = end;
      return { pet_name: p.pet_name, start, end };
    });
    return { round: actIdx + 1, activity, slots };
  });
}

// ── Render daycare schedule ────────────────────────────────────────────────────
function loadDaycare() {
  const el = document.getElementById('daycare-rounds');

  if (DAY_QUEUE.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <div class="icon">🐶</div>
        <p>No pets in daycare. Add pets using the form below.</p>
      </div>`;
    return;
  }

  const rounds = simulateDaycareRR(DAY_QUEUE);

  el.innerHTML = rounds.map(r => {
    const style = ACT_STYLE[r.activity] || { bg:'#f0f0f0', color:'#333', icon:'🐾' };
    return `
      <div class="rr-round">
        <div class="rr-round-header" style="background:${style.color};">
          ${style.icon} Round ${r.round} — ${r.activity}
          &nbsp;·&nbsp; ${TIME_QUANTUM}s per pet &nbsp;·&nbsp; ${r.slots.length} pet${r.slots.length!==1?'s':''}
        </div>
        <div class="rr-slots">
          ${r.slots.map((s, i) => `
            <div class="rr-slot" style="background:${style.bg};">
              <div class="dot" style="background:${style.color};"></div>
              <span style="color:${style.color};font-weight:700;">${s.pet_name}</span>
              <span class="text-muted text-sm">&nbsp;${s.start}s → ${s.end}s</span>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed demo data
// ─────────────────────────────────────────────────────────────────────────────
(function seedDemo() {
  // Billing entries
  const billDemos = [
    { pet_name:'Bruno', total_amount:4500 },
    { pet_name:'Max',   total_amount:1200 },
    { pet_name:'Tom',   total_amount:2800 },
    { pet_name:'Luna',  total_amount:3100 },
    { pet_name:'Rocky', total_amount:5200 },
  ];
  billDemos.forEach((d, i) => {
    BILL_QUEUE.push({
      id:               BILL_ID++,
      pet_name:         d.pet_name,
      total_amount:     d.total_amount,
      remaining_amount: d.total_amount,
      time_quantum:     TIME_QUANTUM,
      arrival_time:     Date.now() - (billDemos.length - i) * 60000,
      arrival_label:    new Date(Date.now() - (billDemos.length - i) * 60000).toLocaleTimeString(),
      status:           'pending',
    });
  });

  // Daycare pets
  ['Bruno','Max','Tom','Rocky','Milo'].forEach(name => {
    DAY_QUEUE.push({ id: DAY_ID++, pet_name: name });
  });
})();

loadBillingSchedule();
loadBillingAll();