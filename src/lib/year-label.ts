export const yearLabel = (year: number | undefined): string => year ? (year + '&nbsp;' + (year >= 0 ? 'AD' : 'BC')) : '?';

