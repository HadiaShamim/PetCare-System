// backend/services/roundRobinService.js
/**
 * Round Robin Scheduling
 * @param {Array}  processes    - array of process objects with { id, pet_name, processing_time, ... }
 * @param {number} timeQuantum  - time slice (default 2)
 * @returns {object}            - { algorithm, timeline, gantt, avg_waiting, avg_turnaround }
 */
function roundRobin(processes, timeQuantum = 2) {
  if (!processes || processes.length === 0)
    return { algorithm: 'Round Robin', timeline: [], gantt: [], avg_waiting: 0, avg_turnaround: 0 };

  const procs = processes.map(p => ({
    ...p,
    remaining: p.processing_time,
    arrival_ms: 0,
    first_start: null,
    finish_time: null,
  }));

  const queue   = [...procs];
  const gantt   = [];
  const done    = [];
  let time      = 0;
  let round     = 1;

  while (queue.length > 0) {
    const snapshot = [];

    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      if (p.first_start === null) p.first_start = time;

      const slice = Math.min(timeQuantum, p.remaining);
      gantt.push({ pet_name: p.pet_name, id: p.id, start: time, end: time + slice, round });

      snapshot.push({ pet_name: p.pet_name, slice_used: slice });
      p.remaining -= slice;
      time        += slice;

      if (p.remaining <= 0) {
        p.finish_time = time;
        done.push(p);
        queue.splice(i, 1);
        i--;
      }
    }

    gantt.push({ type: 'round_separator', round, snapshot });
    round++;
  }

  const timeline = done.map(p => ({
    id:           p.id,
    pet_name:     p.pet_name,
    finish_time:  p.finish_time,
    waiting_time: p.finish_time - p.processing_time,
    turnaround:   p.finish_time,
  }));

  const avg_waiting    = timeline.reduce((s, t) => s + t.waiting_time,  0) / timeline.length;
  const avg_turnaround = timeline.reduce((s, t) => s + t.turnaround,    0) / timeline.length;

  return { algorithm: 'Round Robin', timeline, gantt, avg_waiting, avg_turnaround };
}

/**
 * Round Robin for Daycare activities
 * Returns which activity each pet does in each round.
 */
function daycareRoundRobin(pets, activities = ['Play', 'Training', 'Ball Area'], timeQuantum = 2) {
  const schedule = [];

  activities.forEach((activity, roundIdx) => {
    const round = { round: roundIdx + 1, activity, slots: [] };
    pets.forEach(pet => {
      round.slots.push({
        pet_id:   pet.id || pet.pet_id,
        pet_name: pet.pet_name,
        activity,
        duration: timeQuantum,
        start:    roundIdx * pets.length * timeQuantum + pets.indexOf(pet) * timeQuantum,
      });
    });
    schedule.push(round);
  });

  return { algorithm: 'Round Robin (Daycare)', schedule, timeQuantum };
}

module.exports = { roundRobin, daycareRoundRobin };
