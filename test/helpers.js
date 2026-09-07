import { createServer } from 'node:http';

/** Test için tek kullanımlık HTTP sunucusu; handler(req, res, body) çağırır. */
export async function fakeServer(handler) {
  const server = createServer((req, res) => {
    // Bağlantıyı canlı tutmuyoruz: havuzdan yeniden kullanılan soketler
    // testler arasında isteklerin askıda kalmasına yol açıyor.
    res.setHeader('Connection', 'close');
    // Türkçe karakterler parça sınırına denk gelince bozulmasın diye
    // her parçayı ayrı ayrı metne çevirmiyoruz.
    req.setEncoding('utf8');
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => handler(req, res, body));
  });
  server.keepAliveTimeout = 0;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => {
      // fetch (undici) bağlantıları havuzda canlı tutar; kapatmadan önce
      // hepsini düşürmezsek server.close() süresiz bekler.
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}

/** Anthropic Messages API'nin SSE akışını taklit eder. */
export function writeAnthropicStream(res, { blocks, stopReason = 'end_turn', stopDetails = null }) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send('message_start', {
    type: 'message_start',
    message: {
      id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5',
      content: [], stop_reason: null, stop_sequence: null,
      usage: { input_tokens: 1234, output_tokens: 0 },
    },
  });

  blocks.forEach((block, index) => {
    if (block.type === 'text') {
      send('content_block_start', { type: 'content_block_start', index, content_block: { type: 'text', text: '' } });
      // Metni parça parça gönder: gerçek akışta da böyle gelir.
      for (const piece of chunk(block.text, 40)) {
        send('content_block_delta', { type: 'content_block_delta', index, delta: { type: 'text_delta', text: piece } });
      }
    } else {
      // Sunucu taraflı araç sonuçları tek parça gelir.
      send('content_block_start', { type: 'content_block_start', index, content_block: block });
    }
    send('content_block_stop', { type: 'content_block_stop', index });
  });

  send('message_delta', {
    type: 'message_delta',
    delta: { stop_reason: stopReason, stop_sequence: null, ...(stopDetails ? { stop_details: stopDetails } : {}) },
    usage: { output_tokens: 567 },
  });
  send('message_stop', { type: 'message_stop' });
  res.end();
}

const chunk = (text, size) =>
  Array.from({ length: Math.ceil(text.length / size) }, (_, i) => text.slice(i * size, (i + 1) * size));

/** Örnek web_search sonucu bloğu. */
export const webSearchBlock = (results) => ({
  type: 'web_search_tool_result',
  tool_use_id: 'srvtoolu_test',
  content: results.map((r) => ({ type: 'web_search_result', ...r })),
});
