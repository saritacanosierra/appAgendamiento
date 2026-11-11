import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function registrarSalon(datos) {
  const respuesta = await peticionPublica('/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
