import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

export const auth = getAuth(initializeApp(firebaseConfig));
export const db = getFirestore(auth.app);
const storage = getStorage(auth.app);
export { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, runTransaction, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut };

async function compressImage(file, maxBytes, dimensions) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  try {
    for (const maxDimension of dimensions) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.84, 0.78, 0.72]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= maxBytes) return blob;
      }
    }
    throw new Error("This image could not be compressed enough. Choose a smaller image.");
  } finally {
    bitmap.close();
  }
}

export async function uploadImage(file) {
  const blob = await compressImage(file, 650 * 1024, [1800, 1500, 1200]);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(blob);
  });
}

export async function uploadProductImage(file, sellerId) {
  const blob = await compressImage(file, 260 * 1024, [1200, 1000, 800]);
  const imageRef = storageRef(storage, `products/${sellerId}/${crypto.randomUUID()}.jpg`);
  await uploadBytes(imageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(imageRef);
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const list = async q => (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
const catalogCachePrefix = "cht-jummo:catalog:";
const catalogCacheTtl = 2 * 60 * 1000;
const catalogCacheLimit = 2 * 1024 * 1024;

export async function listCatalog(cacheName, q, onUpdate) {
  const cacheKey = catalogCachePrefix + cacheName;
  let cached = null;
  try {
    const entry = JSON.parse(localStorage.getItem(cacheKey));
    if (Array.isArray(entry?.items)) cached = entry;
  } catch {
    try { localStorage.removeItem(cacheKey); } catch { }
  }

  if (cached) {
    onUpdate(cached.items);
    if (Date.now() - cached.savedAt < catalogCacheTtl) return cached.items;
  }

  try {
    const items = await list(q);
    onUpdate(items);
    try {
      if (items.every(item => typeof item.imageUrl !== "string" || !item.imageUrl.startsWith("data:"))) {
        const serialized = JSON.stringify({ savedAt: Date.now(), items });
        if (serialized.length <= catalogCacheLimit) localStorage.setItem(cacheKey, serialized);
        else localStorage.removeItem(cacheKey);
      } else localStorage.removeItem(cacheKey);
    } catch { }
    return items;
  } catch (error) {
    if (cached) return cached.items;
    throw error;
  }
}

export function invalidateCatalogCache(...cacheNames) {
  try {
    cacheNames.forEach(name => localStorage.removeItem(catalogCachePrefix + name));
  } catch { }
}

export const money = n => "৳" + Number(n || 0).toLocaleString();

export function renderNav(p) {
  const a = (h, t) => `<li class="nav-item"><a class="nav-link" href="${h}">${t}</a></li>`;
  let l = a("products.html", "Products");
  if (p) l += a(p.role === "admin" ? "admin.html" : "dashboard.html", "Dashboard") + a("profile.html", "Profile") + `<li class="nav-item"><a class="nav-link" href="#" id="out">Log out (${esc(p.name)})</a></li>`;
  else l += a("login.html", "Log in") + a("register.html", "Register");
  document.getElementById("nav").innerHTML = `<nav class="navbar navbar-expand-md bg-white border-bottom"><div class="container"><a class="navbar-brand brand" href="index.html"><img src="images/logo.png" alt="" aria-hidden="true">CHT Jummo Marketplace</a><button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#mn" aria-label="Menu"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="mn"><ul class="navbar-nav ms-auto">${l}</ul></div></div></nav>`;
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = `<div class="site-footer-main"><div class="container"><div class="row g-4">
    <div class="col-md-5"><a class="footer-brand" href="index.html">CHT Jummo Marketplace</a><p class="footer-copy mb-0">A marketplace connecting buyers with farmers and artisans across the Chittagong Hill Tracts.</p></div>
    <div class="col-6 col-md-3"><h2 class="footer-heading">Explore</h2><a href="products.html">Browse products</a><a href="register.html">Join the marketplace</a><a href="login.html">Account login</a></div>
    <div class="col-6 col-md-2"><h2 class="footer-heading">Location</h2><p class="footer-copy">Chittagong Hill Tracts<br>Bangladesh</p></div>
    <div class="col-md-2"><h2 class="footer-heading">Follow</h2><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube</a></div>
  </div></div></div><div class="site-footer-bottom"><div class="container">&copy; ${new Date().getFullYear()} CHT Jummo Marketplace</div></div>`;
  const out = document.getElementById("out");
  if (out) out.onclick = async e => { e.preventDefault(); await signOut(auth); location.href = "index.html"; };
}

// Calls cb(profile|null) once the signed-in user's profile is loaded.
export function onUser(cb) {
  onAuthStateChanged(auth, async u => {
    let p = null;
    if (u) { const s = await getDoc(doc(db, "users", u.uid)); if (s.exists()) p = { uid: u.uid, ...s.data() }; }
    renderNav(p); cb(p);
  });
}
// Redirects to login unless the user has one of the allowed roles.
export function guard(roles, cb) {
  onUser(p => { if (!p || !roles.includes(p.role)) location.href = "login.html"; else cb(p); });
}
export const say = (el, text, ok) => { el.innerHTML = `<div class="alert alert-${ok ? "success" : "danger"}">${esc(text)}</div>`; };
export const badge = s => `<span class="badge text-bg-${{ Pending: "warning", Accepted: "info", Completed: "success", Rejected: "danger", Cancelled: "secondary", Approved: "success" }[s] || "secondary"}">${esc(s)}</span>`;
export const card = (p, extra = "") => `<div class="col-6 col-md-4 col-lg-3"><div class="card h-100"><img src="${esc(p.imageUrl)}" class="card-img-top" alt="${esc(p.name)}" loading="lazy" decoding="async"><div class="card-body d-flex flex-column gap-1"><h3 class="h6 mb-0">${esc(p.name)}</h3><span class="badge text-bg-light align-self-start">${esc(p.categoryName)}</span><span class="fw-bold text-success">${money(p.price)}</span><small class="text-muted">by ${esc(p.sellerName)}</small>${extra}</div></div></div>`;
