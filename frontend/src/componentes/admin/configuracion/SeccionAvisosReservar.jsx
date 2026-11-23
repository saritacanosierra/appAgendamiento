import { INDICATIVOS_PAIS } from '../../../compartido/constantes';
import {
  BotonPrincipal,
  CampoContrasena,
  CampoFormulario,
  TextareaTexto,
} from '../../../compartido/componentes';
import AcordeonSeccion from './AcordeonSeccion';

export default function SeccionAvisosReservar({
  abierta,
  onAbrir,
  config,
  actualizarNotificaciones,
  actualizarWhatsappApi,
  actualizarCorreoSmtp,
  aplicarGmailRapido,
  whatsappTokenNuevo,
  setWhatsappTokenNuevo,
  correoSmtpContrasenaNueva,
  setCorreoSmtpContrasenaNueva,
  telefonoPruebaWhatsapp,
  setTelefonoPruebaWhatsapp,
  correoPrueba,
  setCorreoPrueba,
  probarWhatsapp,
  probarCorreo,
  probandoWhatsapp,
  probandoCorreo,
  onAbrirGuia,
}) {
  return (
    <AcordeonSeccion
      id="confirmacion-citas"
      titulo="8. Avisos al reservar"
      resumen="WhatsApp automático y/o correo"
      abierta={abierta}
      onAbrir={onAbrir}
    >

      <p className="configuracion-marca__paso-intro">
        Cuando una clienta reserva, puedes avisarle por WhatsApp, por correo, o por los dos.
        Si el aviso no sale, la cita igual queda guardada.
      </p>

      <div className="configuracion-marca__canal">
        <div className="configuracion-marca__canal-cabecera">
          <div>
            <h3>WhatsApp automático</h3>
            <p>Mensaje al celular de la clienta (necesitas cuenta Business de Meta).</p>
          </div>
          <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
            <input
              type="checkbox"
              checked={Boolean(config.notificaciones?.canales?.whatsapp)}
              onChange={(e) => {
                const activo = e.target.checked;
                actualizarNotificaciones('whatsapp', activo);
                actualizarWhatsappApi('habilitado', activo);
              }}
            />
            <span className="configuracion-marca__horario-switch" aria-hidden="true" />
            <span>{config.notificaciones?.canales?.whatsapp ? 'Encendido' : 'Apagado'}</span>
          </label>
        </div>

        <button
          type="button"
          className="configuracion-marca__btn-guia"
          onClick={() => onAbrirGuia('whatsapp')}
        >
          ¿De dónde salen estos datos?
        </button>

        {config.notificaciones?.canales?.whatsapp ? (
          <div className="configuracion-marca__pasos">
            <ol className="configuracion-marca__pasos-lista">
              <li>En Meta Business / WhatsApp Manager copia el <strong>Phone Number ID</strong>.</li>
              <li>En Meta Developers genera un <strong>token</strong> permanente.</li>
              <li>Pégalos abajo, elige el país, guarda y prueba con tu celular.</li>
            </ol>

            <CampoFormulario
              etiqueta="1. Phone Number ID"
              id="cfg-wa-phone-id"
              ayuda="Es un número largo de Meta. No es el celular de tu negocio."
            >
              <input
                id="cfg-wa-phone-id"
                value={config.whatsappApi?.phoneNumberId ?? ''}
                onChange={(e) => actualizarWhatsappApi('phoneNumberId', e.target.value)}
                placeholder="Ejemplo: 123456789012345"
              />
            </CampoFormulario>

            <CampoFormulario
              etiqueta={config.whatsappApi?.tokenConfigurado
                ? '2. Token (déjalo vacío si no lo cambias)'
                : '2. Token de Meta'}
              id="cfg-wa-token"
            >
              <CampoContrasena
                id="cfg-wa-token"
                value={whatsappTokenNuevo}
                onChange={(e) => setWhatsappTokenNuevo(e.target.value)}
                placeholder={config.whatsappApi?.tokenConfigurado
                  ? 'Déjalo vacío para no cambiarlo'
                  : 'Pega aquí el token'}
                autoComplete="new-password"
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="3. País del número" id="cfg-wa-pais">
              <select
                id="cfg-wa-pais"
                value={config.whatsappApi?.codigoPais ?? ''}
                onChange={(e) => actualizarWhatsappApi('codigoPais', e.target.value)}
              >
                <option value="">Elige el país</option>
                {INDICATIVOS_PAIS.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.nombre} +{pais.codigo}
                  </option>
                ))}
                {config.whatsappApi?.codigoPais
                  && !INDICATIVOS_PAIS.some((pais) => pais.codigo === config.whatsappApi.codigoPais) && (
                  <option value={config.whatsappApi.codigoPais}>
                    +{config.whatsappApi.codigoPais}
                  </option>
                )}
              </select>
            </CampoFormulario>

            <details className="configuracion-marca__guia">
              <summary>Texto del mensaje (opcional)</summary>
              <CampoFormulario
                etiqueta="Mensaje de confirmación"
                id="cfg-wa-confirmacion"
                ayuda="Puedes usar {{nombre}}, {{marca}}, {{servicio}}, {{fecha}}, {{hora}}, {{codigo}}, {{url_confirmacion}}"
              >
                <TextareaTexto
                  id="cfg-wa-confirmacion"
                  value={config.whatsappApi?.plantillaConfirmacion ?? ''}
                  onChange={(e) => actualizarWhatsappApi('plantillaConfirmacion', e.target.value)}
                  rows={4}
                />
              </CampoFormulario>
              <CampoFormulario etiqueta="Plantilla recordatorio Meta (opcional)" id="cfg-wa-plantilla">
                <input
                  id="cfg-wa-plantilla"
                  value={config.whatsappApi?.plantillaRecordatorio ?? ''}
                  onChange={(e) => actualizarWhatsappApi('plantillaRecordatorio', e.target.value)}
                  placeholder="recordatorio_cita"
                />
              </CampoFormulario>
            </details>

            {config.whatsappApi?.configurado ? (
              <p className="configuracion-marca__google-ok">
                Listo. Los avisos saldrán al WhatsApp de la clienta.
              </p>
            ) : (
              <p className="configuracion-marca__aviso-falta">
                Falta guardar el ID, el token y el país. Luego pulsa Guardar y prueba.
              </p>
            )}

            <div className="configuracion-marca__prueba">
              <CampoFormulario etiqueta="Tu celular para probar" id="cfg-wa-prueba">
                <input
                  id="cfg-wa-prueba"
                  value={telefonoPruebaWhatsapp}
                  onChange={(e) => setTelefonoPruebaWhatsapp(e.target.value)}
                  placeholder="Ejemplo: 3001234567"
                />
              </CampoFormulario>
              <BotonPrincipal
                type="button"
                variante="secundario"
                onClick={probarWhatsapp}
                deshabilitado={probandoWhatsapp || !config.whatsappApi?.configurado}
              >
                {probandoWhatsapp ? 'Enviando...' : 'Probar WhatsApp'}
              </BotonPrincipal>
            </div>
          </div>
        ) : (
          <p className="configuracion-marca__hint">
            Déjalo apagado si solo quieres el número público de Contacto (wa.me). Enciéndelo solo si ya tienes Meta Business API.
          </p>
        )}
      </div>

      <div className="configuracion-marca__canal">
        <div className="configuracion-marca__canal-cabecera">
          <div>
            <h3>Correo automático</h3>
            <p>Sale gratis desde tu propio Gmail u otro correo.</p>
          </div>
          <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
            <input
              type="checkbox"
              checked={Boolean(config.notificaciones?.canales?.correo)}
              onChange={(e) => actualizarNotificaciones('correo', e.target.checked)}
            />
            <span className="configuracion-marca__horario-switch" aria-hidden="true" />
            <span>{config.notificaciones?.canales?.correo ? 'Encendido' : 'Apagado'}</span>
          </label>
        </div>

        <button
          type="button"
          className="configuracion-marca__btn-guia"
          onClick={() => onAbrirGuia('correo')}
        >
          ¿Qué es SMTP y de dónde salen estos datos?
        </button>

        {config.notificaciones?.canales?.correo ? (
          <div className="configuracion-marca__pasos">
            <ol className="configuracion-marca__pasos-lista">
              <li>Si usas Gmail, pulsa <strong>Usar Gmail</strong> y crea una contraseña de aplicación en Google.</li>
              <li>Escribe tu correo y esa contraseña (no la normal de Gmail).</li>
              <li>Guarda y prueba enviándote un mensaje.</li>
            </ol>

            <BotonPrincipal type="button" variante="secundario" onClick={aplicarGmailRapido}>
              Usar Gmail (rellena host y puerto)
            </BotonPrincipal>

            <CampoFormulario etiqueta="1. Correo que envía" id="cfg-smtp-usuario">
              <input
                id="cfg-smtp-usuario"
                value={config.notificaciones?.correo?.usuario ?? ''}
                onChange={(e) => actualizarCorreoSmtp('usuario', e.target.value)}
                placeholder="tunegocio@gmail.com"
                autoComplete="off"
              />
            </CampoFormulario>

            <CampoFormulario
              etiqueta={config.notificaciones?.correo?.contrasenaConfigurada
                ? '2. Contraseña de aplicación (vacío = no cambiar)'
                : '2. Contraseña de aplicación'}
              id="cfg-smtp-pass"
              ayuda="En Gmail: Cuenta Google → Seguridad → Contraseñas de aplicaciones."
            >
              <CampoContrasena
                id="cfg-smtp-pass"
                value={correoSmtpContrasenaNueva}
                onChange={(e) => setCorreoSmtpContrasenaNueva(e.target.value)}
                placeholder={config.notificaciones?.correo?.contrasenaConfigurada
                  ? 'Déjala vacía para no cambiarla'
                  : 'La de 16 letras de Google'}
                autoComplete="new-password"
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="3. Nombre que verá la clienta" id="cfg-smtp-remitente">
              <input
                id="cfg-smtp-remitente"
                value={config.notificaciones?.correo?.remitente ?? ''}
                onChange={(e) => actualizarCorreoSmtp('remitente', e.target.value)}
                placeholder="Beauty Nails <tunegocio@gmail.com>"
              />
            </CampoFormulario>

            <details className="configuracion-marca__guia">
              <summary>Ajustes avanzados (solo si no es Gmail)</summary>
              <CampoFormulario etiqueta="Host SMTP" id="cfg-smtp-host">
                <input
                  id="cfg-smtp-host"
                  value={config.notificaciones?.correo?.host ?? ''}
                  onChange={(e) => actualizarCorreoSmtp('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  autoComplete="off"
                />
              </CampoFormulario>
              <CampoFormulario etiqueta="Puerto" id="cfg-smtp-puerto">
                <input
                  id="cfg-smtp-puerto"
                  type="number"
                  inputMode="numeric"
                  value={config.notificaciones?.correo?.puerto ?? 587}
                  onChange={(e) => actualizarCorreoSmtp('puerto', Number(e.target.value) || 587)}
                  placeholder="587"
                />
              </CampoFormulario>
              <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(config.notificaciones?.correo?.seguro)}
                  onChange={(e) => actualizarCorreoSmtp('seguro', e.target.checked)}
                />
                <span className="configuracion-marca__horario-switch" aria-hidden="true" />
                <span>Puerto seguro 465 (SSL)</span>
              </label>
              <CampoFormulario etiqueta="Asunto" id="cfg-smtp-asunto">
                <input
                  id="cfg-smtp-asunto"
                  value={config.notificaciones?.correo?.asunto ?? ''}
                  onChange={(e) => actualizarCorreoSmtp('asunto', e.target.value)}
                  placeholder="Confirmacion de cita — {{marca}}"
                />
              </CampoFormulario>
              <CampoFormulario etiqueta="Tipo de mensaje" id="cfg-smtp-modo">
                <select
                  id="cfg-smtp-modo"
                  value={config.notificaciones?.correo?.modoPlantilla ?? 'texto'}
                  onChange={(e) => actualizarCorreoSmtp('modoPlantilla', e.target.value)}
                >
                  <option value="texto">Solo texto</option>
                  <option value="html">HTML con botón</option>
                </select>
              </CampoFormulario>
              <CampoFormulario etiqueta="Cuerpo en texto" id="cfg-smtp-texto">
                <TextareaTexto
                  id="cfg-smtp-texto"
                  value={config.notificaciones?.correo?.cuerpoTexto ?? ''}
                  onChange={(e) => actualizarCorreoSmtp('cuerpoTexto', e.target.value)}
                  rows={5}
                />
              </CampoFormulario>
              {(config.notificaciones?.correo?.modoPlantilla ?? 'texto') === 'html' && (
                <CampoFormulario etiqueta="Cuerpo HTML" id="cfg-smtp-html">
                  <TextareaTexto
                    id="cfg-smtp-html"
                    value={config.notificaciones?.correo?.cuerpoHtml ?? ''}
                    onChange={(e) => actualizarCorreoSmtp('cuerpoHtml', e.target.value)}
                    rows={8}
                  />
                </CampoFormulario>
              )}
            </details>

            {config.notificaciones?.correo?.listo ? (
              <p className="configuracion-marca__google-ok">
                Correo listo para enviar avisos.
              </p>
            ) : (
              <p className="configuracion-marca__aviso-falta">
                Falta correo, contraseña de aplicación y host. Usa el botón de Gmail si aplica.
              </p>
            )}

            <div className="configuracion-marca__prueba">
              <CampoFormulario etiqueta="Tu correo para probar" id="cfg-smtp-prueba">
                <input
                  id="cfg-smtp-prueba"
                  type="email"
                  value={correoPrueba}
                  onChange={(e) => setCorreoPrueba(e.target.value)}
                  placeholder="El tuyo, para ver si llega"
                />
              </CampoFormulario>
              <BotonPrincipal
                type="button"
                variante="secundario"
                onClick={probarCorreo}
                deshabilitado={probandoCorreo || !config.notificaciones?.correo?.listo}
              >
                {probandoCorreo ? 'Enviando...' : 'Probar correo'}
              </BotonPrincipal>
            </div>
          </div>
        ) : (
          <p className="configuracion-marca__hint">
            Enciéndelo solo si quieres que la clienta reciba un correo al reservar.
          </p>
        )}
      </div>

    </AcordeonSeccion>
  );
}
