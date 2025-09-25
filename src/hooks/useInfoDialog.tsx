import { InfoDialog } from "@/components/Dialog/InfoDialog";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface InfoDialogOptions {
	title: string;
	description: string;
	content?: ReactNode;
	confirmLabel?: string;
	onConfirm?: () => void;
}

interface InfoDialogContextValue {
	openInfoDialog: (options: InfoDialogOptions) => void;
	closeInfoDialog: () => void;
}

const InfoDialogContext = createContext<InfoDialogContextValue | null>(null);

export const useInfoDialog = (): InfoDialogContextValue => {
	const ctx = useContext(InfoDialogContext);
	if (!ctx) {
		throw new Error("useInfoDialog must be used within a InfoDialogProvider");
	}
	return ctx;
};

export const InfoDialogProvider = ({ children }: { children: ReactNode }) => {
	const [dialogOptions, setDialogOptions] = useState<InfoDialogOptions | null>(null);
	const [open, setOpen] = useState(false);

	const openInfoDialog = useCallback((options: InfoDialogOptions) => {
		setDialogOptions(options);
		setOpen(true);
	}, []);

	const closeInfoDialog = () => {
		setOpen(false);
	};

	const handleConfirm = () => {
		dialogOptions?.onConfirm?.();
		closeInfoDialog();
	};

	return (
		<InfoDialogContext.Provider value={{ openInfoDialog, closeInfoDialog }}>
			{children}
			{dialogOptions && (
				<InfoDialog
					open={open}
					title={dialogOptions.title}
					description={dialogOptions.description}
					handleClose={closeInfoDialog}
					confirmLabel={dialogOptions.confirmLabel}
					handleConfirm={handleConfirm}>
					{dialogOptions.content}
				</InfoDialog>
			)}
		</InfoDialogContext.Provider>
	);
};
