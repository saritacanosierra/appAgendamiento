const PASOS_IOS = [
  <>Abre este panel en <strong>Safari</strong> (en iPhone no funciona desde Chrome ni desde apps como WhatsApp).</>,
  <>Toca el boton <strong>Compartir</strong> (cuadrado con flecha hacia arriba), abajo en el centro de la pantalla.</>,
  <>Baja en el menu y elige <strong>Agregar a pantalla de inicio</strong>.</>,
  <>Toca <strong>Agregar</strong> arriba a la derecha para confirmar.</>,
  <>Listo: veras el icono <strong>Panel Admin</strong> en tu inicio. Abrelo para entrar directo al panel.</>,
];

const PASOS_ANDROID_NATIVO = [
  <>Toca el boton <strong>Instalar icono</strong> que aparece abajo en esta ventana.</>,
  <>En el mensaje del navegador, confirma con <strong>Instalar</strong>.</>,
  <>Busca el icono <strong>Panel Admin</strong> en tu pantalla de inicio o en el cajon de apps.</>,
  <>Abrelo: entraras directo al panel (si no has iniciado sesion, te pedira tu usuario y contrasena).</>,
];

const PASOS_ANDROID_MANUAL = [
  <>Abre esta pagina en <strong>Chrome</strong> (no en otro navegador ni dentro de otra app).</>,
  <>Toca los <strong>tres puntos</strong> (menu) arriba a la derecha.</>,
  <>Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong>.</>,
  <>Confirma con <strong>Instalar</strong> o <strong>Agregar</strong>.</>,
  <>Listo: el icono <strong>Panel Admin</strong> quedara en tu inicio. Abrelo para entrar al panel.</>,
];

export function obtenerPasosInstalarPwa({ esIos, esStandalone, puedeInstalarNativo }) {
  if (esStandalone) {
    return {
      intro: 'Ya abriste el panel como app instalada.',
      pasos: [
        'Cierra el navegador y busca el icono Panel Admin en tu pantalla de inicio.',
        'Abrelo cuando quieras volver al panel sin escribir la direccion web.',
      ],
    };
  }

  if (esIos) {
    return {
      intro: 'Sigue estos pasos en tu iPhone para tener un icono en la pantalla de inicio:',
      pasos: PASOS_IOS,
    };
  }

  if (puedeInstalarNativo) {
    return {
      intro: 'Sigue estos pasos en tu Android para agregar el icono a tu celular:',
      pasos: PASOS_ANDROID_NATIVO,
    };
  }

  return {
    intro: 'Sigue estos pasos en tu Android para agregar el icono a tu celular:',
    pasos: PASOS_ANDROID_MANUAL,
  };
}
