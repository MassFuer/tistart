import { useState, useRef, useEffect } from "react";
import { useMessaging } from "../../context/MessagingContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, DollarSign, X } from "lucide-react";
import { artworksAPI } from "../../services/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const MessageComposer = () => {
  const { activeConversation, sendMessage, startTyping, makeOffer, isConnected } =
    useMessaging();
  const [message, setMessage] = useState("");
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [artistArtworks, setArtistArtworks] = useState([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState("");
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const inputRef = useRef(null);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  // Determine Artist and Eligibility
  const currentArtwork = activeConversation?.artwork;
  
  // Find the artist in the conversation
  // Either explicitly linked to artwork OR explicitly has 'artist' role
  const artistUser = activeConversation?.participants?.find(p => {
      const isLinkedParams = currentArtwork && (currentArtwork.artist === p._id || currentArtwork.artist?._id === p._id);
      const isArtistRole = p.role === 'artist' || p.role === 'admin' || p.role === 'superAdmin'; // Admin can also be artist
      return isLinkedParams || (isArtistRole && p._id !== activeConversation?.participants?.find(me => me.email === "me")?._id); // Simplified check, assuming role based
  });
  
  // Strict check: Must have artistStatus 'verified' to receive offers
  const isArtistVerified = artistUser?.artistStatus === "verified";
  const canMakeOffer = artistUser && isArtistVerified;

  // Initialize selected artwork
  useEffect(() => {
      if (currentArtwork) {
          setSelectedArtworkId(currentArtwork._id);
      }
  }, [currentArtwork, activeConversation]);

  // Fetch artworks when offer input is shown
  useEffect(() => {
     if (showOfferInput && artistUser && isArtistVerified) {
         const fetchArtworks = async () => {
             setIsLoadingArtworks(true);
             try {
                 const res = await artworksAPI.getAll({ artist: artistUser._id, limit: 50 });
                 setArtistArtworks(res.data.data || []);
             } catch (err) {
                 console.error("Failed to fetch artist artworks:", err);
                 // Don't toast here to avoid spam execution
             } finally {
                 setIsLoadingArtworks(false);
             }
         };
         fetchArtworks();
     }
  }, [showOfferInput, artistUser, isArtistVerified]);

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
    
    if (!selectedArtworkId) {
        toast.error("Please select an artwork for the offer");
        return;
    }

    makeOffer(amount, selectedArtworkId);
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
        <form onSubmit={handleOfferSubmit} className="flex items-center gap-2 flex-wrap">
          {/* Artwork Selector */}
          <div className="w-[200px]">
              <Select 
                value={selectedArtworkId} 
                onValueChange={setSelectedArtworkId}
                disabled={isLoadingArtworks}
              >
                <SelectTrigger>
                    <SelectValue placeholder={isLoadingArtworks ? "Loading..." : "Select Artwork"} />
                </SelectTrigger>
                <SelectContent>
                    {artistArtworks.length > 0 ? (
                        artistArtworks.map(art => (
                            <SelectItem key={art._id} value={art._id}>
                                {art.title.length > 20 ? art.title.substring(0, 20) + '...' : art.title}
                            </SelectItem>
                        ))
                    ) : (
                         <div className="p-2 text-sm text-muted-foreground">No artworks found</div>
                    )}
                </SelectContent>
              </Select>
          </div>

          <div className="relative flex-1 min-w-[120px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              €
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="pl-7"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!offerAmount || parseFloat(offerAmount) <= 0 || !selectedArtworkId}>
            Offer
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
            disabled={!canMakeOffer}
            title={
                !artistUser 
                ? "No artist in this conversation" 
                : !isArtistVerified 
                ? "Offers disabled: Artist is not verified" 
                : "Make an offer"
            }
          >
            <DollarSign className={`h-4 w-4 ${!canMakeOffer ? "text-muted-foreground" : ""}`} />
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