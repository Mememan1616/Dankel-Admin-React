export const parseFecha = (dateStr: string): number => {
  if (!dateStr) return NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const isYearFirst = parts[0].length === 4;
    const year = parseInt(isYearFirst ? parts[0] : parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(isYearFirst ? parts[2] : parts[0], 10);
    return new Date(year, month, day).getTime();
  }
  return NaN;
};
