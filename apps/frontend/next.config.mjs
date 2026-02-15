import withPWA from 'next-pwa';

const baseConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})(baseConfig);
