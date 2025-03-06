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

// Cart Functions
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  document.querySelectorAll("#cartCount").forEach(el => {
    el.textContent = cart.length;
  });
}

async function loadCart() {
  const cartItemsDiv = document.getElementById('cartItems');
  const cartTotalSpan = document.getElementById('cartTotal');
  const checkoutTotalSpan = document.getElementById('checkoutTotal');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  cartItemsDiv.innerHTML = '';
  let total = 0;

  try {
    for (const productId of cart) {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const product = docSnap.data();
        total += Number(product.price);
        
        cartItemsDiv.innerHTML += `
          <div class="flex items-center justify-between border-b pb-4">
            <div class="flex items-center gap-4 flex-1">
              <img src="${product.image}" 
                   class="w-20 h-20 object-cover rounded"
                   alt="${product.name}"
                   onerror="this.src='https://via.placeholder.com/100'">
              <div>
                <h4 class="font-bold">${product.name}</h4>
                <p class="text-orange-600 font-medium">₹${product.price}</p>
              </div>
            </div>
            <button onclick="removeFromCart('${productId}')" 
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
    checkoutTotalSpan.textContent = total.toFixed(2);
  } catch (error) {
    console.error('Error loading cart:', error);
    alert('Error loading cart items');
  }
}

window.removeFromCart = function(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(id => id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  loadCart();
  alert('Item removed from cart');
}

window.checkout = async function() {
  const user = auth.currentUser;
  if (!user) {
    alert('Please sign in to checkout');
    window.location.href = 'index.html';
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }

  try {
    // Calculate total and get items
    let total = 0;
    const items = [];
    for (const productId of cart) {
      const docSnap = await getDoc(doc(db, 'products', productId));
      if (docSnap.exists()) {
        const product = docSnap.data();
        total += Number(product.price);
        items.push({
          id: productId,
          name: product.name,
          price: product.price
        });
      }
    }

    // Create Razorpay order
    const options = {
      key: 'YOUR_RAZORPAY_KEY',
      amount: total * 100,
      currency: 'INR',
      name: 'Arab Home India',
      description: 'Order Payment',
      prefill: {
        name: user.displayName,
        email: user.email
      },
      handler: async function(response) {
        try {
          await addDoc(collection(db, 'orders'), {
            userId: user.uid,
            items: items,
            total: total,
            date: new Date(),
            status: 'Paid',
            paymentId: response.razorpay_payment_id
          });

          localStorage.removeItem('cart');
          updateCartCount();
          alert('Payment successful! Order placed.');
          window.location.href = 'user.html';
        } catch (error) {
          console.error('Order save error:', error);
          alert('Payment verification failed');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error processing checkout');
  }
}

// Initialize Cart Page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('cart.html')) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        loadCart();
        updateCartCount();
      } else {
        window.location.href = 'index.html';
      }
    });
  }
});