import importlib.util
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location("verify_live", Path(__file__).resolve().parents[1] / "scripts/verify_live.py")
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/protected":
            self.send_response(302)
            self.send_header("Location", "/login?next=/")
            self.send_header("X-Football-Worker", verify.WORKER_MARKER)
            self.end_headers()
        else:
            self.send_response(200)
            if path == "/wrong-route":
                self.send_header("X-Football-Worker", verify.WORKER_MARKER)
            self.end_headers()
            self.wfile.write(b"saved source")


class PublicationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_stale_data_is_not_live_even_when_http_is_200(self):
        expected = {"path": "/data", "status": 200, "worker": False, "sha256": verify.digest(b"new data")}
        self.assertFalse(verify.check(self.base, expected)["ok"])
        expected["sha256"] = verify.digest(b"saved source")
        self.assertTrue(verify.check(self.base, expected)["ok"])

    def test_public_asset_cannot_silently_still_invoke_worker(self):
        result = verify.check(self.base, {"path": "/wrong-route", "status": 200, "worker": False})
        self.assertFalse(result["ok"])

    def test_login_redirect_is_checked_without_following_it(self):
        self.assertTrue(verify.check(self.base, {"path": "/protected", "status": 302, "worker": True, "login": True})["ok"])

    def test_only_known_pages_html_analytics_is_normalized(self):
        original = b"<body>verified article</body>"
        tag = b"<!-- Cloudflare Pages Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"0123456789abcdef0123456789abcdef\"}'></script><!-- Cloudflare Pages Analytics -->"
        served = original.replace(b"</body>", tag + b"</body>")
        self.assertEqual(verify.content_digest(served, True), verify.digest(original))
        self.assertNotEqual(verify.content_digest(served, False), verify.digest(original))
        self.assertNotEqual(verify.content_digest(served.replace(b"verified article", b"stale article"), True), verify.digest(original))
        self.assertNotEqual(verify.content_digest(served.replace(b"static.cloudflareinsights.com", b"evil.example"), True), verify.digest(original))

    def test_all_current_brands_and_shared_data_are_included(self):
        paths = {probe["path"] for probe in verify.probes(Path(__file__).resolve().parents[1])}
        for path in ["/data/today.json", "/data/news/latest.json", "/ykz-family/", "/bw-sport/", "/ko-thet-family/", "/future-code-journal/"]:
            self.assertIn(path, paths)


if __name__ == "__main__":
    unittest.main()
