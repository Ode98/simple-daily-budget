import { useState, useCallback, useEffect } from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { BudgetSettings, BudgetStatus, Transaction } from "../types";
import { getBudgetSettings, saveBudgetSettings } from "../storage";
import { calculateBudgetStatus } from "../budget";
import { formatCurrency } from "../utils/formatCurrency";
import { useSettings } from "./useSettings";

interface UseBudgetResult {
	budgetSettings: BudgetSettings | null;
	budgetStatus: BudgetStatus | null;
	budgetInput: string;
	setBudgetInput: (value: string) => void;
	showBudgetModal: boolean;
	setShowBudgetModal: (value: boolean) => void;
	handleSaveBudget: () => Promise<void>;
	openBudgetModal: () => void;
	loadBudgetSettings: () => Promise<BudgetSettings | null>;
}

export const useBudget = (transactions: Transaction[]): UseBudgetResult => {
	const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(
		null
	);
	const { settings: appSettings } = useSettings();
	const [budgetInput, setBudgetInput] = useState<string>("");
	const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);

	const loadBudgetSettings =
		useCallback(async (): Promise<BudgetSettings | null> => {
			try {
				const settings = await getBudgetSettings();
				setBudgetSettings(settings);
				if (!settings) {
					setShowBudgetModal(true);
				}
				return settings;
			} catch (error) {
				console.error("Error loading budget settings:", error);
				return null;
			}
		}, []);

	const handleSaveBudget = async (): Promise<void> => {
		const amount = parseFloat(budgetInput.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			return;
		}

		const settings: BudgetSettings = {
			monthlyBudget: amount,
			startDate: new Date().toISOString(),
		};

		await saveBudgetSettings(settings);
		setBudgetSettings(settings);
		setShowBudgetModal(false);
		setBudgetInput("");
	};

	const openBudgetModal = (): void => {
		setBudgetInput(budgetSettings?.monthlyBudget?.toString() || "");
		setShowBudgetModal(true);
	};

	const budgetStatus: BudgetStatus | null = budgetSettings
		? calculateBudgetStatus(transactions, budgetSettings.monthlyBudget)
		: null;

	useEffect(() => {
		if (budgetStatus) {
			try {
				const formattedBudget = formatCurrency(
					budgetStatus.availableBudget,
					appSettings.currency,
					appSettings.locale
				);
				const isNegative = budgetStatus.availableBudget < 0;
				requestWidgetUpdate({
					widgetName: "BudgetWidget",
					renderWidget: () => {
						const { BudgetWidget } = require("../widgets/BudgetWidget");
						return (
							<BudgetWidget budget={formattedBudget} isNegative={isNegative} />
						);
					},
					widgetNotFound: () => {
						// Widget not added to home screen yet
					},
				});
			} catch (error) {
				console.error("Failed to update widget:", error);
			}
		}
	}, [budgetStatus?.availableBudget]);

	return {
		budgetSettings,
		budgetStatus,
		budgetInput,
		setBudgetInput,
		showBudgetModal,
		setShowBudgetModal,
		handleSaveBudget,
		openBudgetModal,
		loadBudgetSettings,
	};
};
