import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 全ページ公開（認証必須ページは今後追加）
const isPublicRoute = createRouteMatcher(['/(.*)', '/api/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // 現時点では全ページ公開
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
