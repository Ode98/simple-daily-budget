import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error("ErrorBoundary caught an error:", error);
		console.error("Error info:", errorInfo.componentStack);
	}

	handleRetry = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.title}>Something went wrong</Text>
					<Text style={styles.message}>
						The app encountered an unexpected error.
					</Text>
					{this.state.error && (
						<Text style={styles.errorText}>{this.state.error.message}</Text>
					)}
					<TouchableOpacity style={styles.button} onPress={this.handleRetry}>
						<Text style={styles.buttonText}>Try Again</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#ffffff",
		marginBottom: 10,
	},
	message: {
		fontSize: 16,
		color: "#cccccc",
		textAlign: "center",
		marginBottom: 20,
	},
	errorText: {
		fontSize: 12,
		color: "#ff6b6b",
		textAlign: "center",
		marginBottom: 20,
		paddingHorizontal: 20,
	},
	button: {
		backgroundColor: "#4a4a8a",
		paddingHorizontal: 30,
		paddingVertical: 12,
		borderRadius: 8,
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
});
