// backend/services/fcfsService.js
/**
 * FCFS — First Come, First Served
 * Sorts an array of process objects by arrival_time ascending.
 * Returns the sorted array and a Gantt-chart timeline.
 */
function fcfs(processes) {
  const sorted = [...processes].sort(
    (a, b) => new Date(a.arrival_time) - new Date(b.arrival_time)
  );

  let currentTime = 0;
  const timeline = [];

  sorted.forEach((p, idx) => {
    const arrival = p.arrival_time_ms || 0; // optional numeric field
    const start   = Math.max(currentTime, arrival);
    const finish  = start + (p.processing_time || 1);

    timeline.push({
      queue_position: idx + 1,
      id:             p.id,
      pet_name:       p.pet_name,
      start,
      finish,
      waiting_time:   start - arrival,
      turnaround:     finish - arrival,
    });

    currentTime = finish;
  });

  const avg_waiting    = timeline.reduce((s, t) => s + t.waiting_time,  0) / timeline.length;
  const avg_turnaround = timeline.reduce((s, t) => s + t.turnaround,    0) / timeline.length;

  return { algorithm: 'FCFS', order: sorted, timeline, avg_waiting, avg_turnaround };
}

module.exports = { fcfs };
