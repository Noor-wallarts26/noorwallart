import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Zap, ShoppingCart, Share2, Tag, CheckCircle2, X, ShieldCheck, Lock, AlertCircle, Camera } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const categoryStyles = {
  Electronics: { color: '#3B82F6', icon: '💻' },
  Fashion: { color: '#EC4899', icon: '👕' },
  Books: { color: '#F59E0B', icon: '📚' },
  Home: { color: '#10B981', icon: '🏠' },
  Beauty: { color: '#8B5CF6', icon: '✨' },
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, products, cartItems, toggleWishlist, addToCart, validateCouponForProduct, checkUserProductReviewEligibility, addVerifiedReview } = useContext(ShopContext);
  
  const product = products.find(p => String(p.id) === String(id));

  const [reviewEligibility, setReviewEligibility] = useState({ canReview: false, reason: 'LOADING', message: 'Checking eligibility...' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewImageFiles, setReviewImageFiles] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitMsg, setReviewSubmitMsg] = useState({ text: '', isError: false });
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [productCoupon, setProductCoupon] = useState(null);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', isError: false });
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedProductCoupon, setAppliedProductCoupon] = useState(null);

  // Check Review Eligibility on load or user change
  useEffect(() => {
    if (user && product?.id) {
      checkUserProductReviewEligibility(user.uid, product.id).then(res => {
        setReviewEligibility(res);
      });
    } else {
      setReviewEligibility({ canReview: false, reason: 'NOT_LOGGED_IN', message: 'Only customers who have purchased and received this product can leave a review.' });
    }
  }, [user, product?.id, checkUserProductReviewEligibility]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (reviewImageFiles.length + files.length > 2) {
      alert("Maximum 2 photos allowed per review.");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (let file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        alert(`File "${file.name}" is not supported. Only JPG, JPEG, PNG, and WEBP images are allowed.`);
        return;
      }
      if (file.size > 2.5 * 1024 * 1024) { // 2.5 MB
        alert(`File "${file.name}" exceeds the 2.5 MB maximum size limit.`);
        return;
      }
    }

    const readPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      setReviewImageFiles(prev => [...prev, ...base64Images].slice(0, 2));
    });
  };

  const removeSelectedImage = (index) => {
    setReviewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewSubmitMsg({ text: "Please write a review comment.", isError: true });
      return;
    }

    setIsSubmittingReview(true);
    setReviewSubmitMsg({ text: '', isError: false });

    const result = await addVerifiedReview({
      productId: product.id,
      orderId: reviewEligibility.targetOrderId,
      rating: reviewForm.rating,
      title: reviewForm.title,
      comment: reviewForm.comment,
      imageUrls: reviewImageFiles
    });

    setIsSubmittingReview(false);

    if (result.success) {
      setReviewSubmitMsg({ text: result.message, isError: false });
      setReviewForm({ rating: 5, title: '', comment: '' });
      setReviewImageFiles([]);
      if (user && product?.id) {
        checkUserProductReviewEligibility(user.uid, product.id).then(res => setReviewEligibility(res));
      }
    } else {
      setReviewSubmitMsg({ text: result.error, isError: true });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponMsg({ text: 'Please enter a coupon code.', isError: true });
      return;
    }
    setCouponLoading(true);
    setCouponMsg({ text: '', isError: false });
    const result = await validateCouponForProduct(couponCodeInput, product);
    setCouponLoading(false);

    if (result.success) {
      setAppliedProductCoupon(result.coupon);
      setCouponMsg({ text: result.message, isError: false });
    } else {
      setAppliedProductCoupon(null);
      setCouponMsg({ text: result.error, isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedProductCoupon(null);
    setCouponCodeInput('');
    setCouponMsg({ text: '', isError: false });
  };

  // Fetch coupon linked to product
  useEffect(() => {
    if (!product?.couponId) { setProductCoupon(null); return; }
    const fetchCoupon = async () => {
      try {
        const snap = await getDoc(doc(db, 'coupons', product.couponId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.isActive && (!data.expiryDate || new Date(data.expiryDate) >= new Date())) {
            setProductCoupon({ id: snap.id, ...data });
          } else {
            setProductCoupon(null);
          }
        }
      } catch { setProductCoupon(null); }
    };
    fetchCoupon();
  }, [product?.couponId]);

  // Scroll to top and sync existing cart item coupon state on load or when product id changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setReviewForm({ rating: 5, title: '', comment: '' });

    if (id && Array.isArray(cartItems)) {
      const existingInCart = cartItems.find(item => String(item.productId) === String(id));
      if (existingInCart && existingInCart.appliedCoupon) {
        setAppliedProductCoupon(existingInCart.appliedCoupon);
        setCouponMsg({ text: `Coupon '${existingInCart.appliedCoupon.code}' has already been applied for this product.`, isError: false });
      }
    }
  }, [id, cartItems]);

  if (!product) {
    return (
      <div className="empty-state">
        <p>Product not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Return to Shop</button>
      </div>
    );
  }

  const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} for ₹${product.price.toFixed(2)} on Noor Wall Arts!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const handleBuyNow = () => {
    addToCart(product.id, 1, {}, appliedProductCoupon);
    navigate('/cart');
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { text: "Currently Out of Stock", color: "#DC2626" }; // Red
    if (product.stock <= 5) return { text: `Only ${product.stock} left in stock - order soon`, color: "#F59E0B" }; // Yellow/Orange
    return { text: `In Stock (${product.stock} items available)`, color: "#16A34A" }; // Green
  };

  const stockStatus = getStockStatus();

  // Get related products (same category, not this exact product)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div key={id} className="product-detail-page animate-fade-in" style={{ position: 'relative' }}>
        <header style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} className="back-btn" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', cursor: 'pointer' }}>
            <ArrowLeft size={22} color="#333" />
          </button>
        </header>

      <div className="detail-image-area" style={{ height: '35vh', minHeight: '300px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }} 
            onClick={() => setIsFullscreen(true)}
          />
        ) : (
          <div className="detail-category-icon" style={{ color, fontSize: '4rem' }}>{icon}</div>
        )}
      </div>

      {isFullscreen && createPortal(
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: '#000000', zIndex: 9999999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            overflow: 'hidden',
            touchAction: 'none'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            style={{ 
              position: 'absolute', top: '1.5rem', right: '1.5rem', 
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', 
              borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              zIndex: 10000000
            }}
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          >
            &times;
          </button>
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}

      <div className="detail-content container" style={{ paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h1 className="detail-title" style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            lineHeight: '1.35', 
            margin: 0
          }}>{product.title}</h1>
        </div>

        <div className="detail-rating" style={{ marginBottom: '1.25rem' }}>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={14} 
                fill={star <= Math.round(product.rating) ? '#F59E0B' : 'none'} 
                color={star <= Math.round(product.rating) ? '#F59E0B' : '#94A3B8'} 
              />
            ))}
          </div>
          <span className="detail-reviews" style={{ fontSize: '0.9rem', color: '#3B82F6', fontWeight: '500' }}>{product.reviewsCount} ratings</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {appliedProductCoupon ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16A34A', lineHeight: 1 }}>
                ₹{appliedProductCoupon.discountedPrice.toFixed(2)}
              </span>
              <span style={{ fontSize: '1.1rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                ₹{product.price.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                Save ₹{appliedProductCoupon.discountAmount.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="detail-price" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: 0, color: 'var(--text-primary)', lineHeight: 1 }}>
              ₹{product.price.toFixed(2)}
            </div>
          )}
          <div style={{ 
            color: product.stock === 0 ? '#DC2626' : '#16A34A', 
            fontSize: '0.85rem', 
            fontWeight: '500', 
            marginBottom: '0.15rem'
          }}>
            {product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} Items Available)`}
          </div>
        </div>

        {/* Coupon badge */}
        {productCoupon && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.85rem', borderRadius: '20px',
            backgroundColor: '#DCFCE7', border: '1.5px dashed #16A34A',
            marginBottom: '1rem', cursor: 'default'
          }}>
            <Tag size={14} color="#16A34A" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803D', letterSpacing: '0.03em' }}>
              {productCoupon.code}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#166534' }}>
              &mdash; {productCoupon.discountType === 'percentage'
                ? `${productCoupon.discountValue}% OFF`
                : `₹${productCoupon.discountValue} OFF`}
              {productCoupon.minOrderAmount ? ` on orders above ₹${productCoupon.minOrderAmount}` : ''}
            </span>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 0',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Charge</span>
            <strong>₹{product.deliveryCharge !== undefined ? Number(product.deliveryCharge).toFixed(2) : '80.00'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => toggleWishlist(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
              <Heart size={22} fill={product.isWishlisted ? '#EF4444' : 'none'} color={product.isWishlisted ? '#EF4444' : 'var(--text-secondary)'} />
            </button>
            <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
              <Share2 size={22} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div className="detail-description-box">
          <h3>Product Description</h3>
          <p>{product.description}</p>
        </div>

        {/* Modern Product-Level Apply Coupon Section */}
        <div style={{
          marginTop: '1.5rem',
          marginBottom: '1rem',
          padding: '1rem',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          backgroundColor: 'var(--surface-color, #ffffff)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              <Tag size={18} color="var(--primary, #4f46e5)" />
              <span>Apply Product Coupon</span>
            </div>
            {productCoupon && (
              <span 
                onClick={() => { setCouponCodeInput(productCoupon.code); }}
                style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Use Code {productCoupon.code}
              </span>
            )}
          </div>

          {appliedProductCoupon ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem', backgroundColor: '#DCFCE7',
              border: '1px solid #BBF7D0', borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534' }}>
                    '{appliedProductCoupon.code}' Applied!
                  </span>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D' }}>
                    Discounted Price: <strong>₹{appliedProductCoupon.discountedPrice.toFixed(2)}</strong> (Saved ₹{appliedProductCoupon.discountAmount.toFixed(2)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                title="Remove coupon"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCodeInput}
                onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                style={{
                  flex: 1, padding: '0.65rem 0.85rem',
                  borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.9rem', letterSpacing: '0.05em', outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: '8px',
                  backgroundColor: 'var(--primary, #4f46e5)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap'
                }}
              >
                {couponLoading ? 'Validating...' : 'Apply Coupon'}
              </button>
            </div>
          )}

          {couponMsg.text && (
            <p style={{
              margin: '0.6rem 0 0 0', fontSize: '0.82rem',
              color: couponMsg.isError ? '#DC2626' : '#16A34A', fontWeight: 600
            }}>
              {couponMsg.isError ? '⚠️ ' : '✅ '}{couponMsg.text}
            </p>
          )}
        </div>

        <div className="detail-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '2.5rem' }}>
          <button 
            onClick={() => {
              addToCart(product.id, 1, {}, appliedProductCoupon);
              navigate('/cart');
            }}
            disabled={product.stock === 0}
            style={{ 
              flex: 1, 
              padding: '0.85rem', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '1rem',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
              opacity: product.stock === 0 ? 0.5 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>

          <button 
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            style={{ 
              flex: 1, 
              padding: '0.85rem', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '1rem',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              opacity: product.stock === 0 ? 0.5 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(var(--primary-rgb), 0.3)'
            }}
          >
            <Zap size={18} fill="currentColor" />
            Buy Now
          </button>
        </div>

        <div className="product-reviews-section mt-4">
          <hr className="detail-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Customer Reviews ({product.reviewsCount || (product.reviews ? product.reviews.length : 0)})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fffbe8', border: '1px solid #fef08a', padding: '0.35rem 0.75rem', borderRadius: '16px' }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <strong style={{ fontSize: '0.95rem', color: '#854d0e' }}>{(product.rating || 5.0).toFixed(1)}</strong>
              <span style={{ fontSize: '0.8rem', color: '#a16207' }}>out of 5</span>
            </div>
          </div>
          
          {/* VERIFIED REVIEW ELIGIBILITY & FORM CARD */}
          <div className="write-review-card card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#16A34A" />
              <span>Verified Buyer Review</span>
            </h4>

            {!user ? (
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lock size={18} color="#64748b" />
                <span>Only customers who have purchased and received this product can leave a review. Please <strong>login</strong> to your account.</span>
              </div>
            ) : !reviewEligibility.canReview ? (
              reviewEligibility.reason === 'ALREADY_REVIEWED' ? (
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>You have already submitted a review for this product purchase. Thank you for your feedback!</span>
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#9f1239', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <AlertCircle size={18} color="#e11d48" />
                  <span>Only customers who have purchased and received this product can leave a verified review.</span>
                </div>
              )
            ) : (
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.8rem', color: '#15803d', fontWeight: 600, marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#16a34a" /> Verified Purchase Eligibility Confirmed
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Your Rating *</label>
                  <div style={{ display: 'flex', gap: '0.35rem', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={26} 
                        fill={star <= reviewForm.rating ? '#F59E0B' : 'none'} 
                        color={star <= reviewForm.rating ? '#F59E0B' : '#cbd5e1'}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{ transition: 'transform 0.1s', cursor: 'pointer' }}
                      />
                    ))}
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#d97706', alignSelf: 'center' }}>
                      {reviewForm.rating} Star{reviewForm.rating > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Review Title (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Excellent quality wall frame!" 
                    value={reviewForm.title}
                    onChange={e => setReviewForm({...reviewForm, title: e.target.value})}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Review Comments *</label>
                  <textarea 
                    placeholder="Describe what you liked about this product, quality, framing, and delivery..." 
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                    required
                    rows={3}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                {/* PHOTO UPLOADS (MAX 2 PHOTOS, MAX 2.5MB EACH) */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                    Upload Review Photos (Optional, Max 2 photos)
                  </label>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {reviewImageFiles.map((imgBase64, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={imgBase64} alt={`Review photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => removeSelectedImage(idx)}
                          style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {reviewImageFiles.length < 2 && (
                      <label style={{
                        width: '70px', height: '70px', border: '2px dashed #cbd5e1', borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', backgroundColor: '#f8fafc', color: '#64748b'
                      }}>
                        <Camera size={20} />
                        <span style={{ fontSize: '0.65rem', marginTop: '2px', fontWeight: 600 }}>Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/jpg,image/png,image/webp" 
                          multiple 
                          onChange={handleImageSelect}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                    Supported: JPG, JPEG, PNG, WEBP (Max 2.5 MB per image)
                  </span>
                </div>

                {reviewSubmitMsg.text && (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 600, color: reviewSubmitMsg.isError ? '#dc2626' : '#16a34a' }}>
                    {reviewSubmitMsg.isError ? '⚠️ ' : '✅ '}{reviewSubmitMsg.text}
                  </p>
                )}

                <button type="submit" className="btn-primary" disabled={isSubmittingReview} style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                  {isSubmittingReview ? 'Submitting Review...' : 'Submit Verified Review'}
                </button>
              </form>
            )}
          </div>

          {/* REVIEWS LIST */}
          <div className="reviews-list mt-4">
            {(!product.reviews || product.reviews.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No reviews yet for this product.</p>
            ) : (
              [...product.reviews].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((review, rIdx) => (
                <div key={review.id || rIdx} className="review-item card" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{review.name || review.userName || 'Customer'}</strong>
                        {(review.isVerifiedPurchase !== false) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                            <CheckCircle2 size={12} color="#16a34a" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      {review.title && <h5 style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{review.title}</h5>}
                    </div>

                    <div className="stars" style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          fill={star <= (review.rating || 5) ? '#F59E0B' : 'none'} 
                          color={star <= (review.rating || 5) ? '#F59E0B' : '#94A3B8'} 
                        />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: '0.5rem 0 0.75rem 0', lineHeight: 1.5 }}>{review.comment}</p>

                  {/* REVIEW IMAGE GALLERY */}
                  {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      {review.imageUrls.map((imgUrl, i) => (
                        <img 
                          key={i} 
                          src={imgUrl} 
                          alt={`Review photo ${i + 1}`} 
                          onClick={() => setPreviewModalImg(imgUrl)}
                          style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #cbd5e1' }}
                        />
                      ))}
                    </div>
                  )}

                  <small style={{ color: '#94A3B8', display: 'block', fontSize: '0.78rem' }}>
                    Reviewed on {new Date(review.timestamp || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FULLSCREEN REVIEW PHOTO MODAL */}
        {previewModalImg && createPortal(
          <div 
            style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999999, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
            }}
            onClick={() => setPreviewModalImg(null)}
          >
            <img src={previewModalImg} alt="Review photo full" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
          </div>,
          document.body
        )}

        {relatedProducts.length > 0 && (
          <div className="related-products-section mt-4">
            <h3 style={{ marginBottom: '1rem' }}>You might also like</h3>
            <div className="product-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
              gap: '1rem' 
            }}>
              {relatedProducts.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
