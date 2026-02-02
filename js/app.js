import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
	setup() {
		const queryString = window.location.search;
		const params = new URLSearchParams(queryString);
		const showAnswer = params.get('topsecret') === 'true';
		const gridwidth = params.has('cols') ? parseInt(params.get('cols')) : 12;
		const gridheight = params.has('rows') ? parseInt(params.get('rows')) : 5;
		
		const start = '0,0';
		let end = (Math.floor(Math.random() * gridheight)) + ',' + (gridwidth - 1);
		
		const pathlength = Math.floor(Math.random()*(0.2*gridwidth*gridheight) + 0.4*gridwidth*gridheight);
		
		var path1 = [start];
		var path2 = [end];
		var curpathlength = 2;
		
		function getNextTile(coord, p1, p2) {
			const coords = coord.split(',').map(Number);
			const row = coords[0], col = coords[1];
			var tiles = [];
			[[row-1, col], [row+1, col], [row, col-1], [row, col+1]].forEach(([nr, nc]) => {
				const ntile = nr + ',' + nc;
				if(nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth && !p1.includes(ntile) && !p2.includes(ntile)) {
					tiles.push(ntile);
				}
			});
			return tiles.length > 0 ? tiles[Math.floor(Math.random()*tiles.length)] : false;
		}
		
		// 1. 해결: 포털 생성을 무조건 2쌍(1번, 2번)으로 강제
		let portalsToCreate = 2; 

		let first = true;
		let safetyCounter = 0;
		while((curpathlength < pathlength || portalsToCreate > 0) && safetyCounter < 2000) {
			safetyCounter++;
			if(Math.random() < 0.5 || first) {
				const last1 = path1[path1.length-1];
				const next1 = getNextTile(last1, path1, path2);
				if(next1) path1.push(next1);
				else if(portalsToCreate > 0) {
					let checkFound = false;
					for(let attempt=0; attempt<100; attempt++) {
						let check = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
						if(!path1.includes(check) && !path2.includes(check) && getNextTile(check, path1, path2)) {
							path1.push(check); portalsToCreate--; checkFound = true; break;
						}
					}
					if(!checkFound) break;
				}
				curpathlength++;
			}
			if(Math.random() >= 0.5 || first) {
				const last2 = path2[path2.length-1];
				const next2 = getNextTile(last2, path1, path2);
				if(next2) path2.push(next2);
				else if(portalsToCreate > 0) {
					let checkFound = false;
					for(let attempt=0; attempt<100; attempt++) {
						let check = Math.floor(Math.random()*gridheight)+','+Math.floor(Math.random()*gridwidth);
						if(!path1.includes(check) && !path2.includes(check) && getNextTile(check, path1, path2)) {
							path2.push(check); portalsToCreate--; checkFound = true; break;
						}
					}
					if(!checkFound) break;
				}
				curpathlength++;
			}
			first = false;
		}
		
		function getDir(c1, c2) {
			if(!c1 || !c2) return null;
			let co1 = c1.split(',').map(Number), co2 = c2.split(',').map(Number);
			if(co1[0] == co2[0]) return co1[1] > co2[1] ? 'left' : 'right';
			if(co1[1] == co2[1]) return co1[0] > co2[0] ? 'up' : 'down';
			return 'portal';
		}
		
		const fullpath = path1.concat(path2.toReversed());
		var grid = ref([]);
		const dirs = ['down', 'left', 'up', 'right'];
		let portalnum = 0, portals = {};

		for(let i = 0; i < gridheight; i++) {
			let row = [];
			for(let j = 0; j < gridwidth; j++) {
				let type = 'D', rotation = 0, movable = 0, extra = '', ansRot = 0;
				let coord = i+','+j;
				let pathIndex = fullpath.indexOf(coord);

				if(pathIndex !== -1) {
					let prevD = getDir(coord, fullpath[pathIndex-1]);
					let nextD = getDir(coord, fullpath[pathIndex+1]);

					if(start == coord) {
						type = 'S'; rotation = dirs.indexOf(nextD);
					} else if(end == coord) {
						type = 'E'; rotation = dirs.indexOf(prevD);
					} else if(nextD == 'portal' || prevD == 'portal') {
						type = 'P';
						if(portals[coord] === undefined) {
							let other = nextD == 'portal' ? fullpath[pathIndex+1] : fullpath[pathIndex-1];
							portals[coord] = portalnum; portals[other] = portalnum; extra = portalnum++;
						} else extra = portals[coord];
						rotation = dirs.indexOf(nextD == 'portal' ? prevD : nextD);
					} else {
						let d1 = dirs.indexOf(prevD), d2 = dirs.indexOf(nextD);
						if(Math.abs(d1 - d2) == 2) { 
							type = 'I'; rotation = d1 % 2; 
						} else { 
							type = 'L'; // 2. 해결: 정답 경로에서의 L자 타일 회전 공식을 CSS 기준에 맞춰 완벽 보정
							if ((d1 == 0 && d2 == 3) || (d1 == 3 && d2 == 0)) rotation = 0;
							else if ((d1 == 0 && d2 == 1) || (d1 == 1 && d2 == 0)) rotation = 1;
							else if ((d1 == 1 && d2 == 2) || (d1 == 2 && d2 == 1)) rotation = 2;
							else if ((d1 == 2 && d2 === 3) || (d1 == 3 && d2 == 2)) rotation = 3;
						}
					}
					ansRot = rotation;
					movable = (type == 'P' ? 0 : 1); 
					if(movable) rotation = (rotation + Math.floor(Math.random()*3)+1)%4;
				} else {
					let r = Math.random();
					type = r < 0.3 ? 'D' : (r < 0.65 ? 'I' : 'L');
					rotation = Math.floor(Math.random()*4); movable = type !== 'D' ? 1 : 0;
					ansRot = rotation;
				}
				row.push([type, rotation, movable, '', extra, ansRot]);
			}
			grid.value.push(row);
		}
		
		const themeColor = '#FF4500'; // 주황색 고정
		let shapes = [1, 2, 3, 4];

		return { 
			grid, shapes, themeColor, 
			getNodeClass: (t, alt=false) => {
				const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
				return m[t] || "";
			},
			getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
			getColour: (tile, r, c) => (tile[0]=='S'||tile[0]=='E'||(showAnswer && fullpath.includes(r+','+c))) ? themeColor : '',
			rotate: (t, r, c) => { if(t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1)%4; },
			isCorrectPath: (r, c) => showAnswer && fullpath.includes(r + ',' + c),
			checkWinStatus: () => false
		};
	},
	template: `<div class="d-flex flex-column align-items-center">
		<div v-for="(row, rowIndex) in grid" :key="rowIndex">
			<div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
				<div :class="['tile', getMovableClass(tile[2])]" 
					 :style="{ 
						transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*90+'deg)' : 'rotate('+tile[1]*90+'deg)',
						outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none',
						boxShadow: isCorrectPath(rowIndex, colIndex) ? '0 0 15px #FF3300' : 'none'
					 }" @click="rotate(tile, rowIndex, colIndex)">
					<div :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
					<div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
					<div v-if="tile[0] != 'X'" :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
						 :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37', transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*-90+'deg)' : 'rotate('+tile[1]*-90+'deg)' }"></div>
					<div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*-90+'deg)' : 'rotate('+tile[1]*-90+'deg)' }">
						{{shapes[tile[4]]}}
					</div>
				</div>
			</div>
			<br />
		</div>
	</div>`
}
