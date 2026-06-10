interface ScoringResult {
  score: number;
  reasons: string[];
}

const POSITIVE_KEYWORDS: Record<string, number> = {
  php: 15,
  laravel: 20,
  symfony: 20,
  backend: 15,
  "back-end": 15,
  "back end": 15,
  remote: 10,
  "fully remote": 15,
  "100% remote": 15,
  europe: 10,
  netherlands: 15,
  holland: 15,
  dutch: 10,
  emea: 8,
  cet: 8,
  mysql: 8,
  postgresql: 8,
  postgres: 8,
  redis: 8,
  elasticsearch: 8,
  aws: 8,
  docker: 5,
  kubernetes: 5,
  "ci/cd": 5,
  api: 8,
  rest: 5,
  microservices: 8,
  senior: 10,
  lead: 8,
  principal: 10,
  staff: 10,
  architect: 8,
  python: 5,
  typescript: 5,
  "node.js": 5,
  nodejs: 5,
  vue: 5,
  react: 5,
  ai: 5,
  llm: 5,
  "machine learning": 5,
};

const NEGATIVE_KEYWORDS: Record<string, number> = {
  "wordpress only": -30,
  "wordpress-only": -30,
  "us only": -50,
  "us-only": -50,
  "usa only": -50,
  "united states only": -50,
  "must be located in the us": -50,
  "german required": -30,
  "german native": -30,
  "fluent german": -30,
  "french required": -20,
  "french native": -20,
  junior: -15,
  intern: -20,
  internship: -20,
  entry: -10,
  "entry-level": -15,
  ".net": -5,
  "c#": -5,
  java: -5,
  golang: -3,
  ruby: -3,
  scala: -5,
};

export function scoreJob(
  title: string,
  description: string,
  location?: string
): ScoringResult {
  const text = `${title} ${description} ${location || ""}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const [keyword, points] of Object.entries(POSITIVE_KEYWORDS)) {
    if (text.includes(keyword)) {
      score += points;
      reasons.push(`+${points} ${keyword}`);
    }
  }

  for (const [keyword, points] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (text.includes(keyword)) {
      score += points;
      reasons.push(`${points} ${keyword}`);
    }
  }

  return { score, reasons };
}

export function shouldIncludeJob(
  title: string,
  description: string,
  category?: string
): boolean {
  const text = `${title} ${description} ${category || ""}`.toLowerCase();

  const devKeywords = [
    "developer",
    "engineer",
    "programming",
    "software",
    "backend",
    "back-end",
    "fullstack",
    "full-stack",
    "full stack",
    "php",
    "laravel",
    "symfony",
  ];

  const hasDevKeyword = devKeywords.some((kw) => text.includes(kw));
  if (!hasDevKeyword) return false;

  const excludeKeywords = [
    "wordpress only",
    "wordpress-only",
    "drupal only",
    "frontend only",
    "ios developer",
    "android developer",
    "mobile developer",
    "game developer",
    "unity developer",
  ];

  const hasExcludeKeyword = excludeKeywords.some((kw) => text.includes(kw));
  return !hasExcludeKeyword;
}
