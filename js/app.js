import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
	setup() {
		const queryString = window.location.search;
		const params = new URLSearchParams(queryString);
		const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
		const gridheight = params.has('rows') ? parseInt(params.get('rows')) : 5;
		
		// 1. 시작점과 끝점 위치 고정
		const start = '0,0'; // 왼쪽 제일 위
		const end = Math.floor(Math.random() * gridheight) + ',' + (gridwidth - 1); // 제일 오른쪽 열
		
		const pathlength = Math.floor(Math.random()*(0.2*gridwidth*gridheight) + 0.4*gridwidth*gridheight);
		
		var path1 = [start];
		var path2 = [end];
		var curpathlength = 2;
		
		function getNextTile(coord) {
			const coords = coord.split(',');
			const row = parseInt(coords[0]);
			const col = parseInt(coords[1]);
			var tiles = [];
			
			const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			for (const [dr, dc] of dirs) {
				const nr = row + dr;
				const nc = col + dc;
				const ntile = nr + ',' + nc;
				if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth && !path1.includes(ntile) && !path2.includes(ntile)) {
					tiles.push(ntile);
				}
			}
			return tiles.length > 0 ? tiles[Math.floor(Math.random() * tiles.length)] : false;
		}
		
		var first = true;
		let portalscheck = [];
		while(curpathlength < pathlength) {
			if(Math.random() < 0.5 || first) {
				const t1 = getNextTile(path1[path1.length-1]);
				if(t1) path1.push(t1);
			}
			if(Math.random() >= 0.5 || first) {
				const t2 = getNextTile(path2[path2.length-1]);
				if(t2) path2.push(t2);
			}
			curpathlength = path1.length + path2.length;
			first = false;
		}
		
		function getDir(coord1, coord2) {
			let c1 = coord1.split(',').map(Number);
			let c2 = coord2.split(',').map(Number);
			if(c1[0] == c2[0]) return c1[1] > c2[1] ? 'left' : 'right';
			if(c1[1] == c2[1]) return c1[0] > c2[0] ? 'up' : 'down';
			return 'portal';
		}
		
		const fullpath = path1.concat(path2.toReversed());
		var grid = ref([]);
		const dirs = ['down', 'left', 'up', 'right'];
		let portalnum = 0;
		let portals = {};

		for(let i = 0; i < gridheight; i++) {
			let row = [];
			for(let j = 0; j < gridwidth; j++) {
				let type = '', movable = 0, rotation = 0, extra = '';
				let coord = i+','+j;
				let pathIndex = fullpath.indexOf(coord);

				if(pathIndex !== -1) {
					if(start == coord) {
						type = 'S';
						rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex+1]));
					} else if(end == coord) {
						type = 'E';
						rotation = dirs.indexOf(getDir(coord, fullpath[pathIndex-1]));
					} else {
						let prevDir = getDir(coord, fullpath[pathIndex-1]);
						let nextDir = getDir(coord, fullpath[pathIndex+1]);
						if(nextDir == 'portal' || prevDir == 'portal') {
							type = 'P';
							if(!portals[coord]) {
								let other = nextDir == 'portal' ? fullpath[pathIndex+1] : fullpath[pathIndex-1];
								portals[coord] = portalnum; portals[other] = portalnum; extra = portalnum++;
							} else extra = portals[coord];
							rotation = dirs.indexOf(nextDir == 'portal' ? prevDir : nextDir);
						} else if(Math.abs(dirs.indexOf(nextDir) - dirs.indexOf(prevDir)) == 2) {
							type = 'I'; rotation = dirs.indexOf(nextDir) % 2;
						} else {
							type = 'L'; rotation = (Math.max(dirs.indexOf(nextDir), dirs.indexOf(prevDir)) + 1)%4;
							if(rotation == 0 && Math.min(dirs.indexOf(nextDir), dirs.indexOf(prevDir)) == 0) rotation = 1;
						}
					}
					movable = (type === 'P' ? Math.random() < 0.25 : Math.random() < 0.8) ? 1 : 0;
					if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
				} else {
					let r = Math.random();
					type = r < 0.3 ? 'D' : (r < 0.65 ? 'I' : 'L');
					rotation = Math.floor(Math.random()*4);
					movable = (Math.random() < 0.7 && type !== 'D') ? 1 : 0;
				}
				row.push([type, rotation, movable, '', extra]);
			}
			grid.value.push(row);
		}
		
		// 2. 고정 색상 설정 (매번 달라지지 않음)
		const themeColor = '#FF4500'; // 주황색 고정
		let shapes = Array.from({length: portalnum}, (_, i) => i + 1);

		return { 
			grid, shapes, themeColor,
			getNodeClass: (type, alt=false) => {
				const mapping = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
				return mapping[type] || "";
			},
			getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
			getColour: (tile) => (tile[0] === 'S' || tile[0] === 'E' || tile[3] !== '') ? themeColor : '', // 연결 시 색상 반환
			rotate: (tile, r, c) => { if(tile[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4; },
			checkWinStatus: () => {
				const [er, ec] = end.split(',').map(Number);
				return grid.value[er] && grid.value[er][ec][3] !== '';
			}
		};
	},
	template: `
	<div class="d-flex flex-column align-items-center">
		<h2 class="grandiflora-one-regular mb-4" :style="{ visibility: checkWinStatus() ? 'visible' : 'hidden', color: themeColor }">전류가 연결되었습니다!</h2>
		<div v-for="(row, rowIndex) in grid" :key="rowIndex">
			<div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
				<div :class="['tile', getMovableClass(tile[2])]" :style="{ transform: 'rotate('+tile[1]*90+'deg)' }" @click="rotate(tile, rowIndex, colIndex)">
					<div :style="{ backgroundColor: getColour(tile) }" :class="getNodeClass(tile[0])"></div>
					<div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile) }" :class="getNodeClass(tile[0],true)"></div>
					<div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" :style="{ backgroundColor: getColour(tile), transform: 'rotate('+tile[1]*-90+'deg)' }"></div>
					<div v-if="tile[0] == 'P'" class="portalsymbol" :style="{ transform: 'rotate('+tile[1]*-90+'deg)' }">{{ shapes[tile[4]] }}</div>
				</div>
			</div>
			<br />
		</div>
	</div>`
}
