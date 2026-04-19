CREATE DATABASE IF NOT EXISTS `dbs_project`;
USE `dbs_project`;

CREATE TABLE IF NOT EXISTS `location` (
    `location_id` INT NOT NULL AUTO_INCREMENT,
    `locality_name` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    PRIMARY KEY (`location_id`)
);

CREATE TABLE IF NOT EXISTS `freelancer_skill` (
    `skill_id` INT NOT NULL AUTO_INCREMENT,
    `skill_name` VARCHAR(100) NOT NULL,
    `about` TEXT NULL,
    PRIMARY KEY (`skill_id`)
);

CREATE TABLE IF NOT EXISTS `user` (
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `role` ENUM('freelancer','customer') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `profile_pic` VARCHAR(255) NULL,
    `created_on` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `location_id` INT NULL,
    `is_active` TINYINT(1) NULL DEFAULT 1,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `email` (`email`),
    KEY `fk_user_location` (`location_id`),
    CONSTRAINT `fk_user_location`
        FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `customer` (
    `customer_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `bookings_done` INT NULL DEFAULT 0,
    PRIMARY KEY (`customer_id`),
    UNIQUE KEY `user_id` (`user_id`),
    CONSTRAINT `fk_customer_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `freelancer_profile` (
    `freelancer_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `bio` TEXT NULL,
    `starting_price` DECIMAL(10,2) NOT NULL,
    `avg_rating` DECIMAL(3,2) NULL DEFAULT 0.00,
    `total_reviews` INT NULL DEFAULT 0,
    `experience_yrs` INT NULL,
    `last_active` TIMESTAMP NULL DEFAULT NULL,
    `skill_id` INT NOT NULL,
    PRIMARY KEY (`freelancer_id`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `fk_freelancer_skill` (`skill_id`),
    CONSTRAINT `fk_freelancer_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_freelancer_skill`
        FOREIGN KEY (`skill_id`) REFERENCES `freelancer_skill` (`skill_id`)
);

CREATE TABLE IF NOT EXISTS `availability` (
    `availability_id` INT NOT NULL AUTO_INCREMENT,
    `freelancer_id` INT NOT NULL,
    `slot_date` DATE NOT NULL,
    `slot_hour` INT NOT NULL,
    `status` ENUM('available','not_available','booked') NULL DEFAULT 'available',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`availability_id`),
    UNIQUE KEY `unique_freelancer_slot` (`freelancer_id`, `slot_date`, `slot_hour`),
    CONSTRAINT `fk_availability_freelancer`
        FOREIGN KEY (`freelancer_id`) REFERENCES `freelancer_profile` (`freelancer_id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `booking_request` (
    `request_id` INT NOT NULL AUTO_INCREMENT,
    `requested_on` DATE NULL,
    `requested_time` TIME NOT NULL,
    `requested_date` DATE NOT NULL,
    `max_price` DECIMAL(10,2) NULL,
    `freelancer_proposed_price` DECIMAL(10,2) NULL,
    `status` ENUM('pending','accepted','completed','rejected','cancelled') NOT NULL DEFAULT 'pending',
    `requirements` TEXT NULL,
    `customer_id` INT NOT NULL,
    `freelancer_id` INT NOT NULL,
    PRIMARY KEY (`request_id`),
    KEY `fk_booking_customer` (`customer_id`),
    KEY `fk_booking_freelancer` (`freelancer_id`),
    CONSTRAINT `fk_booking_customer`
        FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_booking_freelancer`
        FOREIGN KEY (`freelancer_id`) REFERENCES `freelancer_profile` (`freelancer_id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `booking` (
    `booking_id` INT NOT NULL AUTO_INCREMENT,
    `accepted_on` DATE NULL,
    `booked_time` TIME NOT NULL,
    `booked_date` DATE NOT NULL,
    `final_price` DECIMAL(10,2) NULL,
    `request_id` INT NOT NULL,
    `freelancer_id` INT NOT NULL,
    PRIMARY KEY (`booking_id`),
    KEY `fk_booking_request` (`request_id`),
    KEY `fk_booking_freelancer_profile` (`freelancer_id`),
    CONSTRAINT `fk_booking_request`
        FOREIGN KEY (`request_id`) REFERENCES `booking_request` (`request_id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_booking_freelancer_profile`
        FOREIGN KEY (`freelancer_id`) REFERENCES `freelancer_profile` (`freelancer_id`)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `review` (
    `review_id` INT NOT NULL AUTO_INCREMENT,
    `rating` INT NOT NULL,
    `comments` TEXT NULL,
    `images` VARCHAR(255) NULL,
    `videos` VARCHAR(255) NULL,
    `review_date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `booking_id` INT NOT NULL,
    `freelancer_id` INT NOT NULL,
    PRIMARY KEY (`review_id`),
    UNIQUE KEY `booking_id` (`booking_id`),
    KEY `freelancer_id` (`freelancer_id`),
    CONSTRAINT `fk_review_booking`
        FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_review_freelancer`
        FOREIGN KEY (`freelancer_id`) REFERENCES `freelancer_profile` (`freelancer_id`)
        ON DELETE CASCADE
);
