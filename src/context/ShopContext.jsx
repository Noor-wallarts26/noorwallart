import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

export const ShopContext = createContext();

const initialProducts = [
  { id: 1, title: "Ayatul Kursi Wall Art", description: "Beautifully crafted wooden Ayatul Kursi Islamic wall art with gold finish.", price: 129.99, category: "Islamic wall arts", rating: 4.8, reviewsCount: 124, stock: 15, isWishlisted: false },
  { id: 2, title: "Customized Photo Frame", description: "Personalized wooden photo frame for couples and family.", price: 49.99, category: "Customized Frames", rating: 4.5, reviewsCount: 85, stock: 10, isWishlisted: false },
  { id: 3, title: "Nikkah Welcome Sign", description: "Elegant acrylic welcome sign for Nikkah and Wedding events.", price: 89.50, category: "Wedding and nikkah collections", rating: 4.6, reviewsCount: 43, stock: 5, isWishlisted: false }
];

export const ShopProvider = ({ children }) => {
  const getInitialProducts = () => {
    try {
      const saved = localStorage.getItem('cachedProducts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  };

  const [products, setProducts] = useState(getInitialProducts());
  const [isProductsLoading, setIsProductsLoading] = useState(getInitialProducts().length === 0);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState({ whatsapp: '' });
  const [deliveryAddress, setDeliveryAddress] = useState(null);

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
        let wishlistIds = [];
        try {
          const savedWishlistIds = localStorage.getItem('wishlistIds');
          wishlistIds = savedWishlistIds ? JSON.parse(savedWishlistIds) : [];
        } catch(e) {}
        
        const finalProducts = productsData.map(p => ({
          ...p,
          isWishlisted: wishlistIds.includes(p.id)
        }));
        
        setProducts(finalProducts);
        setIsProductsLoading(false);
        try {
          localStorage.setItem('cachedProducts', JSON.stringify(finalProducts));
        } catch(e){}
      }, (error) => {
        console.error("Error fetching products: ", error);
        // Fallback to initial products if Firestore fails (e.g. rules issues)
        setProducts(initialProducts);
        setIsProductsLoading(false);
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
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch(e) {
      localStorage.removeItem('cartItems');
    }

    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch(e) {
      localStorage.removeItem('orders');
    }

    const savedAddress = localStorage.getItem('deliveryAddress');
    if (savedAddress) {
      try {
        setDeliveryAddress(JSON.parse(savedAddress));
      } catch (e) {
        // Fallback for old string addresses
        setDeliveryAddress(null);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (deliveryAddress) {
      localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
    }
  }, [deliveryAddress]);

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

  const updateProductSliderStatus = async (productId, showInSlider) => {
    try {
      const productRef = doc(db, 'products', productId.toString());
      await updateDoc(productRef, {
        showInSlider: showInSlider
      });
      
      // Update local state for immediate feedback
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, showInSlider: showInSlider } : p
      ));
      return true;
    } catch (error) {
      console.error("Error updating slider status: ", error);
      return false;
    }
  };

  const updateProductDeliveryCharge = async (productId, charge) => {
    try {
      const productRef = doc(db, 'products', productId.toString());
      await updateDoc(productRef, {
        deliveryCharge: Number(charge)
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, deliveryCharge: Number(charge) } : p
      ));
      return true;
    } catch (error) {
      console.error("Error updating delivery charge: ", error);
      return false;
    }
  };

  const placeOrder = async (customerDetails, paymentMethod = 'COD', paymentDetails = null) => {
    if (cartItems.length === 0) return null;

    const cartWithProducts = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { product, quantity: item.quantity };
    }).filter(i => i.product);

    const total = cartWithProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = cartWithProducts.reduce((sum, item) => {
      const charge = item.product.deliveryCharge !== undefined ? Number(item.product.deliveryCharge) : 80;
      return sum + (charge * item.quantity);
    }, 0);
    const summary = cartWithProducts.map(item => `${item.product.title} (x${item.quantity})`).join(", ");

    const orderId = "AMZ" + Math.floor(100000 + Math.random() * 900000);
    const order = {
      id: orderId,
      userId: user?.uid || null,
      timestamp: Date.now(),
      totalPrice: total + deliveryFee,
      itemsSummary: summary,
      status: "Pending",
      adminMessage: "",
      deliveryFee: deliveryFee,
      paymentMethod: paymentMethod,
      transactionId: paymentDetails?.transactionId || "N/A",
      paymentStatus: "Pending Verification",
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
      await setDoc(doc(db, "orders", orderId), order);
    } catch(err) {
      console.error("Error saving order: ", err);
    }

    setOrders(prev => [order, ...prev]);
    setCartItems([]);

    return order;
  };

  const fetchAllOrders = async () => {
    try {
      const q = query(collection(db, "orders"));
      const querySnapshot = await getDocs(q);
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push(doc.data());
      });
      // sort by timestamp descending
      fetchedOrders.sort((a, b) => b.timestamp - a.timestamp);
      return fetchedOrders;
    } catch (error) {
      console.error("Error fetching all orders: ", error);
      return [];
    }
  };

  const fetchMyOrders = async (userId) => {
    if (!userId) return [];
    try {
      const q = query(collection(db, "orders"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push(doc.data());
      });
      fetchedOrders.sort((a, b) => b.timestamp - a.timestamp);
      return fetchedOrders;
    } catch (error) {
      console.error("Error fetching my orders: ", error);
      return [];
    }
  };

  const updateOrderStatus = async (orderId, newStatus, adminMessage) => {
    try {
      const orderRef = doc(db, "orders", orderId.toString());
      await updateDoc(orderRef, {
        status: newStatus,
        adminMessage: adminMessage
      });
      // Update local state if the order exists there
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus, adminMessage: adminMessage } : o
      ));
      return true;
    } catch (error) {
      console.error("Error updating order status: ", error);
      return false;
    }
  };

  // Derived state
  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { product, quantity: item.quantity };
  }).filter(item => item.product);

  const cartTotal = cartWithProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = cartWithProducts.reduce((sum, item) => {
    const charge = item.product.deliveryCharge !== undefined ? Number(item.product.deliveryCharge) : 80;
    return sum + (charge * item.quantity);
  }, 0);
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
      deliveryAddress,
      setDeliveryAddress,
      filteredProducts,
      wishlistedProducts: products.filter(p => p.isWishlisted),
      cartWithProducts,
      cartTotal,
      deliveryFee,
      totalItemsInCart,
      toggleWishlist,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      placeOrder,
      fetchAllOrders,
      fetchMyOrders,
      updateOrderStatus,
      addReview,
      updateProductSliderStatus,
      updateProductDeliveryCharge,
      user,
      loading,
      isProductsLoading,
      storeSettings,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};
