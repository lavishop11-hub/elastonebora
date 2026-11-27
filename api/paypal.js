
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (process.env.PAYPAL_MODE !== 'sandbox' ||
      process.env.VERCEL_ENV !== 'preview') {
    return res.status(503).json({
      error: 'sandbox_required'
    });
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({error: 'method'});
  }

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const base = 'https://api-m.sandbox.paypal.com';

  if (!id || !secret) {
    return res.status(503).json({
      error: 'configuration'
    });
  }

  try {
    const response = await fetch(
      base + '/v1/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' +
            Buffer.from(id + ':' + secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: 'paypal_auth'
      });
    }

    const data = await response.json();

    if (req.method === 'GET') {
      return res.json({
        connected: true,
        mode: 'sandbox'
      });
    }

    if (req.body?.action !== 'create_test_order') {
      return res.status(400).json({
        error: 'action'
      });
    }

    const order = await fetch(
      base + '/v2/checkout/orders', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + data.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: 'Elastonebora - Test appointment',
            amount: {
              currency_code: 'EUR',
              value: '40.00'
            }
          }]
        })
      }
    );

    if (!order.ok) {
      return res.status(502).json({
        error: 'order_creation'
      });
    }

    const result = await order.json();

    return res.json({
      order_id: result.id,
      status: result.status,
      approval_url: result.links?.find(
        link => link.rel === 'approve' ||
                link.rel === 'payer-action'
      )?.href
    });

  } catch {
    return res.status(502).json({
      error: 'connection'
    });
  }
};
