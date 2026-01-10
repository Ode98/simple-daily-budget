import { useState, useCallback, useEffect } from "react";
import RNAndroidNotificationListener from "react-native-android-notification-listener";

interface UsePermissionResult {
	permissionStatus: string;
	checkPermission: () => Promise<void>;
	requestPermission: () => void;
}

export const usePermission = (): UsePermissionResult => {
	const [permissionStatus, setPermissionStatus] = useState<string>("unknown");

	const checkPermission = useCallback(async () => {
		try {
			const status = await RNAndroidNotificationListener.getPermissionStatus();
			setPermissionStatus(status);
		} catch (error) {
			console.error("Error checking permission:", error);
		}
	}, []);

	const requestPermission = (): void => {
		RNAndroidNotificationListener.requestPermission();
	};

	useEffect(() => {
		checkPermission();
	}, [checkPermission]);

	return {
		permissionStatus,
		checkPermission,
		requestPermission,
	};
};
