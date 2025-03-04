// Firebase Config (Replace with your project’s config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); // Add this line

// Google Sign-In
const googleSignInButton = document.getElementById("google-signin");
googleSignInButton.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth
    .signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      alert(`Welcome, ${user.displayName}!`);
      document.getElementById("products").style.display = "block"; // Show products
    })
    .catch((error) => {
      console.error("Error signing in:", error);
    });
});

// Check if user is already signed in
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("products").style.display = "block"; // Show products
    googleSignInButton.style.display = "none"; // Hide sign-in button
  } else {
    document.getElementById("products").style.display = "none"; // Hide products
    googleSignInButton.style.display = "block"; // Show sign-in button
  }
});

// Fetch and display products
db.collection("products")
  .get()
  .then((querySnapshot) => {
    const productsDiv = document.getElementById("products");
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      productsDiv.innerHTML += `
        <div class="product">
          <h3>${product.name}</h3>
          <img src="${product.image}" width="200">
          <p>Price: ₹${product.price}</p>
          <button onclick="addToCart('${doc.id}')">Add to Cart</button>
        </div>
      `;
    });
  });

// Add to Cart (Store in localStorage)
function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push(productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}
