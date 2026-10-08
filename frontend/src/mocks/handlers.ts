import { http, HttpResponse } from "msw";
import type { AuthUser } from "../api/auth";
import type { Listing } from "../api/marketplace";
import type { Order } from "../api/orders";
import type { PaymentResult } from "../api/payments";
import type { Report } from "../api/lostfound";
import type { SupportOffer, SupportRequest } from "../api/support";
import type { Post, PostComment } from "../api/community";
import type { AppNotification } from "../api/notifications";
import type { Review } from "../api/reviews";
import type { DashboardData } from "../api/dashboard";

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

/* ---- mock orders below, frozen at checkout, reset between tests ---- */

let orderCounter = 0;
let mockOrders: Order[] = [];

export function resetOrders() {
  orderCounter = 0;
  mockOrders = [];
}

const orderHandlers = [
  http.post("*/orders", async ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const basket = cartView(token);
    if (basket.items.length === 0) {
      return bad(400, "CART_EMPTY", "cart is empty");
    }
    const body = (await request.json()) as { deliveryMethod?: Order["deliveryMethod"]; paymentMethod?: Order["paymentMethod"] };
    if (!body.deliveryMethod || !body.paymentMethod) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid");
    }
    /* recheck every row, the shelf may have moved since basketing */
    for (const item of basket.items) {
      const listing = mockListings.find((row) => row.id === item.listingId);
      if (!listing) {
        return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
      }
      if (listing.seller.id === viewer.id) {
        return bad(403, "FORBIDDEN", "you cannot buy your own listing");
      }
      if (listing.status !== "ACTIVE") {
        return bad(409, "LISTING_NOT_AVAILABLE", "listing is no longer available");
      }
    }
    orderCounter += 1;
    const created: Order = {
      id: `order-${orderCounter}`,
      buyerId: viewer.id,
      buyerName: viewer.fullName,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
      subtotal: basket.subtotal,
      total: basket.subtotal,
      status: "PENDING_PAYMENT",
      paidAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      items: basket.items.map((item, index) => {
        const listing = mockListings.find((row) => row.id === item.listingId)!;
        listing.status = "RESERVED";
        return {
          id: `oi-${orderCounter}-${index}`,
          listingId: listing.id,
          title: listing.title,
          unitPrice: listing.price,
          sellerId: listing.seller.id,
          sellerName: listing.seller.fullName,
          quantity: item.quantity,
          lineTotal: listing.price * item.quantity,
        };
      }),
    };
    mockOrders.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("*/orders", ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const mine = mockOrders.filter((order) => order.buyerId === viewer.id);
    return HttpResponse.json({
      content: mine,
      page: 0,
      size: 20,
      totalElements: mine.length,
      totalPages: 1,
      first: true,
      last: true,
    });
  }),

  http.get("*/orders/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const order = mockOrders.find((row) => row.id === params.id);
    const sellerOnOrder =
      !!order && order.items.some((item) => item.sellerId === viewer.id);
    if (!order || (order.buyerId !== viewer.id && !sellerOnOrder)) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    return HttpResponse.json(order);
  }),

  http.post("*/orders/:id/ready", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const order = mockOrders.find((row) => row.id === params.id);
    if (!order) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    if (!order.items.some((item) => item.sellerId === viewer.id)) {
      return bad(403, "FORBIDDEN", "only the seller may mark this order ready");
    }
    if (order.status !== "PAID") {
      return bad(400, "ORDER_INVALID", "only paid orders can be marked ready");
    }
    order.status = "READY_FOR_COLLECTION";
    return HttpResponse.json(order);
  }),

  http.post("*/orders/:id/complete", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const order = mockOrders.find((row) => row.id === params.id);
    if (!order || order.buyerId !== viewer.id) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    if (order.status !== "PAID" && order.status !== "READY_FOR_COLLECTION") {
      return bad(400, "ORDER_INVALID", "only paid orders can be completed");
    }
    order.status = "COMPLETED";
    return HttpResponse.json(order);
  }),

  http.post("*/orders/:id/cancel", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const order = mockOrders.find((row) => row.id === params.id);
    if (!order || order.buyerId !== viewer.id) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
      return bad(400, "ORDER_INVALID", "only unpaid orders can be cancelled");
    }
    for (const item of order.items) {
      const listing = mockListings.find((row) => row.id === item.listingId);
      if (listing) {
        listing.status = "ACTIVE";
      }
    }
    order.status = "CANCELLED";
    return HttpResponse.json(order);
  }),
];

handlers.push(...orderHandlers);

