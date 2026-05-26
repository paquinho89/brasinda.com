// Utilidade para normalizar texto (elimina maiúsculas e acentos)
export function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
