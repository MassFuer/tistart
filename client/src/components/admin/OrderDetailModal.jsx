import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI } from "../../services/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, User, MapPin, CreditCard, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";

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
      const response = await ordersAPI.getOne(orderId);
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
      await ordersAPI.updateStatus(orderId, newStatus);
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

  const getStatusVariant = (status) => {
    switch (status) {
      case "delivered": return "default"; // or success logic if available
      case "paid": return "default";
      case "shipped": return "secondary";
      case "pending": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <Loading />
            </DialogContent>
        </Dialog>
    );
  }

  if (!order) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between mr-4">
                <DialogTitle className="text-xl">
                    Order #{order._id.slice(-6).toUpperCase()}
                </DialogTitle>
                <Badge variant={getStatusVariant(order.status)} className="capitalize">
                    {order.status}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" /> 
                Placed on {format(new Date(order.createdAt), "PPP p")}
            </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
                
                {/* Status Update Actions */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <h3 className="text-sm font-medium">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                        {orderStatuses.map((status) => (
                            <Button
                                key={status}
                                variant={order.status === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStatusChange(status)}
                                disabled={isUpdating || order.status === status || order.status === "cancelled"}
                                className="capitalize"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Customer Info */}
                     <div className="space-y-3">
                         <h3 className="font-semibold flex items-center gap-2">
                             <User className="h-4 w-4 text-muted-foreground" /> Customer
                         </h3>
                         <div className="text-sm border rounded-lg p-3">
                             <p className="font-medium">{order.user?.firstName} {order.user?.lastName}</p>
                             <p className="text-muted-foreground">{order.user?.email}</p>
                         </div>
                     </div>

                     {/* Shipping Address */}
                     {order.shippingAddress && (
                        <div className="space-y-3">
                             <h3 className="font-semibold flex items-center gap-2">
                                 <MapPin className="h-4 w-4 text-muted-foreground" /> Shipping Address
                             </h3>
                             <div className="text-sm border rounded-lg p-3">
                                 <p>{order.shippingAddress.street} {order.shippingAddress.streetNum}</p>
                                 <p>{order.shippingAddress.zipCode} {order.shippingAddress.city}</p>
                                 <p>{order.shippingAddress.country}</p>
                             </div>
                        </div>
                     )}
                </div>

                {/* Items */}
                <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" /> Order Items ({order.items?.length})
                    </h3>
                    <div className="border rounded-lg divide-y">
                        {order.items?.map((item, index) => (
                            <div key={index} className="p-3 flex gap-4 items-center">
                                <div className="h-12 w-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                     {item.artwork?.images?.[0] ? (
                                        <img src={item.artwork.images[0]} alt="" className="h-full w-full object-cover" />
                                     ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                     )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.artwork?.title || "Unknown Artwork"}</p>
                                    <p className="text-xs text-muted-foreground">by {item.artist?.artistInfo?.companyName || item.artist?.firstName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(item.price)}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Totals */}
                 <div className="space-y-3">
                     <h3 className="font-semibold flex items-center gap-2">
                         <CreditCard className="h-4 w-4 text-muted-foreground" /> Payment Details
                     </h3>
                     <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                         <div className="flex justify-between text-sm">
                             <span>Subtotal</span>
                             <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
                         </div>
                         {order.platformFeeTotal > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Platform Fee</span>
                                <span>{formatCurrency(order.platformFeeTotal)}</span>
                            </div>
                         )}
                         <Separator />
                         <div className="flex justify-between font-bold text-lg pt-1">
                             <span>Total</span>
                             <span>{formatCurrency(order.totalAmount)}</span>
                         </div>
                         {order.paymentId && (
                             <p className="text-xs text-muted-foreground pt-2 font-mono">ID: {order.paymentId}</p>
                         )}
                     </div>
                 </div>

            </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;