import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import requests

import main as crawler


def page(pub_id="paper1", more=False, total="1,001"):
    stats = "".join(f'<td class="gsc_rsb_std">{v}</td>' for v in [total, "100", "5", "4", "2", "1"])
    return f"""
    <h3 id="gsc_prf_in">Example Author</h3>
    <table id="gsc_rsb_st"><tr>{stats}</tr></table>
    <table><tbody id="gsc_a_b"><tr class="gsc_a_tr">
      <td><a class="gsc_a_at" href="/citations?citation_for_view=example:{pub_id}">Example Paper</a></td>
      <td><a class="gsc_a_ac" href="/scholar?cites=123">12</a></td>
      <td class="gsc_a_y">2026</td>
    </tr></tbody></table>
    <button id="gsc_bpf_more" {'' if more else 'disabled'}>Show more</button>
    """


def response(html="", status=200):
    result = requests.Response()
    result.status_code = status
    result.url = crawler.SCHOLAR_URL
    result._content = html.encode("utf-8")
    result.encoding = "utf-8"
    return result


class CrawlerTests(unittest.TestCase):
    def test_complete_profile_and_publication_schema(self):
        session = Mock()
        session.get.return_value = response(page())
        author = crawler.fetch_author(session, "example")
        self.assertEqual(author["name"], "Example Author")
        self.assertEqual(author["citedby"], 1001)
        self.assertEqual(author["publications"]["example:paper1"]["num_citations"], 12)
        self.assertEqual(author["publications"]["example:paper1"]["bib"]["pub_year"], "2026")
        self.assertIn("updated", author)
        self.assertEqual(session.get.call_count, 1)

    def test_pagination(self):
        session = Mock()
        session.get.side_effect = [response(page(more=True)), response(page(pub_id="paper2"))]
        author = crawler.fetch_author(session, "example")
        self.assertEqual(len(author["publications"]), 2)
        self.assertEqual(session.get.call_args.kwargs["params"]["cstart"], 100)

    def test_explicit_restrictions_do_not_retry(self):
        for result in [response(status=429), response(status=403), response(status=503), response("Our systems have detected unusual traffic"), response('<form id="captcha-form"></form>')]:
            with self.subTest(status=result.status_code, text=result.text):
                session = Mock()
                session.get.return_value = result
                with self.assertRaises(crawler.ScholarUnavailable):
                    crawler.fetch_author(session, "example")
                self.assertEqual(session.get.call_count, 1)

    def test_network_timeout_is_temporary(self):
        session = Mock()
        session.get.side_effect = requests.Timeout()
        with self.assertRaises(crawler.ScholarUnavailable):
            crawler.fetch_author(session, "example")

    def test_unexpected_html_and_bad_id_still_fail(self):
        for html in ["<html>Not a profile</html>", page().replace("example:paper1", "wrong:paper1"), page(total="not-a-number")]:
            session = Mock()
            session.get.return_value = response(html)
            with self.assertRaises(ValueError):
                crawler.fetch_author(session, "example")
        session.get.return_value = response(status=404)
        with self.assertRaises(requests.HTTPError):
            crawler.fetch_author(session, "example")

    def test_repeated_page_still_fails(self):
        session = Mock()
        session.get.return_value = response(page(more=True))
        with self.assertRaisesRegex(ValueError, "pagination did not advance"):
            crawler.fetch_author(session, "example")

    def test_no_partial_publish_when_second_page_blocked(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.chdir(directory):
            Path("results").mkdir()
            previous = {"updated": "2026-08-25", "citedby": 81}
            previous_text = json.dumps(previous)
            Path("results/gs_data.json").write_text(previous_text)
            Path("results/gs_data_shieldsio.json").write_text('{"message":"81"}')
            with patch.dict(os.environ, {"GOOGLE_SCHOLAR_ID": "example", "GITHUB_OUTPUT": "output.txt", "GITHUB_STEP_SUMMARY": "summary.md"}), patch.object(crawler.requests, "Session") as factory, contextlib.redirect_stdout(io.StringIO()):
                factory.return_value.__enter__.return_value.get.side_effect = [response(page(more=True)), response(status=429)]
                crawler.main()
            self.assertEqual(Path("results/gs_data.json").read_text(), previous_text)
            self.assertEqual(Path("results/gs_data_shieldsio.json").read_text(), '{"message":"81"}')
            self.assertEqual(Path("output.txt").read_text(), "updated=false\n")
            self.assertIn("NOT updated", Path("summary.md").read_text())

    def test_success_writes_compatible_badge_and_data(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.chdir(directory):
            with patch.dict(os.environ, {"GOOGLE_SCHOLAR_ID": "example", "GITHUB_OUTPUT": "output.txt", "GITHUB_STEP_SUMMARY": "summary.md"}), patch.object(crawler.requests, "Session") as factory, contextlib.redirect_stdout(io.StringIO()):
                factory.return_value.__enter__.return_value.get.return_value = response(page())
                crawler.main()
            author = json.loads(Path("results/gs_data.json").read_text())
            badge = json.loads(Path("results/gs_data_shieldsio.json").read_text())
            self.assertEqual(badge["message"], str(author["citedby"]))
            self.assertEqual(badge["schemaVersion"], 1)
            self.assertEqual(Path("output.txt").read_text(), "updated=true\n")

    def test_missing_secret_still_fails(self):
        with patch.dict(os.environ, {"GOOGLE_SCHOLAR_ID": ""}):
            with self.assertRaisesRegex(ValueError, "GOOGLE_SCHOLAR_ID"):
                crawler.main()


if __name__ == "__main__":
    unittest.main()
