import { auth, db } from './firebase.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Common Functions
export function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("#cartCount").forEach(el => el.textContent = count);
}

// Authentication
document.addEventListener('DOMContentLoaded', () => {
  const googleSignInButton = document.getElementById("google-signin");
  const signOutButton = document.getElementById("signout");

  // Google Sign-In
  if(googleSignInButton) {
    googleSignInButton.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: "user",
          createdAt: new Date()
        }, { merge: true });

        alert("Welcome back, " + user.displayName + "!");
      } catch (error) {
        alert("Error signing in: " + error.message);
      }
    });
  }

  // Sign Out
  if(signOutButton) {
    signOutButton.addEventListener("click", () => {
      signOut(auth).then(() => {
        localStorage.removeItem("cart");
        window.location.href = 'index.html';
      });
    });
  }

  // Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    const welcomeMessage = document.getElementById("welcomeMessage");
    if (user) {
      document.getElementById("google-signin")?.classList.add("hidden");
      document.getElementById("signout")?.classList.remove("hidden");
      if(welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.displayName || "User"}!`;
        welcomeMessage.classList.remove("hidden");
      }
    } else {
      document.getElementById("google-signin")?.classList.remove("hidden");
      document.getElementById("signout")?.classList.add("hidden");
      if(welcomeMessage) welcomeMessage.classList.add("hidden");
    }
    updateCartCount();
  });
});

// Product Loading
export async function loadProducts() {
  const productsContainer = document.getElementById("products");
  if(!productsContainer) return;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    productsContainer.innerHTML = snapshot.docs.map(doc => {
      const product = doc.data();
      const price = product.discountPrice || product.originalPrice;
      
      return `
        <div class="bg-white rounded-lg shadow-md p-4">
          <img src="${product.image}" class="w-full h-48 object-cover mb-4">
          <h3 class="font-bold text-lg">${product.name}</h3>
          <p class="text-orange-600 font-bold text-xl my-2">₹${price}</p>
          <button onclick="addToCart('${doc.id}')" class="bg-orange-100 text-orange-600 w-full py-2 rounded">
            Add to Cart
          </button>
        </div>
      `;
    }).join('');
  } catch (error) {
    productsContainer.innerHTML = `<p>Error loading products</p>`;
  }
}

// Cart Functions
window.addToCart = function(productId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(item => item.id === productId);
  
  if(existing) {
    existing.quantity++;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart!");
}