/* ---- mock till below, one row per attempt, reset between tests ---- */

let paymentCounter = 0;
let mockPayments: PaymentResult[] = [];

export function resetPayments() {
  paymentCounter = 0;
  mockPayments = [];
}

const paymentHandlers = [
  http.post("*/orders/:id/payments", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const order = mockOrders.find((row) => row.id === params.id);
    if (!order || order.buyerId !== viewer.id) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
      return bad(400, "ORDER_INVALID", "order cannot be paid in its current state");
    }
    const body = (await request.json()) as { simulate?: string };
    const ok = body.simulate === "SUCCESS";

    /* lock-free mock, same transitions as the backend */
    for (const item of order.items) {
      const listing = mockListings.find((row) => row.id === item.listingId);
      if (!listing) continue;
      if (ok) {
        if (order.status === "PAYMENT_FAILED") {
          if (listing.status !== "ACTIVE") {
            return bad(400, "ORDER_INVALID", "listing is no longer available");
          }
        } else if (listing.status !== "RESERVED") {
          return bad(400, "ORDER_INVALID", "listing is no longer reserved for this order");
        }
        listing.status = "SOLD";
      } else {
        listing.status = "ACTIVE";
      }
    }
    order.status = ok ? "PAID" : "PAYMENT_FAILED";

    paymentCounter += 1;
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (ok) {
      mockCarts[token] = [];
    }
    const result: PaymentResult = {
      id: `pay-${paymentCounter}`,
      amount: order.total,
      status: ok ? "SUCCEEDED" : "FAILED",
      provider: "mock",
      createdAt: new Date().toISOString(),
      order: { ...order, items: [...order.items] },
    };
    mockPayments.unshift(result);
    return HttpResponse.json(result);
  }),
];

handlers.push(...paymentHandlers);

/* ---- mock reports below, rebuilt on every reset ---- */

let reportCounter = 0;
let mockReports: Report[] = [];

function seedReports(): Report[] {
  const student = usersByToken["student-token"];
  const vendor = usersByToken["vendor-token"];
  return [
    {
      id: "rep-lost-wallet",
      owner: { id: student.id, fullName: student.fullName },
      type: "LOST",
      itemName: "black wallet",
      category: "OTHER",
      description: "lost near the library steps",
      location: "library steps",
      incidentDate: "2026-10-01",
      imageUrl: null,
      status: "OPEN",
      createdAt: "2026-10-02T12:00:00Z",
      updatedAt: "2026-10-02T12:00:00Z",
    },
    {
      id: "rep-found-laptop",
      owner: { id: vendor.id, fullName: vendor.fullName },
      type: "FOUND",
      itemName: "silver laptop",
      category: "ELECTRONICS",
      description: "found in lab 3, sticker on lid",
      location: "engineering lab 3",
      incidentDate: "2026-10-03",
      imageUrl: null,
      status: "OPEN",
      createdAt: "2026-10-04T12:00:00Z",
      updatedAt: "2026-10-04T12:00:00Z",
    },
  ];
}

export function resetReports() {
  reportCounter = 0;
  mockReports = seedReports();
}

resetReports();

