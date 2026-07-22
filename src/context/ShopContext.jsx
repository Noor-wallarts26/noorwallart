import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';

export const ShopContext = createContext();

const initialProducts = [
  { id: 1, title: "Apex Wireless Headphones", description: "Over-ear active noise cancelling headphones with rich, immersive spatial audio and up to 40 hours of battery life.", price: 129.99, category: "Electronics", rating: 4.8, reviewsCount: 1240, stock: 15, isWishlisted: false },
  { id: 2, title: "Quantum Smartwatch Pro", description: "Water-resistant health and fitness smartwatch with AMOLED screen, advanced sleep score, stress level index, and 14-day battery.", price: 199.99, category: "Electronics", rating: 4.5, reviewsCount: 850, stock: 10, isWishlisted: false },
  { id: 3, title: "Vivid View 4K Projector", description: "Ultra-bright portable smart projector featuring built-in streaming apps, keystone auto-correction, and dual stereo speakers.", price: 349.50, category: "Electronics", rating: 4.6, reviewsCount: 430, stock: 5, isWishlisted: false },
  { id: 4, title: "Urban Nomad Denim Jacket", description: "Classic premium cotton denim jacket with modern relaxed silhouette, reinforced stitching, and multi-pocket design.", price: 59.99, category: "Fashion", rating: 4.4, reviewsCount: 340, stock: 20, isWishlisted: false },
  { id: 5, title: "ActiveFit Breathable Sneakers", description: "Ultra lightweight running shoes designed with premium shock-absorption soles and breathable knit upper material.", price: 74.95, category: "Fashion", rating: 4.7, reviewsCount: 1120, stock: 12, isWishlisted: false },
  { id: 6, title: "Nomad Canvas Backpack", description: "Rugged, water-resistant canvas travel daypack featuring dedicated 15-inch laptop sleeve and anti-theft zipper compartments.", price: 45.00, category: "Fashion", rating: 4.3, reviewsCount: 190, stock: 25, isWishlisted: false },
  { id: 7, title: "The Infinite Code", description: "A gripping sci-fi technothriller about an underground network of programmers uncovering a quantum AI conspiracy. A national bestseller.", price: 14.99, category: "Books", rating: 4.9, reviewsCount: 520, stock: 30, isWishlisted: false },
  { id: 8, title: "Atomic Habits & Mindsets", description: "Practical framework to design high-performance routines, break bad behaviors, and build remarkable lifelong positive systems.", price: 18.90, category: "Books", rating: 4.8, reviewsCount: 2340, stock: 40, isWishlisted: false },
  { id: 9, title: "Barista Express Espresso Maker", description: "Commercial grade espresso extraction machine with built-in adjustable grinder, precise milk steam wand, and temperature control.", price: 299.99, category: "Home", rating: 4.7, reviewsCount: 670, stock: 4, isWishlisted: false },
  { id: 10, title: "Smart Ambient LED Lamp", description: "Sleek magnetic bedside lamp featuring app control, custom schedule routines, millions of ambient light colors, and phone wireless charging.", price: 39.99, category: "Home", rating: 4.5, reviewsCount: 1150, stock: 18, isWishlisted: false },
  { id: 11, title: "Organic Glow Skin Serum", description: "Nourishing, dermatologically tested skin defense serum infused with organic Vitamin C, hyaluronic acid, and cold-pressed botanical extracts.", price: 24.99, category: "Beauty", rating: 4.6, reviewsCount: 1420, stock: 22, isWishlisted: false },
  { id: 12, title: "Essential Oil Diffuser Set", description: "Quiet ultrasonic wooden-styled humidifier paired with 6 essential oils including Lavender, Peppermint, Tea Tree, and Eucalyptus.", price: 32.50, category: "Beauty", rating: 4.4, reviewsCount: 890, stock: 15, isWishlisted: false }
];

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState({ whatsapp: '' });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch products from Firestore
  useEffect(() => {
    import('firebase/firestore').then(({ collection, onSnapshot }) => {
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Preserve wishlist state from local storage since it's user-specific
        const savedWishlistIds = localStorage.getItem('wishlistIds');
        const wishlistIds = savedWishlistIds ? JSON.parse(savedWishlistIds) : [];
        
        const finalProducts = productsData.map(p => ({
          ...p,
          isWishlisted: wishlistIds.includes(p.id)
        }));
        
        setProducts(finalProducts);
      }, (error) => {
        console.error("Error fetching products: ", error);
        // Fallback to initial products if Firestore fails (e.g. rules issues)
        setProducts(initialProducts);
      });
      return () => unsubscribe();
    });
  }, []);

  // Fetch store settings from Firestore
  useEffect(() => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsubscribe = onSnapshot(doc(db, "settings", "storeInfo"), (docSnap) => {
        if (docSnap.exists()) {
          setStoreSettings(docSnap.data());
        }
      });
      return () => unsubscribe();
    });
  }, []);

  // Load cart and orders from local storage if available
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    const wishlistIds = products.filter(p => p.isWishlisted).map(p => p.id);
    localStorage.setItem('wishlistIds', JSON.stringify(wishlistIds));
  }, [products]);

  const toggleWishlist = (productId) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, isWishlisted: !p.isWishlisted } : p
    ));
  };

  const addToCart = (productId, quantity = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity <= product.stock) {
          return prev.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item);
        }
        return prev;
      } else {
        if (quantity <= product.stock) {
          return [...prev, { productId, quantity }];
        }
        return prev;
      }
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && quantity <= product.stock) {
      setCartItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const placeOrder = () => {
    if (cartItems.length === 0) return null;

    const cartWithProducts = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { product, quantity: item.quantity };
    }).filter(i => i.product);

    const total = cartWithProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const summary = cartWithProducts.map(item => `${item.product.title} (x${item.quantity})`).join(", ");

    const orderId = "AMZ" + Math.floor(100000 + Math.random() * 900000);
    const order = {
      id: orderId,
      timestamp: Date.now(),
      totalPrice: total,
      itemsSummary: summary,
      status: "Processing"
    };

    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cartItems.find(c => c.productId === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    setOrders(prev => [order, ...prev]);
    setCartItems([]);

    return order;
  };

  // Derived state
  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { product, quantity: item.quantity };
  }).filter(item => item.product);

  const cartTotal = cartWithProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItemsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <ShopContext.Provider value={{
      products,
      cartItems,
      orders,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      filteredProducts,
      wishlistedProducts: products.filter(p => p.isWishlisted),
      cartWithProducts,
      cartTotal,
      totalItemsInCart,
      toggleWishlist,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      placeOrder,
      user,
      loading,
      storeSettings,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};
