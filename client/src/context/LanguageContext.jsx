import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";
import { usersAPI } from "../services/api";
import { toast } from "sonner";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "en");

  // 1. On Mount: Check Local Storage (handled by i18next usually, but let's be explicit)
  useEffect(() => {
    const savedLang = localStorage.getItem("i18nextLng");
    if (savedLang && savedLang !== currentLanguage) {
      changeLanguage(savedLang, false); // Don't sync to DB on initial load
    }
  }, []);

  // 2. On User Login: Sync with User Preference
  useEffect(() => {
    if (isAuthenticated && user?.preferredLanguage) {
      if (user.preferredLanguage !== i18n.language) {
        console.log(`Syncing language to user preference: ${user.preferredLanguage}`);
        i18n.changeLanguage(user.preferredLanguage);
        setCurrentLanguage(user.preferredLanguage);
      }
    }
  }, [user, isAuthenticated]);

  const changeLanguage = async (lng, syncWithDb = true) => {
    try {
      await i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
      localStorage.setItem("i18nextLng", lng);

      if (isAuthenticated && syncWithDb) {
        try {
          await usersAPI.updateProfile({ preferredLanguage: lng });
          // toast.success(`Language preference saved: ${lng}`);
        } catch (error) {
          console.error("Failed to update language preference", error);
        }
      }
    } catch (error) {
        console.error("Failed to change language", error);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    languages: [
        { code: "en", name: "English", flag: "🇬🇧" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
