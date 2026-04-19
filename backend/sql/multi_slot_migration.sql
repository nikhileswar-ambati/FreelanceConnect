-- Migration to support multiple time slots per booking
-- Run this after the existing schema.sql

USE `dbs_project`;

-- Table for time slots in booking requests
CREATE TABLE IF NOT EXISTS `booking_request_time_slots` (
    `slot_id` INT NOT NULL AUTO_INCREMENT,
    `request_id` INT NOT NULL,
    `slot_hour` INT NOT NULL,
    PRIMARY KEY (`slot_id`),
    UNIQUE KEY `unique_request_slot` (`request_id`, `slot_hour`),
    CONSTRAINT `fk_request_slots_request`
        FOREIGN KEY (`request_id`) REFERENCES `booking_request` (`request_id`)
        ON DELETE CASCADE
);

-- Table for time slots in confirmed bookings
CREATE TABLE IF NOT EXISTS `booking_time_slots` (
    `slot_id` INT NOT NULL AUTO_INCREMENT,
    `booking_id` INT NOT NULL,
    `slot_hour` INT NOT NULL,
    PRIMARY KEY (`slot_id`),
    UNIQUE KEY `unique_booking_slot` (`booking_id`, `slot_hour`),
    CONSTRAINT `fk_booking_slots_booking`
        FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`)
        ON DELETE CASCADE
);

-- Update existing booking_request table to remove requested_time
-- (We'll keep it for backward compatibility but won't use it for new multi-slot bookings)
-- ALTER TABLE booking_request DROP COLUMN requested_time;

-- Update existing booking table to remove booked_time
-- (We'll keep it for backward compatibility but won't use it for new multi-slot bookings)
-- ALTER TABLE booking DROP COLUMN booked_time;