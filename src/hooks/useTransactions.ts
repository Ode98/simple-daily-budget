import { useState, useCallback, useMemo } from "react";
import { Alert } from "react-native";

import { Transaction, TRANSACTION_TYPES } from "../types";
import {
	getTransactions,
	saveTransaction,
	createTransaction,
	deleteTransaction,
	updateTransaction,
	migrateOldData,
} from "../storage";
import { groupTransactionsByDay } from "../budget";

interface TransactionSection {
	title: string;
	data: Transaction[];
}

interface UseTransactionsResult {
	transactions: Transaction[];
	sections: TransactionSection[];
	loadTransactions: () => Promise<Transaction[]>;
	expenseAmount: string;
	setExpenseAmount: (value: string) => void;
	expenseDescription: string;
	setExpenseDescription: (value: string) => void;
	showExpenseModal: boolean;
	setShowExpenseModal: (value: boolean) => void;
	handleAddExpense: () => Promise<void>;
	incomeAmount: string;
	setIncomeAmount: (value: string) => void;
	incomeDescription: string;
	setIncomeDescription: (value: string) => void;
	showIncomeModal: boolean;
	setShowIncomeModal: (value: boolean) => void;
	handleAddIncome: () => Promise<void>;
	editingTransaction: Transaction | null;
	editAmount: string;
	setEditAmount: (value: string) => void;
	editDescription: string;
	setEditDescription: (value: string) => void;
	showEditModal: boolean;
	setShowEditModal: (value: boolean) => void;
	handleTransactionPress: (transaction: Transaction) => void;
	handleSaveEdit: () => Promise<void>;
	handleDeleteTransaction: () => Promise<void>;
}

export const useTransactions = (): UseTransactionsResult => {
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const [expenseAmount, setExpenseAmount] = useState<string>("");
	const [expenseDescription, setExpenseDescription] = useState<string>("");
	const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
	const [incomeAmount, setIncomeAmount] = useState<string>("");
	const [incomeDescription, setIncomeDescription] = useState<string>("");
	const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [editAmount, setEditAmount] = useState<string>("");
	const [editDescription, setEditDescription] = useState<string>("");
	const [showEditModal, setShowEditModal] = useState<boolean>(false);

	const sections = useMemo(() => {
		const grouped = groupTransactionsByDay(transactions);
		return Object.keys(grouped)
			.sort((a, b) => b.localeCompare(a))
			.map((date) => ({
				title: date,
				data: grouped[date],
			}));
	}, [transactions]);

	const loadTransactions = useCallback(async (): Promise<Transaction[]> => {
		try {
			await migrateOldData();
			const txData = await getTransactions();
			setTransactions(txData);
			return txData;
		} catch (error) {
			console.error("Error loading transactions:", error);
			return [];
		}
	}, []);

	const handleAddExpense = async (): Promise<void> => {
		const amount = parseFloat(expenseAmount.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Invalid Amount", "Please enter a valid amount");
			return;
		}

		const transaction = createTransaction(
			amount,
			TRANSACTION_TYPES.EXPENSE,
			expenseDescription
		);
		const updated = await saveTransaction(transaction);
		setTransactions(updated);
		setShowExpenseModal(false);
		setExpenseAmount("");
		setExpenseDescription("");
	};

	const handleAddIncome = async (): Promise<void> => {
		const amount = parseFloat(incomeAmount.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Invalid Amount", "Please enter a valid amount");
			return;
		}

		const transaction = createTransaction(
			amount,
			TRANSACTION_TYPES.INCOME,
			incomeDescription
		);
		const updated = await saveTransaction(transaction);
		setTransactions(updated);
		setShowIncomeModal(false);
		setIncomeAmount("");
		setIncomeDescription("");
	};

	const handleTransactionPress = useCallback((transaction: Transaction) => {
		setEditingTransaction(transaction);
		setEditAmount(transaction.amount.toString());
		setEditDescription(transaction.description);
		setShowEditModal(true);
	}, []);

	const handleSaveEdit = async (): Promise<void> => {
		if (!editingTransaction) return;

		const amount = parseFloat(editAmount.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Invalid Amount", "Please enter a valid amount");
			return;
		}

		const updated = await updateTransaction(editingTransaction.id, {
			amount,
			description: editDescription,
		});
		setTransactions(updated);
		setShowEditModal(false);
		setEditingTransaction(null);
		setEditAmount("");
		setEditDescription("");
	};

	const handleDeleteTransaction = async (): Promise<void> => {
		if (!editingTransaction) return;

		Alert.alert(
			"Delete Transaction",
			"Are you sure you want to delete this transaction?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						const updated = await deleteTransaction(editingTransaction.id);
						setTransactions(updated);
						setShowEditModal(false);
						setEditingTransaction(null);
					},
				},
			]
		);
	};

	return {
		transactions,
		sections,
		loadTransactions,
		expenseAmount,
		setExpenseAmount,
		expenseDescription,
		setExpenseDescription,
		showExpenseModal,
		setShowExpenseModal,
		handleAddExpense,
		incomeAmount,
		setIncomeAmount,
		incomeDescription,
		setIncomeDescription,
		showIncomeModal,
		setShowIncomeModal,
		handleAddIncome,
		editingTransaction,
		editAmount,
		setEditAmount,
		editDescription,
		setEditDescription,
		showEditModal,
		setShowEditModal,
		handleTransactionPress,
		handleSaveEdit,
		handleDeleteTransaction,
	};
};
