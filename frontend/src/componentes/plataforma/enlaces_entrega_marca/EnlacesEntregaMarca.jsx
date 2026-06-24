import { useState } from 'react';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { urlAbsolutaApp } from '../../../compartido/utilidades/rutasApp';
import '../../../estilos/plataforma/marcas/enlaces_entrega_marca.css';

function textoEntregaCliente({ nombreComercial, slug, adminCorreo }) {
  const urlClientes = urlAbsolutaApp(RUTAS_PUBLICAS.inicioMarca(slug));
  const urlReservar = urlAbsolutaApp(RUTAS_PUBLICAS.reservar(slug));
  const urlAdmin = urlAbsolutaApp(RUTAS_ADMIN.login);

  let texto = `Accesos para ${nombreComercial}\n\n`;
  texto += `App para tus clientes:\n${urlClientes}\n`;
  texto += `Reservar cita:\n${urlReservar}\n\n`;
  texto += `Panel de administración:\n${urlAdmin}\n`;
  if (adminCorreo) {
    texto += `Correo admin: ${adminCorreo}\n`;
  }
  texto += '\n(La contraseña te la entregamos por un canal seguro.)';
  return texto;
}

export default function EnlacesEntregaMarca({ marca }) {
  const [copiado, setCopiado] = useState(null);

  const urlClientes = urlAbsolutaApp(RUTAS_PUBLICAS.inicioMarca(marca.slug));
  const urlReservar = urlAbsolutaApp(RUTAS_PUBLICAS.reservar(marca.slug));
  const urlAdmin = urlAbsolutaApp(RUTAS_ADMIN.login);

  async function copiar(clave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setCopiado('error');
    }
  }

  const bloqueCompleto = textoEntregaCliente(marca);

  return (
    <div className="enlaces-entrega">
      <div className="enlaces-entrega__fila">
        <span className="enlaces-entrega__etiqueta">Clientes</span>
        <a href={urlClientes} target="_blank" rel="noreferrer" className="enlaces-entrega__url">
          {urlClientes}
        </a>
        <button
          type="button"
          className="enlaces-entrega__copiar"
          onClick={() => copiar('clientes', urlClientes)}
          title="Copiar enlace clientes"
        >
          {copiado === 'clientes' ? '✓' : 'Copiar'}
        </button>
      </div>
      <div className="enlaces-entrega__fila">
        <span className="enlaces-entrega__etiqueta">Reservar</span>
        <a href={urlReservar} target="_blank" rel="noreferrer" className="enlaces-entrega__url">
          {urlReservar}
        </a>
        <button
          type="button"
          className="enlaces-entrega__copiar"
          onClick={() => copiar('reservar', urlReservar)}
          title="Copiar enlace reservas"
        >
          {copiado === 'reservar' ? '✓' : 'Copiar'}
        </button>
      </div>
      <div className="enlaces-entrega__fila">
        <span className="enlaces-entrega__etiqueta">Admin</span>
        <a href={urlAdmin} target="_blank" rel="noreferrer" className="enlaces-entrega__url">
          {urlAdmin}
        </a>
        <button
          type="button"
          className="enlaces-entrega__copiar"
          onClick={() => copiar('admin', urlAdmin)}
          title="Copiar enlace panel admin"
        >
          {copiado === 'admin' ? '✓' : 'Copiar'}
        </button>
      </div>
      {marca.adminCorreo && (
        <p className="enlaces-entrega__correo">
          Correo admin: <strong>{marca.adminCorreo}</strong>
        </p>
      )}
      <button
        type="button"
        className="enlaces-entrega__copiar-todo"
        onClick={() => copiar('todo', bloqueCompleto)}
      >
        {copiado === 'todo' ? 'Datos copiados' : 'Copiar todo para el cliente'}
      </button>
    </div>
  );
}
