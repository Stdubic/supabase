#!/usr/bin/env python3
"""
Multi-source job discovery — mirrors n8n workflow + server filter logic.

Usage:
    python3 scripts/discover-jobs.py                    # print JSON to stdout
    python3 scripts/discover-jobs.py --ingest URL SECRET # POST to Vercel ingest
    python3 scripts/discover-jobs.py --test-sources      # test each API
"""

import argparse
import json
import re
import sys
import urllib.request
from html import unescape

DEV_KEYWORDS = [
    "developer", "engineer", "programming", "software",
    "backend", "back-end", "fullstack", "full-stack", "full stack",
    "php", "laravel", "symfony",
]
EXCLUDE_KEYWORDS = [
    "wordpress only", "wordpress-only", "drupal only", "frontend only",
    "ios developer", "android developer", "mobile developer",
    "game developer", "unity developer",
]
USER_AGENT = "job-agent/1.0 (job discovery script)"


def fetch(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def matches_filter(title: str, description: str, extra: str = "") -> bool:
    text = f"{title} {description} {extra}".lower()
    if not any(kw in text for kw in DEV_KEYWORDS):
        return False
    return not any(kw in text for kw in EXCLUDE_KEYWORDS)


def strip_html(html: str) -> str:
    return re.sub(r"<[^>]*>", " ", unescape(html or "")).strip()


def job(title, company, url, description, source, location="Remote", salary=None):
    return {
        "title": title,
        "company": company,
        "url": url,
        "description": (description or "")[:2000],
        "source": source,
        "location": location,
        "salary": salary,
    }


def source_remotive(limit=50):
    data = json.loads(fetch("https://remotive.com/api/remote-jobs?category=software-dev"))
    out = []
    for j in data.get("jobs", []):
        if not matches_filter(j["title"], j.get("description", ""), j.get("category", "")):
            continue
        out.append(job(
            j["title"], j["company_name"], j["url"], j.get("description"),
            "remotive", j.get("candidate_required_location") or "Remote", j.get("salary"),
        ))
        if len(out) >= limit:
            break
    return out


def source_wwr(limit=30):
    text = fetch("https://weworkremotely.com/categories/remote-programming-jobs.rss").decode()
    out = []
    for item in re.findall(r"<item>([\s\S]*?)</item>", text):
        title = (re.search(r"<title><!\[CDATA\[(.+?)\]\]></title>", item) or
                 re.search(r"<title>(.+?)</title>", item))
        link = re.search(r"<link>(.+?)</link>", item)
        desc = (re.search(r"<description><!\[CDATA\[([\s\S]*?)\]\]></description>", item) or
                re.search(r"<description>([\s\S]*?)</description>", item))
        if not title or not link:
            continue
        t = title.group(1)
        d = strip_html(desc.group(1) if desc else "")
        if not matches_filter(t, d):
            continue
        parts = t.split(":")
        out.append(job(
            parts[0].strip(), parts[1].strip() if len(parts) > 1 else "Unknown",
            link.group(1), d, "weworkremotely",
        ))
        if len(out) >= limit:
            break
    return out


def source_arbeitnow(limit=30):
    data = json.loads(fetch("https://www.arbeitnow.com/api/job-board-api"))
    out = []
    for j in data.get("data", []):
        text = f"{j.get('title','')} {j.get('description','')} {' '.join(j.get('tags') or [])}"
        if not matches_filter(j["title"], j.get("description", "")):
            continue
        if not (j.get("remote") or "remote" in text.lower()):
            continue
        out.append(job(
            j["title"], j["company_name"], j["url"], j.get("description"),
            "arbeitnow", j.get("location") or "Remote", j.get("salary"),
        ))
        if len(out) >= limit:
            break
    return out


def source_remoteok(limit=30):
    data = json.loads(fetch("https://remoteok.com/api"))
    out = []
    for j in data:
        if not isinstance(j, dict) or not j.get("position"):
            continue
        tags = " ".join(j.get("tags") or [])
        if not matches_filter(j["position"], j.get("description", ""), tags):
            continue
        salary = None
        if j.get("salary_min") or j.get("salary_max"):
            salary = f"{j.get('salary_min','?')}-{j.get('salary_max','?')}"
        out.append(job(
            j["position"], j.get("company", "Unknown"),
            j.get("url") or j.get("apply_url", ""),
            strip_html(j.get("description", "")), "remoteok",
            j.get("location") or "Remote", salary,
        ))
        if len(out) >= limit:
            break
    return out


def source_jobicy(limit=30):
    data = json.loads(fetch("https://jobicy.com/api/v2/remote-jobs?count=50&tag=dev"))
    out = []
    for j in data.get("jobs", []):
        industries = " ".join(j.get("jobIndustry") or [])
        if not matches_filter(j.get("jobTitle", ""), j.get("jobExcerpt", ""), industries):
            continue
        out.append(job(
            j["jobTitle"], j.get("companyName", "Unknown"),
            j.get("url", ""), strip_html(j.get("jobDescription", j.get("jobExcerpt", ""))),
            "jobicy", j.get("jobGeo") or "Remote",
        ))
        if len(out) >= limit:
            break
    return out


def source_himalayas(limit=30):
    data = json.loads(fetch("https://himalayas.app/jobs/api?limit=50"))
    out = []
    for j in data.get("jobs", []):
        cats = " ".join(j.get("categories", []) + j.get("parentCategories", []))
        if not matches_filter(j.get("title", ""), j.get("excerpt", ""), cats):
            continue
        locs = j.get("locationRestrictions") or []
        if locs and all("united states" in str(l).lower() for l in locs) and len(locs) == 1:
            continue
        salary = None
        if j.get("minSalary"):
            salary = f"{j.get('minSalary')}-{j.get('maxSalary', '')} {j.get('currency', '')}"
        out.append(job(
            j["title"], j.get("companyName", "Unknown"),
            j.get("applicationLink") or j.get("guid", ""),
            j.get("excerpt", ""), "himalayas",
            ", ".join(locs) if locs else "Remote", salary,
        ))
        if len(out) >= limit:
            break
    return out


SOURCES = {
    "remotive": source_remotive,
    "weworkremotely": source_wwr,
    "arbeitnow": source_arbeitnow,
    "remoteok": source_remoteok,
    "jobicy": source_jobicy,
    "himalayas": source_himalayas,
}


def discover_all():
    all_jobs = []
    seen_urls = set()
    stats = {}
    for name, fn in SOURCES.items():
        try:
            jobs = fn()
            stats[name] = len(jobs)
            for j in jobs:
                if j["url"] and j["url"] not in seen_urls:
                    seen_urls.add(j["url"])
                    all_jobs.append(j)
        except Exception as e:
            stats[name] = f"error: {e}"
            print(f"Warning: {name} failed: {e}", file=sys.stderr)
    return all_jobs, stats


def test_sources():
    print("Testing job sources...\n")
    for name, fn in SOURCES.items():
        try:
            jobs = fn(limit=3)
            print(f"  ✓ {name}: {len(jobs)} jobs")
            if jobs:
                print(f"    sample: {jobs[0]['title']} @ {jobs[0]['company']}")
        except Exception as e:
            print(f"  ✗ {name}: {e}")
    print()


def ingest(url: str, secret: str, jobs: list):
    payload = json.dumps(jobs).encode()
    req = urllib.request.Request(
        f"{url.rstrip('/')}/api/jobs/ingest",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser(description="Multi-source job discovery")
    parser.add_argument("--test-sources", action="store_true")
    parser.add_argument("--ingest", nargs=2, metavar=("URL", "SECRET"))
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()

    if args.test_sources:
        test_sources()
        return

    jobs, stats = discover_all()
    jobs = jobs[:args.limit]

    if args.ingest:
        url, secret = args.ingest
        print(f"Discovered {len(jobs)} jobs from: {stats}", file=sys.stderr)
        result = ingest(url, secret, jobs)
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps({"stats": stats, "count": len(jobs), "jobs": jobs}, indent=2))


if __name__ == "__main__":
    main()
