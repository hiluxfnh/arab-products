import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Common Functions
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  document.querySelectorAll("#cartCount").forEach(el => {
    el.textContent = cart.length;
  });
}

// Admin Check
async function isAdmin(user) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data().role === "admin";
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}

// Authentication
document.addEventListener('DOMContentLoaded', () => {
  const googleSignInButton = document.getElementById("google-signin");
  const signOutButton = document.getElementById("signout");
  const adminButton = document.getElementById("adminButton");

  // Google Sign-In
  if(googleSignInButton) {
    googleSignInButton.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store user data
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now(),
          role: "user"
        }, { merge: true });

        alert("Welcome back, " + user.displayName + "!");
      } catch (error) {
        console.error("Sign in error:", error);
        alert("Error signing in: " + error.message);
      }
    });
  }

  // Sign Out
  if(signOutButton) {
    signOutButton.addEventListener("click", () => {
      signOut(auth);
      alert("You've been signed out");
    });
  }

  // Admin Button Handler
  adminButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("Please sign in to access the admin panel");
      return;
    }

    if (await isAdmin(user)) {
      window.location.href = "admin.html";
    } else {
      alert("You don't have admin privileges");
    }
  });

  // Auth State Listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById("google-signin").classList.add("hidden");
      document.getElementById("signout").classList.remove("hidden");
      document.getElementById("welcomeMessage").textContent = `Welcome, ${user.displayName || "User"}!`;
      document.getElementById("welcomeMessage").classList.remove("hidden");
    } else {
      document.getElementById("google-signin").classList.remove("hidden");
      document.getElementById("signout").classList.add("hidden");
      document.getElementById("welcomeMessage").classList.add("hidden");
    }
    updateCartCount();
  });
});

// Product Loading
async function loadProducts() {
  const productsContainer = document.getElementById("products");
  if(!productsContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    productsContainer.innerHTML = "";
    
    querySnapshot.forEach(doc => {
      const product = doc.data();
      const orderDeadline = product.lastOrderDate?.toDate().toLocaleDateString();
      
      productsContainer.innerHTML += `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div class="relative">
            <img src="${product.image}" 
                 class="w-full h-48 object-cover"
                 alt="${product.name}"
                 onerror="this.src='https://via.placeholder.com/300'">
            ${orderDeadline ? `
              <div class="absolute top-2 right-2 bg-orange-600 text-white px-3 py-1 rounded-full text-xs">
                Order by: ${orderDeadline}
              </div>
            ` : ''}
          </div>
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-4">${product.description || ''}</p>
            
            <div class="flex justify-between items-center">
              <div>
                ${product.discountPrice ? `
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400 line-through">₹${product.originalPrice}</span>
                    <span class="text-orange-600 font-bold text-lg">₹${product.discountPrice}</span>
                  </div>
                ` : `
                  <span class="text-orange-600 font-bold text-lg">₹${product.originalPrice}</span>
                `}
              </div>
              <button onclick="addToCart('${doc.id}')" 
                      class="bg-orange-100 text-orange-600 px-4 py-2 rounded hover:bg-orange-200">
                <i class="fas fa-cart-plus mr-2"></i>Add
              </button>
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.innerHTML = `<p class="text-red-500">Error loading products. Please refresh the page.</p>`;
  }
}

// Cart Functions
window.addToCart = function(productId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to add items to your cart");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      quantity: 1,
      addedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart!");
}

// Initialize
updateCartCount();
loadProducts();