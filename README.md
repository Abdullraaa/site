# UN533N E-Commerce Platform: Architecture & Development Plan

This document outlines the complete architecture, design, and implementation plan for the un533n e-commerce platform.

## 1. Overview

un533n is a minimalist clothing brand with a streetwear-inspired aesthetic. This project will create a full-stack e-commerce solution that is performant, scalable, and optimized for SEO. The platform will feature a unique WhatsApp-based checkout system.

- **Frontend:** Next.js (React) with Tailwind CSS and Framer Motion
- **Backend:** Node.js with Express.js
- **Database:** MySQL
- **Hosting:** Hostinger

## 2. Architecture Diagram

```
[Frontend (Next.js on Vercel/Hostinger)] <--> [Backend API (Node.js/Express on Hostinger)] <--> [MySQL Database on Hostinger]
       |                                          |
       |                                          v
       +-----------------------------------> [WhatsApp API]
       |
       v
[Analytics (Google Analytics)]
```

## 3. Front-End Plan

The front-end will be built with Next.js to leverage Server-Side Rendering (SSR) for optimal SEO and performance.

### Folder Structure:

```
/frontend
├── /src
│   ├── /app
│   │   ├── /(pages)
│   │   │   ├── /products
│   │   │   │   ├── /[slug]
│   │   │   │   │   └── page.tsx  // Product Detail Page
│   │   │   │   └── page.tsx      // Product Listing Page
│   │   │   ├── /cart
│   │   │   │   └── page.tsx      // Shopping Cart
│   │   │   ├── /checkout
│   │   │   │   └── page.tsx      // Checkout Page
│   │   │   └── page.tsx          // Homepage
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── /components
│   │   ├── /ui                 // Reusable UI elements (buttons, inputs)
│   │   ├── /layout             // Header, Footer, etc.
│   │   ├── /product            // Product cards, carousels
│   │   └── /cart               // Cart components
│   ├── /lib                  // Helper functions, API client
│   └── /styles               // Global styles
├── next.config.js
└── package.json
```

### Key Features:

- **Responsive Design:** Mobile-first design with Tailwind CSS.
- **Minimalist UI:** Black and white theme with bold typography.
- **Subtle Animations:** Framer Motion for micro-interactions.
- **Component-Based:** Reusable components for consistency.

## 4. Back-End Plan

The back-end will be a Node.js application using the Express.js framework, providing a RESTful API for the front-end.

### Folder Structure:

```
/backend
├── /src
│   ├── /api
│   │   ├── /controllers        // Request handling logic
│   │   ├── /middleware         // Auth, error handling
│   │   └── /routes             // API routes
│   ├── /config               // Database, environment variables
│   ├── /models               // Database models
│   ├── /services             // Business logic
│   ├── app.js                // Express app setup
│   └── server.js             // Server entry point
└── package.json
```

### API Endpoints:

- `GET /api/products`: Get all products.
- `GET /api/products/:id`: Get a single product.
- `POST /api/orders`: Create a new order.
- `GET /api/reviews`: Get product reviews.
- `POST /api/reviews`: Create a new review.

## 5. Database Schema

A MySQL database will be used to store data for users, products, orders, and reviews.

**`users` table:**

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `password` (VARCHAR, NOT NULL)
- `created_at` (TIMESTAMP)

**`products` table:**

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR, NOT NULL)
- `description` (TEXT)
- `price` (DECIMAL)
- `image_url` (VARCHAR)
- `created_at` (TIMESTAMP)

**`orders` table:**

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY)
- `total` (DECIMAL)
- `status` (VARCHAR) // e.g., "pending", "confirmed"
- `whatsapp_link` (VARCHAR)
- `created_at` (TIMESTAMP)

**`reviews` table:**

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `product_id` (INT, FOREIGN KEY)
- `user_id` (INT, FOREIGN KEY)
- `rating` (INT)
- `comment` (TEXT)
- `created_at` (TIMESTAMP)

## 6. UI/UX Design Details

### Homepage:

- Hero section with a full-screen video or bold image.
- Featured products grid.
- Instagram feed integration.
- Customer testimonials section.

### Product Page:

- High-quality product images with zoom.
- Detailed product description.
- "Add to Cart" button.
- Social proof elements (reviews, ratings).

### Checkout Flow:

1.  User reviews items in the cart.
2.  User clicks "Checkout with WhatsApp".
3.  A pre-filled WhatsApp message is generated with the order summary.
4.  User sends the message to the un533n business number.
5.  Order is confirmed manually via WhatsApp.

## 7. SEO & Performance Plan

- **Metadata:** Unique titles and meta descriptions for each page.
- **URL Structure:** Clean, descriptive URLs (e.g., `/products/minimalist-hoodie`).
- **Image Optimization:** Compress images and use next/image for optimization.
- **Schema Markup:** Use JSON-LD for product and review schema.
- **Analytics:** Integrate Google Analytics.

## 8. Deployment Steps (Hostinger)

1.  **Hostinger Setup:**
    - Sign up for a Hostinger plan that supports Node.js and MySQL.
    - Create a MySQL database and note the credentials.
2.  **Environment Variables:**
    - Copy `.env.template` to `.env` and fill values:
      - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `WHATSAPP_NUMBER`.
3.  **Backend Deployment:**
    - `cd backend && npm ci && npm run build`
    - Run migrations: `npm run migrate`
    - Start server: `npm start` (ensure port `4000` open on Hostinger)
4.  **Frontend Deployment:**
    - `cd frontend && npm ci && npm run build`
    - Serve with Node: `npm start` or deploy statically behind Node adapter.
    - Set `NEXT_PUBLIC_API_BASE` if using a custom API URL.
4.  **Domain & DNS:**
    - Point your domain to the front-end deployment.
    - Configure a subdomain for the backend API if needed.

## 9. CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml`:
- Installs dependencies (backend, frontend)
- Starts MySQL service, runs migrations
- Executes backend smoke tests
- Builds frontend

## 10. Optional Enhancements

- **CI/CD Pipeline:** Use GitHub Actions to automate testing and deployment.
- **Internationalization:** Add support for multiple languages and currencies.
- **Customer Accounts:** Allow users to create accounts to view order history.
- **Content Management System (CMS):** Use a headless CMS like Strapi or Sanity to manage products and content.