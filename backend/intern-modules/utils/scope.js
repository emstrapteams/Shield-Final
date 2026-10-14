// Shared helpers for the newer modules. Same behaviour as the per-controller
// scopedFilter used elsewhere: every query is constrained to req.companyId.
// (Who may act for which company is decided by the separately developed
// auth/company-isolation layer, not here.)
const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

const parsePagination = (query, defaultLimit = 20) => {
  const pageNum = Math.max(parseInt(query.page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const pageMeta = (pageNum, limitNum, total) => ({
  page: pageNum,
  limit: limitNum,
  total,
  totalPages: Math.ceil(total / limitNum) || 1,
});

const dateRange = (from, to) => {
  if (!from && !to) return null;
  const r = {};
  if (from) r.$gte = new Date(from);
  if (to) r.$lte = new Date(to);
  return r;
};

module.exports = { scopedFilter, parsePagination, pageMeta, dateRange };
