import { useState, useCallback } from "react";
import {
	AppSettings,
	SUPPORTED_CURRENCIES,
	DEFAULT_APP_SETTINGS,
} from "../types";
import { getAppSettings, saveAppSettings } from "../storage";

interface UseSettingsResult {
	settings: AppSettings;
	isLoading: boolean;
	loadSettings: () => Promise<AppSettings>;
	updateCurrency: (currencyCode: string) => Promise<void>;
}

export const useSettings = (): UseSettingsResult => {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);

	const loadSettings = useCallback(async (): Promise<AppSettings> => {
		try {
			setIsLoading(true);
			const loaded = await getAppSettings();
			setSettings(loaded);
			return loaded;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const updateCurrency = useCallback(
		async (currencyCode: string): Promise<void> => {
			const currency = SUPPORTED_CURRENCIES.find(
				(c) => c.code === currencyCode
			);
			if (!currency) return;

			const newSettings: AppSettings = {
				currency: currency.code,
				locale: currency.locale,
			};

			await saveAppSettings(newSettings);
			setSettings(newSettings);
		},
		[]
	);

	return {
		settings,
		isLoading,
		loadSettings,
		updateCurrency,
	};
};
