import React, { useState } from 'react';
import { User, Search, Shield, ShieldOff, Package, Mail, Phone } from 'lucide-react';

const AdminCustomerManagement = ({
  customers = [],
  onToggleActive,
  onRefresh,
  allOrders = [],
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Filter customers by search term (name, phone, email)
  const filteredCustomers = (customers || []).filter(customer => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    
    const name = (customer.displayName || customer.name || '').toLowerCase();
    const phone = (customer.phoneNumber || customer.phone || '').toLowerCase();
    const email = (customer.email || '').toLowerCase();
    
    return name.includes(term) || phone.includes(term) || email.includes(term);
  });

  // Calculate order metrics for a customer
  const getCustomerOrderStats = (customer) => {
    if (!allOrders || !Array.isArray(allOrders)) {
      return { count: 0, totalSpent: 0 };
    }

    const customerOrders = allOrders.filter(order => {
      if (order.userId && customer.id && order.userId === customer.id) return true;
      if (order.userEmail && customer.email && order.userEmail.toLowerCase() === customer.email.toLowerCase()) return true;
      if (order.customer?.email && customer.email && order.customer.email.toLowerCase() === customer.email.toLowerCase()) return true;
      if (order.customer?.phone && (customer.phone || customer.phoneNumber)) {
        const p1 = String(order.customer.phone).replace(/\D/g, '');
        const p2 = String(customer.phone || customer.phoneNumber).replace(/\D/g, '');
        if (p1 && p2 && (p1.endsWith(p2) || p2.endsWith(p1))) return true;
      }
      return false;
    });

    const totalSpent = customerOrders.reduce((sum, o) => {
      const price = parseFloat(o.totalPrice || o.total || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    return {
      count: customerOrders.length,
      totalSpent
    };
  };

  // Toggle customer active status
  const handleToggleStatus = async (customer) => {
    const currentIsActive = customer.isActive !== false;
    const newStatus = !currentIsActive;
    
    if (currentIsActive) {
      const customerName = customer.displayName || customer.name || customer.email || 'this customer';
      const confirmed = window.confirm(`Are you sure you want to deactivate customer "${customerName}"?`);
      if (!confirmed) return;
    }

    setProcessingId(customer.id);
    try {
      if (typeof onToggleActive === 'function') {
        await onToggleActive(customer.id, newStatus);
      }
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to update customer status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color, #E7EAF0)',
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <Search size={20} style={{ color: 'var(--text-secondary, #6B7280)', marginRight: '0.75rem', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '0.95rem',
            color: 'var(--text-primary, #111827)',
            padding: 0
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #6B7280)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <span style={{ color: 'var(--text-secondary, #6B7280)', fontSize: '0.9rem', fontWeight: '600' }}>
            Loading customer records...
          </span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        /* Empty State */
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #E7EAF0)',
            color: 'var(--text-secondary, #6B7280)'
          }}
        >
          <User size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary, #111827)', marginBottom: '0.3rem' }}>
            No customers found
          </h4>
          <p style={{ fontSize: '0.875rem' }}>
            {searchTerm
              ? `No customer matching "${searchTerm}" was found.`
              : 'There are currently no registered customers in the system.'}
          </p>
        </div>
      ) : (
        /* Customer Cards Grid / List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredCustomers.map(customer => {
            const isActive = customer.isActive !== false;
            const { count, totalSpent } = getCustomerOrderStats(customer);
            const name = customer.displayName || customer.name || 'Unnamed Customer';
            const phone = customer.phoneNumber || customer.phone || 'No phone provided';
            const email = customer.email || 'No email provided';
            const isProcessing = processingId === customer.id;

            return (
              <div
                key={customer.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #E7EAF0)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Header Row: User Info & Status / Toggle Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Customer Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? 'rgba(17, 24, 39, 0.06)' : 'rgba(220, 38, 38, 0.08)',
                        color: isActive ? 'var(--text-primary, #111827)' : 'var(--error, #DC2626)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <User size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary, #111827)', margin: 0 }}>
                          {name}
                        </h3>
                        
                        {/* Status Badge */}
                        <span
                          style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: isActive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                            color: isActive ? 'var(--success, #16A34A)' : 'var(--error, #DC2626)'
                          }}
                        >
                          {isActive ? <Shield size={12} /> : <ShieldOff size={12} />}
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>

                      {/* Contact Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6B7280)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={14} />
                          {email}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6B7280)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={14} />
                          {phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Action Button */}
                  <div>
                    {isActive ? (
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        disabled={isProcessing}
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#DC2626',
                          borderColor: 'rgba(220, 38, 38, 0.3)',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1
                        }}
                      >
                        <ShieldOff size={16} />
                        {isProcessing ? 'Processing...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        disabled={isProcessing}
                        className="btn-primary"
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1
                        }}
                      >
                        <Shield size={16} />
                        {isProcessing ? 'Processing...' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Metrics Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '2rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color, #E7EAF0)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={16} style={{ color: 'var(--text-secondary, #6B7280)' }} />
                    <span style={{ color: 'var(--text-secondary, #6B7280)' }}>Orders:</span>
                    <strong style={{ color: 'var(--text-primary, #111827)' }}>{count}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary, #6B7280)', fontWeight: '700' }}>₹</span>
                    <span style={{ color: 'var(--text-secondary, #6B7280)' }}>Total Spent:</span>
                    <strong style={{ color: 'var(--text-primary, #111827)' }}>
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerManagement;
