import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CampoFormulario, InputTexto } from '../../../compartido/componentes';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { registrarSalon } from '../../../modulos/registro/servicios/registroServicio';
import '../../../estilos/publico/landing/landing.css';

const TITULO_SEO = 'Agenda en línea para peluquerías, uñas, pestañas, tatuaje y estética';
const DESCRIPCION_SEO = 'Tus clientas reservan solas con tu enlace. 8 días gratis, sin tarjeta. Luego $25.000 al mes, sin comisión por cita.';

const VACIO = {
  nombre_comercial: '',
  admin_nombre: '',
  admin_correo: '',
  admin_contrasena: '',
};

const PASOS = [
  {
    titulo: 'Crea tu cuenta en el formulario de abajo',
    texto: 'Escribes el nombre del negocio, tu nombre, el correo y una contraseña. Le das a «Crear mi agenda gratis». No piden tarjeta.',
  },
  {
    titulo: 'Tu marca',
    texto: 'Entras al panel. Abres «Tu marca» y guardas logo, colores, WhatsApp y los días que atiendes.',
  },
  {
    titulo: 'Tus servicios',
    texto: 'Creas cada servicio con su nombre, cuánto dura y el precio. Sin esto, tu clienta no tiene qué reservar.',
  },
  {
    titulo: 'Quién atiende',
    texto: 'Agregas a cada profesional. Si trabajas sola, escribes tu nombre. Así ella elige con quién.',
  },
  {
    titulo: 'Fotos de tus trabajos',
    texto: 'Subes las fotos a la galería. Tu clienta las ve en el celular y puede elegir el diseño.',
  },
  {
    titulo: 'El enlace para tu clienta',
    texto: 'Pulsas «Copiar enlace» y lo pegas en WhatsApp. Ella abre tuagenda.com/m/tu-negocio, elige hora y reserva. No crea cuenta.',
  },
];

const VENTAJAS = [
  { titulo: 'Tu marca al 100%', texto: 'Logo, colores y un enlace con el nombre exacto de tu negocio.' },
  { titulo: 'Galería de trabajos', texto: 'La clienta elige el diseño y queda ligado directamente a su cita.' },
  { titulo: 'Aviso a tu WhatsApp', texto: 'Llega a tu número con el nombre, el servicio y el código de reserva.' },
  { titulo: 'Cada profesional', texto: 'Cada quien tiene su agenda. La clienta elige con quién atenderse.' },
  { titulo: 'Sin fricción', texto: 'Sin contraseñas ni registros. Reservan desde el navegador del celular.' },
  { titulo: 'Precio cerrado', texto: '$25.000 al mes, hagas 10 citas o 200. Lo que cobras se queda contigo.' },
];

const COMPARACION = [
  { tema: 'Precio', nuestra: '$25.000 al mes, fijos', otra: 'Comisión por cita o mensualidades más altas' },
  { tema: 'Tu caja', nuestra: 'El servicio se queda contigo', otra: 'Un porcentaje sale en cada cita' },
  { tema: 'Tus clientas', nuestra: 'Entran al instante desde el celular', otra: 'Les piden cuenta y otra aplicación' },
  { tema: 'Para empezar', nuestra: '8 días gratis, sin tarjeta', otra: 'Cobro desde el primer día' },
];

const PREGUNTAS = [
  {
    pregunta: '¿Para qué negocios es?',
    respuesta: 'Para profesionales y equipos de peluquería, uñas, pestañas, tatuaje y estética que hoy coordinan citas por WhatsApp y quieren su propia agenda.',
  },
  {
    pregunta: '¿Cuánto cuesta después de la prueba?',
    respuesta: 'El mes vale $25.000. El trimestre $90.000, el semestre $180.000 y el año $360.000, con Wompi. No hay comisión por cada reserva.',
  },
  {
    pregunta: '¿Mis clientas tienen que registrarse o descargar algo?',
    respuesta: 'No. Abren tu enlace, eligen servicio, hora y profesional desde el navegador del celular.',
  },
  {
    pregunta: '¿Qué pasa cuando terminan los 8 días?',
    respuesta: 'Activas el plan con Wompi: mes $25.000, trimestre $90.000, semestre $180.000 o año $360.000. Tus clientas siguen reservando. La prueba es una sola vez. Si se acaba el tiempo que pagaste, ellas no agendan y tú entras al panel a pagar de nuevo. Tus citas y fotos siguen guardadas.',
  },
];

