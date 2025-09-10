export const yearLabel = (year: number | undefined): string => year ? (Math.abs(year) + ' ' + (year >= 0 ? 'AD' : 'BC')) : '?';

