-- =============================================================
-- GestionCours - Cleanup duplicate legacy tables
-- Run once in phpMyAdmin on database: gestioncours
-- Canonical table names (singular snake_case):
-- classroom, online_course, online_session, online_booking,
-- on_site_course, on_site_session, on_site_booking
-- =============================================================

USE gestioncours;

SET FOREIGN_KEY_CHECKS = 0;

-- 0) Ensure canonical schema has expected optional columns (for ddl-auto=validate)
SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_course')
		AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'on_site_course' AND column_name = 'description'),
		'ALTER TABLE on_site_course ADD COLUMN description VARCHAR(1000) NULL',
		'SELECT "skip add on_site_course.description"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_course')
		AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'on_site_course' AND column_name = 'classroom_name'),
		'ALTER TABLE on_site_course ADD COLUMN classroom_name VARCHAR(255) NULL',
		'SELECT "skip add on_site_course.classroom_name"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1) Migrate data from legacy plural/variant tables into canonical singular tables
SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'classrooms')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'classroom'),
		'INSERT INTO classroom (id, name, capacity) SELECT s.id, s.name, s.capacity FROM classrooms s LEFT JOIN classroom t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip classrooms -> classroom"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_courses')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_course'),
		'INSERT INTO online_course (id, title, description, level, tutor_id) SELECT s.id, s.title, s.description, s.level, s.tutor_id FROM online_courses s LEFT JOIN online_course t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip online_courses -> online_course"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_sessions')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_session'),
		'INSERT INTO online_session (id, date, capacity, meeting_link, course_id) SELECT s.id, s.date, s.capacity, s.meeting_link, s.course_id FROM online_sessions s LEFT JOIN online_session t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip online_sessions -> online_session"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_bookings')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'online_booking'),
		'INSERT INTO online_booking (id, booking_date, status, student_id, session_id) SELECT s.id, s.booking_date, s.status, s.student_id, s.session_id FROM online_bookings s LEFT JOIN online_booking t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip online_bookings -> online_booking"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'onsite_courses')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_course'),
		'INSERT INTO on_site_course (id, title, level, tutor_id) SELECT s.id, s.title, s.level, s.tutor_id FROM onsite_courses s LEFT JOIN on_site_course t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip onsite_courses -> on_site_course"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_courses')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_course'),
		'INSERT INTO on_site_course (id, title, level, tutor_id) SELECT s.id, s.title, s.level, s.tutor_id FROM on_site_courses s LEFT JOIN on_site_course t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip on_site_courses -> on_site_course"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'onsite_sessions')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_session'),
		'INSERT INTO on_site_session (id, date, capacity, course_id, classroom_id) SELECT s.id, s.date, s.capacity, s.course_id, s.classroom_id FROM onsite_sessions s LEFT JOIN on_site_session t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip onsite_sessions -> on_site_session"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_sessions')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_session'),
		'INSERT INTO on_site_session (id, date, capacity, course_id, classroom_id) SELECT s.id, s.date, s.capacity, s.course_id, s.classroom_id FROM on_site_sessions s LEFT JOIN on_site_session t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip on_site_sessions -> on_site_session"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'onsite_bookings')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_booking'),
		'INSERT INTO on_site_booking (id, booking_date, status, student_id, session_id) SELECT s.id, s.booking_date, s.status, s.student_id, s.session_id FROM onsite_bookings s LEFT JOIN on_site_booking t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip onsite_bookings -> on_site_booking"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
	SELECT IF(
		EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_bookings')
		AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'on_site_booking'),
		'INSERT INTO on_site_booking (id, booking_date, status, student_id, session_id) SELECT s.id, s.booking_date, s.status, s.student_id, s.session_id FROM on_site_bookings s LEFT JOIN on_site_booking t ON t.id = s.id WHERE t.id IS NULL',
		'SELECT "skip on_site_bookings -> on_site_booking"'
	)
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Drop legacy duplicate tables safely (keep only canonical singular tables)
DROP TABLE IF EXISTS classrooms;
DROP TABLE IF EXISTS online_courses;
DROP TABLE IF EXISTS online_sessions;
DROP TABLE IF EXISTS online_bookings;
DROP TABLE IF EXISTS onsite_courses;
DROP TABLE IF EXISTS onsite_sessions;
DROP TABLE IF EXISTS onsite_bookings;
DROP TABLE IF EXISTS on_site_courses;
DROP TABLE IF EXISTS on_site_sessions;
DROP TABLE IF EXISTS on_site_bookings;

SET FOREIGN_KEY_CHECKS = 1;

-- 4) Quick verification
SHOW TABLES;
SELECT 'classroom' AS table_name, COUNT(*) AS rows_count FROM classroom
UNION ALL
SELECT 'online_course', COUNT(*) FROM online_course
UNION ALL
SELECT 'online_session', COUNT(*) FROM online_session
UNION ALL
SELECT 'online_booking', COUNT(*) FROM online_booking
UNION ALL
SELECT 'on_site_course', COUNT(*) FROM on_site_course
UNION ALL
SELECT 'on_site_session', COUNT(*) FROM on_site_session
UNION ALL
SELECT 'on_site_booking', COUNT(*) FROM on_site_booking;