const FOTO_HERO = '';

const FOTOS_OFICIO = [
  { titulo: 'Peluquería', src: '' },
  { titulo: 'Uñas', src: '' },
  { titulo: 'Pestañas', src: '' },
  { titulo: 'Tatuaje', src: '' },
  { titulo: 'Estética', src: '' },
];

function fijarMeta(nombre, contenido, propiedad = false) {
  const atributo = propiedad ? 'property' : 'name';
  let etiqueta = document.head.querySelector(`meta[${atributo}="${nombre}"]`);
  const creada = !etiqueta;
  if (!etiqueta) {
    etiqueta = document.createElement('meta');
    etiqueta.setAttribute(atributo, nombre);
    document.head.appendChild(etiqueta);
  }
  const previo = etiqueta.getAttribute('content');
  etiqueta.setAttribute('content', contenido);
  return () => {
    if (creada) etiqueta.remove();
    else if (previo != null) etiqueta.setAttribute('content', previo);
  };
}

function usarSeoLanding() {
  useEffect(() => {
    const tituloPrevio = document.title;
    const restaurar = [
      fijarMeta('description', DESCRIPCION_SEO),
      fijarMeta('og:title', TITULO_SEO, true),
      fijarMeta('og:description', DESCRIPCION_SEO, true),
      fijarMeta('og:type', 'website', true),
      fijarMeta('og:locale', 'es_CO', true),
    ];

    let canonico = document.head.querySelector('link[rel="canonical"]');
    const canonicoCreado = !canonico;
    const canonicoPrevio = canonico?.getAttribute('href') ?? null;
    if (!canonico) {
      canonico = document.createElement('link');
      canonico.setAttribute('rel', 'canonical');
      document.head.appendChild(canonico);
    }
    canonico.setAttribute('href', window.location.origin + '/');

    const script = document.createElement('script');
    script.id = 'seo-landing-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Agenda',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: DESCRIPCION_SEO,
          offers: {
            '@type': 'Offer',
            price: '25000',
            priceCurrency: 'COP',
            description: 'Plan mensual después de 8 días gratis',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: PREGUNTAS.map((item) => ({
            '@type': 'Question',
            name: item.pregunta,
            acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
          })),
        },
      ],
    }).replace(/</g, '\\u003c');
    document.getElementById('seo-landing-jsonld')?.remove();
    document.head.appendChild(script);

    document.title = TITULO_SEO;

    return () => {
      document.title = tituloPrevio;
      restaurar.forEach((volver) => volver());
      if (canonicoCreado) canonico.remove();
      else if (canonicoPrevio) canonico.setAttribute('href', canonicoPrevio);
      script.remove();
    };
  }, []);
}

function MarcoImagen({ titulo, src, variante = 'cuadrada' }) {
  return (
    <figure className={`landing__imagen landing__imagen--${variante}`}>
      {src ? (
        <img src={src} alt={titulo} />
      ) : (
        <div className="landing__imagen-vacio">
          <span className="landing__imagen-marca" aria-hidden="true">+</span>
          <span className="landing__imagen-titulo">{titulo}</span>
          <span className="landing__imagen-ayuda">Espacio para foto</span>
        </div>
      )}
    </figure>
  );
}

