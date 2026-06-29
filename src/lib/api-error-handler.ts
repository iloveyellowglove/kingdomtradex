import { NextRequest, NextResponse } from 'next/server';

/**
 * Wraps an API route handler with top-level error handling.
 * Ensures no raw error messages or stack traces reach the user.
 *
 * Usage:
 *   export const POST = withErrorHandler(async (request: NextRequest) => { ... });
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      console.error(
        `[API Error] ${request.method} ${request.nextUrl.pathname}`,
        error instanceof Error ? error.message : String(error)
      );

      // Never leak raw errors to the client
      return NextResponse.json(
        { success: false, error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }
  };
}
