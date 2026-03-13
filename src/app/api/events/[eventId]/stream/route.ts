import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// GET - Server-Sent Events stream for real-time updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: "connected",
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        const heartbeatData = `data: ${JSON.stringify({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(heartbeatData));
      }, 30000);

      // Store the interval for cleanup
      (controller as any)._heartbeat = heartbeat;
    },
    cancel() {
      // Clear heartbeat on disconnect
      const controller = this as any;
      if (controller._heartbeat) {
        clearInterval(controller._heartbeat);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// POST - Broadcast message to all connected clients
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { type, data } = body;

    // In production, this would use a proper pub/sub system like Redis
    // For now, we'll just acknowledge the message
    // The actual streaming is handled via the GET endpoint

    return NextResponse.json({
      success: true,
      message: "Message broadcast acknowledged",
      type,
      eventId,
    });
  } catch (error) {
    console.error("Event broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
