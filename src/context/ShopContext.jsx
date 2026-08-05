import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { cleanInput, isRateLimited, isValidCouponCode } from '../utils/security';
import { generateUniqueOrderId, sanitizeOrder, sendWhatsAppOrderNotification } from '../utils/orderUtils';

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
  const [paymentSettings, setPaymentSettings] = useState({ upiId: '', qrCodeUrl: '' });
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // FORCE LOGOUT ALL EXISTING USERS (V1)
      try {
        const hasForcedLogout = localStorage.getItem('v1_forced_logout');
        if (!hasForcedLogout) {
          if (currentUser) {
            signOut(auth).then(() => {
              localStorage.setItem('v1_forced_logout', 'true');
            });
            setUser(null);
            setLoading(false);
            return;
          } else {
            localStorage.setItem('v1_forced_logout', 'true');
          }
        }
      } catch(e) {}

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
          const data = docSnap.data();
          if (data && (data.whatsapp === '8525325330' || !data.whatsapp)) {
            data.whatsapp = '8925325330';
          }
          setStoreSettings(data);
        } else {
          setStoreSettings({ whatsapp: '8925325330' });
        }
      });
      return () => unsubscribe();
    });
  }, []);

  // Fetch payment settings (UPI ID + QR Code) from Firestore
  useEffect(() => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsubscribe = onSnapshot(doc(db, "settings", "payment"), (docSnap) => {
        if (docSnap.exists()) {
          setPaymentSettings(docSnap.data());
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

  const addToCart = (productId, quantity = 1, options = {}, couponInfo = null) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQuantity = existing.quantity + quantity;
        if (newQuantity <= product.stock) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            appliedCoupon: couponInfo || existing.appliedCoupon || null
          };
          return updated;
        }
        return prev;
      } else {
        if (quantity <= product.stock) {
          return [...prev, { productId, quantity, appliedCoupon: couponInfo || null }];
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
      
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          const newReviews = [...(p.reviews || []), { ...reviewData, timestamp: Date.now(), id: 'temp' }];
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
      await updateDoc(productRef, { showInSlider });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, showInSlider } : p));
      return true;
    } catch (error) {
      console.error("Error updating slider status: ", error);
      return false;
    }
  };

  const updateProductDeliveryCharge = async (productId, charge) => {
    try {
      const productRef = doc(db, 'products', productId.toString());
      await updateDoc(productRef, { deliveryCharge: Number(charge) });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, deliveryCharge: Number(charge) } : p));
      return true;
    } catch (error) {
      console.error("Error updating delivery charge: ", error);
      return false;
    }
  };

  const placeOrder = async (customerDetails, paymentMethod = 'Razorpay', paymentDetails = null) => {
    if (cartItems.length === 0) return null;

    const cartWithProducts = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;

      const coupon = item.appliedCoupon;
      let discountAmount = 0;
      let discountedUnitPrice = product.price;

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((product.price * Number(coupon.discountValue)) / 100);
        } else if (coupon.discountType === 'flat') {
          discountAmount = Number(coupon.discountValue) || 0;
        } else {
          discountAmount = Number(coupon.discountAmount) || 0;
        }
        discountAmount = Math.min(discountAmount, product.price);
        discountedUnitPrice = Math.max(0, product.price - discountAmount);
      }

      return {
        productId: product.id,
        title: product.title || 'Product',
        imageUrl: product.imageUrl || product.logoUrl || '/logo.jpg',
        price: discountedUnitPrice,
        originalPrice: product.price,
        discountAmount: discountAmount,
        quantity: item.quantity,
        appliedCoupon: coupon ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: discountAmount
        } : null,
        variant: item.variant || 'N/A',
        size: item.size || 'N/A',
        color: item.color || 'N/A',
        frameType: item.frameType || 'N/A',
        product: product 
      };
    }).filter(Boolean);

    const subtotal = cartWithProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = cartWithProducts.reduce((sum, item) => {
      const charge = item.product.deliveryCharge !== undefined ? Number(item.product.deliveryCharge) : 80;
      return sum + (charge * item.quantity);
    }, 0);
    const summary = cartWithProducts.map(item => `${item.title} (x${item.quantity})`).join(", ");

    const orderId = await generateUniqueOrderId(db);

    const rawOrderPayload = {
      id: orderId,
      userId: user?.uid || null,
      timestamp: Date.now(),
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      discount: 0,
      totalPrice: subtotal + deliveryFee,
      itemsSummary: summary,
      status: "Pending",
      adminMessage: "",
      paymentMethod: paymentMethod,
      transactionId: paymentDetails?.transactionId || "N/A",
      razorpayOrderId: paymentDetails?.razorpayOrderId || "N/A",
      razorpaySignature: paymentDetails?.razorpaySignature || "N/A",
      paymentStatus: paymentDetails?.paymentStatus || 'Paid',
      customer: customerDetails,
      items: cartWithProducts
    };

    const sanitized = sanitizeOrder(rawOrderPayload);

    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cartItems.find(c => c.productId === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    try {
      await setDoc(doc(db, "orders", sanitized.id), sanitized);
    } catch(err) {
      console.error("Error saving order: ", err);
    }

    // Auto Expire & Record Redemption for coupons used in order
    const usedCouponCodes = Array.from(new Set(
      cartWithProducts
        .map(i => i.appliedCoupon?.code)
        .filter(Boolean)
    ));

    for (const code of usedCouponCodes) {
      try {
        const q = query(collection(db, "coupons"), where("code", "==", code.toUpperCase()));
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          const cData = docSnap.data();
          const newUsedCount = (Number(cData.usedCount) || 0) + 1;
          const updates = {
            usedCount: newUsedCount,
            updatedAt: new Date().toISOString()
          };

          if (cData.usageMode === 'one_time' || (cData.usageLimit > 0 && newUsedCount >= cData.usageLimit)) {
            updates.isActive = false;
            updates.status = 'Expired';
            updates.redeemedAt = new Date().toISOString();
            updates.redeemedBy = customerDetails?.name || customerDetails?.phone || user?.uid || 'Customer';
            updates.redeemedOrderId = sanitized.id;
          }

          await updateDoc(doc(db, "coupons", docSnap.id), updates);
        });
      } catch (cErr) {
        console.error("Error updating coupon usage:", cErr);
      }
    }

    setOrders(prev => [sanitized, ...prev]);
    setCartItems([]);

    try {
      const businessWhatsapp = storeSettings?.whatsapp || '8925325330';
      sendWhatsAppOrderNotification(sanitized, businessWhatsapp);
    } catch (waErr) {
      console.error("WhatsApp notification error:", waErr);
    }

    return sanitized;
  };

  const fetchAllOrders = async () => {
    try {
      const q = query(collection(db, "orders"));
      const querySnapshot = await getDocs(q);
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => { fetchedOrders.push(doc.data()); });
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
      querySnapshot.forEach((doc) => { fetchedOrders.push(doc.data()); });
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
      await updateDoc(orderRef, { status: newStatus, adminMessage });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, adminMessage } : o));
      return true;
    } catch (error) {
      console.error("Error updating order status: ", error);
      return false;
    }
  };

  // Product-Level Coupon Validation Function
  const validateCouponForProduct = async (codeStr, product) => {
    if (!codeStr || !codeStr.trim()) {
      return { success: false, error: "Please enter a coupon code." };
    }
    if (!product) {
      return { success: false, error: "Product not found." };
    }
    const cleanCode = cleanInput(codeStr.trim().toUpperCase());

    if (isRateLimited('coupon_apply', 10, 60000)) {
      return { success: false, error: "Too many attempts. Please wait a moment and try again." };
    }

    if (!isValidCouponCode(cleanCode)) {
      return { success: false, error: "Invalid coupon code format." };
    }

    try {
      const q = query(collection(db, "coupons"), where("code", "==", cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "Invalid coupon code." };
      }

      let couponData = null;
      querySnapshot.forEach(docSnap => {
        couponData = { id: docSnap.id, ...docSnap.data() };
      });

      if (!couponData.isActive || couponData.status === 'Disabled') {
        return { success: false, error: "This coupon is currently inactive." };
      }

      // Check One-Time Use / Auto Expire
      if (couponData.usageMode === 'one_time' && (couponData.usedCount > 0 || couponData.redeemedAt || couponData.status === 'Expired')) {
        return { success: false, error: "This coupon has already been used and has expired." };
      }

      // Check Start Date
      if (couponData.startDate) {
        const start = new Date(couponData.startDate).getTime();
        const today = new Date().setHours(0,0,0,0);
        if (start > today) {
          return { success: false, error: `This coupon will become valid on ${new Date(couponData.startDate).toLocaleDateString()}.` };
        }
      }

      // Check Expiry Date
      if (couponData.expiryDate) {
        const expiry = new Date(couponData.expiryDate).getTime();
        const today = new Date().setHours(0,0,0,0);
        if (expiry < today) {
          return { success: false, error: "This coupon code has expired." };
        }
      }

      // Check Usage Limit
      if (couponData.usageLimit && couponData.usageLimit > 0) {
        const usedCount = Number(couponData.usedCount) || 0;
        if (usedCount >= couponData.usageLimit) {
          return { success: false, error: "This coupon has reached its usage limit and has expired." };
        }
      }

      const minAmount = Number(couponData.minOrderAmount) || 0;
      if (product.price < minAmount) {
        return { success: false, error: `Minimum product price of ₹${minAmount} required to use this coupon.` };
      }

      const selCats = Array.isArray(couponData.assignedCategories)
        ? couponData.assignedCategories
        : (Array.isArray(couponData.categoryIds)
          ? couponData.categoryIds
          : (couponData.assignedCategory ? [couponData.assignedCategory] : ['All Categories']));

      const selProds = Array.isArray(couponData.assignedProducts)
        ? couponData.assignedProducts
        : (Array.isArray(couponData.productIds)
          ? couponData.productIds
          : (couponData.assignedProduct ? [couponData.assignedProduct] : ['All Products']));

      const isAllCats = selCats.length === 0 || selCats.includes('All Categories');
      const isAllProds = selProds.length === 0 || selProds.includes('All Products');

      let catMatch = false;
      if (isAllCats) {
        catMatch = true;
      } else {
        const pCat = (product.category || '').trim().toLowerCase();
        const pCats = Array.isArray(product.categories) ? product.categories.map(c => (c || '').trim().toLowerCase()) : [];
        catMatch = selCats.some(sc => {
          const cleanSC = String(sc).trim().toLowerCase();
          return pCat === cleanSC || pCats.includes(cleanSC);
        });
      }

      let prodMatch = false;
      if (isAllProds) {
        prodMatch = true;
      } else {
        const pTitle = (product.title || product.name || '').trim().toLowerCase();
        const pId = String(product.id || '').trim().toLowerCase();
        prodMatch = selProds.some(sp => {
          const cleanSP = String(sp).trim().toLowerCase();
          return pTitle === cleanSP || pId === cleanSP;
        });
      }

      if (!isAllCats && !isAllProds && !catMatch && !prodMatch) {
        return { success: false, error: "This coupon is not applicable to this product." };
      }
      if (!isAllCats && isAllProds && !catMatch) {
        return { success: false, error: `This coupon is only valid for category: ${selCats.join(', ')}.` };
      }
      if (isAllCats && !isAllProds && !prodMatch) {
        return { success: false, error: `This coupon is only valid for selected products.` };
      }

      let discountAmt = 0;
      if (couponData.discountType === 'percentage') {
        discountAmt = Math.round((product.price * Number(couponData.discountValue)) / 100);
      } else {
        discountAmt = Number(couponData.discountValue) || 0;
      }
      discountAmt = Math.min(discountAmt, product.price);
      const discountedPrice = Math.max(0, product.price - discountAmt);

      const couponObj = {
        code: cleanCode,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discountAmount: discountAmt,
        originalPrice: product.price,
        discountedPrice: discountedPrice
      };

      return {
        success: true,
        coupon: couponObj,
        message: `Coupon '${cleanCode}' applied! You save ₹${discountAmt.toFixed(2)}.`
      };
    } catch (err) {
      console.error("Error validating product coupon:", err);
      return { success: false, error: "Failed to validate coupon code." };
    }
  };

  // Derived state
  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    const coupon = item.appliedCoupon;
    let discountAmount = 0;
    let discountedUnitPrice = product.price;

    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((product.price * Number(coupon.discountValue)) / 100);
      } else if (coupon.discountType === 'flat') {
        discountAmount = Number(coupon.discountValue) || 0;
      } else {
        discountAmount = Number(coupon.discountAmount) || 0;
      }
      discountAmount = Math.min(discountAmount, product.price);
      discountedUnitPrice = Math.max(0, product.price - discountAmount);
    }

    return {
      product,
      quantity: item.quantity,
      unitPrice: product.price,
      discountedUnitPrice,
      discountAmountPerUnit: discountAmount,
      itemSubtotal: discountedUnitPrice * item.quantity,
      appliedCoupon: coupon || null
    };
  }).filter(Boolean);

  const cartTotal = cartWithProducts.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const deliveryFee = cartWithProducts.reduce((sum, item) => {
    const charge = item.product.deliveryCharge !== undefined ? Number(item.product.deliveryCharge) : 80;
    return sum + (charge * item.quantity);
  }, 0);
  const finalTotal = cartTotal + deliveryFee;
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
      finalTotal,
      validateCouponForProduct,
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
      paymentSettings,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};