const reportHandlers = [
  http.get("*/lost-found/reports", ({ request }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const url = new URL(request.url);
    const q = (name: string) => url.searchParams.get(name);
    const search = (q("search") ?? "").toLowerCase();

    let rows = mockReports.filter((report) => {
      if (search && !`${report.itemName} ${report.description}`.toLowerCase().includes(search)) {
        return false;
      }
      if (q("type") && report.type !== q("type")) return false;
      if (q("category") && report.category !== q("category")) return false;
      if (q("location") && !report.location.toLowerCase().includes((q("location") ?? "").toLowerCase())) {
        return false;
      }
      if (q("status")) {
        if (report.status !== q("status")) return false;
      } else if (report.status === "CLOSED") {
        return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const page = Number(q("page") ?? "0");
    const size = Number(q("size") ?? "12");
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    return HttpResponse.json({
      content: rows.slice(page * size, page * size + size),
      page,
      size,
      totalElements: rows.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  }),

  http.post("*/lost-found/reports", async ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as Partial<Report>;
    const fieldErrors: Record<string, string> = {};
    if (!body.itemName?.trim()) fieldErrors.itemName = "item name is required";
    if (!body.description?.trim()) fieldErrors.description = "description is required";
    if (!body.location?.trim()) fieldErrors.location = "location is required";
    if (!body.type) fieldErrors.type = "type is required";
    if (Object.keys(fieldErrors).length > 0) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", fieldErrors);
    }
    reportCounter += 1;
    const report: Report = {
      id: `rep-new-${reportCounter}`,
      owner: { id: viewer.id, fullName: viewer.fullName },
      type: (body.type as Report["type"]) ?? "LOST",
      itemName: body.itemName!.trim(),
      category: (body.category as Report["category"]) ?? "OTHER",
      description: body.description!.trim(),
      location: body.location!.trim(),
      incidentDate: body.incidentDate ?? "2026-10-05",
      imageUrl: body.imageUrl ?? null,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockReports.unshift(report);
    pairNewReport(report);
    return HttpResponse.json(report, { status: 201 });
  }),

  http.get("*/lost-found/reports/:id", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const report = mockReports.find((row) => row.id === params.id);
    if (!report) {
      return bad(404, "RESOURCE_NOT_FOUND", "report not found");
    }
    return HttpResponse.json(report);
  }),

  http.patch("*/lost-found/reports/:id", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const report = mockReports.find((row) => row.id === params.id);
    if (!report) {
      return bad(404, "RESOURCE_NOT_FOUND", "report not found");
    }
    if (report.owner.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the reporter may edit this report");
    }
    const body = (await request.json()) as Partial<Report>;
    Object.assign(report, {
      ...(body.itemName !== undefined ? { itemName: body.itemName } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.incidentDate !== undefined ? { incidentDate: body.incidentDate } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
    });
    return HttpResponse.json(report);
  }),

  http.delete("*/lost-found/reports/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const report = mockReports.find((row) => row.id === params.id);
    if (!report) {
      return bad(404, "RESOURCE_NOT_FOUND", "report not found");
    }
    if (report.owner.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the reporter may close this report");
    }
    report.status = "CLOSED";
    return HttpResponse.json(report);
  }),
];

handlers.push(...reportHandlers);

/* ---- mock matches below, deterministic pairing on every create ---- */

interface MockMatch {
  id: string;
  lostId: string;
  foundId: string;
  score: number;
  lostDecision: "PENDING" | "ACCEPTED" | "REJECTED";
  foundDecision: "PENDING" | "ACCEPTED" | "REJECTED";
}

let matchCounter = 0;
let mockMatches: MockMatch[] = [];

export function resetMatches() {
  matchCounter = 0;
  mockMatches = [];
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((word) => word && !["the", "a", "an", "and", "or", "of", "lost", "found"].includes(word)),
  );
}

function jaccard(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 && b.size === 0) return 0;
  const union = new Set([...a, ...b]);
  const both = [...a].filter((word) => b.has(word)).length;
  return both / union.size;
}

function pairScore(lost: Report, found: Report): number {
  const category = lost.category === found.category ? 1 : 0;
  const description = jaccard(lost.description, found.description);
  const location = jaccard(lost.location, found.location);
  const days = Math.abs(
    (Date.parse(lost.incidentDate) - Date.parse(found.incidentDate)) / 86400000,
  );
  const date = days === 0 ? 1 : days <= 1 ? 0.9 : days <= 3 ? 0.75 : days <= 7 ? 0.5 : days <= 14 ? 0.25 : 0;
  return Math.round((0.35 * category + 0.35 * description + 0.2 * location + 0.1 * date) * 10000) / 100;
}

function pairNewReport(report: Report) {
  for (const candidate of mockReports) {
    if (candidate.id === report.id) continue;
    if (candidate.type === report.type) continue;
    if (candidate.owner.id === report.owner.id) continue;
    if (candidate.status !== "OPEN" && candidate.status !== "MATCH_PENDING") continue;
    const lost = report.type === "LOST" ? report : candidate;
    const found = report.type === "LOST" ? candidate : report;
    if (mockMatches.some((row) => row.lostId === lost.id && row.foundId === found.id)) continue;
    if (pairScore(lost, found) < 55) continue;
    matchCounter += 1;
    mockMatches.push({
      id: `match-${matchCounter}`,
      lostId: lost.id,
      foundId: found.id,
      score: pairScore(lost, found),
      lostDecision: "PENDING",
      foundDecision: "PENDING",
    });
    report.status = "MATCH_PENDING";
    if (candidate.status === "OPEN") {
      candidate.status = "MATCH_PENDING";
    }
  }
}

