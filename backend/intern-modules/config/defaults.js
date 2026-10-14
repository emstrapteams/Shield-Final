// Business-rule defaults that must stay configurable rather than hardcoded
// throughout the application.
//
// Training: the business requirement is currently "two training sessions per
// year". It is stored per TrainingProgram (requiredSessionsPerYear) and this
// is only the default applied when a program doesn't specify its own value.
// Override globally with DEFAULT_TRAINING_SESSIONS_PER_YEAR in .env.
module.exports = {
  TRAINING_SESSIONS_PER_YEAR: parseInt(process.env.DEFAULT_TRAINING_SESSIONS_PER_YEAR, 10) || 2,
};
