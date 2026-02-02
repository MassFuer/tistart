import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, Settings2 } from "lucide-react";
import CookieSettingsModal from "./CookieSettingsModal";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "nemesis_cookie_consent";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setShowBanner(false);
  };

  const handleDeclineAll = () => {
    const newConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    const newConsent = {
      essential: true,
      ...settings,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setShowBanner(false);
    setShowSettings(false);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50"
          >
            <Card className="p-4 shadow-2xl border-2 dark:border-white/10 glassmorphism">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Cookie Policy</h4>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We use cookies to improve your experience. By clicking
                    "Accept All", you agree to our use of cookies for analytics
                    and marketing.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      className="text-xs h-8 flex-1"
                      onClick={handleAcceptAll}
                    >
                      Accept All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 flex-1"
                      onClick={handleDeclineAll}
                    >
                      Decline All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowSettings(true)}
                      title="Settings"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <CookieSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />
    </>
  );
};

export default CookieBanner;
