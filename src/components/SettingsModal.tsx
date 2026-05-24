import React, { useState } from "react";
import {
	Modal,
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	TextInput,
} from "react-native";
import { SUPPORTED_CURRENCIES, AppSettings, BudgetSettings } from "../types";

interface SettingsModalProps {
	visible: boolean;
	settings: AppSettings;
	budgetSettings: BudgetSettings | null;
	onClose: () => void;
	onCurrencyChange: (currencyCode: string) => void;
	onChangeBudget: () => void;
	onSimulateNotification?: (rawJson: string) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
	visible,
	settings,
	budgetSettings,
	onClose,
	onCurrencyChange,
	onChangeBudget,
	onSimulateNotification,
}) => {
	const [developerJson, setDeveloperJson] = useState("");

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat(settings.locale, {
			style: "currency",
			currency: settings.currency,
		}).format(amount);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={true}
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={styles.container}>
					<View style={styles.header}>
						<Text style={styles.title}>Settings</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.content}>
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Budget</Text>
							<TouchableOpacity
								style={styles.budgetButton}
								onPress={() => {
									onChangeBudget();
									onClose();
								}}
							>
								<Text style={styles.budgetButtonText}>
									Change Monthly Budget{" "}
									{budgetSettings?.monthlyBudget
										? `(${formatCurrency(budgetSettings.monthlyBudget)})`
										: ""}
								</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Currency</Text>
							<View style={styles.currencyGrid}>
								{SUPPORTED_CURRENCIES.map((currency) => (
									<TouchableOpacity
										key={currency.code}
										style={[
											styles.currencyItem,
											settings.currency === currency.code &&
												styles.currencyItemSelected,
										]}
										onPress={() => onCurrencyChange(currency.code)}
									>
										<Text
											style={[
												styles.currencySymbol,
												settings.currency === currency.code &&
													styles.currencyTextSelected,
											]}
										>
											{currency.symbol}
										</Text>
										<Text
											style={[
												styles.currencyCode,
												settings.currency === currency.code &&
													styles.currencyTextSelected,
											]}
										>
											{currency.code}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{onSimulateNotification && (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Developer Settings</Text>
								<TextInput
									style={styles.devInput}
									placeholder="Paste raw notification JSON here..."
									placeholderTextColor="#666"
									multiline
									value={developerJson}
									onChangeText={setDeveloperJson}
								/>
								<TouchableOpacity
									style={styles.devButton}
									onPress={() => {
										onSimulateNotification(developerJson);
										setDeveloperJson("");
									}}
								>
									<Text style={styles.devButtonText}>Simulate Notification</Text>
								</TouchableOpacity>
							</View>
						)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "flex-end",
	},
	container: {
		backgroundColor: "#16213e",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: "80%",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#ffffff",
	},
	closeButton: {
		padding: 8,
	},
	closeText: {
		fontSize: 20,
		color: "#a0a0a0",
	},
	content: {
		padding: 20,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 14,
		color: "#a0a0a0",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
	},
	currencyGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	currencyItem: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 12,
		minWidth: 70,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "transparent",
	},
	currencyItemSelected: {
		backgroundColor: "rgba(76, 175, 80, 0.2)",
		borderColor: "#4CAF50",
	},
	currencySymbol: {
		fontSize: 20,
		color: "#ffffff",
		marginBottom: 4,
	},
	currencyCode: {
		fontSize: 12,
		color: "#a0a0a0",
	},
	currencyTextSelected: {
		color: "#4CAF50",
	},
	budgetButton: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
	},
	budgetButtonText: {
		fontSize: 16,
		color: "#ffffff",
		fontWeight: "500",
	},
	devInput: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 12,
		color: "#ffffff",
		minHeight: 100,
		textAlignVertical: "top",
		marginBottom: 12,
	},
	devButton: {
		backgroundColor: "#4CAF50",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
	},
	devButtonText: {
		fontSize: 16,
		color: "#ffffff",
		fontWeight: "500",
	},
});

export default SettingsModal;
