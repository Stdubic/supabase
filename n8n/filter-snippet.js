// Shared filter logic — keep in sync with lib/scoring.ts shouldIncludeJob()
const DEV_KEYWORDS = [
  'developer', 'engineer', 'programming', 'software',
  'backend', 'back-end', 'fullstack', 'full-stack', 'full stack',
  'php', 'laravel', 'symfony',
];
const EXCLUDE_KEYWORDS = [
  'wordpress only', 'wordpress-only', 'drupal only', 'frontend only',
  'ios developer', 'android developer', 'mobile developer',
  'game developer', 'unity developer',
];

function matchesFilter(title, description, extra = '') {
  const text = `${title} ${description || ''} ${extra}`.toLowerCase();
  const hasDev = DEV_KEYWORDS.some(kw => text.includes(kw));
  const excluded = EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
  return hasDev && !excluded;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
