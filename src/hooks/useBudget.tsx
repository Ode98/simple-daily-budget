import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { BudgetSettings, BudgetStatus, Transaction } from "../types";
import { getBudgetSettings, saveBudgetSettings } from "../storage";
import { calculateBudgetStatus } from "../budget";
import { formatCurrency } from "../utils/formatCurrency";

interface UseBudgetResult {
	budgetSettings: BudgetSettings | null;
	budgetStatus: BudgetStatus | null;
	budgetInput: string;
	setBudgetInput: (value: string) => void;
	showBudgetModal: boolean;
	setShowBudgetModal: (value: boolean) => void;
	handleSaveBudget: () => Promise<void>;
	handleResetBudget: () => void;
	loadBudgetSettings: () => Promise<BudgetSettings | null>;
}

export const useBudget = (transactions: Transaction[]): UseBudgetResult => {
	const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(
		null
	);
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
			Alert.alert("Invalid Amount", "Please enter a valid budget amount");
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

	const handleResetBudget = (): void => {
		Alert.alert("Reset Budget", "Do you want to change your monthly budget?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Reset",
				onPress: () => {
					setBudgetInput(budgetSettings?.monthlyBudget?.toString() || "");
					setShowBudgetModal(true);
				},
			},
		]);
	};

	const budgetStatus: BudgetStatus | null = budgetSettings
		? calculateBudgetStatus(transactions, budgetSettings.monthlyBudget)
		: null;

	useEffect(() => {
		if (budgetStatus) {
			const formattedBudget = formatCurrency(budgetStatus.availableBudget);
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
		handleResetBudget,
		loadBudgetSettings,
	};
};
