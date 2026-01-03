import React, { useState, useEffect, useCallback } from "react";
import {
	StyleSheet,
	View,
	FlatList,
	RefreshControl,
	StatusBar,
	Alert,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Platform,
	ListRenderItem,
} from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import { requestWidgetUpdate } from "react-native-android-widget";

// Types
import {
	Transaction,
	BudgetSettings,
	BudgetStatus,
	TRANSACTION_TYPES,
} from "./src/types";

// Storage and budget utilities
import {
	getTransactions,
	saveTransaction,
	createTransaction,
	deleteTransaction,
	updateTransaction,
	getBudgetSettings,
	saveBudgetSettings,
	migrateOldData,
} from "./src/storage";
import { calculateBudgetStatus, getDailyAllowance } from "./src/budget";

// Components
import {
	FormModal,
	TransactionItem,
	BudgetHeader,
	ActionButtons,
	PermissionScreen,
	EmptyState,
} from "./src/components";

// Format currency helper
const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

export default function App(): React.JSX.Element {
	const [permissionStatus, setPermissionStatus] = useState<string>("unknown");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(
		null
	);
	const [refreshing, setRefreshing] = useState<boolean>(false);

	// Modal states
	const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
	const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
	const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
	const [showEditModal, setShowEditModal] = useState<boolean>(false);

	// Form states
	const [budgetInput, setBudgetInput] = useState<string>("");
	const [expenseAmount, setExpenseAmount] = useState<string>("");
	const [expenseDescription, setExpenseDescription] = useState<string>("");
	const [incomeAmount, setIncomeAmount] = useState<string>("");
	const [incomeDescription, setIncomeDescription] = useState<string>("");

	// Edit state
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [editAmount, setEditAmount] = useState<string>("");
	const [editDescription, setEditDescription] = useState<string>("");

	// Check permission status
	const checkPermission = useCallback(async () => {
		try {
			const status = await RNAndroidNotificationListener.getPermissionStatus();
			setPermissionStatus(status);
		} catch (error) {
			console.error("Error checking permission:", error);
		}
	}, []);

	// Load data from storage
	const loadData = useCallback(async () => {
		try {
			await migrateOldData();
			const [txData, settings] = await Promise.all([
				getTransactions(),
				getBudgetSettings(),
			]);
			setTransactions(txData);
			setBudgetSettings(settings);

			if (!settings) {
				setShowBudgetModal(true);
			}
		} catch (error) {
			console.error("Error loading data:", error);
		}
	}, []);

	// Handle pull-to-refresh
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await checkPermission();
		await loadData();
		setRefreshing(false);
	}, [checkPermission, loadData]);

	// Initial load
	useEffect(() => {
		checkPermission();
		loadData();
		const interval = setInterval(loadData, 5000);
		return () => clearInterval(interval);
	}, [checkPermission, loadData]);

	// Request permission
	const requestPermission = (): void => {
		RNAndroidNotificationListener.requestPermission();
	};

	// Save budget settings
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

	// Add expense
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

	// Add income
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

	// Open edit modal
	const handleTransactionPress = useCallback((transaction: Transaction) => {
		setEditingTransaction(transaction);
		setEditAmount(transaction.amount.toString());
		setEditDescription(transaction.description);
		setShowEditModal(true);
	}, []);

	// Save edited transaction
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

	// Delete transaction
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

	// Reset budget
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

	// Calculate budget status (moved before hooks to avoid conditional hook calls)
	const budgetStatus: BudgetStatus | null = budgetSettings
		? calculateBudgetStatus(transactions, budgetSettings.monthlyBudget)
		: null;

	// Update widget when budget changes
	useEffect(() => {
		if (budgetStatus) {
			const formattedBudget = formatCurrency(budgetStatus.availableBudget);
			const isNegative = budgetStatus.availableBudget < 0;
			// Trigger widget update with current budget data
			requestWidgetUpdate({
				widgetName: "BudgetWidget",
				renderWidget: () => {
					const { BudgetWidget } = require("./src/widgets/BudgetWidget");
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

	// Memoized render function for FlatList
	const renderItem: ListRenderItem<Transaction> = useCallback(
		({ item }) => (
			<TransactionItem
				item={item}
				onPress={() => handleTransactionPress(item)}
			/>
		),
		[handleTransactionPress]
	);

	// Permission screen
	if (permissionStatus !== "authorized") {
		return (
			<PermissionScreen
				onRequestPermission={requestPermission}
				onCheckPermission={checkPermission}
			/>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

			<BudgetHeader
				budgetStatus={budgetStatus}
				onSettingsPress={handleResetBudget}
			/>

			<ActionButtons
				onExpensePress={() => setShowExpenseModal(true)}
				onIncomePress={() => setShowIncomeModal(true)}
			/>

			{transactions.length === 0 ? (
				<EmptyState />
			) : (
				<FlatList
					data={transactions}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#e94560"
							colors={["#e94560"]}
						/>
					}
				/>
			)}

			{/* Budget Setup Modal */}
			<Modal
				visible={showBudgetModal}
				transparent
				animationType="none"
				onRequestClose={() => budgetSettings && setShowBudgetModal(false)}
			>
				<TouchableWithoutFeedback
					onPress={() => budgetSettings && setShowBudgetModal(false)}
				>
					<View style={styles.modalOverlay}>
						<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
							<KeyboardAvoidingView
								behavior={Platform.OS === "ios" ? "padding" : undefined}
							>
								<View style={styles.modalContent}>
									<Text style={styles.modalTitle}>Set Monthly Budget</Text>
									<Text style={styles.modalSubtitle}>
										This will be divided into daily allowances
									</Text>

									<TextInput
										style={styles.input}
										placeholder="Monthly budget (€)"
										placeholderTextColor="#666"
										keyboardType="decimal-pad"
										value={budgetInput}
										onChangeText={setBudgetInput}
										autoFocus
									/>

									{budgetInput &&
										!isNaN(parseFloat(budgetInput.replace(",", "."))) && (
											<Text style={styles.previewText}>
												≈{" "}
												{formatCurrency(
													getDailyAllowance(
														parseFloat(budgetInput.replace(",", "."))
													)
												)}
												/day
											</Text>
										)}

									<View style={styles.modalButtons}>
										{budgetSettings && (
											<TouchableOpacity
												style={[styles.modalButton, styles.modalButtonCancel]}
												onPress={() => setShowBudgetModal(false)}
											>
												<Text style={styles.modalButtonCancelText}>Cancel</Text>
											</TouchableOpacity>
										)}
										<TouchableOpacity
											style={[
												styles.modalButton,
												styles.modalButtonSubmit,
												!budgetSettings && { flex: 1 },
											]}
											onPress={handleSaveBudget}
										>
											<Text style={styles.modalButtonSubmitText}>Save</Text>
										</TouchableOpacity>
									</View>
								</View>
							</KeyboardAvoidingView>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>

			{/* Expense Modal */}
			<FormModal
				visible={showExpenseModal}
				onClose={() => {
					setShowExpenseModal(false);
					setExpenseAmount("");
					setExpenseDescription("");
				}}
				title="Add Expense"
				onSubmit={handleAddExpense}
				submitText="Add"
				amountValue={expenseAmount}
				onAmountChange={setExpenseAmount}
				descriptionValue={expenseDescription}
				onDescriptionChange={setExpenseDescription}
			/>

			{/* Income Modal */}
			<FormModal
				visible={showIncomeModal}
				onClose={() => {
					setShowIncomeModal(false);
					setIncomeAmount("");
					setIncomeDescription("");
				}}
				title="Add Income"
				onSubmit={handleAddIncome}
				submitText="Add"
				amountValue={incomeAmount}
				onAmountChange={setIncomeAmount}
				descriptionValue={incomeDescription}
				onDescriptionChange={setIncomeDescription}
			/>

			{/* Edit Transaction Modal */}
			<FormModal
				visible={showEditModal}
				onClose={() => {
					setShowEditModal(false);
					setEditingTransaction(null);
					setEditAmount("");
					setEditDescription("");
				}}
				title="Edit Transaction"
				onSubmit={handleSaveEdit}
				submitText="Save"
				amountValue={editAmount}
				onAmountChange={setEditAmount}
				descriptionValue={editDescription}
				onDescriptionChange={setEditDescription}
				showDelete={true}
				onDelete={handleDeleteTransaction}
				rawNotification={editingTransaction?.rawNotification}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	// Budget Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "flex-start",
		paddingTop: 120,
		paddingHorizontal: 24,
	},
	modalContent: {
		backgroundColor: "#16213e",
		borderRadius: 24,
		padding: 24,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
		textAlign: "center",
		marginBottom: 8,
	},
	modalSubtitle: {
		fontSize: 14,
		color: "#a0a0a0",
		textAlign: "center",
		marginBottom: 24,
	},
	input: {
		backgroundColor: "#1a1a2e",
		borderRadius: 12,
		padding: 16,
		fontSize: 18,
		color: "#ffffff",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#2a2a4e",
	},
	previewText: {
		fontSize: 16,
		color: "#4CAF50",
		textAlign: "center",
		marginBottom: 16,
	},
	modalButtons: {
		flexDirection: "row",
		gap: 12,
		marginTop: 8,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	modalButtonCancel: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	modalButtonCancelText: {
		color: "#a0a0a0",
		fontSize: 16,
		fontWeight: "600",
	},
	modalButtonSubmit: {
		backgroundColor: "#e94560",
	},
	modalButtonSubmitText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
});
