/**
 * QStash Signature Verification Utility
 *
 * Verifies that incoming webhook requests are from QStash by validating
 * the signature in the request headers.
 * In development mode, signature verification is skipped.
 */

import { Receiver } from "@upstash/qstash";

// Initialize QStash Receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Verify that a request came from QStash
 *
 * @param request - The incoming Request object
 * @param body - The raw request body as a string
 * @returns True if the signature is valid or if in development mode
 */
export async function verifyQStashSignature(
  request: Request,
  body: string
): Promise<boolean> {
  // Skip verification in development mode
  const isDevMode = request.headers.get("x-dev-mode") === "true";
  if (isDevMode || process.env.NODE_ENV === "development") {
    console.log("[QStash Verify] DEV MODE: Skipping signature verification");
    return true;
  }

  // Get the signature from headers
  const signature = request.headers.get("Upstash-Signature");

  if (!signature) {
    console.error("[QStash Verify] No signature found in request headers");
    return false;
  }

  try {
    // Verify the signature
    await receiver.verify({
      signature,
      body,
    });

    console.log("[QStash Verify] Signature verified successfully");
    return true;
  } catch (error) {
    console.error("[QStash Verify] Signature verification failed:", error);
    return false;
  }
}

/**
 * Verify QStash signature and return error response if invalid
 *
 * Helper function that returns a Response object if verification fails,
 * or null if verification succeeds. This makes it easy to use in API routes.
 *
 * @param request - The incoming Request object
 * @param body - The raw request body as a string
 * @returns A Response object if verification fails, null if it succeeds
 *
 * @example
 * ```ts
 * const body = await request.text();
 * const errorResponse = await verifyOrReturnError(request, body);
 * if (errorResponse) return errorResponse;
 * // Continue with request processing...
 * ```
 */
export async function verifyOrReturnError(
  request: Request,
  body: string
): Promise<Response | null> {
  const isValid = await verifyQStashSignature(request, body);

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null;
}