function matchView(match: MockMatch, viewingId: string) {
  const viewingLost = match.lostId === viewingId;
  const otherId = viewingLost ? match.foundId : match.lostId;
  const other = mockReports.find((row) => row.id === otherId)!;
  return {
    id: match.id,
    reportId: viewingId,
    otherReportId: other.id,
    otherItemName: other.itemName,
    otherDescription: other.description,
    otherLocation: other.location,
    score: match.score,
    myDecision: viewingLost ? match.lostDecision : match.foundDecision,
    otherDecision: viewingLost ? match.foundDecision : match.lostDecision,
    createdAt: new Date().toISOString(),
  };
}

const matchHandlers = [
  http.get("*/lost-found/reports/:id/matches", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const report = mockReports.find((row) => row.id === params.id);
    if (!report) {
      return bad(404, "RESOURCE_NOT_FOUND", "report not found");
    }
    if (report.owner.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the reporter may view these matches");
    }
    const rows = mockMatches.filter((row) => row.lostId === report.id || row.foundId === report.id);
    return HttpResponse.json(rows.map((row) => matchView(row, report.id)));
  }),

  http.post("*/lost-found/matches/:id/decision", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const match = mockMatches.find((row) => row.id === params.id);
    if (!match) {
      return bad(404, "RESOURCE_NOT_FOUND", "match not found");
    }
    const lost = mockReports.find((row) => row.id === match.lostId)!;
    const found = mockReports.find((row) => row.id === match.foundId)!;
    const lostSide = lost.owner.id === viewer.id;
    const foundSide = found.owner.id === viewer.id;
    if (!lostSide && !foundSide) {
      return bad(403, "FORBIDDEN", "only the involved owners may decide");
    }
    const current = lostSide ? match.lostDecision : match.foundDecision;
    if (current !== "PENDING") {
      return bad(409, "MATCH_ALREADY_DECIDED", "you already decided on this match");
    }
    const body = (await request.json()) as { decision?: string };
    const next = body.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";
    if (lostSide) {
      match.lostDecision = next;
    } else {
      match.foundDecision = next;
    }
    if (match.lostDecision === "ACCEPTED" && match.foundDecision === "ACCEPTED") {
      lost.status = "MATCHED";
      found.status = "MATCHED";
    } else if (match.lostDecision === "REJECTED" || match.foundDecision === "REJECTED") {
      for (const report of [lost, found]) {
        if (report.status !== "MATCH_PENDING") continue;
        const live = mockMatches.some(
          (row) =>
            row.id !== match.id &&
            (row.lostId === report.id || row.foundId === report.id) &&
            row.lostDecision !== "REJECTED" &&
            row.foundDecision !== "REJECTED",
        );
        if (!live) {
          report.status = "OPEN";
        }
      }
    }
    return HttpResponse.json(matchView(match, lostSide ? lost.id : found.id));
  }),
];

handlers.push(...matchHandlers);

/* ---- mock survival board below, transitions mirror the backend ---- */

let supportCounter = 0;
let offerCounter = 0;
let mockRequests: SupportRequest[] = [];
let mockOffers: SupportOffer[] = [];

function seedSupport(): SupportRequest[] {
  const student = usersByToken["student-token"];
  return [
    {
      id: "sup-seed-1",
      requester: { id: student.id, fullName: student.fullName },
      type: "FOOD",
      title: "need dinner tonight",
      description: "stipend late, one meal please",
      location: "res block c",
      urgency: "HIGH",
      status: "OPEN",
      resolvedAt: null,
      createdAt: "2026-10-05T12:00:00Z",
      updatedAt: "2026-10-05T12:00:00Z",
    },
  ];
}

export function resetSupport() {
  supportCounter = 0;
  offerCounter = 0;
  mockRequests = seedSupport();
  mockOffers = [];
}

resetSupport();

