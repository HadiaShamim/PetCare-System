// backend/services/priorityService.js
/**
 * Priority Scheduling (non-preemptive)
 * Lower priority number = higher urgency  (1 = Emergency, 2 = Normal)
 * Ties broken by arrival_time.
 */
function prioritySchedule(processes) {
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
    const available = remaining.filter(p => p.arrival_ms <= currentTime);

    if (available.length === 0) {
      currentTime = Math.min(...remaining.map(p => p.arrival_ms));
      continue;
    }

    // Sort by priority ASC, then arrival ASC
    available.sort((a, b) =>
      a.priority !== b.priority
        ? a.priority - b.priority
        : a.arrival_ms - b.arrival_ms
    );

    const chosen = available[0];
    const start  = currentTime;
    const finish = start + chosen.processing_time;

    // Assign room based on case_type
    const room = chosen.case_type === 'Emergency' ? 'Emergency Room' : 'General Room';

    timeline.push({
      queue_position: position++,
      id:             chosen.id,
      pet_name:       chosen.pet_name,
      priority:       chosen.priority,
      case_type:      chosen.case_type,
      room_assigned:  room,
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
    algorithm: 'Priority Scheduling',
    order: timeline.map(t => procs.find(p => p.id === t.id)),
    timeline,
    avg_waiting,
    avg_turnaround,
  };
}

module.exports = { prioritySchedule };
