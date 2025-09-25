export interface PuzzleData {
	across: { [key: string]: CellData };
	down: { [key: string]: CellData };
}

interface CellData {
	clue: string;
	answer: string;
	row: number;
	col: number;
}
