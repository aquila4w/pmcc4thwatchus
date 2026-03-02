import { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// Store for active connections per event
const eventConnections = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// SSE endpoint for real-time event updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Verify event exists
  const payload = await getPayload({ config });
  const events = await payload.find({
    collection: "managed-events",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (events.docs.length === 0) {
    return new Response("Event not found", { status: 404 });
  }

  const eventId = String(events.docs[0].id);

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the event's connections
      if (!eventConnections.has(eventId)) {
        eventConnections.set(eventId, new Set());
      }
      eventConnections.get(eventId)!.add(controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", eventId, timestamp: new Date().toISOString() })}\n\n`));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventConnections.get(eventId)?.delete(controller);
        if (eventConnections.get(eventId)?.size === 0) {
          eventConnections.delete(eventId);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// POST - Broadcast an update to all connected clients for this event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  // Verify event exists
  const payload = await getPayload({ config });
  const events = await payload.find({
    collection: "managed-events",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (events.docs.length === 0) {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventId = String(events.docs[0].id);
  const connections = eventConnections.get(eventId);

  if (!connections || connections.size === 0) {
    return new Response(JSON.stringify({
      message: "No active connections",
      broadcast: false,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Broadcast the update to all connected clients
  const encoder = new TextEncoder();
  const message = JSON.stringify({
    type: body.type || "update",
    data: body.data,
    timestamp: new Date().toISOString(),
  });

  let sent = 0;
  connections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      sent++;
    } catch {
      // Connection closed, remove it
      connections.delete(controller);
    }
  });

  return new Response(JSON.stringify({
    success: true,
    broadcast: true,
    connectionCount: sent,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

// Note: To broadcast from other routes, use the POST endpoint instead
// POST /api/events/[slug]/stream with { type: "...", data: { ... } }
