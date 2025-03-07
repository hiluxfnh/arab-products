import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc
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
const provider = new GoogleAuthProvider();

// Login elements
const loading = document.getElementById('loading');
const adminContent = document.getElementById('adminContent');
const authContainer = document.createElement('div');

// Create login UI
function showLoginButton() {
  authContainer.className = "min-h-screen flex items-center justify-center";
  authContainer.innerHTML = `
    <button id="loginBtn" class="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 text-lg">
      <i class="fab fa-google mr-2"></i>Sign In with Google
    </button>
  `;
  document.body.appendChild(authContainer);
  
  document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  });
}

// Check user authentication
async function checkAuth() {
  loading.classList.remove('hidden');
  adminContent.classList.add('hidden');

  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        role: "user",
        lastLogin: new Date()
      }, { merge: true });
    }
  } catch (error) {
    alert('Authentication error: ' + error.message);
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          loading.classList.add('hidden');
          adminContent.classList.remove('hidden');
          document.getElementById('adminEmail').textContent = user.email;
          setupAdminPanel();
        } else {
          await signOut(auth);
          alert('You are not an admin!');
          showLoginButton();
        }
      } catch (error) {
        alert('Error checking admin status: ' + error.message);
        await signOut(auth);
        showLoginButton();
      }
    } else {
      loading.classList.add('hidden');
      showLoginButton();
    }
  });
}

// Admin panel setup
async function setupAdminPanel() {
  // Load initial data
  await loadAdminPanel();

  // Sign out handler
  document.getElementById('signout').addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      alert('Sign out error: ' + error.message);
    }
  });

  // Product form handler
  document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const imageFile = document.getElementById('productImage').files[0];

    try {
      if (!imageFile) throw new Error('Please select an image');
      if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
        throw new Error('Only JPG/PNG images allowed');
      }

      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      const base64Image = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      if (base64Image.length > 700000) {
        throw new Error('Image too large! Max 500KB');
      }

      await addDoc(collection(db, "products"), {
        name: formData.get('name'),
        originalPrice: Number(formData.get('originalPrice')),
        discountPrice: formData.get('discountPrice') ? Number(formData.get('discountPrice')) : null,
        lastOrderDate: new Date(formData.get('lastOrderDate')),
        description: formData.get('description'),
        image: base64Image,
        createdAt: new Date()
      });

      alert('Product added successfully!');
      e.target.reset();
      await loadAdminPanel();
    } catch (error) {
      alert('Error adding product: ' + error.message);
    }
  });

  // Image preview
  document.getElementById('productImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    if (file) {
      preview.classList.remove('hidden');
      preview.querySelector('img').src = URL.createObjectURL(file);
    }
  });
}

// Load products and orders
async function loadAdminPanel() {
  try {
    // Load orders
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = ordersSnapshot.docs.map(doc => `
      <div class="border rounded p-4 mb-4 bg-gray-50">
        <p class="font-bold text-orange-600">Order #${doc.id.slice(0,6)}</p>
        <p class="text-sm">Date: ${doc.data().date?.toDate().toLocaleDateString()}</p>
        <p>Status: <span class="font-medium">${doc.data().status}</span></p>
        <p>Total: ₹${doc.data().total}</p>
      </div>
    `).join('');

    // Load products
    const productsSnapshot = await getDocs(collection(db, "products"));
    const productsList = document.getElementById('adminProducts');
    productsList.innerHTML = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      return `
        <div class="border rounded p-4 mb-4 bg-gray-50">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">${product.name}</p>
              ${product.discountPrice ? `
                <div class="flex gap-2 items-center">
                  <span class="text-gray-400 line-through">₹${product.originalPrice}</span>
                  <span class="text-orange-600 font-bold">₹${product.discountPrice}</span>
                </div>
              ` : `
                <span class="text-orange-600 font-bold">₹${product.originalPrice}</span>
              `}
              ${product.lastOrderDate ? `
                <p class="text-sm mt-1 text-gray-500">
                  Order by: ${product.lastOrderDate.toDate().toLocaleDateString()}
                </p>
              ` : ''}
            </div>
            <button onclick="deleteProduct('${doc.id}')" 
                    class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <img src="${product.image}" 
               class="mt-2 w-full h-32 object-cover rounded"
               alt="${product.name}">
        </div>
      `;
    }).join('');
  } catch (error) {
    alert('Error loading data: ' + error.message);
  }
}

// Delete product function
window.deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await deleteDoc(doc(db, "products", productId));
    await loadAdminPanel();
    alert('Product deleted successfully!');
  } catch (error) {
    alert('Delete failed: ' + error.message);
  }
};

// Start the application
document.addEventListener('DOMContentLoaded', checkAuth);