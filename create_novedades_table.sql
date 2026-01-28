CREATE TABLE IF NOT EXISTS novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255) DEFAULT NULL,
    cuerpo TEXT NOT NULL,
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    imagen_url VARCHAR(500) DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    leido_por_todos TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar una novedad de ejemplo
INSERT INTO novedades (titulo, subtitulo, cuerpo, fecha_publicacion) VALUES 
('¡Bienvenidos a la sección de Novedades!', 'Enterate de todo acá', 'Aquí publicaremos las últimas promociones, aperturas de nuevos lavaderos y noticias importantes para que no te pierdas nada.', NOW());
