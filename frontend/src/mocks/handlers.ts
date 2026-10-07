import { http, HttpResponse } from "msw";
import type { AuthUser } from "../api/auth";

/* canned campus users, tokens are test-only and never leave jsdom */
function baseUsers(): Record<string, AuthUser> {
  const student: AuthUser = {
    id: "11111111-1111-1111-1111-111111111111",
    fullName: "test user",
    email: "student@cput.ac.za",
    studentNumber: "220000001",
    faculty: "informatics and design",
    phoneNumber: null,
    bio: null,
    profileImageUrl: null,
    role: "STUDENT",
    enabled: true,
    createdAt: "2026-10-05T12:00:00Z",
  };

  const vendor: AuthUser = {
    ...student,
    id: "22222222-2222-2222-2222-222222222222",
    fullName: "vendor user",
    email: "vendor@cput.ac.za",
    studentNumber: null,
    role: "VENDOR",
  };

  const admin: AuthUser = {
    ...student,
    id: "33333333-3333-3333-3333-333333333333",
    fullName: "admin user",
    email: "admin@cput.ac.za",
    studentNumber: null,
    role: "ADMIN",
  };

  return {
    "student-token": student,
    "vendor-token": vendor,
    "admin-token": admin,
    "registered-token": student,
  };
}

/* mutable so patch tests persist, reset between tests in test-setup */
let usersByToken: Record<string, AuthUser> = baseUsers();

export function resetMockUsers() {
  usersByToken = baseUsers();
}

function userFor(request: Request): AuthUser | undefined {
  const header = request.headers.get("Authorization") ?? "";
  return usersByToken[header.replace("Bearer ", "")];
}

interface LoginBody {
  identifier?: string;
  password?: string;
}

interface RegisterBody {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  studentNumber?: string;
  faculty?: string;
}

const bad = (status: number, code: string, message: string, fieldErrors?: Record<string, string>) =>
  HttpResponse.json({ status, code, message, fieldErrors, path: "/api/v1/auth" }, { status });

export const handlers = [
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginBody;
    const users = Object.values(usersByToken);
    const found = users.find((u) => u.email === body.identifier || u.studentNumber === body.identifier);
    if (!found || body.password !== "password123") {
      return bad(401, "INVALID_CREDENTIALS", "invalid credentials");
    }
    const token =
      Object.keys(usersByToken).find((key) => usersByToken[key].id === found.id) ?? "student-token";
    return HttpResponse.json({ token, user: found });
  }),

  http.post("*/auth/register", async ({ request }) => {
    const body = (await request.json()) as RegisterBody;
    if (body.role === "ADMIN") {
      return bad(403, "FORBIDDEN", "admin accounts cannot be created publicly");
    }
    if (body.email === "dup@cput.ac.za") {
      return bad(409, "EMAIL_ALREADY_EXISTS", "email is already registered", {
        email: "email is already registered",
      });
    }
    const user: AuthUser = {
      ...usersByToken["student-token"],
      id: "99999999-9999-9999-9999-999999999999",
      fullName: body.fullName ?? "new user",
      email: (body.email ?? "new@cput.ac.za").toLowerCase(),
      studentNumber: body.studentNumber?.trim() ? body.studentNumber.trim() : null,
      faculty: body.faculty?.trim() ? body.faculty.trim() : null,
      role: body.role === "VENDOR" ? "VENDOR" : "STUDENT",
    };
    return HttpResponse.json({ token: "registered-token", user }, { status: 201 });
  }),

  http.get("*/auth/me", ({ request }) => {
    const user = userFor(request);
    if (!user) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    return HttpResponse.json(user);
  }),
];
