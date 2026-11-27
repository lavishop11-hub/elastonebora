module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method' });
  }

  if (process.env.PAYPAL_MODE !== 'sandbox') {
    return res.status(503).json({ error: 'sandbox_required' });
  }

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!id || !secret) {
    return res.status(503).json({ error: 'configuration' });
  }

  try {
    const response = await fetch(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' +
            Buffer.from(id + ':' + secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      }
    );

    return res.status(response.ok ? 200 : 502).json({
      connected: response.ok,
      mode: 'sandbox'
    });
  } catch {
    return res.status(502).json({ error: 'connection' });
  }
};
