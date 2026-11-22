// Ayudas para los tests: días fijos para que no dependan de la fecha de hoy.
import { upcomingDays } from './dates';
export * from './plan';
export const upcomingDaysFixed = upcomingDays(new Date(2026, 10, 22), 5);
