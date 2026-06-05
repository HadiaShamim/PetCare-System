-- ============================================================
--  PetCare Resort Management System — Seed Data
-- ============================================================
USE petcare_db;

-- ── Pets ─────────────────────────────────────────────────────
INSERT INTO pets (pet_name, owner_name, species, age, contact) VALUES
('Bruno',   'Ahmed Khan',    'Dog',    3.0, '0300-1234567'),
('Max',     'Sara Ali',      'Dog',    1.5, '0311-2345678'),
('Tom',     'Bilal Raza',    'Cat',    2.0, '0321-3456789'),
('Luna',    'Ayesha Noor',   'Cat',    4.0, '0333-4567890'),
('Rocky',   'Omar Sheikh',   'Dog',    5.0, '0345-5678901'),
('Bella',   'Fatima Malik',  'Rabbit', 1.0, '0301-6789012'),
('Milo',    'Usman Tariq',   'Dog',    2.5, '0312-7890123'),
('Coco',    'Hina Javed',    'Bird',   0.5, '0322-8901234');

-- ── Registration Queue (FCFS order) ──────────────────────────
INSERT INTO registration_queue (pet_id, pet_name, arrival_time, processing_time, status, algorithm, queue_position) VALUES
(1, 'Bruno', NOW() - INTERVAL 10 MINUTE, 8,  'waiting', 'FCFS', 1),
(2, 'Max',   NOW() - INTERVAL  8 MINUTE, 2,  'waiting', 'FCFS', 2),
(3, 'Tom',   NOW() - INTERVAL  6 MINUTE, 3,  'waiting', 'FCFS', 3),
(4, 'Luna',  NOW() - INTERVAL  4 MINUTE, 5,  'waiting', 'FCFS', 4),
(5, 'Rocky', NOW() - INTERVAL  2 MINUTE, 10, 'waiting', 'FCFS', 5);

-- ── Grooming Tasks ────────────────────────────────────────────
INSERT INTO grooming_tasks (pet_id, pet_name, task_type, arrival_time, processing_time, status, algorithm, queue_position) VALUES
(1, 'Bruno', 'Haircut',  NOW() - INTERVAL 5 MINUTE, 30, 'waiting', 'FCFS', 1),
(2, 'Max',   'Nail Trim',NOW() - INTERVAL 4 MINUTE,  5, 'waiting', 'FCFS', 2),
(3, 'Tom',   'Bath',     NOW() - INTERVAL 3 MINUTE, 10, 'waiting', 'FCFS', 3),
(4, 'Luna',  'Ear Clean',NOW() - INTERVAL 2 MINUTE,  8, 'waiting', 'FCFS', 4),
(6, 'Bella', 'Full Groom',NOW() - INTERVAL 1 MINUTE,20, 'waiting', 'FCFS', 5);

-- ── Vet Cases (Emergency first) ──────────────────────────────
INSERT INTO vet_cases (pet_id, pet_name, case_type, condition_desc, priority, arrival_time, processing_time, room_assigned, status, queue_position) VALUES
(1, 'Bruno', 'Emergency', 'Leg injury from fall',           1, NOW() - INTERVAL 3 MINUTE, 20, 'Emergency Room', 'waiting', 1),
(2, 'Max',   'Normal',    'Routine vaccination',            2, NOW() - INTERVAL 5 MINUTE, 10, 'General Room',   'waiting', 2),
(3, 'Tom',   'Normal',    'Annual checkup',                 2, NOW() - INTERVAL 4 MINUTE, 15, 'General Room',   'waiting', 3),
(5, 'Rocky', 'Emergency', 'Allergic reaction — swelling',  1, NOW() - INTERVAL 2 MINUTE, 25, 'Emergency Room', 'waiting', 4),
(7, 'Milo',  'Normal',    'Skin rash examination',         2, NOW() - INTERVAL 1 MINUTE, 12, 'General Room',   'waiting', 5);

-- ── Billing Queue ─────────────────────────────────────────────
INSERT INTO billing_queue (pet_id, pet_name, total_amount, remaining_amount, time_quantum, status) VALUES
(1, 'Bruno', 4500.00, 4500.00, 2, 'pending'),
(2, 'Max',   1200.00, 1200.00, 2, 'pending'),
(3, 'Tom',   2800.00, 2800.00, 2, 'pending'),
(4, 'Luna',  3100.00, 3100.00, 2, 'pending'),
(5, 'Rocky', 5200.00, 5200.00, 2, 'pending');

-- ── Daycare Activities ────────────────────────────────────────
INSERT INTO daycare_activities (pet_id, pet_name, activity, time_quantum, round_number, status) VALUES
(1, 'Bruno', 'Play',      2, 1, 'scheduled'),
(2, 'Max',   'Play',      2, 1, 'scheduled'),
(3, 'Tom',   'Play',      2, 1, 'scheduled'),
(5, 'Rocky', 'Play',      2, 1, 'scheduled'),
(7, 'Milo',  'Play',      2, 1, 'scheduled'),
(1, 'Bruno', 'Training',  2, 2, 'scheduled'),
(2, 'Max',   'Training',  2, 2, 'scheduled'),
(3, 'Tom',   'Training',  2, 2, 'scheduled'),
(5, 'Rocky', 'Training',  2, 2, 'scheduled'),
(7, 'Milo',  'Training',  2, 2, 'scheduled'),
(1, 'Bruno', 'Ball Area', 2, 3, 'scheduled'),
(2, 'Max',   'Ball Area', 2, 3, 'scheduled'),
(3, 'Tom',   'Ball Area', 2, 3, 'scheduled'),
(5, 'Rocky', 'Ball Area', 2, 3, 'scheduled'),
(7, 'Milo',  'Ball Area', 2, 3, 'scheduled');
