/** @type {import('next').NextConfig} */
const nextConfig = {
  // 실험적 기능 (필요한 경우)
  experimental: {
    // App Router 사용시
    appDir: true,
  },
  
  // API 프록시 설정 (개발 환경용)
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },

  // CORS 헤더 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },

  // 환경변수 설정
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8080',
  },

  // 이미지 도메인 허용 (필요한 경우)
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig