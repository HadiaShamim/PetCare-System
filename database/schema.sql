-- ============================================================
--  PetCare Resort Management System — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS petcare_db;
USE petcare_db;

-- ────────────────────────────────────────────────────────────
--  PETS  (master table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    pet_name        VARCHAR(100) NOT NULL,
    owner_name      VARCHAR(100) NOT NULL,
    species         ENUM('Dog','Cat','Bird','Rabbit','Other') DEFAULT 'Dog',
    age             DECIMAL(4,1),
    contact         VARCHAR(20),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
--  REGISTRATION QUEUE  (FCFS + SJF)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registration_queue (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    pet_id              INT NOT NULL,
    pet_name            VARCHAR(100) NOT NULL,
    arrival_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time     INT NOT NULL COMMENT 'minutes',
    status              ENUM('waiting','processing','done') DEFAULT 'waiting',
    algorithm           ENUM('FCFS','SJF') DEFAULT 'FCFS',
    queue_position      INT,
    start_time          DATETIME,
    finish_time         DATETIME,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  GROOMING TASKS  (FCFS + SJF)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grooming_tasks (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    pet_id              INT NOT NULL,
    pet_name            VARCHAR(100) NOT NULL,
    task_type           ENUM('Bath','Haircut','Nail Trim','Ear Clean','Full Groom') NOT NULL,
    arrival_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time     INT NOT NULL COMMENT 'minutes',
    status              ENUM('waiting','in-progress','completed') DEFAULT 'waiting',
    algorithm           ENUM('FCFS','SJF') DEFAULT 'FCFS',
    queue_position      INT,
    start_time          DATETIME,
    finish_time         DATETIME,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  VET CASES  (Priority Scheduling)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vet_cases (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    pet_id              INT NOT NULL,
    pet_name            VARCHAR(100) NOT NULL,
    case_type           ENUM('Emergency','Normal') NOT NULL DEFAULT 'Normal',
    condition_desc      VARCHAR(255),
    priority            INT NOT NULL COMMENT '1=Emergency, 2=Normal',
    arrival_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time     INT NOT NULL COMMENT 'minutes',
    room_assigned       ENUM('Emergency Room','General Room') DEFAULT 'General Room',
    status              ENUM('waiting','in-treatment','discharged') DEFAULT 'waiting',
    queue_position      INT,
    start_time          DATETIME,
    finish_time         DATETIME,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  BILLING QUEUE  (Round Robin)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_queue (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    pet_id              INT NOT NULL,
    pet_name            VARCHAR(100) NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
    arrival_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time_quantum        INT NOT NULL DEFAULT 2 COMMENT 'seconds',
    rounds_completed    INT DEFAULT 0,
    status              ENUM('pending','processing','paid') DEFAULT 'pending',
    paid_at             DATETIME,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  DAYCARE ACTIVITIES  (Round Robin)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daycare_activities (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    pet_id              INT NOT NULL,
    pet_name            VARCHAR(100) NOT NULL,
    activity            ENUM('Play','Training','Ball Area','Rest','Swim') NOT NULL,
    time_quantum        INT NOT NULL DEFAULT 2 COMMENT 'seconds per slot',
    round_number        INT DEFAULT 1,
    status              ENUM('scheduled','active','completed') DEFAULT 'scheduled',
    scheduled_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at        DATETIME,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  ALGORITHM RUN LOG  (audit trail)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS algorithm_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    department      ENUM('Registration','Grooming','Vet','Billing','Daycare') NOT NULL,
    algorithm       VARCHAR(50) NOT NULL,
    input_snapshot  JSON,
    output_snapshot JSON,
    ran_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
