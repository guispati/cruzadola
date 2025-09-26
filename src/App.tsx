import { useEffect, useState } from "react";
import { Crossword } from "./components/Crossword";
import { InfoDialogProvider } from "./hooks/useInfoDialog";
import { Logo } from "./components/Logo";
import { Button } from "./components/ui/button";
import { formatDate, formatDisplayDate } from "./utils/date";
import { ProgressCircle } from "./components/ProgressCircle";
import { ConfirmDialogProvider } from "./hooks/useConfirmDialog";
import { Toaster } from "sonner";
import type { PuzzleData } from "./types/puzzle";

interface PuzzleMeta {
	id: string;
	date: string;
	file: string;
	totalCells: number;
}

interface SelectedPuzzle {
	id: string;
	data: PuzzleData;
}

export function App() {
	const [availablePuzzles, setAvailablePuzzles] = useState<PuzzleMeta[]>([]);
	const [selectedPuzzle, setSelectedPuzzle] = useState<SelectedPuzzle | null>(null);

	useEffect(() => {
		fetch(`${import.meta.env.BASE_URL}assets/puzzles/puzzlesMeta.json`)
			.then(res => res.json())
			.then((data: PuzzleMeta[]) => {
				const today = new Date();
				const startDate = new Date(today);
				startDate.setDate(today.getDate() - 9);

				const startStr = formatDate(startDate);
				const endStr = formatDate(today);

				const filtered = data
					.filter(p => p.date >= startStr && p.date <= endStr)
					.sort((a, b) => (a.date > b.date ? -1 : 1));

				setAvailablePuzzles(filtered);
			});
	}, []);

	const handleSelect = async (id: string) => {
		const puzzleMeta = availablePuzzles.find(p => p.id === id);
		if (!puzzleMeta) return;

		const res = await fetch(`${import.meta.env.BASE_URL}assets/puzzles/${puzzleMeta.file}`);
		const data: PuzzleData = await res.json();
		setSelectedPuzzle({ id, data });
	};

	const handleBackToList = () => {
		setSelectedPuzzle(null);
	};

	const getProgress = (puzzleId: string) => {
		const saved = localStorage.getItem(`crossword_${puzzleId}`);
		if (!saved) return 0;

		try {
			const parsed = JSON.parse(saved) as { completionPercentage?: number };
			return parsed.completionPercentage ?? 0;
		} catch {
			return 0;
		}
	};

	return (
		<InfoDialogProvider>
			<ConfirmDialogProvider>
				<main className="w-full h-screen bg-gray-100 p-4 flex items-center justify-center">
					<div className="grid grid-cols-12 gap-4 container relative">
						{selectedPuzzle ? (
							<div className="col-span-12">
								<Crossword
									gridData={selectedPuzzle.data}
									onExit={handleBackToList}
									puzzleId={selectedPuzzle.id}
									fileName={availablePuzzles.find(p => p.id === selectedPuzzle.id)?.file}
								/>
							</div>
						) : (
							<div className="col-span-6 col-start-4 bg-white shadow-lg rounded-xl p-8 w-full flex flex-col items-center m-auto">
								<Logo />
								<h2 className="mt-8 font-bold text-2xl text-blue-500 text-center">
									Selecione sua Cruzadola
								</h2>
								<div className="flex flex-col gap-4 w-full mt-4 overflow-y-auto max-h-96">
									{availablePuzzles.map(puzzle => (
										<Button
											key={puzzle.id}
											onClick={() => handleSelect(puzzle.id)}
											variant="secondary"
											className="flex items-center gap-4 justify-start p-4 rounded-lg shadow hover:shadow-md transition h-16 capitalize">
											<ProgressCircle value={getProgress(puzzle.id)} />
											<span className="text-left font-medium text-xl">
												{formatDisplayDate(puzzle.date)}
											</span>
										</Button>
									))}
								</div>
							</div>
						)}
					</div>
				</main>
				<Toaster richColors position="top-center" />
			</ConfirmDialogProvider>
		</InfoDialogProvider>
	);
}
