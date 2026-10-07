import { http, HttpResponse } from "msw";
import type { AuthUser } from "../api/auth";
import type { Listing } from "../api/marketplace";

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
    averageRating: 0,
    reviewCount: 0,
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

interface PatchBody {
  fullName?: string;
  faculty?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
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

  /* profile doors mirror /users/me + /users/:id on the backend */
  http.get("*/users/me", ({ request }) => {
    const user = userFor(request);
    if (!user) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    return HttpResponse.json(user);
  }),

  http.patch("*/users/me", async ({ request }) => {
    const user = userFor(request);
    if (!user) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as PatchBody;
    /* allowlist only, same as the backend service */
    if (body.fullName !== undefined && body.fullName.trim()) {
      user.fullName = body.fullName.trim();
    }
    for (const field of ["faculty", "phoneNumber", "bio", "profileImageUrl"] as const) {
      if (body[field] !== undefined) {
        const value = body[field]?.trim();
        user[field] = value ? value : null;
      }
    }
    return HttpResponse.json(user);
  }),

  http.get("*/users/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const found = Object.values(usersByToken).find((u) => u.id === params.id);
    if (!found) {
      return bad(404, "RESOURCE_NOT_FOUND", "user not found");
    }
    return HttpResponse.json(found);
  }),

  /* upload door, hands back a canned url per test */
  http.post("*/media/uploads", ({ request }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    return HttpResponse.json({
      files: [
        {
          filename: "mock-photo.jpg",
          url: "/uploads/listing/mock-photo.jpg",
          contentType: "image/jpeg",
          size: 4,
        },
      ],
    });
  }),

  /* marketplace doors, small in-memory shelf reset between tests */
  http.get("*/marketplace/listings", ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const url = new URL(request.url);
    const q = (name: string) => url.searchParams.get(name);

    const search = (q("search") ?? "").toLowerCase();
    let rows = mockListings.filter((listing) => {
      if (search && !`${listing.title} ${listing.description}`.toLowerCase().includes(search)) {
        return false;
      }
      if (q("category") && listing.category !== q("category")) return false;
      if (q("condition") && listing.condition !== q("condition")) return false;
      if (q("minPrice") && listing.price < Number(q("minPrice"))) return false;
      if (q("maxPrice") && listing.price > Number(q("maxPrice"))) return false;
      if (q("sellerId") && listing.seller.id !== q("sellerId")) return false;
      const status = q("status") ?? "ACTIVE";
      if (listing.status !== status) return false;
      return true;
    });

    const [sortProp, sortDir] = (q("sort") ?? "createdAt,desc").split(",");
    rows = [...rows].sort((a, b) => {
      const left = sortProp === "price" ? a.price : Date.parse(a.createdAt);
      const right = sortProp === "price" ? b.price : Date.parse(b.createdAt);
      return sortDir === "asc" ? left - right : right - left;
    });

    const page = Number(q("page") ?? "0");
    const size = Number(q("size") ?? "12");
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    const content = rows.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      page,
      size,
      totalElements: rows.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  }),

  http.post("*/marketplace/listings", async ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as Partial<Listing>;
    const fieldErrors: Record<string, string> = {};
    if (!body.title?.trim() || body.title.trim().length < 3) {
      fieldErrors.title = "title must be 3 to 150 characters";
    }
    if (body.price === undefined || body.price === null || Number.isNaN(Number(body.price))) {
      fieldErrors.price = "price is required";
    } else if (Number(body.price) < 0) {
      fieldErrors.price = "price cannot be negative";
    }
    if (body.imageUrls && body.imageUrls.length > 5) {
      fieldErrors.imageUrls = "at most 5 images allowed";
    }
    if (Object.keys(fieldErrors).length > 0) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", fieldErrors);
    }
    mockCounter += 1;
    const listing: Listing = {
      id: `listing-new-${mockCounter}`,
      seller: { id: viewer.id, fullName: viewer.fullName },
      title: body.title!.trim(),
      description: body.description ?? "",
      price: Number(body.price),
      category: (body.category as Listing["category"]) ?? "OTHER",
      condition: (body.condition as Listing["condition"]) ?? "GOOD",
      location: body.location ?? null,
      status: "ACTIVE",
      imageUrls: body.imageUrls ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockListings.unshift(listing);
    return HttpResponse.json(listing, { status: 201 });
  }),

  http.get("*/marketplace/listings/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const listing = mockListings.find((row) => row.id === params.id);
    if (
      !listing ||
      (listing.status !== "ACTIVE" &&
        listing.seller.id !== viewer.id &&
        viewer.role !== "ADMIN")
    ) {
      return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
    }
    return HttpResponse.json(listing);
  }),

  http.patch("*/marketplace/listings/:id", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const listing = mockListings.find((row) => row.id === params.id);
    if (!listing) {
      return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
    }
    if (listing.seller.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the seller may edit this listing");
    }
    const body = (await request.json()) as Partial<Listing>;
    Object.assign(listing, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.condition !== undefined ? { condition: body.condition } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.imageUrls !== undefined ? { imageUrls: body.imageUrls } : {}),
    });
    return HttpResponse.json(listing);
  }),

  http.delete("*/marketplace/listings/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const listing = mockListings.find((row) => row.id === params.id);
    if (!listing) {
      return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
    }
    if (listing.seller.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the seller may archive this listing");
    }
    listing.status = "ARCHIVED";
    return HttpResponse.json(listing);
  }),
];

