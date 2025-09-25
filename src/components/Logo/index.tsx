export function Logo() {
	return (
		<div className="flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative flex items-center justify-center w-32 h-32">
					<div className="absolute inset-0 rounded-full border-[16px] border-[#1e88d1] [clip-path:polygon(0%_0%,100%_0%,100%_80%,80%_100%,0%_100%)]"></div>

					<div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-0.5 bg-[#1f1f1f] rounded-lg p-0.5 w-20 h-20 shadow-md">
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							C
						</div>
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							R
						</div>
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							A
						</div>

						<div className="bg-[#1f1f1f] rounded"></div>
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs"></div>
						<div className="bg-[#1f1f1f] rounded"></div>

						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							Q
						</div>
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							U
						</div>
						<div className="flex items-center justify-center font-bold text-gray-900 bg-[#faf6ec] rounded text-xs">
							E
						</div>
					</div>
				</div>

				{/* Brand text smaller */}
				<div className="text-2xl font-extrabold uppercase bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-wide">
					Cruzadola
				</div>
			</div>
		</div>
	);
}
