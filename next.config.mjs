/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // GHL served the funnel home page at /homepage-page-2125 as well.
  async redirects() {
    return [{ source: '/homepage-page-2125', destination: '/', permanent: true }];
  },
};

export default nextConfig;
