// app/api/auth/[...nextauth]/route.ts
import { authOptions } from "./option";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

// Using route handlers syntax for Next.js App Router
export const GET = handler;
export const POST = handler;
