import { ConfirmationDialog } from "@/components/Dialog/InfoDialog/ConfirmationDialog";
import { createContext, useCallback, useContext, useState } from "react";

interface ConfirmDialogOptions {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmDisabled?: boolean;
	cancelDisabled?: boolean;
	onConfirm?: () => void;
	onCancel?: () => void;
}

interface ConfirmDialogContextValue {
	openConfirmDialog: (options: ConfirmDialogOptions) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export const useConfirmDialog = (): ConfirmDialogContextValue => {
	const ctx = useContext(ConfirmDialogContext);
	if (!ctx) {
		throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
	}
	return ctx;
};

export const ConfirmDialogProvider = ({ children }: { children: React.ReactNode }) => {
	const [dialogOptions, setDialogOptions] = useState<ConfirmDialogOptions | null>(null);
	const [open, setOpen] = useState(false);

	const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
		setDialogOptions(options);
		setOpen(true);
	}, []);

	const handleConfirm = useCallback(() => {
		dialogOptions?.onConfirm?.();
		setOpen(false);
	}, [dialogOptions]);

	const handleCancel = useCallback(() => {
		dialogOptions?.onCancel?.();
		setOpen(false);
	}, [dialogOptions]);

	return (
		<ConfirmDialogContext.Provider value={{ openConfirmDialog }}>
			{children}
			{dialogOptions && (
				<ConfirmationDialog
					open={open}
					title={dialogOptions.title}
					description={dialogOptions.description}
					confirmLabel={dialogOptions.confirmLabel}
					cancelLabel={dialogOptions.cancelLabel}
					confirmDisabled={dialogOptions.confirmDisabled}
					cancelDisabled={dialogOptions.cancelDisabled}
					handleConfirm={handleConfirm}
					handleCancel={handleCancel}
					handleClose={() => setOpen(false)}
				/>
			)}
		</ConfirmDialogContext.Provider>
	);
};
