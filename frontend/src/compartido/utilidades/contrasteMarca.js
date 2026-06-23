const TEXTO_CLARO = '#ffffff';
const TEXTO_OSCURO = '#1a1a1a';

export function parsearColor(color) {
  if (!color || typeof color !== 'string') return null;
  const valor = color.trim();

  let match = valor.match(/^#([0-9a-f]{3})$/i);
  if (match) {
    const [r, g, b] = match[1].split('').map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }

  match = valor.match(/^#([0-9a-f]{6})$/i);
  if (match) {
    const hex = match[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  match = valor.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (match) {
    return { r: +match[1], g: +match[2], b: +match[3] };
  }

  return null;
}

function luminanciaRelativa({ r, g, b }) {
  const canal = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canal[0] + 0.7152 * canal[1] + 0.0722 * canal[2];
}

export function contrasteRatio(colorA, colorB) {
  const rgbA = typeof colorA === 'string' ? parsearColor(colorA) : colorA;
  const rgbB = typeof colorB === 'string' ? parsearColor(colorB) : colorB;
  if (!rgbA || !rgbB) return 1;

  const l1 = luminanciaRelativa(rgbA);
  const l2 = luminanciaRelativa(rgbB);
  const claro = Math.max(l1, l2);
  const oscuro = Math.min(l1, l2);
  return (claro + 0.05) / (oscuro + 0.05);
}

export function esFondoClaro(color) {
  const rgb = parsearColor(color);
  if (!rgb) return true;
  return luminanciaRelativa(rgb) > 0.45;
}

export function aHex({ r, g, b }) {
  const canal = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

/** Mezcla colorA hacia colorB; ratioB = proporción de colorB (0–1). */
export function mezclarColores(colorA, colorB, ratioB) {
  const a = parsearColor(colorA);
  const b = parsearColor(colorB);
  if (!a || !b) return colorA || colorB || TEXTO_OSCURO;

  const t = Math.max(0, Math.min(1, ratioB));
  return aHex({
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  });
}

/** Texto legible sobre un fondo; respeta preferido si cumple contraste mínimo. */
export function textoLegibleSobre(fondo, preferido = null, minRatio = 4.5) {
  if (!parsearColor(fondo)) return TEXTO_OSCURO;

  if (preferido && contrasteRatio(preferido, fondo) >= minRatio) {
    return preferido;
  }

  const ratioClaro = contrasteRatio(TEXTO_CLARO, fondo);
  const ratioOscuro = contrasteRatio(TEXTO_OSCURO, fondo);

  if (ratioClaro >= minRatio && ratioOscuro >= minRatio) {
    return esFondoClaro(fondo) ? TEXTO_OSCURO : TEXTO_CLARO;
  }

  return ratioClaro >= ratioOscuro ? TEXTO_CLARO : TEXTO_OSCURO;
}

/** Acento (p. ej. color principal) legible como texto sobre fondo claro/oscuro. */
export function acentoLegible(acento, fondo, minRatio = 3) {
  if (contrasteRatio(acento, fondo) >= minRatio) return acento;

  const rgb = parsearColor(acento);
  const fondoClaro = esFondoClaro(fondo);
  if (!rgb) return acento;

  for (let paso = 1; paso <= 24; paso += 1) {
    const factor = fondoClaro ? 1 - paso * 0.04 : 1 + paso * 0.05;
    const ajustado = aHex({
      r: rgb.r * factor,
      g: rgb.g * factor,
      b: rgb.b * factor,
    });
    if (contrasteRatio(ajustado, fondo) >= minRatio) return ajustado;
  }

  return textoLegibleSobre(fondo, acento, minRatio);
}

/** Variante atenuada del texto principal con contraste suficiente. */
export function textoMuted(texto, fondo, minRatio = 4.5, maxMix = 0.85) {
  for (let mix = 0.35; mix <= maxMix; mix += 0.05) {
    const muted = mezclarColores(texto, fondo, mix);
    if (contrasteRatio(muted, fondo) >= minRatio) return muted;
  }
  return textoLegibleSobre(fondo, texto, minRatio);
}

/** Texto secundario bien visible (p. ej. navegación sobre fondo claro). */
export function textoSecundarioVisible(texto, fondo, minRatio = 4.5) {
  for (let mix = 0.22; mix <= 0.48; mix += 0.04) {
    const secundario = mezclarColores(texto, fondo, mix);
    if (contrasteRatio(secundario, fondo) >= minRatio) return secundario;
  }
  return textoLegibleSobre(fondo, null, minRatio);
}

/** Variante más suave que muted. */
export function textoSuave(texto, fondo, minRatio = 3) {
  for (let mix = 0.55; mix <= 0.9; mix += 0.05) {
    const suave = mezclarColores(texto, fondo, mix);
    if (contrasteRatio(suave, fondo) >= minRatio) return suave;
  }
  return mezclarColores(texto, fondo, 0.7);
}

export function bordeSobre(fondo) {
  return esFondoClaro(fondo)
    ? mezclarColores(fondo, TEXTO_OSCURO, 0.12)
    : mezclarColores(fondo, TEXTO_CLARO, 0.22);
}

/** Tarjetas y contenedores elevados sobre el fondo de la app. */
export function superficieElevada(fondo, fondoApp) {
  if (esFondoClaro(fondo)) return '#ffffff';
  return mezclarColores(fondoApp, TEXTO_CLARO, 0.1);
}

/** @deprecated Usar superficieElevada */
export function superficieSobre(fondo) {
  if (esFondoClaro(fondo)) return '#ffffff';
  return mezclarColores(fondo, TEXTO_CLARO, 0.1);
}

/** Fondo de campos de texto dentro de una superficie. */
export function fondoInput(superficie, fondoApp) {
  if (esFondoClaro(superficie)) return '#ffffff';
  return mezclarColores(superficie, fondoApp, 0.45);
}

/** Equivalente JS de color-mix(in srgb, secundario 14%, fondo). */
export function calcularFondoApp(secundario, fondo) {
  return mezclarColores(secundario, fondo, 0.86);
}
