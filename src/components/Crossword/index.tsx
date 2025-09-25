import { useInfoDialog } from "@/hooks/useInfoDialog";
import {
	CircleX,
	Copyright,
	Info,
	RotateCw,
	Save,
	Search,
	SearchCheck,
	SearchCode,
	Timer,
	WholeWord,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Show } from "../Show";
import { Separator } from "../ui/separator";
import { Logo } from "../Logo";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { toast } from "sonner";
import { buildGrid } from "@/utils/grid";
import type { PuzzleData } from "@/types/puzzle";
import { GRID_SIZE } from "@/constants/grid";
import { extractDatesFromFilename, formatDisplayDate } from "@/utils/date";

interface CrosswordProps {
	gridData: PuzzleData;
	puzzleId: string;
	onExit: () => void;
	fileName?: string;
}

export function Crossword({ gridData, puzzleId, onExit, fileName }: CrosswordProps) {
	const [selectedDirection, setSelectedDirection] = useState<"across" | "down">("across");
	const [currentWord, setCurrentWord] = useState<ReturnType<typeof getWordInfo> | null>(null);
	const [selectedRow, setSelectedRow] = useState<number | undefined>(undefined);
	const [selectedCol, setSelectedCol] = useState<number | undefined>(undefined);
	const grid = buildGrid(gridData, GRID_SIZE);
	const savedRaw = localStorage.getItem(`crossword_${puzzleId}`);
	const initialState = savedRaw ? JSON.parse(savedRaw) : null;
	const savedGridValues: string[][] | undefined = initialState?.gridValues ?? initialState?.grid;
	const savedHelped: boolean[][] | undefined = initialState?.helpedCells;

	const [gridValues, setGridValues] = useState<string[][]>(
		() => savedGridValues ?? buildGrid(gridData, GRID_SIZE).map(row => row.map(() => ""))
	);
	const [helpedCells, setHelpedCells] = useState<boolean[][]>(
		() => savedHelped ?? buildGrid(gridData, GRID_SIZE).map(row => row.map(() => false))
	);
	const [time, setTime] = useState<number>(typeof initialState?.time === "number" ? initialState.time : 0);
	const [timerStarted, setTimerStarted] = useState(false);
	const { openInfoDialog } = useInfoDialog();
	const { openConfirmDialog } = useConfirmDialog();
	const [openMenu, setOpenMenu] = useState(false);
	const [incorrectMessageShown, setIncorrectMessageShown] = useState(false);

	useEffect(() => {
		if (!timerStarted) return;

		const interval = setInterval(() => {
			setTime(prev => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [timerStarted]);

	const formattedTime = `${Math.floor(time / 60)
		.toString()
		.padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;

	const findPreviousCell = (row: number, col: number, direction: "across" | "down"): [number, number] | null => {
		const bounds = getWordBounds(row, col, direction);
		if (!bounds) return null;

		if (!(row === bounds.startRow && col === bounds.startCol)) {
			let newRow = row;
			let newCol = col;

			while (true) {
				if (direction === "across") {
					newCol -= 1;
					if (newCol < bounds.startCol) return null;
				} else {
					newRow -= 1;
					if (newRow < bounds.startRow) return null;
				}

				if (grid[newRow][newCol]) {
					return [newRow, newCol];
				}
			}
		}

		if (direction === "across") {
			const acrossWords = Object.values(gridData.across);
			const candidates = acrossWords.filter(
				({ row: r, col: c, answer }) => r === row && c + answer.length - 1 < col
			);
			if (candidates.length > 0) {
				const prevWord = candidates.reduce((a, b) => (a.col > b.col ? a : b));
				return [prevWord.row, prevWord.col + prevWord.answer.length - 1];
			}
		} else {
			const downWords = Object.values(gridData.down);
			const candidates = downWords.filter(
				({ col: c, row: r, answer }) => c === col && r + answer.length - 1 < row
			);
			if (candidates.length > 0) {
				const prevWord = candidates.reduce((a, b) => (a.row > b.row ? a : b));
				return [prevWord.row + prevWord.answer.length - 1, prevWord.col];
			}
		}

		return null;
	};

	const cellHasWord = (row: number, col: number, dir: "across" | "down") => {
		if (!grid[row][col]) return false;

		if (dir === "across") {
			return (
				(col > 0 && grid[row][col - 1] !== null) || (col < grid[0].length - 1 && grid[row][col + 1] !== null)
			);
		} else {
			return (row > 0 && grid[row - 1][col] !== null) || (row < grid.length - 1 && grid[row + 1][col] !== null);
		}
	};

	const moveToCell = (row: number, col: number, direction: "up" | "down" | "left" | "right") => {
		const numRows = grid.length;
		const numCols = grid[0].length;

		let r = row;
		let c = col;

		const isValid = (rr: number, cc: number) =>
			rr >= 0 && rr < numRows && cc >= 0 && cc < numCols && grid[rr][cc] !== null;

		while (true) {
			if (direction === "up") {
				r--;
				if (r < 0) {
					r = numRows - 1;
					c--;
				}
			} else if (direction === "down") {
				r++;
				if (r >= numRows) {
					r = 0;
					c++;
				}
			} else if (direction === "left") {
				c--;
				if (c < 0) {
					c = numCols - 1;
					r--;
				}
			} else if (direction === "right") {
				c++;
				if (c >= numCols) {
					c = 0;
					r++;
				}
			}

			if (r < 0 || r >= numRows || c < 0 || c >= numCols) break;

			if (isValid(r, c)) {
				let newDirection: "across" | "down";

				if (direction === "up" || direction === "down") {
					if (cellHasWord(r, c, "down")) newDirection = "down";
					else if (cellHasWord(r, c, "across")) newDirection = "across";
					else continue;
				} else {
					if (cellHasWord(r, c, "across")) newDirection = "across";
					else if (cellHasWord(r, c, "down")) newDirection = "down";
					else continue;
				}

				handleSelectCell(r, c, newDirection);
				break;
			}
		}
	};

	const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
		e.preventDefault();

		const key = e.key.toUpperCase();

		if (e.key === "ArrowUp") moveToCell(row, col, "up");
		else if (e.key === "ArrowDown") moveToCell(row, col, "down");
		else if (e.key === "ArrowLeft") moveToCell(row, col, "left");
		else if (e.key === "ArrowRight") moveToCell(row, col, "right");

		if (key === "BACKSPACE") {
			if (key === "BACKSPACE") {
				const newGrid = gridValues.map(r => [...r]);

				if (gridValues[row][col]) {
					newGrid[row][col] = "";
				} else {
					const prevCell = findPreviousCell(row, col, selectedDirection);
					if (prevCell) {
						const [prevRow, prevCol] = prevCell;
						newGrid[prevRow][prevCol] = "";
						handleSelectCell(prevRow, prevCol);
					}
				}

				setGridValues(newGrid);
				return;
			}
		}

		if (/^[A-Z]$/.test(key)) {
			if (!timerStarted) setTimerStarted(true);

			const newGrid = gridValues.map(r => [...r]);
			newGrid[row][col] = key;

			setGridValues(newGrid);

			moveToNextCell(row, col, 1);

			const isFull = grid
				.flatMap((rowArr, r) => rowArr.map((cell, c) => !cell || newGrid[r][c] !== ""))
				.every(Boolean);

			if (isFull) validateGrid(newGrid, helpedCells);
		}
	};

	const getWordBounds = (row: number, col: number, direction: "across" | "down") => {
		if (direction === "across") {
			for (const { answer, row: r, col: c } of Object.values(gridData.across)) {
				if (r === row && col >= c && col < c + answer.length) {
					return { startRow: r, startCol: c, endRow: r, endCol: c + answer.length - 1 };
				}
			}
		} else {
			for (const { answer, row: r, col: c } of Object.values(gridData.down)) {
				if (c === col && row >= r && row < r + answer.length) {
					return { startRow: r, startCol: c, endRow: r + answer.length - 1, endCol: c };
				}
			}
		}
		return null;
	};

	const getWordInfo = (row: number, col: number, direction: "across" | "down") => {
		if (direction === "across") {
			for (const [num, { clue, answer, row: r, col: c }] of Object.entries(gridData.across)) {
				if (r === row && col >= c && col < c + answer.length) {
					return {
						number: num,
						clue,
						answer,
						startRow: r,
						startCol: c,
						endRow: r,
						endCol: c + answer.length - 1,
					};
				}
			}
		} else {
			for (const [num, { clue, answer, row: r, col: c }] of Object.entries(gridData.down)) {
				if (c === col && row >= r && row < r + answer.length) {
					return {
						number: num,
						clue,
						answer,
						startRow: r,
						startCol: c,
						endRow: r + answer.length - 1,
						endCol: c,
					};
				}
			}
		}
		return null;
	};

	const moveToNextCell = (row: number, col: number, step: 1 | -1) => {
		const bounds = getWordBounds(row, col, selectedDirection);
		if (!bounds) return;

		let newRow = row;
		let newCol = col;

		while (true) {
			if (selectedDirection === "across") {
				newCol += step;
				if (newCol < bounds.startCol || newCol > bounds.endCol) break;
			} else {
				newRow += step;
				if (newRow < bounds.startRow || newRow > bounds.endRow) break;
			}

			if (grid[newRow][newCol]) {
				handleSelectCell(newRow, newCol);
				break;
			}
		}
	};

	const handleSelectCell = (row: number, col: number, forceDirection?: "across" | "down") => {
		let newDirection: "across" | "down" = forceDirection ?? selectedDirection;

		const acrossInfo = getWordInfo(row, col, "across");
		const downInfo = getWordInfo(row, col, "down");

		if (!forceDirection) {
			if (selectedRow === row && selectedCol === col) {
				if (selectedDirection === "across" && downInfo) {
					newDirection = "down";
				} else if (selectedDirection === "down" && acrossInfo) {
					newDirection = "across";
				}
			} else {
				if (selectedDirection === "across" && !acrossInfo && downInfo) {
					newDirection = "down";
				} else if (selectedDirection === "down" && !downInfo && acrossInfo) {
					newDirection = "across";
				} else if (!acrossInfo && !downInfo) {
					return;
				}
			}
		}

		setSelectedDirection(newDirection);
		setSelectedRow(row);
		setSelectedCol(col);

		const input = document.getElementById(`cell-${row}-${col}`) as HTMLInputElement;
		input.focus();

		const wordInfo = getWordInfo(row, col, newDirection);
		setCurrentWord(wordInfo);
	};

	const getHighlightedCells = () => {
		if (selectedRow == null || selectedCol == null) return [];

		const highlights: [number, number][] = [];

		const words = gridData[selectedDirection];
		for (const { answer, row, col } of Object.values(words)) {
			if (selectedDirection === "across") {
				if (row === selectedRow && selectedCol >= col && selectedCol < col + answer.length) {
					for (let i = 0; i < answer.length; i++) {
						highlights.push([row, col + i]);
					}
					break;
				}
			} else {
				if (col === selectedCol && selectedRow >= row && selectedRow < row + answer.length) {
					for (let i = 0; i < answer.length; i++) {
						highlights.push([row + i, col]);
					}
					break;
				}
			}
		}

		return highlights;
	};

	const highlighted = getHighlightedCells();
	const isSelected = (row: number, col: number) => selectedRow === row && selectedCol === col;

	const isWordComplete = (wordInfo: ReturnType<typeof getWordInfo>, cellValues: string[][]) => {
		if (!wordInfo) return false;
		const { startRow, startCol, endRow, endCol } = wordInfo;

		if (startRow === endRow) {
			for (let c = startCol; c <= endCol; c++) {
				if (cellValues[startRow][c] === "") return false;
			}
		} else {
			for (let r = startRow; r <= endRow; r++) {
				if (cellValues[r][startCol] === "") return false;
			}
		}

		return true;
	};

	const isCurrentClue = (num: string, dir: "across" | "down") => {
		return currentWord?.number === num && selectedDirection === dir;
	};

	const restoreFocus = () => {
		if (selectedRow != null && selectedCol != null) {
			setTimeout(() => {
				const input = document.getElementById(`cell-${selectedRow}-${selectedCol}`) as HTMLInputElement;
				input?.focus();
			}, 0);
		}
	};

	const validateGrid = (cellValues: string[][], helped: boolean[][] = helpedCells) => {
		let incorrectFound = false;

		for (let r = 0; r < GRID_SIZE; r++) {
			for (let c = 0; c < GRID_SIZE; c++) {
				if (!grid[r][c]) continue;
				if (cellValues[r][c] !== grid[r][c].letter) {
					incorrectFound = true;
					break;
				}
			}
			if (incorrectFound) break;
		}

		if (incorrectFound) {
			if (!incorrectMessageShown) {
				openInfoDialog({
					title: "Você está quase lá!",
					description: "Algumas respostas não estão corretas.",
					confirmLabel: "Continue tentando!",
					onConfirm: restoreFocus,
				});
				setIncorrectMessageShown(true);
			} else {
				restoreFocus();
			}
			return false;
		}

		openInfoDialog({
			title: "Você é craque!",
			description: "",
			content: (
				<div className="flex items-center justify-evenly gap-2 text-xl font-medium">
					<div className="flex flex-col items-center gap-2">
						<div className="flex gap-2 items-center">
							<Timer size={20} />
							<span>Tempo</span>
						</div>
						<span className="text-2xl text-amber-600">{formattedTime}</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<div className="flex gap-2 items-center">
							<Search size={20} />
							<span>Sem ajuda</span>
						</div>
						<span className="text-2xl text-amber-600">{getNoHelpPercentage()}%</span>
					</div>
				</div>
			),
			confirmLabel: "Voltar ao menu",
			onConfirm: () => {
				saveProgress(false, cellValues, helped);
				onExit();
			},
		});

		return true;
	};

	const revealLetter = () => {
		if (selectedRow == null || selectedCol == null) return;

		const correctLetter = grid[selectedRow][selectedCol]?.letter;
		if (!correctLetter) return;

		const newGrid = gridValues.map(r => [...r]);
		newGrid[selectedRow][selectedCol] = correctLetter;

		const newHelped = helpedCells.map(r => [...r]);
		newHelped[selectedRow][selectedCol] = true;
		setHelpedCells(newHelped);

		setGridValues(newGrid);
		toggleOpenMenuChange();
		saveProgress();
	};

	const revealWord = () => {
		if (!currentWord) return;
		const { startRow, startCol, endRow, answer } = currentWord;
		const newGrid = gridValues.map(r => [...r]);
		const newHelped = helpedCells.map(r => [...r]);

		if (startRow === endRow) {
			for (let i = 0; i < answer.length; i++) {
				newGrid[startRow][startCol + i] = answer[i];
				newHelped[startRow][startCol + i] = true;
			}
		} else {
			for (let i = 0; i < answer.length; i++) {
				newGrid[startRow + i][startCol] = answer[i];
				newHelped[startRow + i][startCol] = true;
			}
		}

		setGridValues(newGrid);
		setHelpedCells(newHelped);
		toggleOpenMenuChange();
		saveProgress();
	};

	const solvePuzzle = () => {
		const newGrid = grid.map(row => row.map(cell => (cell ? cell.letter : "")));
		const newHelped = grid.map(row => row.map(cell => (cell ? true : false)));

		setGridValues(newGrid);
		setHelpedCells(newHelped);
		validateGrid(newGrid);
		toggleOpenMenuChange();
		saveProgress();
	};

	const computeNoHelpStats = (cellValues: string[][] = gridValues, helped: boolean[][] = helpedCells) => {
		let filledWithoutHelp = 0;
		let totalCells = 0;

		for (let r = 0; r < GRID_SIZE; r++) {
			for (let c = 0; c < GRID_SIZE; c++) {
				if (!grid[r][c]) continue;
				totalCells++;
				const val = cellValues[r][c];
				if (val !== "" && val === grid[r][c].letter && !helped[r][c]) {
					filledWithoutHelp++;
				}
			}
		}

		return { filledWithoutHelp, totalCells };
	};

	const getNoHelpPercentage = () => {
		const { filledWithoutHelp, totalCells } = computeNoHelpStats();
		if (totalCells === 0) return 0;
		return Math.floor((filledWithoutHelp / totalCells) * 100);
	};

	const resetPuzzle = () => {
		openConfirmDialog({
			title: "Reiniciar do Jogo",
			description: "Tem certeza de que deseja reiniciar o jogo? Todo seu progresso será perdido.",
			onConfirm: () => {
				setGridValues(buildGrid(gridData, GRID_SIZE).map(row => row.map(cell => (cell ? "" : ""))));
				setTime(0);
				setTimerStarted(false);
				toggleOpenMenuChange();
				saveProgress();
			},
		});
	};

	const saveAndExit = () => {
		saveProgress();
		onExit();
	};

	const exitPuzzle = () => {
		openConfirmDialog({
			title: "Sair do Jogo",
			description: "Deseja realmente sair do jogo?",
			onConfirm: () => {
				saveAndExit();
			},
		});
	};

	const saveProgress = (
		showMessage = false,
		cellValues: string[][] = gridValues,
		helped: boolean[][] = helpedCells
	) => {
		const { filledWithoutHelp, totalCells } = computeNoHelpStats(cellValues, helped);

		let correctCells = 0;
		for (let r = 0; r < GRID_SIZE; r++) {
			for (let c = 0; c < GRID_SIZE; c++) {
				if (!grid[r][c]) continue;
				if (cellValues[r][c] === grid[r][c].letter) correctCells++;
			}
		}
		const completionPercentage = totalCells > 0 ? Math.floor((correctCells / totalCells) * 100) : 0;

		localStorage.setItem(
			`crossword_${puzzleId}`,
			JSON.stringify({
				gridValues: cellValues,
				helpedCells: helped,
				noHelpPercentage: Math.floor((filledWithoutHelp / totalCells) * 100),
				time,
				completionPercentage,
			})
		);

		if (showMessage) {
			toast.success(`Jogo salvo! ${completionPercentage}% correto`, { duration: 2000 });
			toggleOpenMenuChange();
		}
	};

	const showPuzzleInfo = () => {
		if (!fileName) return;

		const dates = extractDatesFromFilename(fileName);

		if (dates) {
			openInfoDialog({
				title: "Informações do Jogo",
				description: "",
				content: (
					<div className="flex flex-col gap-4 text-center">
						<p className="text-sm text-gray-500 italic">{formatDisplayDate(dates.originalDate)}</p>
						<p className="text-lg font-semibold text-indigo-700">Palavras Cruzadas O Globo</p>
						<p className="text-base">
							por <span className="font-medium">P. Durante</span>
						</p>
						<p className="text-sm text-gray-600">© Arte em Texto Ltda.</p>
					</div>
				),
				confirmLabel: "Fechar",
			});
		}
	};

	const showCredits = () => {
		openInfoDialog({
			title: "Créditos",
			description: "",
			content: (
				<div className="flex flex-col gap-4 text-center">
					<p className="text-base">
						Desenvolvido com ❤️ por{" "}
						<a
							href="https://github.com/guispati"
							target="_blank"
							rel="noopener noreferrer"
							className="text-indigo-600 font-medium hover:underline">
							Spati
						</a>
					</p>

					<p className="text-base font-semibold">Todos os créditos dos desafios vão para:</p>
					<div className="flex flex-col">
						<p>Palavras Cruzadas O Globo</p>
						<p>by P. Durante</p>
						<p>Arte em Texto Ltda.</p>
					</div>
				</div>
			),
			confirmLabel: "Fechar",
		});
	};

	const toggleOpenMenuChange = () => {
		setTimeout(() => setOpenMenu(!openMenu), 100);
	};

	useEffect(() => {
		if (!timerStarted) return;

		const interval = setInterval(() => {
			saveProgress();
		}, 60_000);

		return () => clearInterval(interval);
	}, [timerStarted, gridValues, helpedCells]);

	return (
		<Drawer direction="left" open={openMenu} onOpenChange={toggleOpenMenuChange}>
			<div className="col-span-12 grid grid-cols-12 gap-4 shrink">
				<div className="col-span-3 flex flex-col items-center justify-between gap-4">
					<Show>
						<Show.When isTrue={openMenu}>
							<DrawerContent>
								<DrawerHeader className="flex items-center justify-center relative border-b">
									<DrawerTitle>Menu</DrawerTitle>
									<DrawerClose className="absolute top-3.5 right-4 cursor-pointer">
										<X size={24} />
									</DrawerClose>
								</DrawerHeader>
								<div className="flex flex-col justify-between gap-2 p-4 h-full">
									<Logo />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={revealLetter}>
										<SearchCode size={24} className="text-indigo-600" /> Revelar Letra
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={revealWord}>
										<WholeWord size={24} className="text-indigo-600" /> Revelar Palavra
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={solvePuzzle}>
										<SearchCheck size={24} className="text-indigo-600" /> Solucionar Cruzadola
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={() => saveProgress(true)}>
										<Save size={24} className="text-indigo-600" /> Salvar
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={showPuzzleInfo}>
										<Info size={24} className="text-indigo-600" /> Informações do Jogo
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={resetPuzzle}>
										<RotateCw size={24} className="text-indigo-600" /> Reiniciar Jogo
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={showCredits}>
										<Copyright size={24} className="text-indigo-600" /> Créditos
									</button>
									<Separator />

									<button
										className="flex items-center gap-2 p-2 rounded hover:bg-indigo-100 font-medium cursor-pointer"
										onClick={exitPuzzle}>
										<CircleX size={24} className="text-indigo-600" /> Sair
									</button>
								</div>
							</DrawerContent>
						</Show.When>
						<Show.Else>
							<div className="border bg-white rounded text-center flex items-center justify-evenly shadow w-full h-14">
								<span className="text-indigo-500 font-bold text-xl">{formattedTime}</span>
								<DrawerTrigger>
									<div className="text-indigo-500 font-bold text-xl cursor-pointer uppercase">
										Menu
									</div>
								</DrawerTrigger>
							</div>

							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-4 max-h-[716px]">
									<div className="bg-white shadow border rounded flex flex-col max-h-[350px]">
										<h3 className="font-bold p-2 text-orange-500 text-center border-b border-black flex-shrink-0">
											Horizontal
										</h3>
										<ul className="p-3 overflow-y-auto flex-grow">
											{Object.entries(gridData.across).map(([num, { clue, row, col }]) => {
												const wordInfo = getWordInfo(row, col, "across");
												const done = isWordComplete(wordInfo!, gridValues);

												return (
													<li
														key={num}
														className={`p-1 rounded ${
															done
																? "line-through cursor-default"
																: "hover:bg-yellow-200 cursor-pointer"
														} ${
															isCurrentClue(num, "across")
																? "bg-yellow-300 font-bold"
																: ""
														}`}
														onClick={() => handleSelectCell(row, col, "across")}>
														<strong>{num}.</strong> {clue}
													</li>
												);
											})}
										</ul>
									</div>

									<div className="bg-white shadow border rounded flex flex-col max-h-[350px]">
										<h3 className="font-bold p-2 text-orange-500 text-center border-b border-black flex-shrink-0">
											Vertical
										</h3>
										<ul className="p-3 overflow-y-auto flex-grow">
											{Object.entries(gridData.down).map(([num, { clue, row, col }]) => {
												const wordInfo = getWordInfo(row, col, "down");
												const done = isWordComplete(wordInfo!, gridValues);
												return (
													<li
														key={num}
														className={`p-1 rounded ${
															done
																? "line-through cursor-default"
																: "hover:bg-yellow-200 cursor-pointer"
														} ${
															isCurrentClue(num, "down") ? "bg-yellow-300 font-bold" : ""
														}`}
														onClick={() => handleSelectCell(row, col, "down")}>
														<strong>{num}.</strong> {clue}
													</li>
												);
											})}
										</ul>
									</div>
								</div>
							</div>
						</Show.Else>
					</Show>
				</div>
				<div className="col-span-9 w-full flex flex-col gap-4 items-center justify-center">
					<div className="w-full h-14 flex items-center justify-center shadow border bg-white">
						{currentWord && (
							<span className="whitespace-pre-line break-words">
								<strong className="text-orange-400 uppercase">
									{currentWord.number} {selectedDirection === "across" ? "Horizontal" : "Vertical"}:
								</strong>{" "}
								{currentWord.clue}
							</span>
						)}
					</div>
					<div className="w-full bg-gray-950 flex items-center justify-center">
						<div className="grid grid-cols-11 grid-rows-11 gap-[1px] bg-black border">
							{grid.map((row, rowIndex) =>
								row.map((cell, colIndex) => {
									if (!cell) {
										return <div key={`${rowIndex}-${colIndex}`} className="bg-black w-16 h-16" />;
									}

									const isHighlighted = highlighted.some(
										([r, c]) => r === rowIndex && c === colIndex
									);
									return (
										<div
											key={`${rowIndex}-${colIndex}`}
											className={`relative w-16 h-16 flex items-center justify-center ${
												isHighlighted ? "bg-yellow-200" : "bg-white"
											}`}>
											{cell.number && (
												<span className="absolute top-0 left-0 text-xs text-black p-1">
													{cell.number}
												</span>
											)}
											<input
												type="text"
												id={`cell-${rowIndex}-${colIndex}`}
												value={gridValues[rowIndex][colIndex]}
												maxLength={1}
												className={`w-full h-full text-center text-4xl font-medium uppercase border-none outline-none cursor-default caret-transparent ${
													isSelected(rowIndex, colIndex) && "bg-[#FFC14D]"
												}`}
												onClick={() => handleSelectCell(rowIndex, colIndex)}
												readOnly
												onKeyDown={e => handleCellKeyDown(e, rowIndex, colIndex)}
												onMouseDown={e => e.preventDefault()}
												onContextMenu={e => e.preventDefault()}
												onDragStart={e => e.preventDefault()}
											/>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
}
