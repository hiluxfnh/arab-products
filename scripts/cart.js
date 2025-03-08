// cart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { initializeHeader, updateCartCount } from "./header.js";

// Initialize Firebase
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

// Initialize header and cart count
initializeHeader();
updateCartCount();

// Load cart when page loads
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      loadCart();
    }
  });
});

async function loadCart() {
  const cartItemsDiv = document.getElementById('cartItems');
  const cartTotalSpan = document.getElementById('cartTotal');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  cartItemsDiv.innerHTML = '';
  let total = 0;

  try {
    // Get all products in cart
    for (const item of cart) {
      const docRef = doc(db, 'products', item.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const product = docSnap.data();
        const price = product.discountPrice || product.originalPrice;
        total += price * item.quantity;
        
        cartItemsDiv.innerHTML += `
          <div class="flex items-center justify-between border-b pb-4">
            <div class="flex items-center gap-4 flex-1">
              <img src="${product.image}" 
                   class="w-20 h-20 object-cover rounded"
                   alt="${product.name}"
                   onerror="this.src='https://via.placeholder.com/100'">
              <div>
                <h4 class="font-bold">${product.name}</h4>
                <p class="text-orange-600 font-medium">
                  ₹${price.toFixed(2)} 
                  <span class="text-gray-500 text-sm">x ${item.quantity}</span>
                </p>
              </div>
            </div>
            <button onclick="removeFromCart('${item.id}')" 
                    class="text-red-500 hover:text-red-700 ml-4">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
      }
    }

    if (cart.length === 0) {
      cartItemsDiv.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-shopping-cart text-4xl mb-4"></i>
          <p>Your cart is empty</p>
        </div>
      `;
    }

    cartTotalSpan.textContent = total.toFixed(2);
  } catch (error) {
    console.error('Error loading cart:', error);
    alert('Error loading cart items');
  }
}

// Remove item from cart
window.removeFromCart = function(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  loadCart();
  alert('Item removed from cart');
}

// Checkout function
window.checkout = async function() {
  const user = auth.currentUser;
  if (!user) return alert('Please sign in to checkout');

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) return alert('Your cart is empty');

  try {
    // Create order document
    const orderRef = await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      items: cart,
      total: document.getElementById('cartTotal').textContent,
      date: new Date(),
      status: 'Pending',
      deliveryAddress: document.getElementById('deliveryAddress').value
    });

    localStorage.removeItem('cart');
    updateCartCount();
    alert(`Order placed successfully! Order ID: ${orderRef.id}`);
    window.location.href = 'user.html';
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error processing order');
  }
}