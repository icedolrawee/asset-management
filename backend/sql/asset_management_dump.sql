-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: asset_management
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `asset_management`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `asset_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `asset_management`;

--
-- Table structure for table `asset_checkouts`
--

DROP TABLE IF EXISTS `asset_checkouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_checkouts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `checked_out_by` bigint(20) unsigned NOT NULL,
  `borrower_user_id` bigint(20) unsigned DEFAULT NULL,
  `borrower_name` varchar(255) NOT NULL,
  `asset_number` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `room` varchar(100) NOT NULL,
  `checked_out_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `returned_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_asset_checkouts_asset_active` (`asset_id`,`returned_at`),
  KEY `idx_asset_checkouts_user` (`checked_out_by`),
  KEY `idx_asset_checkouts_borrower_active` (`borrower_user_id`,`returned_at`),
  CONSTRAINT `fk_asset_checkouts_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `fk_asset_checkouts_borrower` FOREIGN KEY (`borrower_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_asset_checkouts_user` FOREIGN KEY (`checked_out_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_checkouts`
--

LOCK TABLES `asset_checkouts` WRITE;
/*!40000 ALTER TABLE `asset_checkouts` DISABLE KEYS */;
INSERT INTO `asset_checkouts` VALUES (5,24,2,1,'ดลรวี มุ้ยแก้ว','ค.008/2569','อาคารสำนักงานอธิการบดี','ห้องงานพัสดุ ชั้น 2','2026-11-10 03:56:02',NULL),(10,26,2,3,'กัน นัทนรี','ค.009/2569','อาคารสำนักงานอธิการบดี','ห้องงานสารบรรณ ชั้น 2','2026-11-10 07:31:48',NULL),(11,23,2,3,'กัน นรีรัตร','ค.001/2569','อาคารสำนักงานอธิการบดี','ห้องงานสารบรรณ ชั้น 2','2026-11-10 08:53:26',NULL);
/*!40000 ALTER TABLE `asset_checkouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_status_history`
--

DROP TABLE IF EXISTS `asset_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_status_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `old_status` enum('ใช้งาน','ชำรุด','จำหน่าย') DEFAULT NULL,
  `new_status` enum('ใช้งาน','ชำรุด','จำหน่าย') NOT NULL,
  `changed_by` bigint(20) unsigned DEFAULT NULL,
  `note` varchar(1000) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_asset_status_history_asset` (`asset_id`,`changed_at`),
  KEY `fk_status_history_user` (`changed_by`),
  CONSTRAINT `fk_status_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `fk_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_status_history`
--

LOCK TABLES `asset_status_history` WRITE;
/*!40000 ALTER TABLE `asset_status_history` DISABLE KEYS */;
INSERT INTO `asset_status_history` VALUES (22,17,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:46:42'),(23,18,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:47:40'),(24,19,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:48:20'),(25,20,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:49:02'),(27,22,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:50:18'),(28,23,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:51:02'),(29,24,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 03:51:48'),(30,24,'ใช้งาน','ชำรุด',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 03:53:34'),(31,24,'ชำรุด','ใช้งาน',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 03:53:52'),(32,24,'ใช้งาน','ชำรุด',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 03:59:18'),(33,24,'ชำรุด','ใช้งาน',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 03:59:29'),(34,24,'ใช้งาน','จำหน่าย',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 03:59:35'),(36,26,NULL,'ใช้งาน',NULL,'สร้างรายการครุภัณฑ์','2026-11-10 04:23:11'),(40,26,'ใช้งาน','ชำรุด',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 08:50:04'),(41,26,'ชำรุด','จำหน่าย',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 09:08:33'),(42,26,'จำหน่าย','ชำรุด',2,'เปลี่ยนสถานะผ่านหน้ารายการครุภัณฑ์','2026-11-10 09:09:25');
/*!40000 ALTER TABLE `asset_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_number` varchar(100) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `budget_year` smallint(5) unsigned DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `room` varchar(100) DEFAULT NULL,
  `status` enum('ใช้งาน','ชำรุด','จำหน่าย') NOT NULL DEFAULT 'ใช้งาน',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assets_serial_number` (`serial_number`),
  UNIQUE KEY `uq_assets_asset_number` (`asset_number`),
  KEY `idx_assets_status` (`status`),
  KEY `idx_assets_item_name` (`item_name`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (17,'ค.007/2569','ตู้เก็บเอกสาร','Luckyworld','FC-3','CAB-OFF-2026-0001','/uploads/assets/1794282402584-430072355.png','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:46:42','2026-11-10 03:46:42'),(18,'ค.006/2569','เครื่องสแกนเอกสาร','Fujitsu (Ricoh)','fi-8040','SCN-OFF-2026-0001','/uploads/assets/1794282460050-686758084.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:47:40','2026-11-10 03:47:40'),(19,'ค.005/2569','เครื่องพิมพ์','HP','LaserJet Pro M404dn','PRT-OFF-2026-0001','/uploads/assets/1794282500976-683208265.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:48:20','2026-11-10 03:48:20'),(20,'ค.004/2569','โทรทัศน์','Samsung','Crystal UHD DU8000','TV-OFF-2026-0001','/uploads/assets/1794282542352-605434227.png','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:49:02','2026-11-10 03:49:02'),(22,'ค.003/2569','จอคอมพิวเตอร์','Dell','P2422H','MON-OFF-2026-0001','/uploads/assets/1794282618144-621027072.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:50:18','2026-11-10 03:50:18'),(23,'ค.001/2569','เก้าอี้สำนักงาน','Modernform','Series 1','OFC-CHR-2026-0001','/uploads/assets/1794282662702-405966805.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ใช้งาน',NULL,'2026-11-10 03:51:02','2026-11-10 03:51:02'),(24,'ค.008/2569','โต๊ะทำงาน',NULL,'Office Desk 120 cm',NULL,'/uploads/assets/1794282708103-339349233.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'จำหน่าย',NULL,'2026-11-10 03:51:48','2026-11-10 03:59:35'),(26,'ค.009/2569','คอมพิวเตอร์','Dell','Series 1','PC-OFF-2026-0001','/uploads/assets/1794284591685-35023691.jpg','ฝ่ายเทคโนโลยีสารสนเทศ',2569,NULL,NULL,'ชำรุด',NULL,'2026-11-10 04:23:11','2026-11-10 09:09:25');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_profiles` (
  `user_id` bigint(20) unsigned NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL DEFAULT '',
  `room` varchar(100) NOT NULL DEFAULT '',
  `floor` varchar(100) NOT NULL DEFAULT '',
  `department` varchar(255) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `avatar_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,'ดลรวี มุ้ยแก้ว','นักวิชาการคอมพิวเตอร์','301','3','ฝ่ายเทคโนโลยีสารสนเทศ','2026-11-06 02:50:51','/uploads/avatars/user-1-1793933451791.jpg'),(2,'test-dev07 rucom','','','','','2026-11-06 02:54:48',NULL),(3,'กัน นรีรัตร','พนักงาน','302','3','พัฒนา','2026-11-11 01:50:47','/uploads/avatars/user-3-1794361806262.jpg');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `auth_provider` enum('LOCAL','AUTHEN365') NOT NULL DEFAULT 'LOCAL',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_active` (`role`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ice@gmail.com','ดลรวี มุ้ยแก้ว',NULL,'USER','LOCAL',1,'2026-11-11 08:47:40','2026-10-30 02:12:43','2026-11-11 01:47:40'),(2,'test-dev07@ru.ac.th','test-dev07 rucom',NULL,'ADMIN','AUTHEN365',1,'2026-11-11 08:51:03','2026-10-30 02:12:51','2026-11-11 01:51:03'),(3,'gun@gmail.com','กัน นรีรัตร',NULL,'USER','LOCAL',1,'2026-11-11 08:49:46','2026-11-04 07:45:44','2026-11-11 01:50:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11  9:57:14
