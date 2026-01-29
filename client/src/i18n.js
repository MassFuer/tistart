import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Get API URL from env or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: true, // Turn off in production
    ns: ["common", "translation"], // 'common' is a good practice, 'translation' is default
    defaultNS: "translation",

    backend: {
      // Path to fetch translations from backend
      loadPath: `${API_URL}/api/translations/{{lng}}/{{ns}}`,

      // If using local storage cache later:
      // expirationTime: 7 * 24 * 60 * 60 * 1000 // 7 days
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
        useSuspense: false // To avoid suspense fallback on initial load if undesired, or true if we want it
    }
  });

export default i18n;
