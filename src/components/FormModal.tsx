import React from "react";
import {
	StyleSheet,
	Text,
	View,
	Modal,
	TextInput,
	TouchableOpacity,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import type { RawNotification } from "../types";

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
	/** Raw notification data for auto transactions (debugging) */
	rawNotification?: RawNotification;
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
	rawNotification,
}) => {
	const inputRef = React.useRef<TextInput>(null);
	const [selection, setSelection] = React.useState<
		{ start: number; end: number } | undefined
	>(undefined);
	const [showRawData, setShowRawData] = React.useState(false);

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
			// Reset selection and raw data view when modal closes
			setSelection(undefined);
			setShowRawData(false);
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
			<Pressable style={styles.modalOverlay} onPress={onClose}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<Pressable style={styles.modalContent} onPress={() => {}}>
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

						{/* Advanced Info Button - only show for auto transactions with raw data */}
						{rawNotification && (
							<TouchableOpacity
								style={styles.advancedButton}
								onPress={() => setShowRawData(!showRawData)}
							>
								<Text style={styles.advancedButtonText}>
									{showRawData ? "▼ Hide Raw Data" : "▶ Show Raw Data"}
								</Text>
							</TouchableOpacity>
						)}

						{/* Raw notification data display */}
						{showRawData && rawNotification && (
							<ScrollView
								style={styles.rawDataContainer}
								nestedScrollEnabled={true}
								scrollEnabled={true}
								showsVerticalScrollIndicator={true}
								onStartShouldSetResponder={() => true}
								onMoveShouldSetResponder={() => true}
							>
								<Text style={styles.rawDataText} selectable>
									{JSON.stringify(rawNotification, null, 2)}
								</Text>
							</ScrollView>
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
								<Text style={styles.modalButtonSubmitText}>{submitText}</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</KeyboardAvoidingView>
			</Pressable>
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
	advancedButton: {
		paddingVertical: 8,
		marginBottom: 8,
	},
	advancedButtonText: {
		color: "#666",
		fontSize: 12,
	},
	rawDataContainer: {
		backgroundColor: "#1a1a2e",
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
		maxHeight: 150,
	},
	rawDataText: {
		color: "#888",
		fontSize: 11,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
