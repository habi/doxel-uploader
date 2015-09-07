-- phpMyAdmin SQL Dump
-- version 4.2.12deb2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 07, 2015 at 11:33 PM
-- Server version: 10.0.20-MariaDB-0+deb8u1
-- PHP Version: 5.6.12-0+deb8u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `doxel`
--
CREATE DATABASE IF NOT EXISTS `doxel` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `doxel`;

-- --------------------------------------------------------

--
-- Table structure for table `pictures`
--

DROP TABLE IF EXISTS `pictures`;
CREATE TABLE IF NOT EXISTS `pictures` (
`id` bigint(20) NOT NULL,
  `user` int(11) DEFAULT NULL,
  `created` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `flags` bit(32) DEFAULT NULL,
  `timestamp` timestamp(6) NULL DEFAULT NULL,
  `segment` timestamp(6) NULL DEFAULT NULL,
  `lon` double DEFAULT NULL,
  `lat` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL,
  `name` varchar(254) NOT NULL,
  `fingerprint` char(32) NOT NULL,
  `pass` varchar(32) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) NOT NULL,
  `forwarded_for` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pictures`
--
ALTER TABLE `pictures`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `picture` (`id`), ADD KEY `timestamp` (`timestamp`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pictures`
--
ALTER TABLE `pictures`
MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
