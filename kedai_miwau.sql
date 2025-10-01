-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 17, 2025 at 09:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kedai_miwau`
--

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `role` enum('admin','kasir','kitchen','owner') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('aktif','nonaktif') DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `username`, `password`, `nama_lengkap`, `role`, `created_at`, `updated_at`, `status`) VALUES
(1, 'Vincent', '$2b$10$nA4q/3CtdN3QWhgDB.hOPug0N6dyGsf.T/HSUcoXkrH5Kllcy1c4y', 'Nathaniel Vincent', 'admin', '2025-06-05 14:41:33', '2025-06-05 14:41:33', 'aktif'),
(2, 'Vincent123', '$2b$10$ojYpvkt.NGdPBY8J0se48eM5YlLnTu4cPZa5dDZaDRXpv1pKd0wZW', 'Nathaniel Vincent', 'admin', '2025-06-05 14:41:45', '2025-06-05 14:41:45', 'aktif'),
(3, 'abc', '$2b$10$LRV2ykFwcgatpLSrKnPGUuJJdGZW/1BC8ANK.DNlBs7p6tysALULK', 'abc', 'admin', '2025-06-05 14:42:02', '2025-06-05 14:42:02', 'aktif'),
(4, '123', '$2b$10$6O5IPa1XeCL/nBwov3CW7uU4UEkuoi8H77oFUcpD9SOU89hLZaEUS', '123', 'kitchen', '2025-06-05 14:45:24', '2025-06-05 14:45:24', 'aktif'),
(5, '132', '$2b$10$NmhjJxPRaxxzCWWcEYgg8.zkW8Hkwv2KREL7rhDsl1kyGrcc3AZaq', '132', 'admin', '2025-06-05 14:46:05', '2025-06-05 14:46:05', 'aktif'),
(6, 'tes', '$2b$10$vO48nL0gzDkIJ57ISrXuq.munzkJfaqIqQPUeP3AU9N621ksnHjHW', 'tes', 'admin', '2025-09-15 12:57:40', '2025-09-15 12:57:40', 'aktif'),
(7, '12345', '$2b$10$rsyOegr9SBSGxsBbsQ9Y5ecQNDxDdgd7Lbx5qiGnAsFYWCFTV2qOa', '12345', 'admin', '2025-09-15 12:58:08', '2025-09-15 12:58:08', 'aktif'),
(8, '1234', '$2b$10$GxgguJ2YQPGrIBXT81kf6uLcHnYvTc9bf3SJP0UaMyHHl/7zYluSO', '1234', 'admin', '2025-09-15 13:52:55', '2025-09-15 13:52:55', 'aktif'),
(9, '123456', '$2b$10$MzNaIO9hKUHXFDgZUk6Q/.2e37tXUhGvO2oKyXKmdO6jHuC5YbSha', '123456', 'admin', '2025-09-15 17:29:16', '2025-09-15 17:29:16', 'aktif'),
(10, '123445', '$2b$10$6/fOPOwaTC3skhFz4.0nj.oKD.497KzbM5JaLTb2lXs2az3d4NXDS', '123445', 'admin', '2025-09-15 17:29:34', '2025-09-15 17:29:34', 'aktif'),
(11, '12334', '$2b$10$UnJ.ZnpHAD8txID7szhIhuEIzhpoFUhNkXl1LDoMEEV50nqNHUdBy', '12334', 'admin', '2025-09-15 17:30:21', '2025-09-15 17:30:21', 'aktif'),
(12, '1223', '$2b$10$U3/omtRAzU9ZUAC7xdXqgenMZU5G.Jnlq0yY7jreImWwXhec11dyO', '1223', 'admin', '2025-09-15 17:30:36', '2025-09-15 17:30:36', 'aktif');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
