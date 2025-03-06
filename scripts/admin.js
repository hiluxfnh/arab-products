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
  getDoc
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

// Elements
const loading = document.getElementById('loading');
const adminContent = document.getElementById('adminContent');

// Enhanced Admin Check
async function isAdmin(user) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    return userDoc.exists() && userDoc.data().role === "admin";
  } catch (error) {
    console.error("Admin check failed:", error);
    return false;
  }
}

// Load Admin Data
async function loadAdminPanel() {
  try {
    // Load Orders
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = ordersSnapshot.docs.map(doc => `
      <div class="border rounded p-4 mb-4 bg-gray-50">
        <p class="font-bold text-orange-600">Order #${doc.id.slice(0,6)}</p>
        <p class="text-sm">Date: ${doc.data().date?.toDate().toLocaleDateString()}</p>
        <p>Status: <span class="font-medium">${doc.data().status}</span></p>
        <p>Total: ₹${doc.data().total}</p>
      </div>
    `).join('');

    // Load Products
    const productsSnapshot = await getDocs(collection(db, "products"));
    const productsList = document.getElementById("adminProducts");
    productsList.innerHTML = productsSnapshot.docs.map(doc => `
      <div class="border rounded p-4 mb-4 bg-gray-50">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold">${doc.data().name}</p>
            <p class="text-orange-600">₹${doc.data().price}</p>
          </div>
          <button onclick="deleteProduct('${doc.id}')" 
                  class="text-red-500 hover:text-red-700">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <img src="${doc.data().image}" 
             class="mt-2 w-full h-32 object-cover rounded"
             onerror="this.style.display='none'">
      </div>
    `).join('');
  } catch (error) {
    console.error("Failed to load admin data:", error);
    alert("Error loading admin panel. Check console for details.");
  }
}

// Initialize Admin Page
document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.includes("admin.html")) return;

  // Initial state
  loading.classList.remove('hidden');
  adminContent.classList.add('hidden');

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    try {
      const adminStatus = await isAdmin(user);
      
      if (adminStatus) {
        // Show admin content
        loading.classList.add('hidden');
        adminContent.classList.remove('hidden');
        document.getElementById("adminEmail").textContent = user.email;
        
        // Load data
        await loadAdminPanel();

        // Add product handler
        document.getElementById("addProductForm").addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          
          try {
            await addDoc(collection(db, "products"), {
              name: formData.get("name"),
              price: Number(formData.get("price")),
              image: formData.get("image"),
              description: formData.get("description"),
              createdAt: new Date()
            });
            alert("Product added successfully!");
            e.target.reset();
            await loadAdminPanel();
          } catch (error) {
            console.error("Product add failed:", error);
            alert("Failed to add product. Check console.");
          }
        });

        // Sign out handler
        document.getElementById("signout").addEventListener("click", () => {
          signOut(auth);
        });
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      window.location.href = "index.html";
    }
  });
});

// Delete Product
window.deleteProduct = async (productId) => {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  try {
    await deleteDoc(doc(db, "products", productId));
    await loadAdminPanel();
    alert("Product deleted successfully!");
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete product. Check console.");
  }
};