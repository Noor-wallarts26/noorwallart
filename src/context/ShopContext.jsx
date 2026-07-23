import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const ShopContext = createContext();

const initialProducts = [
  { id: 1, title: "Ayatul Kursi Wall Art", description: "Beautifully crafted wooden Ayatul Kursi Islamic wall art with gold finish.", price: 129.99, category: "Islamic wall arts", rating: 4.8, reviewsCount: 124, stock: 15, isWishlisted: false },
  { id: 2, title: "Customized Photo Frame", description: "Personalized wooden photo frame for couples and family.", price: 49.99, category: "Customized Frames", rating: 4.5, reviewsCount: 85, stock: 10, isWishlisted: false },
  { id: 3, title: "Nikkah Welcome Sign", description: "Elegant acrylic welcome sign for Nikkah and Wedding events.", price: 89.50, category: "Wedding and nikkah collections", rating: 4.6, reviewsCount: 43, stock: 5, isWishlisted: false }
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

  const addReview = async (productId, reviewData) => {
    try {
      const productRef = doc(db, 'products', productId.toString());
      await updateDoc(productRef, {
        reviews: arrayUnion({
          ...reviewData,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(7)
        })
      });
      
      // Update local state for immediate feedback
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          const newReviews = [...(p.reviews || []), { ...reviewData, timestamp: Date.now(), id: 'temp' }];
          // Recalculate average rating
          const newRating = newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length;
          return {
            ...p,
            reviews: newReviews,
            rating: parseFloat(newRating.toFixed(1)),
            reviewsCount: newReviews.length
          };
        }
        return p;
      }));
      return true;
    } catch (error) {
      console.error("Error adding review: ", error);
      return false;
    }
  };

  const placeOrder = async (customerDetails) => {
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
      totalPrice: total + 80, // adding fixed shipping cost
      itemsSummary: summary,
      status: "Processing",
      customer: customerDetails,
      items: cartItems
    };

    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cartItems.find(c => c.productId === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, "orders", orderId), order);
    } catch(err) {
      console.error("Error saving order: ", err);
    }

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
      addReview,
      user,
      loading,
      storeSettings,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};
