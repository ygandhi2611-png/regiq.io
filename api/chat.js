module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2500,
        system: req.body.system,
        messages: req.body.messages
      })
    });

    const data = await response.json();
    const rawText = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    const stopReason = data.stop_reason || '';

    // If response was truncated, return as conversational message
    if (stopReason === 'max_tokens') {
      return res.status(200).json({
        content: [{ type: 'text', text: 'The analysis was too long to complete in one response. Please try a more specific product description.' }]
      });
    }

    // Try to extract and validate JSON server-side
    let cleanText = rawText.replace(/`{1,3}json\s*/gi, '').replace(/`{1,3}\s*/g, '').trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const jsonStr = cleanText.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        // If it parsed successfully and is a valid result, return clean JSON string
        if (parsed.mode === 'ra' || parsed.mode === 'qa') {
          return res.status(200).json({
            content: [{ type: 'text', text: JSON.stringify(parsed) }]
          });
        }
      } catch(e) {
        // JSON parse failed - return original text as conversational response
      }
    }

    // Return original text for conversational messages
    return res.status(200).json({
      content: [{ type: 'text', text: rawText }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
