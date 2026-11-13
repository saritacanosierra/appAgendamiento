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
  <>Si abriste el panel desde WhatsApp u otra app, usa el menú y elige <strong>Abrir en Chrome</strong>.</>,
  <>En Chrome, toca los <strong>tres puntos</strong> arriba a la derecha.</>,
  <>Elige <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong>.</>,
  <>Confirma con <strong>Instalar</strong> o <strong>Agregar</strong>.</>,
  <>El icono <strong>Panel Admin</strong> queda en el inicio o en el cajón de apps.</>,
];

const PASOS_ESCRITORIO_NATIVO = [
  <>Pulsa el botón <strong>Instalar icono</strong> de esta ventana.</>,
  <>En el aviso de Chrome o Edge, confirma con <strong>Instalar</strong>.</>,
  <>Abre <strong>Panel Admin</strong> desde el menú Inicio o el escritorio.</>,
];

const PASOS_ESCRITORIO_MANUAL = [
  <>Abre este panel en <strong>Chrome</strong> o en <strong>Edge</strong>.</>,
  <>Busca el icono de instalar en la barra de la dirección. Si no está, abre el menú de los <strong>tres puntos</strong>.</>,
  <>Elige <strong>Instalar</strong>, o <strong>Aplicaciones</strong> y luego instalar este sitio.</>,
  <>Confirma. <strong>Panel Admin</strong> queda en el menú Inicio o en el escritorio.</>,
];

export function obtenerPasosInstalarPwa({ sistema = 'escritorio', esStandalone, puedeInstalarNativo }) {
  if (esStandalone) {
    const enCelular = sistema === 'ios' || sistema === 'android';
    return {
      intro: enCelular
        ? 'Ya abriste el panel como app instalada en el celular.'
        : 'Ya abriste el panel como aplicación en este equipo.',
      pasos: enCelular
        ? [
          'Cierra el navegador y busca el icono Panel Admin en tu pantalla de inicio.',
          'Ábrelo cuando quieras volver al panel sin escribir la dirección.',
        ]
        : [
          'Cierra el navegador y abre Panel Admin desde el menú Inicio o el escritorio.',
          'Ahí entras directo, sin escribir la dirección.',
        ],
    };
  }

  if (sistema === 'ios') {
    return {
      intro: 'Estás en iPhone o iPad. Hazlo desde Safari.',
      pasos: PASOS_IOS,
    };
  }

  if (sistema === 'android') {
    return {
      intro: puedeInstalarNativo
        ? 'Estás en Android. Puedes instalar el icono desde este aviso.'
        : 'Estás en Android. Instálalo desde Chrome, con estos pasos.',
      pasos: puedeInstalarNativo ? PASOS_ANDROID_NATIVO : PASOS_ANDROID_MANUAL,
    };
  }

  return {
    intro: puedeInstalarNativo
      ? 'Estás en un computador. Instala el panel en este equipo.'
      : 'Estás en un computador. Sigue estos pasos en Chrome o Edge.',
    pasos: puedeInstalarNativo ? PASOS_ESCRITORIO_NATIVO : PASOS_ESCRITORIO_MANUAL,
  };
}
