"""Fetch public Scholar statistics; never publish an incomplete or blocked response."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

SCHOLAR_URL = "https://scholar.google.com/citations"


class ScholarUnavailable(Exception):
    """A temporary network failure or an explicit Scholar access restriction."""


def fetch_page(session, scholar_id, start):
    try:
        response = session.get(
            SCHOLAR_URL,
            params={"user": scholar_id, "hl": "en", "cstart": start, "pagesize": 100},
            timeout=(10, 20),
        )
    except (requests.Timeout, requests.ConnectionError) as error:
        raise ScholarUnavailable("Google Scholar could not be reached.") from error
    if response.status_code in (403, 429) or response.status_code >= 500:
        raise ScholarUnavailable(f"Google Scholar returned HTTP {response.status_code}.")
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    if (
        "/sorry/" in response.url
        or "unusual traffic" in soup.get_text(" ", strip=True).lower()
        or soup.select_one("#captcha-form, .g-recaptcha")
    ):
        raise ScholarUnavailable("Google Scholar returned a traffic restriction page.")
    return soup


def number(text):
    # Empty citation cells represent zero citations.
    return int(text.replace(",", "").replace("\u202f", "").strip() or "0")


def parse_profile(soup, scholar_id):
    name = soup.select_one("#gsc_prf_in")
    stats = soup.select("#gsc_rsb_st .gsc_rsb_std")
    if name is None or not name.get_text(strip=True) or len(stats) != 6:
        raise ValueError("Scholar author name/statistics missing; check the profile ID or page markup.")
    author = {"scholar_id": scholar_id, "name": name.get_text(strip=True)}
    for key, cell in zip(
        ("citedby", "citedby5y", "hindex", "hindex5y", "i10index", "i10index5y"), stats
    ):
        if not cell.get_text(strip=True):
            raise ValueError("Scholar statistics are empty; refusing a partial update.")
        author[key] = number(cell.get_text())
    author["publications"] = {}
    return author


def parse_publications(soup, scholar_id):
    if soup.select_one("#gsc_a_b") is None:
        raise ValueError("Scholar publication table missing; refusing a partial update.")
    publications = {}
    for row in soup.select(".gsc_a_tr"):
        title = row.select_one(".gsc_a_at")
        citations = row.select_one(".gsc_a_ac")
        if title is None or citations is None:
            raise ValueError("Incomplete Scholar publication row.")
        query = parse_qs(urlparse(title.get("href", "")).query)
        pub_id = query.get("citation_for_view", [""])[0]
        if not pub_id.startswith(scholar_id + ":"):
            raise ValueError("Missing or unexpected Scholar publication ID.")
        year = row.select_one(".gsc_a_y")
        publication = {
            "author_pub_id": pub_id,
            "bib": {"title": title.get_text(strip=True), "pub_year": year.get_text(strip=True) if year else ""},
            "num_citations": number(citations.get_text()),
        }
        if citations.get("href"):
            publication["citedby_url"] = urljoin(SCHOLAR_URL, citations["href"])
        publications[pub_id] = publication
    return publications


def fetch_author(session, scholar_id):
    soup = fetch_page(session, scholar_id, 0)
    author = parse_profile(soup, scholar_id)
    for start in range(0, 1000, 100):
        if start:
            soup = fetch_page(session, scholar_id, start)
        publications = parse_publications(soup, scholar_id)
        if start and (not publications or author["publications"].keys() & publications.keys()):
            raise ValueError("Scholar pagination did not advance; refusing a partial update.")
        author["publications"].update(publications)
        more = soup.select_one("#gsc_bpf_more")
        if (more is not None and more.has_attr("disabled")) or (more is None and len(publications) < 100):
            break
    else:
        raise ValueError("Scholar pagination exceeded the limit; refusing a partial update.")
    author["updated"] = datetime.now(timezone.utc).isoformat()
    return author


def report(updated, message):
    print(message, flush=True)
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            output.write(f"updated={str(updated).lower()}\n")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
            summary.write(message + "\n")


def main():
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID", "").strip()
    if not scholar_id:
        raise ValueError("GOOGLE_SCHOLAR_ID is required.")
    try:
        with requests.Session() as session:
            author = fetch_author(session, scholar_id)
    except ScholarUnavailable as error:
        report(False, f"::warning::Citation data NOT updated: {error} Previous data and its timestamp are unchanged. Retry on the next scheduled run.")
        return
    # Both files are produced only after every page was fetched and validated.
    results = Path("results")
    results.mkdir(exist_ok=True)
    (results / "gs_data.json").write_text(json.dumps(author, ensure_ascii=False, indent=2), encoding="utf-8")
    badge = {"schemaVersion": 1, "label": "citations", "message": str(author["citedby"])}
    (results / "gs_data_shieldsio.json").write_text(json.dumps(badge), encoding="utf-8")
    report(True, f"Fetched {author['citedby']} citations and {len(author['publications'])} publications at {author['updated']}. Ready to publish.")


if __name__ == "__main__":
    main()