export default function LandingVista() {
  const { iniciarSesion } = useAuth();
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [creado, setCreado] = useState(null);
  usarSeoLanding();

  function actualizar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function registrar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const datos = await registrarSalon(form);
      setCreado(datos);
      await iniciarSesion(form.admin_correo, form.admin_contrasena, 'marca');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="landing">
      <header className="landing__barra">
        <div className="landing__ancho landing__barra-interior">
          <a className="landing__marca" href="#inicio">
            <span className="landing__logo" aria-hidden="true">A</span>
            Agenda
          </a>
          <nav className="landing__nav" aria-label="Secciones">
            <a href="#inicio">Inicio</a>
            <a href="#como">Cómo funciona</a>
            <a href="#ventajas">Beneficios</a>
            <a href="#precio">Precio</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <a className="landing__cta" href="#registro">Empezar gratis</a>
        </div>
      </header>

      <main>
        <section className="landing__hero" id="inicio">
          <div className="landing__ancho landing__hero-grid">
            <div className="landing__hero-copia">
              <p className="landing__etiqueta">Diseñado para quienes viven de su agenda</p>
              <h1>Llena tus días de citas, no de mensajes interminables en WhatsApp.</h1>
              <p className="landing__bajada">
                Tus clientas reservan solas con un enlace de tu negocio. Ves tu tiempo y tu caja,
                sin pagar comisión por cita. Prueba 8 días gratis, sin tarjeta. Luego, $25.000 al mes.
              </p>
              <div className="landing__hero-acciones">
                <a className="landing__cta" href="#registro">Crear mi agenda gratis ahora</a>
                <a className="landing__cta landing__cta--ghost" href="#precio">Ver el precio</a>
              </div>
              <p className="landing__nota">8 días sin tarjeta. La configuras el mismo día.</p>
            </div>
            <div className="landing__hero-escena">
              <article className="landing__flotante landing__flotante--enlace">
                <p>Tu enlace</p>
                <strong>Listo para WhatsApp</strong>
              </article>
              <div className="landing__telefono landing__telefono--hero" aria-hidden="true">
                <p className="landing__telefono-app">Agenda</p>
                <p className="landing__telefono-dia">Hoy</p>
                <div className="landing__telefono-cita"><span>10:00</span><strong>Corte</strong></div>
                <div className="landing__telefono-cita"><span>11:30</span><strong>Pestañas</strong></div>
                <div className="landing__telefono-cita"><span>14:00</span><strong>Tatuaje</strong></div>
              </div>
              <article className="landing__flotante landing__flotante--caja">
                <p>$0</p>
                <strong>de comisión por cita</strong>
              </article>
              <div className="landing__flotante landing__flotante--foto">
                <MarcoImagen titulo="Foto de tu negocio" src={FOTO_HERO} variante="hero" />
              </div>
            </div>
          </div>
          <div className="landing__ola" aria-hidden="true">
            <svg viewBox="0 0 1440 420" preserveAspectRatio="none" focusable="false">
              <path
                fill="#cfc4ff"
                d="M0,390 A2000,1200 0 0 1 1440,86 L1440,420 L0,420 Z"
              />
            </svg>
          </div>
        </section>

        <section className="landing__cifras landing__entra" aria-label="La oferta">
          <ul className="landing__ancho landing__cifras-lista">
            <li className="landing__cifra--fuerte"><strong>$0</strong><span>de comisión por cita</span></li>
            <li><strong>8 días</strong><span>para probarlo</span></li>
            <li><strong>$25.000</strong><span>al mes, precio fijo</span></li>
            <li><strong>1 enlace</strong><span>para tus clientas</span></li>
          </ul>
        </section>

        <section className="landing__bloque landing__entra" id="puertas">
          <div className="landing__ancho">
            <p className="landing__etiqueta">Dos puertas</p>
            <h2>Tú personalizas la marca. Tu clienta solo abre un enlace.</h2>
            <div className="landing__puertas">
              <article className="landing__puerta">
                <p className="landing__puerta-rol">Dueña de la marca</p>
                <h3>Entras al panel para dejarla a tu gusto.</h3>
                <ul>
                  <li>Nombre, logo y colores de tu negocio.</li>
                  <li>Servicios, precios, equipo y horarios.</li>
                  <li>Galería de trabajos y el aviso a tu WhatsApp.</li>
                </ul>
                <p className="landing__puerta-nota">Esta puerta es solo tuya, con correo y contraseña.</p>
              </article>
              <article className="landing__puerta">
                <p className="landing__puerta-rol">Tu clienta</p>
                <h3>No se registra. Le compartes este enlace.</h3>
                <p className="landing__enlace-muestra">tuagenda.com/m/tu-negocio</p>
                <ul>
                  <li>Lo copias en el panel y lo envías por WhatsApp o Instagram.</li>
                  <li>Ella elige servicio, hora y profesional desde el celular.</li>
                  <li>Tú recibes el aviso con su nombre y la cita.</li>
                </ul>
                <p className="landing__puerta-nota">Ese enlace es lo único que ve tu clienta.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing__bloque landing__entra" id="problema">
          <div className="landing__ancho landing__dos">
            <div>
              <p className="landing__etiqueta">El día de hoy</p>
              <h2>¿Cuánto tiempo pierdes respondiendo «¿qué hora tienes libre?»?</h2>
              <p className="landing__bajada">
                Coordinar por WhatsApp te quita el tiempo de atender. Otras agendas cobran
                un porcentaje de cada cita o le piden a tu clienta que cree una cuenta.
              </p>
            </div>
            <div className="landing__oferta">
              <p>Con tu enlace</p>
              <ul>
                <li>Ella reserva sola, desde el celular.</li>
                <li>Tú ves el día y la caja.</li>
                <li>No hay comisión por cita.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="landing__bloque landing__bloque--violeta landing__entra" id="como">
          <div className="landing__ancho">
            <p className="landing__etiqueta">Cómo funciona</p>
            <h2>Si acabas de inscribirte, haz esto en orden.</h2>
            <p className="landing__bajada">
              El 1 es este formulario. Del 2 al 6 los haces en tu panel, en el mismo orden. El enlace es lo único que ve tu clienta.
            </p>
            <ol className="landing__pasos">
              {PASOS.map((paso, indice) => (
                <li key={paso.titulo}>
                  <span>{indice + 1}</span>
                  <div>
                    <h3>{paso.titulo}</h3>
                    <p>{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing__bloque landing__entra" id="ventajas">
          <div className="landing__ancho">
            <p className="landing__etiqueta">Beneficios</p>
            <h2>Todo lo que tu negocio necesita, en el celular.</h2>
            <ul className="landing__tarjetas">
              {VENTAJAS.map((ventaja) => (
                <li key={ventaja.titulo}>
                  <h3>{ventaja.titulo}</h3>
                  <p>{ventaja.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing__bloque landing__bloque--rosa landing__entra" id="oficios">
          <div className="landing__ancho">
            <p className="landing__etiqueta">Tu oficio</p>
            <h2>Para belleza, estética y arte corporal.</h2>
            <p className="landing__bajada">Peluquería, uñas, pestañas, tatuaje y estética. Cada recuadro es el lugar de su foto.</p>
            <div className="landing__oficios">
              {FOTOS_OFICIO.map((foto) => (
                <MarcoImagen key={foto.titulo} titulo={foto.titulo} src={foto.src} variante="cuadrada" />
              ))}
            </div>
          </div>
        </section>

        <section className="landing__bloque landing__entra" id="precio">
          <div className="landing__ancho">
            <div className="landing__banda">
              <div className="landing__telefono" aria-hidden="true">
                <p className="landing__telefono-dia">Hoy</p>
                <div className="landing__telefono-cita"><span>10:00</span><strong>Corte</strong></div>
                <div className="landing__telefono-cita"><span>11:30</span><strong>Pestañas</strong></div>
                <div className="landing__telefono-cita"><span>14:00</span><strong>Tatuaje</strong></div>
              </div>
              <div>
                <p className="landing__etiqueta">Precio</p>
                <h2>Una tarifa plana que protege lo que cobras.</h2>
                <p className="landing__precio-grande">$25.000 al mes</p>
                <p className="landing__bajada">
                  Sin porcentaje sobre el servicio. El mes sigue en $25.000. El trimestre cuesta $90.000, el semestre $180.000 y el año $360.000.
                </p>
                <a className="landing__cta" href="#registro">Probar 8 días gratis</a>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__bloque landing__bloque--violeta landing__entra" id="comparacion">
          <div className="landing__ancho">
            <p className="landing__etiqueta">Comparación</p>
            <h2>Tu agenda frente a las que cobran por cita.</h2>
            <ul className="landing__versus">
              {COMPARACION.map((fila) => (
                <li key={fila.tema}>
                  <p>{fila.tema}</p>
                  <strong>{fila.nuestra}</strong>
                  <span>{fila.otra}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing__bloque landing__entra" id="preguntas">
          <div className="landing__ancho landing__faq">
            <div>
              <p className="landing__etiqueta">Preguntas</p>
              <h2>Antes de crear tu agenda</h2>
            </div>
            <div>
              {PREGUNTAS.map((item) => (
                <details key={item.pregunta}>
                  <summary>{item.pregunta}</summary>
                  <p>{item.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__registro landing__entra" id="registro">
          <div className="landing__ancho landing__registro-grid">
            <div>
              <p className="landing__etiqueta">Empieza hoy</p>
              <h2>Crea tu perfil para empezar en la app.</h2>
              <p className="landing__bajada">Este formulario es tu cuenta. El correo y la contraseña son los que usarás para entrar.</p>
              <ul className="landing__alta">
                <li>Escribes el negocio y tu nombre.</li>
                <li>El correo es con el que vas a entrar.</li>
                <li>La contraseña es la llave de ese ingreso.</li>
              </ul>
              <p className="landing__entrar">
                ¿Ya tienes cuenta? <Link to={RUTAS_ADMIN.login}>Entrar al panel</Link>
              </p>
            </div>

            {creado ? (
              <div className="landing__listo">
                <h3>Paso 1 listo. Sigue con el paso 2.</h3>
                <p>
                  {creado.marca.nombreComercial} tiene {creado.prueba.dias} días gratis, hasta {creado.prueba.venceEn}.
                  En el panel, el paso 2 es tu marca: logo, colores, WhatsApp y horarios.
                </p>
                <Link className="landing__cta landing__cta--ancho" to={RUTAS_ADMIN.configuracionMarca}>
                  Ir al paso 2: tu marca
                </Link>
                <p className="landing__entrar">
                  <Link to={RUTAS_ADMIN.panel}>Ver la lista completa en el panel</Link>
                </p>
              </div>
            ) : (
              <form className="landing__form" onSubmit={registrar}>
                <h3 className="landing__form-titulo">Tu perfil para entrar</h3>
                <p className="landing__form-ayuda">Con estos datos abres el panel de tu marca cada vez que vuelvas.</p>
                <CampoFormulario etiqueta="Negocio" id="reg-nombre" requerido>
                  <InputTexto
                    id="reg-nombre"
                    capitalizar="palabras"
                    value={form.nombre_comercial}
                    placeholder="Luna Studio"
                    onChange={(e) => actualizar('nombre_comercial', e.target.value)}
                    required
                  />
                </CampoFormulario>
                <CampoFormulario etiqueta="Tu nombre" id="reg-admin" requerido>
                  <InputTexto
                    id="reg-admin"
                    capitalizar="palabras"
                    value={form.admin_nombre}
                    placeholder="Ana Ruiz"
                    onChange={(e) => actualizar('admin_nombre', e.target.value)}
                    required
                  />
                </CampoFormulario>
                <CampoFormulario
                  etiqueta="Correo para entrar"
                  id="reg-correo"
                  requerido
                  ayuda="Con este correo inicias sesión."
                >
                  <input
                    id="reg-correo"
                    type="email"
                    autoComplete="email"
                    value={form.admin_correo}
                    placeholder="ana@salon.com"
                    onChange={(e) => actualizar('admin_correo', e.target.value)}
                    required
                  />
                </CampoFormulario>
                <CampoFormulario
                  etiqueta="Contraseña para entrar"
                  id="reg-pass"
                  requerido
                  ayuda="Con esta contraseña inicias sesión. Mínimo 8 caracteres."
                >
                  <input
                    id="reg-pass"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={form.admin_contrasena}
                    onChange={(e) => actualizar('admin_contrasena', e.target.value)}
                    required
                  />
                </CampoFormulario>
                {error && <p className="landing__error" role="alert">{error}</p>}
                <button type="submit" className="landing__cta landing__cta--ancho" disabled={enviando}>
                  {enviando ? 'Creando...' : 'Crear mi perfil y entrar'}
                </button>
                <p className="landing__nota">Sin tarjeta. Guarda este correo y esta contraseña: son los de tu ingreso.</p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="landing__pie">
        <div className="landing__ancho">
          <strong>Agenda</strong>
          <p>Peluquería, uñas, pestañas, tatuaje y estética. 8 días gratis y luego $25.000 al mes con Wompi.</p>
        </div>
      </footer>
    </div>
  );
}