const supportHandlers = [
  http.get("*/support/requests", ({ request }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const status = new URL(request.url).searchParams.get("status");
    const rows = status ? mockRequests.filter((row) => row.status === status) : mockRequests;
    const ordered = [...rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return HttpResponse.json({
      content: ordered,
      page: 0,
      size: 20,
      totalElements: ordered.length,
      totalPages: 1,
      first: true,
      last: true,
    });
  }),

  http.post("*/support/requests", async ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as Partial<SupportRequest>;
    const fieldErrors: Record<string, string> = {};
    if (!body.title?.trim()) fieldErrors.title = "title is required";
    if (!body.description?.trim()) fieldErrors.description = "description is required";
    if (!body.location?.trim()) fieldErrors.location = "location is required";
    if (!body.type) fieldErrors.type = "type is required";
    if (!body.urgency) fieldErrors.urgency = "urgency is required";
    if (Object.keys(fieldErrors).length > 0) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", fieldErrors);
    }
    supportCounter += 1;
    const row: SupportRequest = {
      id: `sup-new-${supportCounter}`,
      requester: { id: viewer.id, fullName: viewer.fullName },
      type: body.type!,
      title: body.title!.trim(),
      description: body.description!.trim(),
      location: body.location!.trim(),
      urgency: body.urgency!,
      status: "OPEN",
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequests.unshift(row);
    return HttpResponse.json(row, { status: 201 });
  }),

  http.get("*/support/requests/:id", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = mockRequests.find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    return HttpResponse.json(row);
  }),

  http.patch("*/support/requests/:id", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = mockRequests.find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    if (row.requester.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the requester may do this");
    }
    const body = (await request.json()) as Partial<SupportRequest>;
    Object.assign(row, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
    });
    return HttpResponse.json(row);
  }),

  http.post("*/support/requests/:id/cancel", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = mockRequests.find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    if (row.requester.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the requester may do this");
    }
    if (row.status !== "OPEN" && row.status !== "OFFER_RECEIVED") {
      return bad(400, "INVALID_STATE_TRANSITION", "only open requests can be cancelled");
    }
    row.status = "CANCELLED";
    return HttpResponse.json(row);
  }),

  http.post("*/support/requests/:id/resolve", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = mockRequests.find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    if (row.requester.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the requester may do this");
    }
    if (row.status === "RESOLVED") {
      return bad(400, "INVALID_STATE_TRANSITION", "request is already resolved");
    }
    row.status = "RESOLVED";
    for (const offer of mockOffers) {
      if (offer.requestId === row.id && offer.status === "ACCEPTED") {
        offer.status = "COMPLETED";
      }
    }
    return HttpResponse.json(row);
  }),

  http.post("*/support/requests/:id/offers", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = mockRequests.find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    if (row.requester.id === viewer.id) {
      return bad(403, "FORBIDDEN", "you cannot offer help on your own request");
    }
    if (row.status === "RESOLVED" || row.status === "CANCELLED") {
      return bad(400, "INVALID_STATE_TRANSITION", "request is no longer open for help");
    }
    const body = (await request.json()) as { message?: string };
    if (!body.message?.trim()) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", {
        message: "message is required",
      });
    }
    offerCounter += 1;
    const offer: SupportOffer = {
      id: `offer-${offerCounter}`,
      requestId: row.id,
      responder: { id: viewer.id, fullName: viewer.fullName },
      message: body.message.trim(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    mockOffers.push(offer);
    if (row.status === "OPEN") {
      row.status = "OFFER_RECEIVED";
    }
    return HttpResponse.json(offer, { status: 201 });
  }),

  http.get("*/support/requests/:id/offers", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    if (!mockRequests.some((entry) => entry.id === params.id)) {
      return bad(404, "RESOURCE_NOT_FOUND", "support request not found");
    }
    return HttpResponse.json(mockOffers.filter((offer) => offer.requestId === params.id));
  }),

  http.post("*/support/offers/:id/accept", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const offer = mockOffers.find((entry) => entry.id === params.id);
    if (!offer) {
      return bad(404, "RESOURCE_NOT_FOUND", "support offer not found");
    }
    const row = mockRequests.find((entry) => entry.id === offer.requestId)!;
    if (row.requester.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the requester may do this");
    }
    if (offer.status !== "PENDING") {
      return bad(400, "INVALID_STATE_TRANSITION", "offer is no longer pending");
    }
    offer.status = "ACCEPTED";
    row.status = "IN_PROGRESS";
    return HttpResponse.json(offer);
  }),

  http.post("*/support/offers/:id/decline", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const offer = mockOffers.find((entry) => entry.id === params.id);
    if (!offer) {
      return bad(404, "RESOURCE_NOT_FOUND", "support offer not found");
    }
    const row = mockRequests.find((entry) => entry.id === offer.requestId)!;
    if (row.requester.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the requester may do this");
    }
    if (offer.status !== "PENDING") {
      return bad(400, "INVALID_STATE_TRANSITION", "offer is no longer pending");
    }
    offer.status = "DECLINED";
    return HttpResponse.json(offer);
  }),

  http.post("*/support/offers/:id/withdraw", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const offer = mockOffers.find((entry) => entry.id === params.id);
    if (!offer) {
      return bad(404, "RESOURCE_NOT_FOUND", "support offer not found");
    }
    if (offer.responder.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the responder may withdraw this offer");
    }
    if (offer.status !== "PENDING") {
      return bad(400, "INVALID_STATE_TRANSITION", "offer is no longer pending");
    }
    offer.status = "WITHDRAWN";
    return HttpResponse.json(offer);
  }),
];

