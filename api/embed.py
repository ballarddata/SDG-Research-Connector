import json
from http.server import BaseHTTPRequestHandler

from sentence_transformers import SentenceTransformer

MODEL = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')


class handler(BaseHTTPRequestHandler):
  def _set_headers(self, status=200):
    self.send_response(status)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    self.end_headers()

  def do_OPTIONS(self):
    self._set_headers()

  def do_POST(self):
    try:
      content_length = int(self.headers.get('Content-Length', 0))
      body = self.rfile.read(content_length)
      payload = json.loads(body or '{}')

      text = (payload.get('text') or '').strip()
      if not text:
        self._set_headers(400)
        self.wfile.write(json.dumps({'error': 'Text is required'}).encode('utf-8'))
        return

      embedding = MODEL.encode(text, normalize_embeddings=True).tolist()
      self._set_headers(200)
      self.wfile.write(json.dumps({'embedding': embedding}).encode('utf-8'))
    except Exception as error:
      self._set_headers(500)
      self.wfile.write(json.dumps({'error': str(error)}).encode('utf-8'))