/* ---- mock shelf below, rebuilt from the canned users on every reset ---- */

function seedMarketplace(): Listing[] {
  const student = usersByToken["student-token"];
  const vendor = usersByToken["vendor-token"];
  const day = (n: number) => new Date(Date.UTC(2026, 9, n)).toISOString();
  return [
    {
      id: "listing-calc",
      seller: { id: student.id, fullName: student.fullName },
      title: "calculus textbook",
      description: "barely used stewart calculus",
      price: 350,
      category: "TEXTBOOKS",
      condition: "LIKE_NEW",
      location: "bellville campus",
      status: "ACTIVE",
      imageUrls: ["/uploads/listing/calc.jpg"],
      createdAt: day(5),
      updatedAt: day(5),
    },
    {
      id: "listing-laptop",
      seller: { id: vendor.id, fullName: vendor.fullName },
      title: "dell laptop",
      description: "i5 with fresh battery",
      price: 4500,
      category: "ELECTRONICS",
      condition: "GOOD",
      location: null,
      status: "ACTIVE",
      imageUrls: [],
      createdAt: day(4),
      updatedAt: day(4),
    },
    {
      id: "listing-jacket",
      seller: { id: student.id, fullName: student.fullName },
      title: "winter jacket",
      description: "warm jacket size medium",
      price: 600,
      category: "CLOTHING",
      condition: "FAIR",
      location: "res lobby",
      status: "ACTIVE",
      imageUrls: [],
      createdAt: day(3),
      updatedAt: day(3),
    },
  ];
}

let mockCounter = 0;
let mockListings: Listing[] = [];

export function resetMarketplace() {
  mockCounter = 0;
  mockListings = seedMarketplace();
}

resetMarketplace();

/* ---- mock basket below, one shelf per token, reset between tests ---- */

interface MockCartRow {
  id: string;
  listingId: string;
  qty: number;
}

let cartCounter = 0;
let mockCarts: Record<string, MockCartRow[]> = {};

export function resetCart() {
  cartCounter = 0;
  mockCarts = {};
}

function cartView(token: string) {
  const rows = mockCarts[token] ?? [];
  const items = rows.flatMap((row) => {
    const listing = mockListings.find((item) => item.id === row.listingId);
    if (!listing) {
      return [];
    }
    return [
      {
        id: row.id,
        listingId: listing.id,
        title: listing.title,
        sellerName: listing.seller.fullName,
        price: listing.price,
        imageUrl: listing.imageUrls[0] ?? null,
        quantity: row.qty,
        lineTotal: listing.price * row.qty,
      },
    ];
  });
  return {
    id: "mock-cart",
    items,
    itemCount: items.length,
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

const cartHandlers = [
  http.get("*/cart", ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    return HttpResponse.json(cartView(token));
  }),

  http.post("*/cart/items", async ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as { listingId?: string };
    const listing = mockListings.find((row) => row.id === body.listingId);
    if (!listing) {
      return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
    }
    if (listing.seller.id === viewer.id) {
      return bad(403, "FORBIDDEN", "you cannot add your own listing to your cart");
    }
    if (listing.status !== "ACTIVE") {
      return bad(409, "LISTING_NOT_AVAILABLE", "listing is no longer available");
    }
    const rows = (mockCarts[token] ??= []);
    if (!rows.some((row) => row.listingId === listing.id)) {
      cartCounter += 1;
      rows.push({ id: `ci-${cartCounter}`, listingId: listing.id, qty: 1 });
    }
    return HttpResponse.json(cartView(token));
  }),

  http.patch("*/cart/items/:id", async ({ request, params }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = (mockCarts[token] ?? []).find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "cart item not found");
    }
    const body = (await request.json()) as { quantity?: number };
    row.qty = body.quantity ?? row.qty;
    return HttpResponse.json(cartView(token));
  }),

  http.delete("*/cart/items/:id", ({ request, params }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const rows = mockCarts[token] ?? [];
    const index = rows.findIndex((entry) => entry.id === params.id);
    if (index < 0) {
      return bad(404, "RESOURCE_NOT_FOUND", "cart item not found");
    }
    rows.splice(index, 1);
    return HttpResponse.json(cartView(token));
  }),

  http.delete("*/cart", ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    mockCarts[token] = [];
    return HttpResponse.json(cartView(token));
  }),
];

handlers.push(...cartHandlers);
