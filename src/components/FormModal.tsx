import React from "react";
import {
	StyleSheet,
	Text,
	View,
	Modal,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

interface FormModalProps {
	visible: boolean;
	onClose: () => void;
	title: string;
	onSubmit: () => void;
	submitText: string;
	amountValue: string;
	onAmountChange: (value: string) => void;
	descriptionValue: string;
	onDescriptionChange: (value: string) => void;
	showDescription?: boolean;
	showDelete?: boolean;
	onDelete?: () => void;
	autoFocusAmount?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({
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
	const inputRef = React.useRef<TextInput>(null);
	const [selection, setSelection] = React.useState<
		{ start: number; end: number } | undefined
	>(undefined);

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
		marginBottom: 16,
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

export default FormModal;
