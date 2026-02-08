export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).json({ error: 'Missing Upstash credentials' });
  }

  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Missing wallet parameter' });
  }

  const key = `backup:${wallet}`;

  if (req.method === 'POST') {
    const { data } = req.body;
    
    // Upstash REST format: POST /set/key/value
    fetch(`${UPSTASH_URL}/set/${key}/${encodeURIComponent(data)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    })
    .then(() => res.status(200).json({ success: true }))
    .catch(err => res.status(500).json({ error: err.message }));
    
    return;
  }
  
  // GET format: GET /get/key
  fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  })
  .then(r => r.json())
  .then(({ result }) => res.status(200).json({ data: result }))
  .catch(err => res.status(500).json({ error: err.message }));
}