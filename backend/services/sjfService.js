// backend/services/sjfService.js
/**
 * SJF — Shortest Job First (non-preemptive)
 * At each decision point, pick the available process with the smallest
 * processing_time.  A process is "available" when arrival_time_ms <= currentTime.
 */
function sjf(processes) {
  // Normalise: give every process a numeric arrival offset in "minutes"
  const base = Math.min(...processes.map(p => new Date(p.arrival_time).getTime()));
  const procs = processes.map(p => ({
    ...p,
    arrival_ms: new Date(p.arrival_time).getTime() - base,
  }));

  const remaining = [...procs];
  const timeline  = [];
  let currentTime = 0;
  let position    = 1;

  while (remaining.length > 0) {
    // All processes that have arrived by currentTime
    const available = remaining.filter(p => p.arrival_ms <= currentTime);

    let chosen;
    if (available.length === 0) {
      // CPU idle — jump to next arrival
      currentTime = Math.min(...remaining.map(p => p.arrival_ms));
      continue;
    }

    // Pick shortest burst
    chosen = available.reduce((min, p) =>
      p.processing_time < min.processing_time ? p : min
    );

    const start  = currentTime;
    const finish = start + chosen.processing_time;

    timeline.push({
      queue_position: position++,
      id:             chosen.id,
      pet_name:       chosen.pet_name,
      start,
      finish,
      waiting_time:   start - chosen.arrival_ms,
      turnaround:     finish - chosen.arrival_ms,
    });

    currentTime = finish;
    remaining.splice(remaining.findIndex(p => p.id === chosen.id), 1);
  }

  const avg_waiting    = timeline.reduce((s, t) => s + t.waiting_time,  0) / timeline.length;
  const avg_turnaround = timeline.reduce((s, t) => s + t.turnaround,    0) / timeline.length;

  return {
    algorithm: 'SJF',
    order: timeline.map(t => procs.find(p => p.id === t.id)),
    timeline,
    avg_waiting,
    avg_turnaround,
  };
}

module.exports = { sjf };
