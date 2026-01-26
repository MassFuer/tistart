import { useState, useRef, useEffect } from "react";
import { useMessaging } from "../../context/MessagingContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, DollarSign, X } from "lucide-react";

const MessageComposer = () => {
  const { activeConversation, sendMessage, startTyping, makeOffer, isConnected } =
    useMessaging();
  const [message, setMessage] = useState("");
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const inputRef = useRef(null);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || !activeConversation) return;

    sendMessage(message.trim());
    setMessage("");
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) return;

    makeOffer(amount);
    setOfferAmount("");
    setShowOfferInput(false);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    startTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="border-t p-4 bg-background">
      {showOfferInput ? (
        <form onSubmit={handleOfferSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              €
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter offer amount"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="pl-7"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!offerAmount || parseFloat(offerAmount) <= 0}>
            Send Offer
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowOfferInput(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowOfferInput(true)}
            title="Make an offer"
          >
            <DollarSign className="h-4 w-4" />
          </Button>

          <Input
            ref={inputRef}
            type="text"
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            className="flex-1"
          />

          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || !isConnected}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {!isConnected && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Reconnecting to server...
        </p>
      )}
    </div>
  );
};

export default MessageComposer;