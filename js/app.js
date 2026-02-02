//0203-7

import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000'; // 빨간색 전류 고정

        // L자(L): 0:┘(위오), 1:└(오아), 2:┌(아왼), 3:┐(왼위)
        // 직선(I): 0:↕(세로), 1:↔(가로)
        // 포털(P): 연결구가 향하는 방향 0:하, 1:좌, 2:상, 3:우

        const patternA = [
            [0,0,'S',3], [0,1,'I',1], [0,2,'I',1], [0,3,'I',1], [0,4,'L',2], [1,4,'I',0], [2,4,'P',2,0],
            [2,8,'P',0,0], [3,8,'I',0], [4,8,'I',0], [5,8,'I',0], [6,8,'L',0], [6,9,'I',1], [6,10,'P',1,1],
            [4,2,'P',3,1], [4,3,'I',1], [4,4,'I',1], [4,5,'I',1], [4,6,'I',1], [4,7,'P',1,2],
            [7,0,'P',3,2], [7,1,'I',1], [7,2,'I',1], [7,3,'I',1], [7,4,'I',1], [7,5,'I',1], [7,6,'I',1], [7,7,'I',1], [7,8,'I',1], [7,9,'I',1], [7,10,'I',1], [7,11,'E',1]
        ];

        // 패턴 B
        const patternB = [
            [0,11,'S',1], [0,10,'I',1], [0,9,'I',1], [0,8,'I',1], [0,7,'L',1], [1,7,'P',2,0],
            [4,11,'P',1,0], [4,10,'I',1], [4,9,'I',1], [4,8,'I',1], [4,7,'I',1], [4,6,'L',0], [3,6,'P',0,1],
            [1,0,'P',3,1], [1,1,'I',1], [1,2,'I',1], [1,3,'I',1], [1,4,'I',1], [1,5,'P',1,2],
            [3,10,'P',0,2], [4,10,'I',0], [5,10,'I',0], [6,10,'L',0], 
            [6,11,'I',0], [7,11,'L',3], [7,10,'I',1], [7,9,'I',1], 
            [7,8,'L',0], [6,8,'I',0], [5,8,'L',1], [5,9,'I',1], [5,10,'I',1], [5,11,'E',1]
        ];

        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const grid = ref([]);
        const poweredTiles = ref(new Set()); 

        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = i + ',' + j;
                let pathNode = selectedPattern.find(p => (p[0] + ',' + p[1]) === coord);
                let type, rotation, movable, extra, ansRot;

                if (pathNode) {
                    type = pathNode[2]; ansRot = pathNode[3]; 
                    extra = pathNode[4] !== undefined ? pathNode[4] : '';
                    movable = (type === 'P' ? 0 : 1);
                    rotation = movable ? (ansRot + Math.floor(Math.random() * 3) + 1) % 4 : ansRot;
                } else {
                    let r = Math.random();
                    type = r < 0.3 ? 'D' : (r < 0.6 ? 'I' : 'L');
                    ansRot = Math.floor(Math.random() * 4);
                    rotation = ansRot; movable = (type !== 'D' ? 1 : 0);
                    extra = '';
                }
                row.push([type, rotation, movable, '', extra, ansRot]);
            }
            grid.value.push(row);
        }

        const getOpenings = (r, c) => {
            const tile = grid.value[r][c];
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            else if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            else if (tile[0] === 'L') return [rot, (rot + 1) % 4];
            return [];
        };

        const updatePower = () => {
            const newPowered = new Set();
            const startNode = selectedPattern.find(p => p[2] === 'S');
            const queue = [startNode[0] + ',' + startNode[1]];
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (newPowered.has(curr)) continue;
                newPowered.add(curr);

                const [r, c] = curr.split(',').map(Number);
                const tile = grid.value[r][c];
                const currentOpenings = getOpenings(r, c);

                if (tile[0] === 'P') {
                    const myId = tile[4];
                    const other = selectedPattern.find(p => p[2] === 'P' && p[4] === myId && (p[0] + ',' + p[1]) !== curr);
                    if (other) queue.push(other[0] + ',' + other[1]);
                }

                currentOpenings.forEach(dir => {
                    let nr = r, nc = c;
                    if (dir === 0) nr++; else if (dir === 1) nc--; else if (dir === 2) nr--; else if (dir === 3) nc++;
                    if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth) {
                        const targetOpenings = getOpenings(nr, nc);
                        if (targetOpenings.includes((dir + 2) % 4)) queue.push(nr + ',' + nc);
                    }
                });
            }
            poweredTiles.value = newPowered;
        };

        watch(grid, updatePower, { deep: true, immediate: true });

        const isGameWon = computed(() => {
            const endNode = selectedPattern.find(p => p[2] === 'E');
            return poweredTiles.value.has(endNode[0] + ',' + endNode[1]);
        });

        return {
            grid, shapes: [1, 2, 3], themeColor, isGameWon, poweredTiles,
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            getColour: (r, c) => (showAnswer || poweredTiles.value.has(r + ',' + c)) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && selectedPattern.some(p => p[0] === r && p[1] === c)
        };
    },
	template: `
	<div class="d-flex flex-column align-items-center">
		<h2 class="grandiflora-one-regular mb-4" :style="{ opacity: isGameWon ? 1 : 0, color: themeColor, transition: 'opacity 0.5s' }">
			전류가 끝점에 도달했습니다! 무대 장치 가동.
		</h2>
		<div v-for="(row, rowIndex) in grid" :key="rowIndex">
			<div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
				<div :class="['tile', getMovableClass(tile[2])]" 
					 :style="{ 
						transform: 'rotate(' + (isCorrectPath(rowIndex, colIndex) ? tile[5]*90 : tile[1]*90) + 'deg)',
						boxShadow: getColour(rowIndex, colIndex) ? '0 0 15px ' + themeColor : 'none',
						border: getColour(rowIndex, colIndex) ? '2px solid ' + themeColor : '1px solid #4a4d44'
					 }" @click="rotate(tile, rowIndex, colIndex)">
					<div :style="{ backgroundColor: getColour(rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
					<div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
					<div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
						 :style="{ backgroundColor: getColour(rowIndex, colIndex) || '#d4af37', transform: 'rotate(' + (isCorrectPath(rowIndex, colIndex) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }"></div>
					<div v-if="tile[0] == 'P'" class="portalsymbol active" :style="{ transform: 'rotate(' + (isCorrectPath(rowIndex, colIndex) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }">
						{{tile[4] + 1}}
					</div>
				</div>
			</div>
			<br />
		</div>
	</div>`
}
