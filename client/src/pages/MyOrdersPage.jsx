import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";
import "./MyOrdersPage.css";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.orders.getMine();
      setOrders(response.data.data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="my-orders-page page-container">
      <h1>My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>You haven't placed any orders yet.</p>
          <Link to="/gallery" className="btn btn-primary">Browse Artworks</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link to={`/orders/${order._id}`} key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={`order-status-badge status-${order.status}`}>{order.status}</div>
              </div>

              <div className="order-items-preview">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.quantity}x {item.artwork?.title || "Unknown Artwork"}</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span className="total-label">Total Amount</span>
                <span className="total-amount">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(order.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
