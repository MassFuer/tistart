import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Loading from "../components/common/Loading";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  ArrowLeft
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CartPage = () => {
  const { cart, loading, removeFromCart, clearCart, updateQuantity, cartCount } = useCart();
  const navigate = useNavigate();

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.artwork?.price || 0) * item.quantity, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-7xl">
       {/* Height Fix and Container consistency */}
      
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
            {cartCount} {cartCount === 1 ? "item" : "items"}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
                Looks like you haven't added any artworks to your collection yet.
                Explore our gallery to find unique pieces.
            </p>
            <Button asChild size="lg">
                <Link to="/gallery">
                    Browse Gallery <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-1 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Cart Items</CardTitle>
                      <CardDescription>Manage your selection before checkout</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y p-0">
                      {cart.map((item) => (
                          <div key={item._id} className="flex flex-col sm:flex-row gap-4 p-6 hover:bg-muted/20 transition-colors">
                              {/* Image */}
                              <Link to={`/artworks/${item.artwork?._id}`} className="shrink-0 w-full sm:w-32 aspect-square rounded-md overflow-hidden bg-muted border">
                                  {item.artwork?.images?.[0] ? (
                                      <img 
                                        src={item.artwork.images[0]} 
                                        alt={item.artwork.title} 
                                        className="w-full h-full object-cover"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                          No Image
                                      </div>
                                  )}
                              </Link>

                              {/* Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                                  <div>
                                       <div className="flex justify-between items-start">
                                            <div>
                                                <Link to={`/artworks/${item.artwork?._id}`} className="font-semibold text-lg hover:underline truncate block">
                                                    {item.artwork?.title}
                                                </Link>
                                                <Link to={`/artists/${item.artwork?.artist?._id}`} className="text-sm text-muted-foreground hover:text-foreground">
                                                    by {item.artwork?.artist?.artistInfo?.companyName ||
                                                        `${item.artwork?.artist?.firstName} ${item.artwork?.artist?.lastName}`}
                                                </Link>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{formatCurrency((item.artwork?.price || 0) * item.quantity)}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.artwork?.price)} each</p>
                                                )}
                                            </div>
                                       </div>
                                  </div>

                                  {/* Controls */}
                                  <div className="flex items-center justify-between">
                                       <div className="flex items-center border rounded-md">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-r-none"
                                                onClick={() => updateQuantity(item.artwork._id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-l-none"
                                                onClick={() => updateQuantity(item.artwork._id, item.quantity + 1)}
                                                disabled={item.quantity >= (item.artwork?.totalInStock || 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                       </div>
                                       
                                       <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemove(item.artwork._id)}
                                        >
                                           <Trash2 className="h-4 w-4 mr-2" /> Remove
                                       </Button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </CardContent>
                  <CardFooter className="bg-muted/30 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" asChild>
                          <Link to="/gallery">
                              <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
                          </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
                          Clear Cart
                      </Button>
                  </CardFooter>
              </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-96 space-y-6">
              <Card className="sticky top-24">
                  <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-6">
                      <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                          Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      {/* Trust Badges */}
                      <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground w-full">
                          <div className="flex items-center gap-3">
                              <Truck className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                  <p className="font-medium text-foreground">Free Shipping</p>
                                  <p className="text-xs">On all orders worldwide</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                  <p className="font-medium text-foreground">Secure Payment</p>
                                  <p className="text-xs">256-bit SSL encryption</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                  <p className="font-medium text-foreground">Easy Returns</p>
                                  <p className="text-xs">30-day return policy</p>
                              </div>
                          </div>
                      </div>
                  </CardFooter>
              </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
