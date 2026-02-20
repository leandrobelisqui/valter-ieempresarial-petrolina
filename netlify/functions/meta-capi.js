// netlify/functions/meta-capi.js
// Meta Conversions API - Server-side event tracking

const META_API_VERSION = 'v18.0';

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      },
    };
  }

  try {
    const { eventName, eventData, userData } = JSON.parse(event.body);
    
    // Get environment variables
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    if (!pixelId || !accessToken) {
      console.error('Missing META_PIXEL_ID or META_ACCESS_TOKEN');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Get client IP and user agent
    const clientIp = event.headers['x-nf-client-connection-ip'] || 
                     event.headers['x-forwarded-for'] || 
                     '127.0.0.1';
    const userAgent = event.headers['user-agent'] || '';

    // Build the event payload
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: eventData?.url || 'https://ie-empresarial-petrolina.netlify.app',
          user_data: {
            client_ip_address: clientIp.split(',')[0].trim(),
            client_user_agent: userAgent,
            ...(userData?.fbc && { fbc: userData.fbc }),
            ...(userData?.fbp && { fbp: userData.fbp }),
          },
          custom_data: {
            ...eventData?.customData,
          },
        },
      ],
      test_event_code: process.env.META_TEST_EVENT_CODE || null,
    };

    // Send to Meta Conversions API
    const apiUrl = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta CAPI Error:', result);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Failed to send event to Meta', details: result }),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, events_received: result.events_received }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    };

  } catch (error) {
    console.error('Error processing CAPI event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};
