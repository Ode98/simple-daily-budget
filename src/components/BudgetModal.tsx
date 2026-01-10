import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	Modal,
	TouchableOpacity,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

import { BudgetSettings } from "../types";
import { getDailyAllowance } from "../budget";
import { formatCurrency } from "../utils/formatCurrency";

interface BudgetModalProps {
	visible: boolean;
	budgetSettings: BudgetSettings | null;
	budgetInput: string;
	onBudgetInputChange: (value: string) => void;
	onSave: () => void;
	onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
	visible,
	budgetSettings,
	budgetInput,
	onBudgetInputChange,
	onSave,
	onClose,
}) => {
	const canClose = !!budgetSettings;
	const parsedAmount = parseFloat(budgetInput.replace(",", "."));
	const showPreview = budgetInput && !isNaN(parsedAmount);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={() => canClose && onClose()}
		>
			<TouchableWithoutFeedback onPress={() => canClose && onClose()}>
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
									onChangeText={onBudgetInputChange}
									autoFocus
								/>

								{showPreview && (
									<Text style={styles.previewText}>
										≈ {formatCurrency(getDailyAllowance(parsedAmount))}/day
									</Text>
								)}

								<View style={styles.modalButtons}>
									{canClose && (
										<TouchableOpacity
											style={[styles.modalButton, styles.modalButtonCancel]}
											onPress={onClose}
										>
											<Text style={styles.modalButtonCancelText}>Cancel</Text>
										</TouchableOpacity>
									)}
									<TouchableOpacity
										style={[
											styles.modalButton,
											styles.modalButtonSubmit,
											!canClose && { flex: 1 },
										]}
										onPress={onSave}
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
	);
};

const styles = StyleSheet.create({
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