handlers.push(...supportHandlers);

/* ---- mock wall below, threads plus flat replies, reset between tests ---- */

let postCounter = 0;
let commentCounter = 0;
let mockPosts: Post[] = [];
let mockComments: PostComment[] = [];

function seedCommunity(): Post[] {
  const student = usersByToken["student-token"];
  const vendor = usersByToken["vendor-token"];
  return [
    {
      id: "post-quiet",
      author: { id: student.id, fullName: student.fullName },
      title: "quiet thread",
      body: "nobody replies here",
      imageUrl: null,
      pinned: false,
      commentCount: 0,
      createdAt: "2026-10-03T12:00:00Z",
      updatedAt: "2026-10-03T12:00:00Z",
    },
    {
      id: "post-nsfas",
      author: { id: vendor.id, fullName: vendor.fullName },
      title: "nsfas allowance dates",
      body: "when do allowances drop this term",
      imageUrl: null,
      pinned: false,
      commentCount: 0,
      createdAt: "2026-10-04T12:00:00Z",
      updatedAt: "2026-10-04T12:00:00Z",
    },
  ];
}

export function resetCommunity() {
  postCounter = 0;
  commentCounter = 0;
  mockPosts = seedCommunity();
  mockComments = [];
}

resetCommunity();

const communityHandlers = [
  http.get("*/community/posts", ({ request }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const url = new URL(request.url);
    const q = (name: string) => url.searchParams.get(name);
    const search = (q("search") ?? "").toLowerCase();
    const sort = q("sort") ?? "latest";

    let rows = mockPosts.filter((post) => {
      if (search && !`${post.title} ${post.body}`.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "trending") {
        if (b.commentCount !== a.commentCount) return b.commentCount - a.commentCount;
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

    const page = Number(q("page") ?? "0");
    const size = Number(q("size") ?? "20");
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    return HttpResponse.json({
      content: rows.slice(page * size, page * size + size),
      page,
      size,
      totalElements: rows.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  }),

  http.post("*/community/posts", async ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const body = (await request.json()) as Partial<Post>;
    const fieldErrors: Record<string, string> = {};
    if (!body.title?.trim()) fieldErrors.title = "title is required";
    if (!body.body?.trim()) fieldErrors.body = "body is required";
    if (Object.keys(fieldErrors).length > 0) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", fieldErrors);
    }
    postCounter += 1;
    const post: Post = {
      id: `post-new-${postCounter}`,
      author: { id: viewer.id, fullName: viewer.fullName },
      title: body.title!.trim(),
      body: body.body!.trim(),
      imageUrl: body.imageUrl?.trim() ? body.imageUrl.trim() : null,
      pinned: false,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPosts.unshift(post);
    return HttpResponse.json(post, { status: 201 });
  }),

  http.get("*/community/posts/:id", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const post = mockPosts.find((row) => row.id === params.id);
    if (!post) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    return HttpResponse.json(post);
  }),

  http.patch("*/community/posts/:id", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const post = mockPosts.find((row) => row.id === params.id);
    if (!post) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    if (post.author.id !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the author may edit this post");
    }
    const body = (await request.json()) as Partial<Post>;
    Object.assign(post, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
    });
    return HttpResponse.json(post);
  }),

  http.delete("*/community/posts/:id", ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const index = mockPosts.findIndex((row) => row.id === params.id);
    if (index < 0) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    const post = mockPosts[index];
    if (post.author.id !== viewer.id && viewer.role !== "ADMIN") {
      return bad(403, "FORBIDDEN", "only the author may delete this post");
    }
    mockPosts.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/community/posts/:id/comments", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    if (!mockPosts.some((row) => row.id === params.id)) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    return HttpResponse.json(mockComments.filter((row) => row.postId === params.id));
  }),

  http.post("*/community/posts/:id/comments", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const post = mockPosts.find((row) => row.id === params.id);
    if (!post) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", {
        body: "body is required",
      });
    }
    commentCounter += 1;
    const comment: PostComment = {
      id: `comment-${commentCounter}`,
      postId: post.id,
      author: { id: viewer.id, fullName: viewer.fullName },
      body: body.body.trim(),
      createdAt: new Date().toISOString(),
    };
    mockComments.push(comment);
    post.commentCount += 1;
    return HttpResponse.json(comment, { status: 201 });
  }),
];

handlers.push(...communityHandlers);

/* ---- mock inbox below, one shelf per token, reset between tests ---- */

let mockNotifications: Record<string, AppNotification[]> = {};

