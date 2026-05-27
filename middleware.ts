import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/vault/:path*", "/upload-rfp/:path*", "/proposals/:path*", "/templates/:path*", "/linkedin-content/:path*", "/dashboard/:path*", "/settings/:path*", "/team/:path*"],
};
