export const getSkipForPagination = (page: number, limit: number) =>
  (page - 1) * limit;
