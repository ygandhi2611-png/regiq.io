exports.handler = function(event, context, callback) {
  if (event.httpMethod !== "POST") {
    callback(null, { statusCode: 405, body: "Method Not Allowed" });
    return;
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

  var geminiBody = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: { maxOutputTokens: 1400, temperature: 0.3 }
  });

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + apiKey;
  var https = require("https");
  var urlObj = new URL(url);

  var options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(geminiBody)
    }
  };

  var req = https.request(options, function(res) {
    var chunks = [];
    res.on("data", function(chunk) { chunks.push(chunk); });
    res.on("end", function() {
      try {
        var data = JSON.parse(Buffer.concat(chunks).toString());
        var text = "";
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          text = data.candidates[0].content.parts[0].text || "";
        }
        if (!text && data.error) {
          var errMsg = data.error.message || "";
          if (errMsg.indexOf("quota") !== -1 || errMsg.indexOf("Quota") !== -1 || errMsg.indexOf("rate") !== -1) {
            text = "__RATE_LIMIT__";
          } else {
            text = "API error: " + errMsg;
          }
        }
        callback(null, {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ content: [{ type: "text", text: text }] })
        });
      } catch (e) {
        callback(null, { statusCode: 500, body: JSON.stringify({ error: e.message }) });
      }
    });
  });

  req.on("error", function(e) {
    callback(null, { statusCode: 500, body: JSON.stringify({ error: e.message }) });
  });

  req.write(geminiBody);
  req.end();
};
