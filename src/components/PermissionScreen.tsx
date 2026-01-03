import React from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	StatusBar,
} from "react-native";

interface PermissionScreenProps {
	onRequestPermission: () => void;
	onCheckPermission: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({
	onRequestPermission,
	onCheckPermission,
}) => {
	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
			<View style={styles.content}>
				<Text style={styles.icon}>🔔</Text>
				<Text style={styles.title}>Notification Access Required</Text>
				<Text style={styles.text}>
					This app needs permission to read notifications from Google Pay to
					automatically track your spending.
				</Text>
				<TouchableOpacity style={styles.button} onPress={onRequestPermission}>
					<Text style={styles.buttonText}>Open Settings</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.refreshButton}
					onPress={onCheckPermission}
				>
					<Text style={styles.refreshButtonText}>I've enabled it</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},
	icon: {
		fontSize: 64,
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
		textAlign: "center",
		marginBottom: 16,
	},
	text: {
		fontSize: 16,
		color: "#a0a0a0",
		textAlign: "center",
		marginBottom: 32,
		lineHeight: 24,
	},
	button: {
		backgroundColor: "#e94560",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		marginBottom: 16,
	},
	buttonText: {
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
});

export default PermissionScreen;
