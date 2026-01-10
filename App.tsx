import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, StatusBar } from "react-native";

import {
	FormModal,
	BudgetHeader,
	ActionButtons,
	PermissionScreen,
	EmptyState,
	BudgetModal,
	TransactionList,
	ErrorBoundary,
} from "./src/components";

import { usePermission } from "./src/hooks/usePermission";
import { useBudget } from "./src/hooks/useBudget";
import { useTransactions } from "./src/hooks/useTransactions";

export default function App(): React.JSX.Element {
	const { permissionStatus, checkPermission, requestPermission } =
		usePermission();

	const {
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
	} = useTransactions();

	const {
		budgetSettings,
		budgetStatus,
		budgetInput,
		setBudgetInput,
		showBudgetModal,
		setShowBudgetModal,
		handleSaveBudget,
		handleResetBudget,
		loadBudgetSettings,
	} = useBudget(transactions);

	const [refreshing, setRefreshing] = useState<boolean>(false);

	const loadData = useCallback(async () => {
		await loadTransactions();
		await loadBudgetSettings();
	}, [loadTransactions, loadBudgetSettings]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await checkPermission();
		await loadData();
		setRefreshing(false);
	}, [checkPermission, loadData]);

	useEffect(() => {
		loadData();
		const interval = setInterval(loadData, 5000);
		return () => clearInterval(interval);
	}, [loadData]);

	if (permissionStatus !== "authorized") {
		return (
			<ErrorBoundary>
				<PermissionScreen
					onRequestPermission={requestPermission}
					onCheckPermission={checkPermission}
				/>
			</ErrorBoundary>
		);
	}

	return (
		<ErrorBoundary>
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
					<TransactionList
						sections={sections}
						refreshing={refreshing}
						onRefresh={onRefresh}
						onTransactionPress={handleTransactionPress}
					/>
				)}

				<BudgetModal
					visible={showBudgetModal}
					budgetSettings={budgetSettings}
					budgetInput={budgetInput}
					onBudgetInputChange={setBudgetInput}
					onSave={handleSaveBudget}
					onClose={() => setShowBudgetModal(false)}
				/>

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

				<FormModal
					visible={showEditModal}
					onClose={() => {
						setShowEditModal(false);
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
		</ErrorBoundary>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
});
