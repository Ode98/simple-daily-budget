import React from "react";
import { StyleSheet, Text, View } from "react-native";

const EmptyState = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.icon}>📊</Text>
			<Text style={styles.title}>No transactions yet</Text>
			<Text style={styles.subtitle}>
				Add expenses manually or make a Google Pay payment
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
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
		fontSize: 20,
		fontWeight: "600",
		color: "#ffffff",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#a0a0a0",
		textAlign: "center",
		lineHeight: 24,
	},
});

export default EmptyState;
