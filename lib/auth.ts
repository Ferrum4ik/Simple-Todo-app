import crypto from "crypto";

import { query } from "@/lib/db";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidateHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(hash, "hex"),
  );
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, item) => {
    const [name, ...rest] = item.split("=");
    const value = rest.join("=");

    if (name && value) {
      cookies[name.trim()] = value.trim();
    }

    return cookies;
  }, {});
}

export async function getCurrentUserFromRequest(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.session;

  if (!token) {
    return null;
  }

  const { rows } = await query<AuthUser>(
    `SELECT u.id, u.name, u.email
     FROM users u
     INNER JOIN sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token],
  );

  return rows[0] ?? null;
}
