import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/income/:path*", "/analytics/:path*", "/cashflow/:path*", "/expenses/:path*"],
};
