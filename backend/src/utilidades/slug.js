export function generarSlug(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

export async function slugUnico(base, existeFn) {
  let slug = generarSlug(base) || 'publicacion';
  let candidato = slug;
  let contador = 2;

  while (await existeFn(candidato)) {
    candidato = `${slug}-${contador}`;
    contador += 1;
  }

  return candidato;
}
