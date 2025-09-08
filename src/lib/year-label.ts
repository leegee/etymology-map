export const yearLabel = (year: number | undefined): string => year ? ('c ' + (year) + ' C ' + (year >= 0 ? 'AD' : 'BC')) : '?';

