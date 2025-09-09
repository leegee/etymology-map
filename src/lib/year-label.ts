export const yearLabel = (year: number | undefined): string => year ? (year + ' ' + (year >= 0 ? 'AD' : 'BC')) : '?';

