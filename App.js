import React, { useState, useEffect, useCallback, memo } from "react";
import {
	StyleSheet,
	Text,
	View,
	FlatList,
	TouchableOpacity,
	TouchableWithoutFeedback,
	RefreshControl,
	StatusBar,
	Alert,
	Modal,
	TextInput,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import {
	getTransactions,
	saveTransaction,
	createTransaction,
	deleteTransaction,
	updateTransaction,
	getBudgetSettings,
	saveBudgetSettings,
	migrateOldData,
	TRANSACTION_TYPES,
} from "./src/storage";
import {
	calculateBudgetStatus,
	getDailyAllowance,
	formatDate,
} from "./src/budget";

// Get transaction icon and color - defined outside for performance
const getTransactionStyle = (type) => {
	switch (type) {
		case TRANSACTION_TYPES.INCOME:
			return { icon: "💰", color: "#4CAF50", sign: "+" };
		case TRANSACTION_TYPES.AUTO_PAYMENT:
			return { icon: "💳", color: "#e94560", sign: "-" };
		case TRANSACTION_TYPES.EXPENSE:
		default:
			return { icon: "🛒", color: "#e94560", sign: "-" };
	}
};

// Format currency - defined outside for performance
const formatCurrency = (amount) => {
	return new Intl.NumberFormat("fi-FI", {
		style: "currency",
		currency: "EUR",
	}).format(Math.abs(amount));
};

// Memoized transaction item component for better FlatList performance
const TransactionItem = memo(({ item, onPress }) => {
	const style = getTransactionStyle(item.type);

	return (
		<TouchableOpacity
			style={styles.transactionItem}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={styles.transactionLeft}>
				<Text style={styles.transactionIcon}>{style.icon}</Text>
				<View style={styles.transactionInfo}>
					<Text style={styles.transactionDescription}>{item.description}</Text>
					<Text style={styles.transactionDate}>
						{formatDate(item.timestamp)}
					</Text>
				</View>
			</View>
			<Text style={[styles.transactionAmount, { color: style.color }]}>
				{style.sign}
				{formatCurrency(item.amount)}
			</Text>
		</TouchableOpacity>
	);
});

// Form Modal Component - defined outside App to prevent recreation on each render
const FormModal = ({
	visible,
	onClose,
	title,
	onSubmit,
	submitText,
	amountValue,
	onAmountChange,
	descriptionValue,
	onDescriptionChange,
	showDescription = true,
	showDelete = false,
	onDelete,
	autoFocusAmount = true,
}) => {
	const inputRef = React.useRef(null);
	const [selection, setSelection] = React.useState(undefined);

	// Focus input when modal becomes visible (only if autoFocusAmount is true)
	React.useEffect(() => {
		if (visible && autoFocusAmount) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
				// Set cursor to end of text
				if (amountValue) {
					setSelection({ start: amountValue.length, end: amountValue.length });
				}
			}, 100);
			return () => clearTimeout(timer);
		} else if (!visible) {
			// Reset selection when modal closes
			setSelection(undefined);
		}
	}, [visible, autoFocusAmount, amountValue]);

	// Clear selection after it's been applied (so user can freely move cursor)
	const handleSelectionChange = () => {
		if (selection) {
			setSelection(undefined);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.modalOverlay}>
					<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
						<KeyboardAvoidingView
							behavior={Platform.OS === "ios" ? "padding" : undefined}
						>
							<View style={styles.modalContent}>
								<Text style={styles.modalTitle}>{title}</Text>

								<TextInput
									ref={inputRef}
									style={styles.input}
									placeholder="Amount (€)"
									placeholderTextColor="#666"
									keyboardType="decimal-pad"
									value={amountValue}
									onChangeText={onAmountChange}
									selection={selection}
									onSelectionChange={handleSelectionChange}
								/>

								{showDescription && (
									<TextInput
										style={styles.input}
										placeholder="Description (optional)"
										placeholderTextColor="#666"
										value={descriptionValue}
										onChangeText={onDescriptionChange}
									/>
								)}

								<View style={styles.modalButtons}>
									{showDelete && (
										<TouchableOpacity
											style={[styles.modalButton, styles.modalButtonDelete]}
											onPress={onDelete}
										>
											<Text style={styles.modalButtonDeleteText}>Delete</Text>
										</TouchableOpacity>
									)}
									<TouchableOpacity
										style={[styles.modalButton, styles.modalButtonCancel]}
										onPress={onClose}
									>
										<Text style={styles.modalButtonCancelText}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.modalButton, styles.modalButtonSubmit]}
										onPress={onSubmit}
									>
										<Text style={styles.modalButtonSubmitText}>
											{submitText}
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						</KeyboardAvoidingView>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default function App() {
	const [permissionStatus, setPermissionStatus] = useState("unknown");
	const [transactions, setTransactions] = useState([]);
	const [budgetSettings, setBudgetSettings] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	// Modal states
	const [showBudgetModal, setShowBudgetModal] = useState(false);
	const [showExpenseModal, setShowExpenseModal] = useState(false);
	const [showIncomeModal, setShowIncomeModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);

	// Form states - separate state for each modal to prevent conflicts
	const [budgetInput, setBudgetInput] = useState("");
	const [expenseAmount, setExpenseAmount] = useState("");
	const [expenseDescription, setExpenseDescription] = useState("");
	const [incomeAmount, setIncomeAmount] = useState("");
	const [incomeDescription, setIncomeDescription] = useState("");

	// Edit state
	const [editingTransaction, setEditingTransaction] = useState(null);
	const [editAmount, setEditAmount] = useState("");
	const [editDescription, setEditDescription] = useState("");

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
			// Migrate old data if present
			await migrateOldData();

			const [txData, settings] = await Promise.all([
				getTransactions(),
				getBudgetSettings(),
			]);
			setTransactions(txData);
			setBudgetSettings(settings);

			// Show budget setup if not configured
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

		// Refresh periodically
		const interval = setInterval(loadData, 5000);
		return () => clearInterval(interval);
	}, [checkPermission, loadData]);

	// Open Android notification settings
	const requestPermission = () => {
		RNAndroidNotificationListener.requestPermission();
	};

	// Save budget settings
	const handleSaveBudget = async () => {
		const amount = parseFloat(budgetInput.replace(",", "."));
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Invalid Amount", "Please enter a valid budget amount");
			return;
		}

		const settings = {
			monthlyBudget: amount,
			startDate: new Date().toISOString(),
		};

		await saveBudgetSettings(settings);
		setBudgetSettings(settings);
		setShowBudgetModal(false);
		setBudgetInput("");
	};

	// Add expense
	const handleAddExpense = async () => {
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
	const handleAddIncome = async () => {
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

	// Open edit modal for a transaction
	const handleTransactionPress = useCallback((transaction) => {
		setEditingTransaction(transaction);
		setEditAmount(transaction.amount.toString());
		setEditDescription(transaction.description);
		setShowEditModal(true);
	}, []);

	// Save edited transaction
	const handleSaveEdit = async () => {
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
	const handleDeleteTransaction = async () => {
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
						setEditAmount("");
						setEditDescription("");
					},
				},
			]
		);
	};

	// Reset budget
	const handleResetBudget = () => {
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

	// Memoized render function for FlatList - must be before early return
	const renderItem = useCallback(
		({ item }) => (
			<TransactionItem
				item={item}
				onPress={() => handleTransactionPress(item)}
			/>
		),
		[handleTransactionPress]
	);

	// Render permission request screen
	if (permissionStatus !== "authorized") {
		return (
			<View style={styles.container}>
				<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
				<View style={styles.permissionContainer}>
					<Text style={styles.permissionIcon}>🔔</Text>
					<Text style={styles.permissionTitle}>
						Notification Access Required
					</Text>
					<Text style={styles.permissionText}>
						This app needs permission to read notifications from Google Pay to
						automatically track your spending.
					</Text>
					<TouchableOpacity
						style={styles.permissionButton}
						onPress={requestPermission}
					>
						<Text style={styles.permissionButtonText}>Open Settings</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.refreshButton}
						onPress={checkPermission}
					>
						<Text style={styles.refreshButtonText}>I've enabled it</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Calculate budget status
	const budgetStatus = budgetSettings
		? calculateBudgetStatus(transactions, budgetSettings.monthlyBudget)
		: null;

	const isPositive = budgetStatus?.availableBudget >= 0;

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

			{/* Header with daily budget */}
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<Text style={styles.headerLabel}>Today's Budget</Text>
					<TouchableOpacity onPress={handleResetBudget}>
						<Text style={styles.settingsIcon}>⚙️</Text>
					</TouchableOpacity>
				</View>

				{budgetStatus ? (
					<>
						<Text
							style={[
								styles.budgetAmount,
								{ color: isPositive ? "#4CAF50" : "#e94560" },
							]}
						>
							{formatCurrency(budgetStatus.availableBudget)}
						</Text>
						<Text style={styles.dailyAllowance}>
							+{formatCurrency(budgetStatus.dailyAllowance)}/day
						</Text>
						<View style={styles.statsRow}>
							<Text style={styles.statText}>
								Day {budgetStatus.daysElapsed}/{budgetStatus.daysInMonth}
							</Text>
							<Text style={styles.statDivider}>•</Text>
							<Text style={styles.statText}>
								Spent: {formatCurrency(budgetStatus.totalSpent)}
							</Text>
							{budgetStatus.totalIncome > 0 && (
								<>
									<Text style={styles.statDivider}>•</Text>
									<Text style={[styles.statText, { color: "#4CAF50" }]}>
										+{formatCurrency(budgetStatus.totalIncome)}
									</Text>
								</>
							)}
						</View>
					</>
				) : (
					<Text style={styles.budgetAmount}>Set Budget</Text>
				)}
			</View>

			{/* Action buttons */}
			<View style={styles.actionButtons}>
				<TouchableOpacity
					style={[styles.actionButton, styles.expenseButton]}
					onPress={() => setShowExpenseModal(true)}
				>
					<Text style={styles.actionButtonIcon}>−</Text>
					<Text style={styles.actionButtonText}>Expense</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.actionButton, styles.incomeButton]}
					onPress={() => setShowIncomeModal(true)}
				>
					<Text style={styles.actionButtonIcon}>+</Text>
					<Text style={styles.actionButtonText}>Income</Text>
				</TouchableOpacity>
			</View>

			{/* Transactions list */}
			{transactions.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyIcon}>📊</Text>
					<Text style={styles.emptyText}>No transactions yet</Text>
					<Text style={styles.emptySubtext}>
						Add expenses manually or make a Google Pay payment
					</Text>
				</View>
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
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},

	// Permission screen
	permissionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},
	permissionIcon: {
		fontSize: 64,
		marginBottom: 24,
	},
	permissionTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
		textAlign: "center",
		marginBottom: 16,
	},
	permissionText: {
		fontSize: 16,
		color: "#a0a0a0",
		textAlign: "center",
		marginBottom: 32,
		lineHeight: 24,
	},
	permissionButton: {
		backgroundColor: "#e94560",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		marginBottom: 16,
	},
	permissionButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "600",
	},
	refreshButton: {
		paddingHorizontal: 32,
		paddingVertical: 12,
	},
	refreshButtonText: {
		color: "#e94560",
		fontSize: 16,
	},

	// Header
	header: {
		backgroundColor: "#16213e",
		padding: 24,
		paddingTop: 60,
		alignItems: "center",
		borderBottomLeftRadius: 32,
		borderBottomRightRadius: 32,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		marginBottom: 8,
	},
	headerLabel: {
		fontSize: 14,
		color: "#a0a0a0",
		textTransform: "uppercase",
		letterSpacing: 2,
	},
	settingsIcon: {
		fontSize: 24,
	},
	budgetAmount: {
		fontSize: 56,
		fontWeight: "bold",
		color: "#4CAF50",
		marginBottom: 4,
	},
	dailyAllowance: {
		fontSize: 16,
		color: "#4CAF50",
		marginBottom: 12,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statText: {
		fontSize: 13,
		color: "#a0a0a0",
	},
	statDivider: {
		fontSize: 13,
		color: "#a0a0a0",
		marginHorizontal: 8,
	},

	// Action buttons
	actionButtons: {
		flexDirection: "row",
		padding: 16,
		gap: 12,
	},
	actionButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		borderRadius: 12,
		gap: 8,
	},
	expenseButton: {
		backgroundColor: "rgba(233, 69, 96, 0.2)",
		borderWidth: 1,
		borderColor: "#e94560",
	},
	incomeButton: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderWidth: 1,
		borderColor: "#4CAF50",
	},
	actionButtonIcon: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
	},

	// List
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	transactionItem: {
		backgroundColor: "#16213e",
		borderRadius: 16,
		padding: 16,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	transactionItemPressed: {
		backgroundColor: "#1e2a4a",
	},
	transactionLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	transactionIcon: {
		fontSize: 24,
		marginRight: 12,
	},
	transactionInfo: {
		flex: 1,
	},
	transactionDescription: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
		marginBottom: 2,
	},
	transactionDate: {
		fontSize: 13,
		color: "#a0a0a0",
	},
	transactionAmount: {
		fontSize: 18,
		fontWeight: "bold",
	},

	// Empty state
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},
	emptyIcon: {
		fontSize: 64,
		marginBottom: 24,
	},
	emptyText: {
		fontSize: 20,
		fontWeight: "600",
		color: "#ffffff",
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 16,
		color: "#a0a0a0",
		textAlign: "center",
		lineHeight: 24,
	},

	// Modals
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
	modalButtonDelete: {
		backgroundColor: "rgba(233, 69, 96, 0.2)",
		borderWidth: 1,
		borderColor: "#e94560",
	},
	modalButtonDeleteText: {
		color: "#e94560",
		fontSize: 16,
		fontWeight: "600",
	},
});
