import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmDisabled?: boolean;
	cancelDisabled?: boolean;
	handleConfirm: () => void;
	handleCancel?: () => void;
	handleClose?: () => void;
}

export function ConfirmationDialog({
	open,
	title,
	description,
	handleConfirm,
	handleCancel,
	handleClose,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	confirmDisabled = false,
	cancelDisabled = false,
}: ConfirmationDialogProps) {
	return (
		<Dialog open={open} onOpenChange={val => !val && handleClose?.()}>
			<DialogContent className="gap-4 max-w-fit">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex justify-end items-center gap-2 w-full">
					<Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelDisabled}>
						{cancelLabel}
					</Button>
					<Button size="sm" onClick={handleConfirm} disabled={confirmDisabled}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
