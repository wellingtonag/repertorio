import { NextResponse } from "next/server";

// Proteção simples por senha (HTTP Basic). Só ativa se SITE_PASSWORD existir.
export function middleware(req) {
  const senha = process.env.SITE_PASSWORD;
  if (!senha) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [, pass] = atob(auth.slice(6)).split(/:(.*)/s);
    if (pass === senha) return NextResponse.next();
  }
  return new NextResponse("Acesso restrito", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Repertorio"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
