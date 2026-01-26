import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/common/Loading";
import { toast } from "sonner";
import { 
  Package, 
  ArrowRight, 
  ShoppingBag, 
  Calendar, 
  CreditCard 
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      shipped: "bg-blue-100 text-blue-800 border-blue-200",
      delivered: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    
    return (
        <Badge variant="outline" className={`capitalize px-2 py-0.5 text-xs font-medium border ${styles[status] || ""}`}>
            {status}
        </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-5xl">
      <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <Button variant="outline" onClick={() => navigate("/gallery")}>
              Browse Gallery
          </Button>
      </div>
      
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
                You haven't placed any orders yet. Start your collection today!
            </p>
            <Button asChild size="lg">
                <Link to="/gallery">
                    Browse Gallery <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="space-y-1">
                     <div className="flex items-center gap-3">
                         <span className="font-semibold text-lg">Order #{order._id.slice(-6).toUpperCase()}</span>
                         {getStatusBadge(order.status)}
                     </div>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}
                         </span>
                         <span className="flex items-center gap-1">
                             <CreditCard className="h-3 w-3" /> {formatCurrency(order.totalAmount)}
                         </span>
                     </div>
                 </div>
                 <Button asChild variant="outline" size="sm">
                     <Link to={`/orders/${order._id}`}>
                         View Details <ArrowRight className="ml-2 h-3 w-3" />
                     </Link>
                 </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                      {order.items.slice(0, 3).map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-sm">
                               <div className="flex items-center gap-2">
                                   <Package className="h-4 w-4 text-muted-foreground" />
                                   <span>
                                       <span className="font-medium text-foreground">{item.quantity}x</span> {item.artwork?.title || "Unknown Artwork"}
                                   </span>
                               </div>
                               <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                           </div>
                      ))}
                      {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground pt-2">
                              + {order.items.length - 3} more items...
                          </p>
                      )}
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
