# CHT Jummo Marketplace

A web marketplace where farmers and artisans of the Chittagong Hill Tracts list handloom, bamboo products and produce, and buyers send order requests.

## Features
- Bootstrap 5 responsive UI
- Seller identity verification: sellers upload ID photos, the admin approves or rejects (with a reason), and only approved sellers can list products
- Product listings use direct image uploads instead of external image links
- Landing page, product browsing with search, category and price filters
- Registration and login with email verification and three roles: **Buyer**, **Seller**, **Admin**
- Role-based access (page guards in JS and Firestore security rules in `firestore.rules`)
- Seller dashboard: product CRUD, accept / reject / complete order requests
- Buyer dashboard: order requests with status tracking and cancel
- Admin panel: review seller verifications, manage categories, remove products, order reports
- Profile editing, responsive layout

## Tech
HTML, CSS, Bootstrap 5, JavaScript (ES modules) · Firebase Authentication · Cloud Firestore · Hosted on Vercel / GitHub Pages

## Database (Firestore)
`users`, `verifications`, `categories`, `products`, `orders` (each order holds one product, its quantity, status and buyer/seller info).

## Run locally
1. Create a Firebase project, add a **Web app**, and paste its config into `js/firebase-config.js`.
2. Enable **Authentication > Email/Password** and create **Firestore Database**. Keep Firebase Authentication's email verification template enabled.
3. Copy `firestore.rules` into Firestore > Rules and publish. Users must verify their email before accessing marketplace data. Image uploads are compressed in the browser and saved in Firestore; Firebase Storage is not required.
4. Serve the folder (ES modules need a server): `npx serve .` or VS Code Live Server.
5. Register an account, then in the Firestore console open `users/<uid>` and set `role` to `admin` for your admin user.
6. Log in as admin and add some categories. Register a seller, approve them in the admin panel, and add products.

## Deploy
Push to GitHub, import the repo in Vercel (framework: Other, no build command), or enable GitHub Pages. Then add your live domain under Firebase > Authentication > Settings > Authorized domains.

## Screenshots
(add after running the app)

## Future improvements
Multi-item cart, notifications, payment integration, Bengali / Chakma language option.
