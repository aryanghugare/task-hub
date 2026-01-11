import { clerkMiddleware , createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const publicRoutes = [
  "/",
  "/api/webhook/register",
  "/sign-in",
  "/sign-up",
]

const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
// You can access the following properties from the `auth` object:
 const {
    userId,
    sessionId,
    sessionClaims,
    orgId,
    orgRole,
    orgPermissions,
  } = await auth()



 if ( !userId && !publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

if( userId ) {
 try {

        const user = await clerkClient.users.getUser(userId); // Fetch user data from Clerk
        const role = user.publicMetadata.role as string | undefined;
if(role === undefined) {
console.error("User role is undefined in public metadata");

}
        // Admin role redirection logic
        if (role === "admin" && req.nextUrl.pathname === "/dashboard") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }

        // Prevent non-admin users from accessing admin routes
        if (role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Redirect authenticated users trying to access public routes
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return NextResponse.redirect(
            new URL(
              role === "admin" ? "/admin/dashboard" : "/dashboard",
              req.url
            )
          );
        }
      } catch (error) {
        console.error("Error fetching user data from Clerk:", error);
        return NextResponse.redirect(new URL("/error", req.url));
      }

}
 
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};