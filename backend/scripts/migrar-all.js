/**
 * Ejecuta todas las migraciones en orden con registro en schema_migraciones.
 * Uso: npm run migrar:all
 */
import {
  aplicarMigracion,
  asegurarTablaMigraciones,
  crearConexion,
  ejecutarArchivoSql,
  ejecutarSentencias,
} from './utilidades/migracion.js';

const MIGRACIONES = [
  {
    id: '001_plataforma_superadmin',
    nombre: 'Plataforma superadmin y configuracion global',
    ejecutar: (conexion) => ejecutarSentencias(conexion, [
      `ALTER TABLE marcas ADD COLUMN plan_habilitado TINYINT(1) NOT NULL DEFAULT 1 AFTER activa`,
      `ALTER TABLE usuarios MODIFY marca_id INT UNSIGNED NULL`,
      `ALTER TABLE usuarios MODIFY rol ENUM('superadmin', 'admin', 'staff') NOT NULL DEFAULT 'admin'`,
      `ALTER TABLE tokens_sesion MODIFY marca_id INT UNSIGNED NULL`,
      `CREATE TABLE IF NOT EXISTS configuracion_plataforma (
        clave VARCHAR(80) NOT NULL PRIMARY KEY,
        valor TEXT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ]),
  },
  {
    id: '002_solicitudes_reagendamiento',
    nombre: 'Solicitudes de reagendamiento',
    ejecutar: (c) => ejecutarArchivoSql(c, '002_solicitudes_reagendamiento.sql'),
  },
  {
    id: '003_atencion_facturacion',
    nombre: 'Facturacion en atencion',
    ejecutar: (c) => ejecutarArchivoSql(c, '003_atencion_facturacion.sql'),
  },
  {
    id: '004_carrusel_inicio',
    nombre: 'Carrusel del inicio',
    ejecutar: (c) => ejecutarArchivoSql(c, '004_carrusel_inicio.sql'),
  },
  {
    id: '005_servicios_imagen',
    nombre: 'Imagen en servicios',
    ejecutar: (c) => ejecutarArchivoSql(c, '005_servicios_imagen.sql'),
  },
  {
    id: '006_servicios_tipo',
    nombre: 'Tipo de servicio marca/adicional',
    ejecutar: (c) => ejecutarArchivoSql(c, '006_servicios_tipo.sql'),
  },
  {
    id: '007_galeria_temporada',
    nombre: 'Temporada en galeria',
    ejecutar: (c) => ejecutarArchivoSql(c, '007_galeria_temporada.sql'),
  },
  {
    id: '007_galeria_tendencia',
    nombre: 'Disenos en tendencia',
    ejecutar: (c) => ejecutarSentencias(c, [
      `ALTER TABLE disenos_galeria
        ADD COLUMN en_tendencia TINYINT(1) NOT NULL DEFAULT 0 AFTER orden_visualizacion`,
    ]),
  },
  {
    id: '008_galeria_catalogo',
    nombre: 'Catalogo configurable galeria',
    ejecutar: (c) => ejecutarArchivoSql(c, '008_galeria_catalogo.sql'),
  },
  {
    id: '009_cliente_favoritos',
    nombre: 'Favoritos de clientes',
    ejecutar: (c) => ejecutarArchivoSql(c, '009_cliente_favoritos.sql'),
  },
  {
    id: '010_citas_whatsapp_recordatorio',
    nombre: 'Marca recordatorio WhatsApp',
    ejecutar: (c) => ejecutarArchivoSql(c, '010_citas_whatsapp_recordatorio.sql'),
  },
  {
    id: '011_citas_cancelada_por',
    nombre: 'Quien cancelo la cita',
    ejecutar: (c) => ejecutarArchivoSql(c, '011_citas_cancelada_por.sql'),
  },
  {
    id: '012_cita_disenos_galeria',
    nombre: 'Disenos de galeria por cita',
    ejecutar: (c) => ejecutarArchivoSql(c, '012_cita_disenos_galeria.sql'),
  },
  {
    id: '013_suscripcion_marca',
    nombre: 'Suscripcion SaaS por marca',
    ejecutar: (c) => ejecutarArchivoSql(c, '013_suscripcion_marca.sql'),
  },
  {
    id: '014_estilistas_ciudad',
    nombre: 'Estilistas, ciudad SEO y galeria por estilista',
    ejecutar: (c) => ejecutarArchivoSql(c, '014_estilistas_ciudad.sql'),
  },
  {
    id: '015_publicidad_blog',
    nombre: 'Publicidad pagada del blog',
    ejecutar: (c) => ejecutarArchivoSql(c, '015_publicidad_blog.sql'),
  },
  {
    id: '016_publicidad_por_publicacion',
    nombre: 'Campanas de publicidad por publicacion',
    ejecutar: (c) => ejecutarArchivoSql(c, '016_publicidad_por_publicacion.sql'),
  },
  {
    id: '017_portafolio_estilistas',
    nombre: 'Foto y habilidades del portafolio',
    ejecutar: (c) => ejecutarArchivoSql(c, '017_portafolio_estilistas.sql'),
  },
  {
    id: '018_estilista_descripcion',
    nombre: 'Descripcion del portafolio',
    ejecutar: (c) => ejecutarArchivoSql(c, '018_estilista_descripcion.sql'),
  },
  {
    id: '019_selecciones_galeria_telefono',
    nombre: 'Disenos de galeria guardados por celular',
    ejecutar: (c) => ejecutarArchivoSql(c, '019_selecciones_galeria_telefono.sql'),
  },
  {
    id: '020_pagos_wompi',
    nombre: 'Pagos mensuales con Wompi',
    ejecutar: (c) => ejecutarArchivoSql(c, '020_pagos_wompi.sql'),
  },
];

async function main() {
  const conexion = await crearConexion();

  try {
    await asegurarTablaMigraciones(conexion);
    console.log(`Migraciones pendientes en ${process.env.DB_NOMBRE ?? 'spa_unas'}:\n`);

    let aplicadas = 0;
    for (const migracion of MIGRACIONES) {
      const nueva = await aplicarMigracion(conexion, migracion);
      if (nueva) aplicadas += 1;
    }

    console.log(`\nListo. ${aplicadas} migracion(es) nueva(s), ${MIGRACIONES.length} revisadas.`);
  } finally {
    await conexion.end();
  }
}

main().catch((err) => {
  console.error('\nError en migrar:all:', err.message);
  process.exit(1);
});
