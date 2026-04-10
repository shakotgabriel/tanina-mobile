import type { ReactNode } from 'react';
import { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorBoundaryProps = {
	children: ReactNode;
	fallbackTitle?: string;
	fallbackMessage?: string;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = {
		hasError: false,
	};

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		console.error('Unhandled UI error caught by ErrorBoundary:', error);
	}

	private handleRetry = () => {
		this.setState({ hasError: false });
	};

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.title}>{this.props.fallbackTitle ?? 'Something went wrong'}</Text>
					<Text style={styles.message}>
						{this.props.fallbackMessage ?? 'Please try again. If the issue persists, restart the app.'}
					</Text>
					<Pressable accessibilityRole="button" onPress={this.handleRetry} style={styles.button}>
						<Text style={styles.buttonLabel}>Try again</Text>
					</Pressable>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: '#F8FAFC',
	},
	title: {
		fontSize: 22,
		lineHeight: 28,
		fontWeight: '700',
		color: '#0F172A',
		textAlign: 'center',
		marginBottom: 12,
	},
	message: {
		fontSize: 15,
		lineHeight: 22,
		color: '#475569',
		textAlign: 'center',
		marginBottom: 20,
	},
	button: {
		minHeight: 44,
		borderRadius: 12,
		backgroundColor: '#0EA5E9',
		paddingHorizontal: 18,
		paddingVertical: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonLabel: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
	},
});
