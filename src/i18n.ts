import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enDemoGreet from "../i18n/en/demo/greet";
import zhCNDemoGreet from "../i18n/zh-CN/demo/greet";

const supportedLanguages = ["en", "zh-CN"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

function isSupportedLanguage(
	language: string | null,
): language is SupportedLanguage {
	return supportedLanguages.some(
		(supportedLanguage) => supportedLanguage === language,
	);
}

function getInitialLanguage(): SupportedLanguage {
	const savedLanguage = localStorage.getItem("rcrt-language");
	if (isSupportedLanguage(savedLanguage)) return savedLanguage;

	return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

const initialLanguage = getInitialLanguage();
document.documentElement.lang = initialLanguage;

i18n.use(initReactI18next).init({
	resources: {
		en: { "demo/greet": enDemoGreet },
		"zh-CN": { "demo/greet": zhCNDemoGreet },
	},
	lng: initialLanguage,
	fallbackLng: "en",
	supportedLngs: [...supportedLanguages],
	defaultNS: "demo/greet",
	interpolation: {
		escapeValue: false,
	},
});

i18n.on("languageChanged", (language) => {
	document.documentElement.lang = language;
	localStorage.setItem("rcrt-language", language);
});

export default i18n;
