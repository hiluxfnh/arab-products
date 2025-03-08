import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  collection, 
  addDoc,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { updateCartCount } from './main.js';

// Cart Functions
async function loadCart() {
  const cartItemsDiv = document.getElementById('cartItems');
  const cartTotalSpan = document.getElementById('cartTotal');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  cartItemsDiv.innerHTML = '';
  let total = 0;

  for (const item of cart) {
    const docSnap = await getDoc(doc(db, 'products', item.id));
    if(docSnap.exists()) {
      const product = docSnap.data();
      const price = product.discountPrice || product.originalPrice;
      total += price * item.quantity;
      
      cartItemsDiv.innerHTML += `
        <div class="flex items-center justify-between border-b pb-4">
          <div class="flex items-center gap-4">
            <img src="${product.image}" class="w-20 h-20 object-cover">
            <div>
              <h4 class="font-bold">${product.name}</h4>
              <p class="text-orange-600">₹${price} x ${item.quantity}</p>
            </div>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="text-red-500">
            Remove
          </button>
        </div>
      `;
    }
  }

  cartTotalSpan.textContent = total.toFixed(2);
}

window.removeFromCart = function(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
  updateCartCount();
}

window.checkout = async function() {
  const user = auth.currentUser;
  if(!user) return alert('Please sign in first');
  
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if(cart.length === 0) return alert('Cart is empty');

  try {
    // Create order
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      items: cart,
      total: document.getElementById('cartTotal').textContent,
      status: 'Pending',
      customerInfo: {
        name: document.getElementById('deliveryName').value,
        phone: document.getElementById('deliveryPhone').value,
        address: document.getElementById('deliveryAddress').value
      },
      date: new Date()
    });

    localStorage.removeItem('cart');
    updateCartCount();
    alert('Order placed successfully!');
    window.location.href = 'user.html';
  } catch(error) {
    alert('Checkout failed: ' + error.message);
  }
}

// Initialize Cart Page
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => {
    if(user) {
      loadCart();
      updateCartCount();
    } else {
      window.location.href = 'index.html';
    }
  });
});