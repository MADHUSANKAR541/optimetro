import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'commuter'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'commuter'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'commuter'
  }
}
