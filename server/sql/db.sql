/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.4.3-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: ACLI
-- ------------------------------------------------------
-- Server version	11.4.3-MariaDB-1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `posti_prenotazioni`
--

DROP TABLE IF EXISTS `posti_prenotazioni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posti_prenotazioni` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index_row` int(11) DEFAULT NULL,
  `index_col` int(11) DEFAULT NULL,
  `id_prenotazione` int(11) NOT NULL,
  `id_tavolo` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_tavolo` (`id_tavolo`),
  KEY `id_prenotazione` (`id_prenotazione`),
  CONSTRAINT `posti_prenotazioni_ibfk_1` FOREIGN KEY (`id_tavolo`) REFERENCES `tavoli` (`id`),
  CONSTRAINT `posti_prenotazioni_ibfk_2` FOREIGN KEY (`id_prenotazione`) REFERENCES `prenotazioni` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4785 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posti_prenotazioni`
--

LOCK TABLES `posti_prenotazioni` WRITE;
/*!40000 ALTER TABLE `posti_prenotazioni` DISABLE KEYS */;
INSERT INTO `posti_prenotazioni` VALUES
(4735,0,0,9,1),
(4736,1,0,9,1),
(4737,0,1,9,1),
(4738,1,1,9,1),
(4739,0,2,9,1),
(4740,1,2,9,1),
(4741,0,3,9,1),
(4742,1,3,9,1),
(4743,0,4,9,1),
(4744,1,4,9,1),
(4745,0,5,16,1),
(4746,1,5,16,1),
(4747,0,6,16,1),
(4748,1,6,16,1),
(4749,0,7,16,1),
(4750,1,7,16,1),
(4751,0,8,13,1),
(4752,1,8,13,1),
(4753,0,9,13,1),
(4754,1,9,13,1),
(4755,0,0,14,5),
(4756,0,1,14,5),
(4757,1,0,14,5),
(4758,1,1,14,5),
(4759,2,0,11,5),
(4760,2,1,11,5),
(4761,3,0,11,5),
(4762,3,1,11,5),
(4763,4,0,11,5),
(4764,4,1,11,5),
(4765,5,0,11,5),
(4766,5,1,23,5),
(4767,6,0,23,5),
(4768,6,1,23,5),
(4769,7,0,23,5),
(4770,7,1,23,5),
(4771,0,0,17,6),
(4772,1,0,17,6),
(4773,0,1,17,6),
(4774,1,1,17,6),
(4775,0,2,17,6),
(4776,1,2,17,6),
(4777,0,0,18,7),
(4778,0,1,18,7),
(4779,1,0,18,7),
(4780,1,1,18,7),
(4781,2,0,15,7),
(4782,2,1,15,7),
(4783,3,0,15,7),
(4784,3,1,12,7);
/*!40000 ALTER TABLE `posti_prenotazioni` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prenotazioni`
--

DROP TABLE IF EXISTS `prenotazioni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prenotazioni` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` text NOT NULL,
  `color` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prenotazioni`
--

LOCK TABLES `prenotazioni` WRITE;
/*!40000 ALTER TABLE `prenotazioni` DISABLE KEYS */;
INSERT INTO `prenotazioni` VALUES
(9,'canosort\'s','#9ce2b5'),
(11,'sindaco','#f2b0b0'),
(12,'wilmer','#b8ffc3'),
(13,'marti e amici','#92e34f'),
(14,'family','#98a7f1'),
(15,'bho','#e1a95b'),
(16,'prova da sei','#b895da'),
(17,'bho!','#7fb6f0'),
(18,'pino','#86dddf'),
(23,'temp','#707070');
/*!40000 ALTER TABLE `prenotazioni` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tavoli`
--

DROP TABLE IF EXISTS `tavoli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tavoli` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) NOT NULL,
  `y` int(11) NOT NULL,
  `orientamento` int(11) NOT NULL,
  `places` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tavoli`
--

LOCK TABLES `tavoli` WRITE;
/*!40000 ALTER TABLE `tavoli` DISABLE KEYS */;
INSERT INTO `tavoli` VALUES
(1,631,456,0,20),
(4,631,351,0,12),
(5,526,246,1,16),
(6,876,351,0,6),
(7,1016,351,1,10);
/*!40000 ALTER TABLE `tavoli` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-03-19 15:32:05
