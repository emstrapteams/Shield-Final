/**
 * TEMPORARY PLACEHOLDER — no authentication, no RBAC, no isolation logic.
 *
 * Authentication, RBAC, JWT, and company-level access control are handled
 * separately in the main Shield architecture and are intentionally NOT
 * implemented in this branch.
 *
 * The Employee/Department/Facility controllers in this codebase expect
 * `req.companyId` to be set. Until this branch is wired into the main
 * Shield auth/company-isolation layer, this middleware simply reads a
 * company id directly from the request (header, query, or body) so the
 * existing controllers continue to function for local development and
 * testing.
 *
 * Replace or remove this file once the main Shield architecture's
 * authentication and company-isolation middleware is integrated.
 */
const setCompanyContext = (req, res, next) => {
  req.companyId =
    req.headers["x-company-id"] ||
    req.query.companyId ||
    req.body.company ||
    null;
  next();
};

module.exports = setCompanyContext;
