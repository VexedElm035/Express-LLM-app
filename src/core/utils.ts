/**
 * Funciones útiles para la aplicación
 */

/**
 * Pausa la ejecución por un número específico de milisegundos
 * @param milisegundos - Tiempo de espera en milisegundos
 */
export async function esperar(milisegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

/**
 * Trunca un texto a una longitud máxima
 * @param texto - Texto a truncar
 * @param longitudMaxima - Longitud máxima permitida
 */
export function truncarTexto(texto: string, longitudMaxima: number): string {
  if (texto.length <= longitudMaxima) {
    return texto;
  }
  return texto.substring(0, longitudMaxima) + '...';
}

/**
 * Formatea el tiempo de actividad en segundos a un formato legible
 * @param segundos - Tiempo en segundos
 * @returns Texto formateado como "2d 3h 45m 12s"
 */
export function formatearTiempoActividad(segundos: number): string {
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}m`);
  if (segs > 0 || partes.length === 0) partes.push(`${segs}s`);

  return partes.join(' ');
}

/**
 * Obtiene la marca de tiempo actual en formato ISO
 * @returns Fecha y hora actual en formato ISO 8601
 */
export function obtenerMarcaTiempo(): string {
  return new Date().toISOString();
}

/**
 * Estima el número de tokens en un texto
 * Aproximación: 1 token ≈ 4 caracteres
 * @param texto - Texto para estimar tokens
 * @returns Número estimado de tokens
 */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}
