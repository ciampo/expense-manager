import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Since Server Components can't write cookies,
// you need middleware to refresh expired Auth tokens and store them.
//
// The middleware is responsible for:
// - Refreshing the Auth token (by calling supabase.auth.getUser).
// - Passing the refreshed Auth token to Server Components,
//   so they don't attempt to refresh the same token themselves.
//   This is accomplished with request.cookies.set.
// - Passing the refreshed Auth token to the browser, so it replaces
//   the old token. This is accomplished with response.cookies.set.
//
// WARNING:
// Be careful when protecting pages. The server gets the user session
// from the cookies, which can be spoofed by anyone.
//
// Always use supabase.auth.getUser() to protect pages and user data.
//
// Never trust supabase.auth.getSession() inside server code such as middleware.
// It isn't guaranteed to revalidate the Auth token.
//
// It's safe to trust getUser() because it sends a request to the Supabase
// Auth server every time to revalidate the Auth token.

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh the auth token
  await supabase.auth.getUser();

  return response;
}
