import { json } from '@sveltejs/kit';
import { addSSEConnection } from '$lib/sse.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
  // Check if this is an SSE request
  if (request.headers.get('accept') === 'text/event-stream') {
    return new Response(
      new ReadableStream({
        start(controller) {
          // Send initial connection message
          controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to bid notifications' })}\n\n`);
          
          // Add this controller to the SSE connections
          const cleanup = addSSEConnection(controller);
          
          // Handle connection close
          request.signal?.addEventListener('abort', () => {
            cleanup();
          });
        },
        cancel() {
          // Connection closed
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
  
  return json({ error: 'Invalid request' }, { status: 400 });
}