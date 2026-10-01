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

export const formatearFechaISO = (fecha?: Date): string => {
  const f = fecha || new Date();
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  return `${f.getFullYear()}-${mes}-${dia}`;
};

export const formatearFechaDMY = (fecha?: Date | string): string => {
  if (typeof fecha === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return '';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  const f = fecha || new Date();
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${f.getFullYear()}`;
};
