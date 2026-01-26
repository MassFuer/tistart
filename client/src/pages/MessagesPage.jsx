import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMessaging } from "../context/MessagingContext";
import ConversationList from "../components/messaging/ConversationList";
import ConversationHeader from "../components/messaging/ConversationHeader";
import MessageList from "../components/messaging/MessageList";
import MessageComposer from "../components/messaging/MessageComposer";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Menu, MessageCircle } from "lucide-react";

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const {
    conversations,
    activeConversation,
    openConversation,
    fetchConversations,
    isConnected,
  } = useMessaging();
  const [showSidebar, setShowSidebar] = useState(false);

  // Open conversation from URL param
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find((c) => c._id === conversationId);
      if (conversation && activeConversation?._id !== conversationId) {
        openConversation(conversation);
      }
    }
  }, [searchParams, conversations, activeConversation, openConversation]);

  // Refresh conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 text-center">
          Connecting to messaging server...
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-80 lg:w-96 border-r flex-col bg-background">
          <div className="p-4 border-b">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="left" className="w-80 p-0">
            <div className="p-4 border-b">
              <h1 className="text-lg font-semibold">Messages</h1>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)]">
              <ConversationList />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <>
              <ConversationHeader onBack={() => setShowSidebar(false)} />
              <MessageList />
              <MessageComposer />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Mobile menu button */}
              <Button
                variant="outline"
                size="lg"
                className="md:hidden mb-4"
                onClick={() => setShowSidebar(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                View Conversations
              </Button>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                <p className="text-muted-foreground max-w-sm">
                  Select a conversation to start messaging, or contact an artist
                  from their artwork page.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MessagesPage;