function seedNotifications(): Record<string, AppNotification[]> {
  return {
    "student-token": [
      {
        id: "notif-unread-1",
        type: "ORDER_PAID",
        title: "payment successful",
        message: "your order is paid",
        entityType: "order",
        entityId: "order-1",
        readAt: null,
        createdAt: "2026-10-06T12:00:00Z",
      },
      {
        id: "notif-read-1",
        type: "SYSTEM",
        title: "welcome aboard",
        message: "thanks for joining varsity connect",
        entityType: null,
        entityId: null,
        readAt: "2026-10-05T12:00:00Z",
        createdAt: "2026-10-05T12:00:00Z",
      },
    ],
  };
}

export function resetNotifications() {
  mockNotifications = seedNotifications();
}

resetNotifications();

const notificationHandlers = [
  http.get("*/notifications", ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const rows = [...(mockNotifications[token] ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return HttpResponse.json({
      content: rows,
      page: 0,
      size: 50,
      totalElements: rows.length,
      totalPages: 1,
      first: true,
      last: true,
    });
  }),

  http.get("*/notifications/unread-count", ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const count = (mockNotifications[token] ?? []).filter((row) => !row.readAt).length;
    return HttpResponse.json({ count });
  }),

  http.post("*/notifications/:id/read", ({ request, params }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const row = (mockNotifications[token] ?? []).find((entry) => entry.id === params.id);
    if (!row) {
      return bad(404, "RESOURCE_NOT_FOUND", "notification not found");
    }
    row.readAt = new Date().toISOString();
    return HttpResponse.json(row);
  }),

  http.post("*/notifications/read-all", ({ request }) => {
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const now = new Date().toISOString();
    for (const row of mockNotifications[token] ?? []) {
      row.readAt ??= now;
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

handlers.push(...notificationHandlers);

/* ---- mock voices below, one per order per seller, reset between tests ---- */

let reviewCounter = 0;
let mockReviews: Review[] = [];

export function resetReviews() {
  reviewCounter = 0;
  mockReviews = [];
}

function reviewAverages(revieweeId: string): { averageRating: number; reviewCount: number } {
  const rows = mockReviews.filter((row) => row.revieweeId === revieweeId);
  if (rows.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  const sum = rows.reduce((total, row) => total + row.rating, 0);
  return { averageRating: Math.round((sum / rows.length) * 10) / 10, reviewCount: rows.length };
}

const reviewHandlers = [
  http.get("*/users/:userId/reviews", ({ request, params }) => {
    if (!userFor(request)) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const rows = mockReviews
      .filter((row) => row.revieweeId === params.userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return HttpResponse.json(rows);
  }),

  http.post("*/users/:userId/reviews", async ({ request, params }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const revieweeId = params.userId as string;
    const reviewer = Object.values(usersByToken).find((u) => u.id === revieweeId);
    if (!reviewer) {
      return bad(404, "RESOURCE_NOT_FOUND", "user not found");
    }
    const body = (await request.json()) as { orderId?: string; rating?: number; comment?: string };
    const order = mockOrders.find((row) => row.id === body.orderId);
    if (!order) {
      return bad(404, "RESOURCE_NOT_FOUND", "order not found");
    }
    if (order.buyerId !== viewer.id) {
      return bad(403, "FORBIDDEN", "only the buyer may review this order");
    }
    if (order.status !== "COMPLETED") {
      return bad(400, "ORDER_NOT_COMPLETED", "only completed orders can be reviewed");
    }
    if (revieweeId === viewer.id) {
      return bad(400, "SELF_REVIEW", "you cannot review yourself");
    }
    if (!order.items.some((item) => item.sellerId === revieweeId)) {
      return bad(403, "FORBIDDEN", "you can only review this order's sellers");
    }
    if (
      mockReviews.some(
        (row) =>
          row.orderId === order.id && row.reviewerId === viewer.id && row.revieweeId === revieweeId,
      )
    ) {
      return bad(409, "DUPLICATE_REVIEW", "you already reviewed this seller for this order");
    }
    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", {
        rating: "rating must be 1 to 5",
      });
    }
    if (!body.comment?.trim()) {
      return bad(400, "VALIDATION_ERROR", "one or more fields are invalid", {
        comment: "comment is required",
      });
    }
    reviewCounter += 1;
    const review: Review = {
      id: `review-${reviewCounter}`,
      reviewerId: viewer.id,
      reviewerName: viewer.fullName,
      revieweeId,
      orderId: order.id,
      rating: body.rating,
      comment: body.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    mockReviews.unshift(review);
    /* profiles light up immediately, same as the backend aggregates */
    for (const user of Object.values(usersByToken)) {
      if (user.id === revieweeId) {
        Object.assign(user, reviewAverages(revieweeId));
      }
    }
    return HttpResponse.json(review, { status: 201 });
  }),
];

handlers.push(...reviewHandlers);

/* ---- mock home below, capped slices of the same shelves above ---- */

const dashboardHandlers = [
  http.get("*/dashboard", ({ request }) => {
    const viewer = userFor(request);
    if (!viewer) {
      return bad(401, "UNAUTHORIZED", "authentication required");
    }
    const token = (request.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const activeListings = mockListings
      .filter((row) => row.status === "ACTIVE")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const openReports = mockReports.filter((row) => row.status === "OPEN");
    const openSupport = mockRequests
      .filter((row) => row.status === "OPEN")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const myReportIds = mockReports.filter((row) => row.owner.id === viewer.id).map((row) => row.id);
    const myMatches = mockMatches
      .filter((row) => myReportIds.includes(row.lostId) || myReportIds.includes(row.foundId))
      .slice(0, 5)
      .map((row) => {
        const viewingId = myReportIds.includes(row.lostId) ? row.lostId : row.foundId;
        return matchView(row, viewingId);
      });
    const unread = (mockNotifications[token] ?? []).filter((row) => !row.readAt).length;
    const body: DashboardData = {
      user: viewer,
      unreadNotifications: unread,
      latestListings: activeListings.slice(0, 4),
      latestPosts: [...mockPosts]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 4),
      openSupportRequests: openSupport.slice(0, 4),
      myMatches,
      activeListingCount: activeListings.length,
      openLostReportCount: openReports.length,
      openSupportRequestCount: mockRequests.filter((row) => row.status === "OPEN").length,
    };
    return HttpResponse.json(body);
  }),
];

handlers.push(...dashboardHandlers);

/* ---- mock desk below, admins only, reset between tests ---- */

function pageOf<T>(rows: T[]) {
  return {
    content: rows,
    page: 0,
    size: 50,
    totalElements: rows.length,
    totalPages: 1,
    first: true,
    last: true,
  };
}

function requireAdmin(request: Request) {
  const viewer = userFor(request);
  if (!viewer) {
    return { error: bad(401, "UNAUTHORIZED", "authentication required") as Response };
  }
  if (viewer.role !== "ADMIN") {
    return { error: bad(403, "FORBIDDEN", "you may not perform this action") as Response };
  }
  return { viewer };
}

const adminHandlers = [
  http.get("*/admin/users", ({ request }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    /* registered-token aliases the student, the desk lists people once */
    const seen = new Set<string>();
    const people = Object.values(usersByToken).filter((user) => {
      if (seen.has(user.id)) {
        return false;
      }
      seen.add(user.id);
      return true;
    });
    return HttpResponse.json(pageOf(people));
  }),

  http.post("*/admin/users/:id/enable", ({ request, params }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    const found = Object.values(usersByToken).find((u) => u.id === params.id);
    if (!found) {
      return bad(404, "RESOURCE_NOT_FOUND", "user not found");
    }
    found.enabled = true;
    return HttpResponse.json(found);
  }),

  http.post("*/admin/users/:id/disable", ({ request, params }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    const found = Object.values(usersByToken).find((u) => u.id === params.id);
    if (!found) {
      return bad(404, "RESOURCE_NOT_FOUND", "user not found");
    }
    found.enabled = false;
    return HttpResponse.json(found);
  }),

  http.get("*/admin/listings", ({ request }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    return HttpResponse.json(pageOf(mockListings));
  }),

  http.delete("*/admin/listings/:id", ({ request, params }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    const listing = mockListings.find((row) => row.id === params.id);
    if (!listing) {
      return bad(404, "RESOURCE_NOT_FOUND", "listing not found");
    }
    listing.status = "ARCHIVED";
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/community/posts", ({ request }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    return HttpResponse.json(pageOf(mockPosts));
  }),

  http.delete("*/admin/community/posts/:id", ({ request, params }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    const index = mockPosts.findIndex((row) => row.id === params.id);
    if (index < 0) {
      return bad(404, "RESOURCE_NOT_FOUND", "post not found");
    }
    mockPosts.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/support/requests", ({ request }) => {
    const gate = requireAdmin(request);
    if (gate.error) return gate.error;
    return HttpResponse.json(pageOf(mockRequests));
  }),
];

handlers.push(...adminHandlers);
