exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  var body = JSON.parse(event.body);
  var messages = body.messages || [];
  var systemPrompt = body.system || "";
  var apiKey = process.env.GEMINI_API_KEY;

  var contents = [];
  for (var i = 0; i < messages.length; i++) {
    contents.push({
      role: messages[i].role === "assistant" ? "model" : "user",
      parts: [{ text: messages[i].content }]
    });
  }

  var geminiBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: { maxOutputTokens: 1400, temperature: 0.3 }
  };

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + apiKey;

  var response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiBody)
  });

  var data = await response.json();

  var text = "";
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    text = data.candidates[0].content.parts[0].text || "";
  }
  if (!text && data.error) {
    text = "API error: " + data.error.message;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ content: [{ type: "text", text: text }] })
  };
};        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();

    // Log full response for debugging
    console.log('Gemini raw response:', JSON.stringify(data));

    // Extract text safely from Gemini response
    let text = '';
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        text = candidate.content.parts[0].text || '';
      }
    }

    // If still empty check for errors
    if (!text && data.error) {
      console.log('Gemini error:', JSON.stringify(data.error));
      text = 'API error: ' + data.error.message;
    }

    if (!text && data.promptFeedback) {
      console.log('Prompt feedback:', JSON.stringify(data.promptFeedback));
      text = 'Request blocked: ' + JSON.stringify(data.promptFeedback);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        content: [{ type: 'text', text: text }]
      })
    };

  } catch (err) {
    console.log('Function error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};        body: JSON.stringify(geminiBody)
      }
    );

    const data = await response.json();

    // Log full response for debugging
    console.log('Gemini raw response:', JSON.stringify(data));

    // Extract text safely from Gemini response
    let text = '';
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        text = candidate.content.parts[0].text || '';
      }
    }

    // If still empty check for errors
    if (!text && data.error) {
      console.log('Gemini error:', JSON.stringify(data.error));
      text = 'API error: ' + data.error.message;
    }

    if (!text && data.promptFeedback) {
      console.log('Prompt feedback:', JSON.stringify(data.promptFeedback));
      text = 'Request blocked: ' + JSON.stringify(data.promptFeedback);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        content: [{ type: 'text', text: text }]
      })
    };

  } catch (err) {
    console.log('Function error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
