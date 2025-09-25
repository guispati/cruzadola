import { Show } from "@/components/Show";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface InfoDialogProps {
	open: boolean;
	title: string;
	description: string;
	children: ReactNode;
	confirmLabel?: string;
	handleClose?: () => void;
	handleConfirm?: () => void;
}

export function InfoDialog({
	open,
	title,
	description = "",
	children,
	confirmLabel = "Confirmar",
	handleClose,
	handleConfirm,
}: InfoDialogProps) {
	return (
		<Dialog open={open} onOpenChange={val => !val && handleClose?.()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-2xl text-center">{title}</DialogTitle>
					<Separator />
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
				<Show.When isTrue={!!handleConfirm}>
					<DialogFooter>
						<Button variant="default" onClick={handleConfirm}>
							{confirmLabel}
						</Button>
					</DialogFooter>
				</Show.When>
			</DialogContent>
		</Dialog>
	);
}
