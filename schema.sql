-- ============================================================
-- SCRIPT DE BASE DE DATOS: quinua_3d_db
-- Plataforma Web de Museo Digital y Marketplace 3D Quinua
-- ============================================================

CREATE DATABASE IF NOT EXISTS `quinua_3d_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quinua_3d_db`;

-- ------------------------------------------------------------
-- 1. TABLA: usuarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `compras`;
DROP TABLE IF EXISTS `artesanias`;
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('turista', 'artesano', 'admin') DEFAULT 'artesano',
  `especialidad` VARCHAR(100) NULL,
  `telefono` VARCHAR(25) NULL,
  `direccion_quinua` VARCHAR(255) DEFAULT 'Pueblo Histórico de Quinua, Ayacucho',
  `ubicacion_maps` VARCHAR(255) DEFAULT 'https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho+Peru',
  `biografia` TEXT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. TABLA: artesanias
-- ------------------------------------------------------------
CREATE TABLE `artesanias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion_es` TEXT NULL,
  `descripcion_qu` TEXT NULL,
  `modelo_glb` VARCHAR(255) NOT NULL DEFAULT 'iglesia_quinua.glb',
  `imagen_url` VARCHAR(255) NULL,
  `audio_es` VARCHAR(255) NULL,
  `audio_qu` VARCHAR(255) NULL,
  `alto_cm` DECIMAL(6,2) DEFAULT 25.00,
  `ancho_cm` DECIMAL(6,2) DEFAULT 15.00,
  `fondo_cm` DECIMAL(6,2) DEFAULT 12.00,
  `precio` DECIMAL(10,2) DEFAULT 85.00,
  `estado` ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'aprobado',
  `artesano_id` INT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`artesano_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. TABLA: compras
-- ------------------------------------------------------------
CREATE TABLE `compras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `turista_id` INT NULL,
  `artesania_id` INT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `metodo_pago` ENUM('yape', 'tarjeta', 'plin') DEFAULT 'yape',
  `referencia_pago` VARCHAR(100) NOT NULL,
  `estado_pago` ENUM('completado', 'pendiente') DEFAULT 'completado',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`turista_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`artesania_id`) REFERENCES `artesanias`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DATOS INICIALES DE PRUEBA
-- ============================================================

-- Usuario Administrador (Contraseña: admin123)
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `especialidad`, `direccion_quinua`, `ubicacion_maps`, `biografia`) VALUES
(1, 'Administrador Quinua', 'admin@quinua.pe', '$2a$10$wE9l13G08m/n1Y1mXn1GzeXwO1Q0vW91O0O.Y.X.X.X.X', 'admin', 'Administración General', 'Plaza de Armas S/N, Quinua', 'https://www.google.com/maps/search/?api=1&query=Plaza+de+Armas+Quinua+Ayacucho', 'Administración y moderación del Museo Digital Quinua 3D');

-- Usuario Artesano Maestro (Contraseña: artesano123)
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `especialidad`, `direccion_quinua`, `ubicacion_maps`, `biografia`) VALUES
(2, 'Taller Familia Lope', 'tallerlope@quinua.pe', '$2a$10$wE9l13G08m/n1Y1mXn1GzeXwO1Q0vW91O0O.Y.X.X.X.X', 'artesano', 'Iglesias Tradicionales y Toritos', 'Jr. Sucre N° 102, Pueblo Histórico de Quinua, Ayacucho', 'https://www.google.com/maps/search/?api=1&query=Quinua+Ayacucho+Peru', 'Maestro ceramista con más de 20 años de experiencia en alfarería quinuela tradicional.');

-- Artesanía Ejemplo 1 (Iglesia Techada)
INSERT INTO `artesanias` (`id`, `titulo`, `descripcion_es`, `descripcion_qu`, `modelo_glb`, `imagen_url`, `audio_es`, `audio_qu`, `alto_cm`, `ancho_cm`, `fondo_cm`, `precio`, `estado`, `artesano_id`) VALUES
(1, 'Iglesia Techada de Quinua', 'Cruz techada: Esta cruz se coloca en los tejados de las casas como símbolo de protección en las viviendas de Quinua.', 'Maki rurasqa quinua iglesiacha protectora', 'iglesia_quinua.glb', NULL, 'desc_es.m4a', 'desc_qu.m4a', 25.00, 15.00, 12.00, 85.00, 'aprobado', 2);

-- Artesanía Ejemplo 2 (Torito de Quinua)
INSERT INTO `artesanias` (`id`, `titulo`, `descripcion_es`, `descripcion_qu`, `modelo_glb`, `imagen_url`, `audio_es`, `audio_qu`, `alto_cm`, `ancho_cm`, `fondo_cm`, `precio`, `estado`, `artesano_id`) VALUES
(2, 'Torito de Quinua Tradicional', 'Símbolo de fuerza, fecundidad y abundancia en la cultura andina.', 'Torito maki rurasqa quinua marka', 'iglesia_quinua.glb', NULL, 'desc_es.m4a', 'desc_qu.m4a', 30.00, 18.00, 14.00, 120.00, 'aprobado', 2);
