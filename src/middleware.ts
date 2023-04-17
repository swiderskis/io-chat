import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Set the paths that don't require the user to be signed in
const publicPaths = ["/sign-in*"];

const isPublic = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

export default withClerkMiddleware((request: NextRequest) => {
  const { userId } = getAuth(request);

  if (isPublic(request.nextUrl.pathname)) {
    // If the user is signed in redirect them to the home page
    if (userId) {
      const homeUrl = new URL("/", request.url);

      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }

  // If the user is not signed in redirect them to the sign in page
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: "/((?!_next/image|_next/static|favicon.ico).*)",
};
