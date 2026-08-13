import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs, setDoc, getDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { cleanInput, isRateLimited, isValidCouponCode } from '../utils/security';
import { generateUniqueOrderId, sanitizeOrder, sendWhatsAppOrderNotification } from '../utils/orderUtils';
import { sendAdminOrderEmailNotification } from '../utils/emailService';

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
        setDeliveryAddress(null);
      }
    }
  }, []);

  // Sync authenticated user's saved delivery address from Firestore
  useEffect(() => {
    if (user?.uid) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().deliveryAddress) {
            const dbAddress = docSnap.data().deliveryAddress;
            setDeliveryAddress(dbAddress);
            try {
              localStorage.setItem('deliveryAddress', JSON.stringify(dbAddress));
            } catch(e){}
          }
        });
        return () => unsubscribe();
      });
    }
  }, [user?.uid]);

  const saveDeliveryAddressToDB = async (addressData) => {
    if (!addressData) return false;
    
    const sanitizedAddress = {
      name: addressData.name?.trim() || '',
      phone: addressData.phone?.trim() || '',
      houseNo: addressData.houseNo?.trim() || '',
      building: addressData.building?.trim() || '',
      street: addressData.street?.trim() || '',
      area: addressData.area?.trim() || '',
      landmark: addressData.landmark?.trim() || '',
      district: addressData.district?.trim() || '',
      state: addressData.state?.trim() || '',
      country: addressData.country?.trim() || 'India',
      pincode: addressData.pincode?.trim() || '',
      addressType: addressData.addressType || 'Home',
      instructions: addressData.instructions?.trim() || '',
      lat: typeof addressData.lat === 'number' && !isNaN(addressData.lat) ? addressData.lat : null,
      lng: typeof addressData.lng === 'number' && !isNaN(addressData.lng) ? addressData.lng : null,
      updatedAt: new Date().toISOString()
    };

    setDeliveryAddress(sanitizedAddress);
    try {
      localStorage.setItem('deliveryAddress', JSON.stringify(sanitizedAddress));
    } catch(e){}

    if (user?.uid) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, "users", user.uid), {
          deliveryAddress: sanitizedAddress,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error persisting delivery address to Firestore:", err);
      }
    }
    return true;
  };

  const updateUserProfile = async (profileData) => {
    if (!user?.uid) throw new Error("User not authenticated.");

    const name = (profileData.name || '').trim();
    const email = (profileData.email || '').trim();
    const phone = (profileData.phone || '').trim();

    const sanitizedAddress = {
      ...deliveryAddress,
      name: name,
      phone: phone,
      houseNo: (profileData.houseNo || '').trim(),
      building: (profileData.houseNo || '').trim(),
      street: (profileData.street || profileData.address || '').trim(),
      area: (profileData.street || profileData.address || '').trim(),
      city: (profileData.city || '').trim(),
      district: (profileData.city || '').trim(),
      state: (profileData.state || '').trim(),
      pincode: (profileData.pincode || '').trim(),
      updatedAt: new Date().toISOString()
    };

    // 1. Update Firebase Auth Profile (displayName)
    try {
      const { updateProfile } = await import('firebase/auth');
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name
        });
      }
    } catch (e) {
      console.warn("Auth updateProfile failed:", e);
    }

    // 2. Persist to Firestore user document (doc(db, "users", user.uid))
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const userDocData = {
        uid: user.uid,
        name: name,
        displayName: name,
        email: email,
        phone: phone,
        phoneNumber: phone,
        deliveryAddress: sanitizedAddress,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), userDocData, { merge: true });
    } catch (err) {
      console.error("Firestore user doc update failed:", err);
      throw new Error("Failed to save profile changes to database: " + err.message);
    }

    // 3. Update React State & Local Storage
    setUser(prev => prev ? {
      ...prev,
      displayName: name,
      email: email,
      phoneNumber: phone
    } : prev);

    setDeliveryAddress(sanitizedAddress);
    try {
      localStorage.setItem('deliveryAddress', JSON.stringify(sanitizedAddress));
    } catch(e) {}

    return true;
  };

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

    if (couponInfo && couponInfo.code) {
      const cleanCode = couponInfo.code.trim().toUpperCase();
      const isAlreadyUsed = cartItems.some(item => {
        if (item.productId === productId) return false;
        const appliedCode = item.appliedCoupon?.code || item.couponCode;
        return appliedCode && appliedCode.trim().toUpperCase() === cleanCode;
      });

      if (isAlreadyUsed) {
        alert("This coupon has already been used for another product in your cart. Remove the existing discounted product before using this coupon again.");
        return;
      }
    }

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];

        // COUPON QUANTITY LOCK RULE: If item already has a coupon applied, reject duplicate addition
        if (existing.appliedCoupon || couponInfo) {
          alert("This discounted product cannot be added more than once. Coupon products are limited to 1 quantity.");
          return prev;
        }

        const newQuantity = existing.quantity + quantity;
        if (newQuantity <= product.stock) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            appliedCoupon: null
          };
          return updated;
        }
        return prev;
      } else {
        // Enforce quantity = 1 if coupon is applied
        const initialQty = couponInfo ? 1 : Math.min(quantity, product.stock);
        return [...prev, { productId, quantity: initialQty, appliedCoupon: couponInfo || null }];
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
      setCartItems(prev => prev.map(item => {
        if (item.productId === productId) {
          // COUPON QUANTITY LOCK RULE: Lock coupon product quantity to 1
          if (item.appliedCoupon && quantity > 1) {
            alert("Coupon products are limited to 1 quantity.");
            return { ...item, quantity: 1 };
          }
          return { ...item, quantity };
        }
        return item;
      }));
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const checkUserProductReviewEligibility = async (userId, productId) => {
    if (!userId || !productId) {
      return { canReview: false, reason: "NOT_LOGGED_IN", message: "Only customers who have purchased and received this product can leave a review." };
    }

    try {
      const userOrders = await fetchMyOrders(userId);

      const deliveredOrdersWithProduct = userOrders.filter(order => {
        const isDelivered = (order.status || '').toLowerCase() === 'delivered';
        const hasProduct = Array.isArray(order.items) && order.items.some(item => String(item.productId) === String(productId));
        return isDelivered && hasProduct;
      });

      if (deliveredOrdersWithProduct.length === 0) {
        return { 
          canReview: false, 
          reason: "NOT_DELIVERED", 
          message: "Only customers who have purchased and received this product can leave a review." 
        };
      }

      const q = query(
        collection(db, "reviews"),
        where("userId", "==", userId),
        where("productId", "==", String(productId))
      );
      const reviewSnap = await getDocs(q);
      const existingReviews = [];
      reviewSnap.forEach(d => existingReviews.push({ id: d.id, ...d.data() }));

      const unreviewedOrders = deliveredOrdersWithProduct.filter(order => {
        return !existingReviews.some(rev => String(rev.orderId) === String(order.id));
      });

      if (unreviewedOrders.length === 0) {
        return {
          canReview: false,
          reason: "ALREADY_REVIEWED",
          message: "You have already reviewed this product for your purchase.",
          existingReview: existingReviews[0]
        };
      }

      return {
        canReview: true,
        reason: "ELIGIBLE",
        eligibleOrders: unreviewedOrders,
        targetOrderId: unreviewedOrders[0].id
      };
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      return { canReview: false, reason: "ERROR", message: "Failed to verify review eligibility." };
    }
  };

  const addVerifiedReview = async ({ productId, orderId, rating, title, comment, imageUrls = [] }) => {
    if (!user) return { success: false, error: "Please log in to submit a review." };

    const eligibility = await checkUserProductReviewEligibility(user.uid, productId);
    if (!eligibility.canReview) {
      return { success: false, error: eligibility.message };
    }

    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return { success: false, error: "Product not found." };

    if (Array.isArray(imageUrls) && imageUrls.length > 2) {
      return { success: false, error: "Maximum 2 review images allowed." };
    }

    const reviewDoc = {
      id: `REV-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName || user.email || user.phoneNumber || 'Verified Customer',
      userPhone: user.phoneNumber || '',
      productId: String(productId),
      productTitle: product.title || 'Product',
      orderId: String(orderId || eligibility.targetOrderId || 'N/A'),
      rating: Number(rating) || 5,
      title: (title || '').trim(),
      comment: (comment || '').trim(),
      imageUrls: imageUrls || [],
      isVerifiedPurchase: true,
      approved: true,
      status: 'Approved',
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, "reviews"), reviewDoc);

      const productRef = doc(db, 'products', String(productId));
      await updateDoc(productRef, {
        reviews: arrayUnion({
          id: reviewDoc.id,
          name: reviewDoc.userName,
          rating: reviewDoc.rating,
          title: reviewDoc.title,
          comment: reviewDoc.comment,
          imageUrls: reviewDoc.imageUrls,
          isVerifiedPurchase: true,
          timestamp: reviewDoc.timestamp
        })
      });

      setProducts(prev => prev.map(p => {
        if (String(p.id) === String(productId)) {
          const newReviews = [...(p.reviews || []), reviewDoc];
          const newRating = newReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / newReviews.length;
          return {
            ...p,
            reviews: newReviews,
            rating: parseFloat(newRating.toFixed(1)),
            reviewsCount: newReviews.length
          };
        }
        return p;
      }));

      return { success: true, message: "Thank you! Your verified review has been submitted." };
    } catch (err) {
      console.error("Error submitting verified review:", err);
      return { success: false, error: "Failed to submit review. Please try again." };
    }
  };

  const addReview = async (productId, reviewData) => {
    return addVerifiedReview({ productId, ...reviewData });
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
        quantity: coupon ? 1 : item.quantity,
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

    // SECURITY AUDIT: Ensure no duplicate coupon codes are used across different products in the same order
    const validatedCouponCodesSet = new Set();
    for (const item of cartWithProducts) {
      if (item.appliedCoupon?.code) {
        const code = item.appliedCoupon.code.trim().toUpperCase();
        if (validatedCouponCodesSet.has(code)) {
          alert(`Security Violation: Coupon '${code}' has already been used for another product in your cart. Remove the duplicate discounted product before placing your order.`);
          return { success: false, error: `Coupon '${code}' can only be applied to one product per order.` };
        }
        validatedCouponCodesSet.add(code);
      }
    }

    const origSubtotal = cartWithProducts.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    const totDiscount = cartWithProducts.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0);
    const discountedSubtotal = cartWithProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = cartWithProducts.reduce((sum, item) => {
      const charge = item.product.deliveryCharge !== undefined ? Number(item.product.deliveryCharge) : 80;
      return sum + (charge * item.quantity);
    }, 0);
    const summary = cartWithProducts.map(item => `${item.title} (x${item.quantity})`).join(", ");

    const orderId = await generateUniqueOrderId(db);

    const rawOrderPayload = {
      id: orderId,
      userId: user?.uid || null,
      userEmail: user?.email || null,
      timestamp: Date.now(),
      originalSubtotal: origSubtotal,
      subtotal: origSubtotal,
      deliveryFee: deliveryFee,
      discount: totDiscount,
      totalPrice: discountedSubtotal + deliveryFee,
      itemsSummary: summary,
      status: "Ordered",
      adminMessage: "",
      paymentMethod: paymentMethod,
      transactionId: paymentDetails?.transactionId || "N/A",
      razorpayOrderId: paymentDetails?.razorpayOrderId || "N/A",
      razorpaySignature: paymentDetails?.razorpaySignature || "N/A",
      paymentStatus: paymentDetails?.paymentStatus || 'Paid',
      customer: {
        ...customerDetails,
        email: customerDetails?.email || user?.email || 'N/A'
      },
      items: cartWithProducts,
      print_status: 'NOT_PRINTED'
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
      throw new Error(`Failed to save order to database: ${err.message}`);
    }

    // Auto Expire & Record Redemption for coupons used in order
    const redeemedCouponCodes = Array.from(new Set(
      cartWithProducts
        .map(i => i.appliedCoupon?.code)
        .filter(Boolean)
    ));

    for (const code of redeemedCouponCodes) {
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

    // AUTOMATED ORDER NOTIFICATIONS SYSTEM (Payment Success Trigger)
    if (sanitized.paymentStatus === 'Paid' || paymentMethod === 'Razorpay Online Payment' || paymentMethod === 'Cash on Delivery') {
      // 1. Admin Real-time Notification Document (Firestore)
      (async () => {
        try {
          const notifRef = doc(db, 'notifications', `NOTIF_${sanitized.id}`);
          const notifSnap = await getDoc(notifRef);
          if (!notifSnap.exists()) {
            await setDoc(notifRef, {
              id: `NOTIF_${sanitized.id}`,
              orderId: sanitized.id,
              type: 'order',
              title: '🛒 New Order Received',
              message: `Order #${sanitized.id} - ${customerDetails?.name || 'Customer'} placed a new order for ₹${(discountedSubtotal + deliveryFee).toFixed(2)}.`,
              customerName: customerDetails?.name || 'Customer',
              customerPhone: customerDetails?.phone || 'N/A',
              customerEmail: customerDetails?.email || 'N/A',
              totalPrice: discountedSubtotal + deliveryFee,
              paymentMethod: paymentMethod,
              paymentStatus: 'Paid ✅',
              read: false,
              timestamp: Date.now(),
              createdAt: new Date().toISOString()
            });
          }
        } catch (notifErr) {
          console.error("Error creating admin order notification in Firestore:", notifErr);
        }
      })();

      // 2. Admin Email Notification (noorkarts.in@gmail.com)
      (async () => {
        try {
          await sendAdminOrderEmailNotification(sanitized, 'noorkarts.in@gmail.com');
        } catch (emailErr) {
          console.error("Error sending admin order email notification:", emailErr);
        }
      })();
    }

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

  const subscribeToAllOrders = (callback) => {
    const ordersRef = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const allOrders = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      allOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(allOrders);
    }, (error) => {
      console.error('Real-time orders listener error:', error);
    });
    return unsubscribe;
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

  const updateOrderStatus = async (orderId, newStatus, adminMessage, courierPartner) => {
    try {
      const orderRef = doc(db, "orders", orderId.toString());
      const nowTs = Date.now();
      
      const dateStr = new Date(nowTs).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      const newHistoryEvent = {
        status: newStatus,
        timestamp: nowTs,
        date: dateStr,
        message: adminMessage || ''
      };

      const updatePayload = { 
        status: newStatus, 
        adminMessage,
        statusHistory: arrayUnion(newHistoryEvent)
      };

      // Only write courierPartner if provided (not undefined)
      if (courierPartner !== undefined) {
        updatePayload.courierPartner = courierPartner || '';
      }

      await updateDoc(orderRef, updatePayload);

      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const currentHistory = Array.isArray(o.statusHistory) ? o.statusHistory : [];
          return { 
            ...o, 
            status: newStatus, 
            adminMessage,
            courierPartner: courierPartner !== undefined ? (courierPartner || '') : o.courierPartner,
            statusHistory: [...currentHistory, newHistoryEvent]
          };
        }
        return o;
      }));
      return true;
    } catch (error) {
      console.error("Error updating order status: ", error);
      return false;
    }
  };

  const cancelOrder = async (orderId) => {
    if (!user?.uid) return { success: false, error: 'Not authenticated.' };
    try {
      const orderRef = doc(db, 'orders', orderId.toString());
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return { success: false, error: 'Order not found.' };
      const orderData = orderSnap.data();
      // Security: verify ownership
      if (orderData.userId !== user.uid) return { success: false, error: 'Unauthorized.' };
      // Only allow cancellation when status is 'Ordered'
      const currentStatus = (orderData.status || '').toLowerCase();
      if (currentStatus !== 'ordered') {
        return { success: false, error: 'This order can no longer be cancelled. Only orders with "Ordered" status can be cancelled.' };
      }
      const nowTs = Date.now();
      const dateStr = new Date(nowTs).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const cancelEvent = {
        status: 'Cancelled',
        timestamp: nowTs,
        date: dateStr,
        message: 'Order cancelled by customer.'
      };
      await updateDoc(orderRef, {
        status: 'Cancelled',
        adminMessage: 'Customer cancelled this order.',
        statusHistory: arrayUnion(cancelEvent)
      });
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const currentHistory = Array.isArray(o.statusHistory) ? o.statusHistory : [];
          return { ...o, status: 'Cancelled', adminMessage: 'Customer cancelled this order.', statusHistory: [...currentHistory, cancelEvent] };
        }
        return o;
      }));
      return { success: true, message: 'Order cancelled successfully.' };
    } catch (err) {
      console.error('Error cancelling order:', err);
      return { success: false, error: 'Failed to cancel order. Please try again.' };
    }
  };

  const updateOrderPrintStatus = async (orderId, printStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId.toString());
      await updateDoc(orderRef, {
        print_status: printStatus,
        printed_at: printStatus === 'PRINTED' ? Date.now() : null
      });
      return true;
    } catch (err) {
      console.error('Error updating print status:', err);
      return false;
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const customers = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      return customers;
    } catch (err) {
      console.error('Error fetching customers:', err);
      return [];
    }
  };

  const toggleCustomerActive = async (userId, isActive) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isActive: isActive, updatedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      console.error('Error toggling customer status:', err);
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
        return { success: false, error: "This coupon is no longer valid." };
      }

      // SECURITY CHECK 1: Check if THIS product in cart already has a coupon applied
      const cleanCodeUpper = cleanCode.toUpperCase();
      const existingCartItemForProduct = cartItems.find(item => item.productId === product.id);
      if (existingCartItemForProduct && existingCartItemForProduct.appliedCoupon) {
        return {
          success: false,
          error: "This coupon has already been applied for this product."
        };
      }

      // SECURITY CHECK 2: Check if ANOTHER product in cart is using this same coupon code
      const isUsedByAnotherProduct = cartItems.some(item => {
        if (item.productId === product.id) return false;
        const appliedCode = item.appliedCoupon?.code || item.couponCode;
        return appliedCode && appliedCode.trim().toUpperCase() === cleanCodeUpper;
      });

      if (isUsedByAnotherProduct) {
        return {
          success: false,
          error: "This coupon has already been used for another product in your cart. Remove the existing discounted product before using this coupon again."
        };
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

    const effectiveQuantity = coupon ? 1 : item.quantity;
    return {
      product,
      quantity: effectiveQuantity,
      unitPrice: product.price,
      discountedUnitPrice,
      discountAmountPerUnit: discountAmount,
      itemSubtotal: discountedUnitPrice * effectiveQuantity,
      appliedCoupon: coupon || null
    };
  }).filter(Boolean);

  const originalSubtotal = cartWithProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const cartTotal = cartWithProducts.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const totalCouponDiscount = originalSubtotal - cartTotal;
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
      saveDeliveryAddressToDB,
      updateUserProfile,
      filteredProducts,
      wishlistedProducts: products.filter(p => p.isWishlisted),
      cartWithProducts,
      originalSubtotal,
      totalCouponDiscount,
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
      addVerifiedReview,
      checkUserProductReviewEligibility,
      updateProductSliderStatus,
      updateProductDeliveryCharge,
      subscribeToAllOrders,
      cancelOrder,
      updateOrderPrintStatus,
      fetchAllCustomers,
      toggleCustomerActive,
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

