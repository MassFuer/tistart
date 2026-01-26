import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Loading from "../components/common/Loading";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Calendar,
  AlertCircle
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
      paid: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
      shipped: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
      delivered: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
    };
    
    return (
        <Badge variant="outline" className={`capitalize px-3 py-1 text-sm font-medium border ${styles[status] || ""}`}>
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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>
                This order does not exist or you don't have permission to view it.
            </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/my-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-6xl">
       {/* Header */}
       <div className="mb-8">
            <Button variant="ghost" className="pl-0 gap-2 mb-4" onClick={() => navigate("/my-orders")}>
                <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Order #{order._id.slice(-6).toUpperCase()}
                        {getStatusBadge(order.status)}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                </div>
                {/* Status - Mobile/Desktop placement handled by flex */}
            </div>
       </div>

       {isAdmin && (
         <Card className="mb-8 border-dashed border-primary/20 bg-primary/5">
           <CardHeader className="pb-3">
             <CardTitle className="text-lg">Admin Controls</CardTitle>
             <CardDescription>Update order status</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex flex-wrap gap-2">
                {["pending", "paid", "shipped", "delivered", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={order.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || order.status === status}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
            </div>
           </CardContent>
         </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Order Items */}
        <div className="flex-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Order Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                     {order.items.map((item, idx) => (
                        <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4 md:gap-6">
                             {/* Image */}
                             <div className="shrink-0 w-24 h-24 bg-muted rounded-md overflow-hidden border">
                                  {item.artwork?.images?.[0] ? (
                                    <img 
                                        src={item.artwork.images[0]} 
                                        alt={item.artwork.title} 
                                        className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                                  )}
                             </div>
                             
                             {/* Details */}
                             <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                      <h3 className="font-semibold text-lg truncate">
                                         {item.artwork ? (
                                           <Link to={`/artworks/${item.artwork._id}`} className="hover:underline">
                                               {item.artwork.title}
                                           </Link>
                                         ) : (
                                           <span className="text-muted-foreground">Artwork no longer available</span>
                                         )}
                                      </h3>
                                      {item.artwork?.artist && (
                                        <p className="text-sm text-muted-foreground">
                                          by {item.artwork.artist.artistInfo?.companyName ||
                                              `${item.artwork.artist.firstName} ${item.artwork.artist.lastName}`}
                                        </p>
                                      )}
                                  </div>
                                  
                                  <div className="flex justify-between items-end mt-2">
                                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                      <div className="text-right">
                                          <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                                          {item.quantity > 1 && (
                                              <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                                          )}
                                      </div>
                                  </div>
                             </div>
                        </div>
                     ))}
                </CardContent>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 space-y-6">
             {/* Summary */}
             <Card>
                  <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                  </CardContent>
             </Card>

             {/* Shipping Address */}
             <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                          <MapPin className="h-4 w-4" /> Shipping Address
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                      <p className="font-medium">
                        {order.shippingAddress.streetNum} {order.shippingAddress.street}
                      </p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                  </CardContent>
             </Card>

             {/* Payment Info */}
             <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                          <CreditCard className="h-4 w-4" /> Payment Info
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className="capitalize font-medium">{order.status === "cancelled" ? "Refunded" : "Paid"}</span>
                      </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Method</span>
                          <span>Stripe Secure</span>
                      </div>
                       <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-2">
                           <span className="truncate">ID: {order.paymentId || "N/A"}</span>
                       </div>
                  </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
