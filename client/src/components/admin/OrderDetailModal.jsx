import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiOrders } from "../../services/api";
import toast from "react-hot-toast";
import "./OrderDetailModal.css";

const OrderDetailModal = ({ orderId, onClose, onUpdate }) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const orderStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await apiOrders.getOne(orderId);
      setOrder(response.data.data);
    } catch (error) {
      toast.error("Failed to load order details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === order.status) return;

    setIsUpdating(true);
    try {
      await apiOrders.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrder();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: "status-pending",
      paid: "status-paid",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    return classes[status] || "";
  };

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="order-detail-modal">
          <div className="modal-loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-id-row">
              <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
              <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
          </div>

          {/* Status Update */}
          <div className="status-update-section">
            <label>Update Status:</label>
            <div className="status-buttons">
              {orderStatuses.map((status) => (
                <button
                  key={status}
                  className={`status-btn ${order.status === status ? "active" : ""} ${getStatusClass(status)}`}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating || order.status === status || order.status === "cancelled"}
                >
                  {status}
                </button>
              ))}
            </div>
            {order.status === "cancelled" && (
              <p className="status-note">Cancelled orders cannot be updated.</p>
            )}
          </div>

          {/* Customer Info */}
          <div className="section">
            <h3>Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>{order.user?.firstName} {order.user?.lastName}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{order.user?.email}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="section">
              <h3>Shipping Address</h3>
              <div className="address-block">
                <p>{order.shippingAddress.street} {order.shippingAddress.streetNum}</p>
                <p>{order.shippingAddress.zipCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="section">
            <h3>Order Items ({order.items?.length || 0})</h3>
            <div className="order-items-list">
              {order.items?.map((item, index) => (
                <div className="order-item" key={index}>
                  <div className="item-image">
                    {item.artwork?.images?.[0] ? (
                      <img src={item.artwork.images[0]} alt={item.artwork?.title || "Artwork"} />
                    ) : (
                      <div className="no-image">No image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <Link to={`/artworks/${item.artwork?._id}`} className="item-title">
                      {item.artwork?.title || "Artwork unavailable"}
                    </Link>
                    <p className="item-artist">
                      by {item.artist?.firstName} {item.artist?.lastName}
                    </p>
                    <div className="item-pricing">
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-price">{formatCurrency(item.price)} each</span>
                    </div>
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="section order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
            </div>
            {order.platformFeeTotal > 0 && (
              <>
                <div className="total-row fee-row">
                  <span>Platform Fee ({((order.platformFeeRate || 0.2) * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(order.platformFeeTotal)}</span>
                </div>
                <div className="total-row fee-row">
                  <span>Artist Earnings</span>
                  <span>{formatCurrency(order.totalAmount - order.platformFeeTotal)}</span>
                </div>
              </>
            )}
            <div className="total-row grand-total">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Info */}
          {order.paymentId && (
            <div className="section">
              <h3>Payment Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Payment ID</label>
                  <span className="mono">{order.paymentId}</span>
                </div>
                {order.refundedAt && (
                  <>
                    <div className="info-item">
                      <label>Refunded At</label>
                      <span>{formatDate(order.refundedAt)}</span>
                    </div>
                    {order.refundReason && (
                      <div className="info-item full-width">
                        <label>Refund Reason</label>
                        <span>{order.refundReason}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="section timestamps">
            <div className="info-grid">
              <div className="info-item">
                <label>Created</label>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Last Updated</label>
                <span>{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;