/**
 * Función de utilidad para crear un retraso en la ejecución
 * @param ms Tiempo de retraso en milisegundos
 * @returns Promise que se resuelve después del tiempo especificado
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 