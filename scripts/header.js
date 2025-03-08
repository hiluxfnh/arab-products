// scripts/header.js

// Initialize Firebase (shared across all pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN_oSzm9sBsYBl2v7WrDe2KHQV-cbjnUA",
  authDomain: "arabicproductsindia.firebaseapp.com",
  projectId: "arabicproductsindia",
  storageBucket: "arabicproductsindia.appspot.com",
  messagingSenderId: "337959070143",
  appId: "1:337959070143:web:115c4cb3bc20df9f21590a",
  measurementId: "G-TPF2YLXP5N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create and manage the header
export function initializeHeader() {
  // Create header HTML
  const headerHTML = `
  <header class="bg-white shadow-md">
    <nav class="container mx-auto p-4 flex justify-between items-center">
      <a href="index.html" class="text-2xl font-bold text-orange-600">بيت العرب في الهند | The Arab Home in India</a>
      <div class="flex items-center gap-6">
        <div id="welcomeMessage" class="hidden text-gray-700 font-medium"></div>
        <a href="cart.html" class="flex items-center text-gray-700 hover:text-orange-600">
          <i class="fas fa-shopping-cart mr-1"></i>
          <span id="cartCount" class="bg-orange-100 px-2 rounded-full">0</span>
        </a>
        <button id="signout" class="hidden bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
          Sign Out
        </button>
      </div>
    </nav>
  </header>`;
  
  // Insert header at top of page
  document.body.insertAdjacentHTML('afterbegin', headerHTML);
  
  // Add signout functionality
  document.getElementById('signout')?.addEventListener('click', () => {
    signOut(auth).then(() => {
      localStorage.removeItem("cart");
      window.location.href = "index.html";
    });
  });

  // Update auth state for all pages
  onAuthStateChanged(auth, (user) => {
    const welcomeMsg = document.getElementById('welcomeMessage');
    const signoutBtn = document.getElementById('signout');
    
    if (user) {
      welcomeMsg.textContent = `Welcome, ${user.displayName || "User"}!`;
      welcomeMsg.classList.remove("hidden");
      signoutBtn.classList.remove("hidden");
    } else {
      welcomeMsg.classList.add("hidden");
      signoutBtn.classList.add("hidden");
    }
  });
}

// Cart count updater for all pages
export function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("#cartCount").forEach(el => {
    el.textContent = count;
  });
}