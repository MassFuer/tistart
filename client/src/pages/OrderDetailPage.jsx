import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";
import "./OrderDetailPage.css";

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.orders.getOne(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin) return;

    setUpdating(true);
    try {
      await api.orders.updateStatus(id, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      pending: "status-pending",
      paid: "status-paid",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    return statusClasses[status] || "";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) return <Loading />;

  if (!order) {
    return (
      <div className="order-detail-page page-container">
        <div className="error-state">
          <h2>Order Not Found</h2>
          <p>This order does not exist or you don't have permission to view it.</p>
          <Link to="/my-orders" className="btn btn-primary">Back to My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page page-container">
      <div className="order-detail-header">
        <div>
          <Link to="/my-orders" className="back-link">&larr; Back to Orders</Link>
          <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
          <p className="order-date">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className={`order-status-badge ${getStatusClass(order.status)}`}>
          {order.status}
        </div>
      </div>

      {isAdmin && (
        <div className="admin-controls">
          <h3>Update Status</h3>
          <div className="status-buttons">
            {["pending", "paid", "shipped", "delivered", "cancelled"].map((status) => (
              <button
                key={status}
                className={`btn btn-sm ${order.status === status ? "btn-primary" : "btn-outline"}`}
                onClick={() => handleStatusChange(status)}
                disabled={updating || order.status === status}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="order-detail-content">
        <div className="order-items-section">
          <h2>Order Items</h2>
          <div className="order-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <div className="item-image">
                  {item.artwork?.images?.[0] ? (
                    <img src={item.artwork.images[0]} alt={item.artwork.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>
                    {item.artwork ? (
                      <Link to={`/artworks/${item.artwork._id}`}>{item.artwork.title}</Link>
                    ) : (
                      "Artwork no longer available"
                    )}
                  </h3>
                  {item.artwork?.artist && (
                    <p className="item-artist">
                      by {item.artwork.artist.artistInfo?.companyName ||
                          `${item.artwork.artist.firstName} ${item.artwork.artist.lastName}`}
                    </p>
                  )}
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                </div>
                <div className="item-price">
                  <span className="unit-price">{formatCurrency(item.price)} each</span>
                  <span className="subtotal">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-sidebar">
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="shipping-address-card">
            <h2>Shipping Address</h2>
            <p>
              {order.shippingAddress.street} {order.shippingAddress.streetNum}<br />
              {order.shippingAddress.zipCode} {order.shippingAddress.city}<br />
              {order.shippingAddress.country}
            </p>
          </div>

          <div className="payment-info-card">
            <h2>Payment Info</h2>
            <p><strong>Payment ID:</strong> {order.paymentId || "N/A"}</p>
            <p><strong>Status:</strong> {order.status === "cancelled" ? "Refunded" : "Completed"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
