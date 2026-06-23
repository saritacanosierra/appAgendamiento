import { VARIABLES_MARCA_DEFECTO } from '../constantes';
import {
  acentoLegible,
  bordeSobre,
  calcularFondoApp,
  esFondoClaro,
  fondoInput,
  superficieElevada,
  textoLegibleSobre,
  textoMuted as calcularTextoMuted,
  textoSecundarioVisible,
  textoSuave as calcularTextoSuave,
} from './contrasteMarca';

/**
 * Aplica variables CSS de la marca al documento,
 * ajustando colores de texto para contraste legible sobre cada fondo.
 */
export function aplicarTemaMarca(marca = {}) {
  const raiz = document.documentElement;
  const colores = { ...VARIABLES_MARCA_DEFECTO, ...marca };

  const fondo = colores.colorFondo;
  const principal = colores.colorPrincipal;
  const secundario = colores.colorSecundario;
  const fondoApp = calcularFondoApp(secundario, fondo);
  const superficie = superficieElevada(fondo, fondoApp);
  const inputFondo = fondoInput(superficie, fondoApp);

  /* Texto sobre fondo de página (body) */
  const texto = textoLegibleSobre(fondoApp, colores.colorTexto);
  const textoMuted = calcularTextoMuted(texto, fondoApp);
  const textoSuaveVar = calcularTextoSuave(texto, fondoApp);

  /* Texto sobre tarjetas / contenedores / formularios */
  const textoSuperficie = textoLegibleSobre(superficie, colores.colorTexto);
  const textoMutedSuperficie = calcularTextoMuted(textoSuperficie, superficie);
  const textoSuaveSuperficie = calcularTextoSuave(textoSuperficie, superficie);

  /* Texto sobre inputs */
  const textoInput = textoLegibleSobre(inputFondo, colores.colorTexto);

  const textoSobrePrincipal = textoLegibleSobre(principal);
  const textoSobreSecundario = textoLegibleSobre(secundario);
  const acento = acentoLegible(principal, fondoApp);
  const acentoSuperficie = acentoLegible(principal, superficie, 4.5);

  /* Cromo (encabezado + menú): sigue la superficie elevada */
  const fondoCromo = superficie;
  const textoNav = textoLegibleSobre(fondoCromo, colores.colorTexto);
  const textoNavMuted = textoSecundarioVisible(textoNav, fondoCromo);
  const acentoNav = acentoLegible(principal, fondoCromo, 4.5);

  raiz.style.setProperty('--color-principal', principal);
  raiz.style.setProperty('--color-secundario', secundario);
  raiz.style.setProperty('--color-fondo', fondo);
  raiz.style.setProperty('--color-fondo-app', fondoApp);
  raiz.style.setProperty('--color-superficie', superficie);
  raiz.style.setProperty('--color-borde', bordeSobre(fondoApp));
  raiz.style.setProperty('--color-borde-superficie', bordeSobre(superficie));
  raiz.style.setProperty('--color-input-fondo', inputFondo);
  raiz.style.setProperty('--color-input-borde', bordeSobre(inputFondo));

  raiz.style.setProperty('--color-texto', texto);
  raiz.style.setProperty('--color-texto-muted', textoMuted);
  raiz.style.setProperty('--color-texto-suave', textoSuaveVar);

  raiz.style.setProperty('--color-texto-superficie', textoSuperficie);
  raiz.style.setProperty('--color-texto-muted-superficie', textoMutedSuperficie);
  raiz.style.setProperty('--color-texto-suave-superficie', textoSuaveSuperficie);
  raiz.style.setProperty('--color-input-texto', textoInput);

  raiz.style.setProperty('--color-texto-sobre-principal', textoSobrePrincipal);
  raiz.style.setProperty('--color-texto-sobre-secundario', textoSobreSecundario);
  raiz.style.setProperty('--color-acento', acento);
  raiz.style.setProperty('--color-acento-superficie', acentoSuperficie);

  raiz.style.setProperty('--color-texto-nav', textoNav);
  raiz.style.setProperty('--color-texto-nav-muted', textoNavMuted);
  raiz.style.setProperty('--color-acento-nav', acentoNav);

  raiz.dataset.temaClaro = esFondoClaro(fondoApp) ? '1' : '0';
}

export function formatearPrecio(precio) {
  const valor = Number(precio ?? 0);
  if (!Number.isFinite(valor)) return '$0';

  const numero = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(valor));

  return `$${numero}`;
}

export function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
  }).format(new Date(fecha));
}
