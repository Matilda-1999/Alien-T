//0203-6

import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 

		// L자(L): 0:┘(위+오), 1:└(오+아), 2:┌(아+왼), 3:┐(왼+위)
		// 직선(I): 0:↕(세로), 1:↔(가로)
		// 포털(P): 연결구가 향하는 방향 0:하, 1:좌, 2:상, 3:우

		// 패턴 A
		const patternA = [
			// 구간 1: 시작 -> 포털1 (7칸)
			[0,0,'S',3], [0,1,'I',1], [0,2,'I',1], [0,3,'I',1], [0,4,'L',2], [1,4,'I',0], [2,4,'P',2,0],
			// 구간 2: 포털1 -> 포털2 (7칸)
			[2,8,'P',0,0], [3,8,'I',0], [4,8,'I',0], [5,8,'I',0], [6,8,'L',0], [6,9,'I',1], [6,10,'P',1,1],
			// 구간 3: 포털2 -> 포털3 (6칸)
			[4,2,'P',3,1], [4,3,'I',1], [4,4,'I',1], [4,5,'I',1], [4,6,'I',1], [4,7,'P',1,2],
			// 구간 4: 포털3 -> 종료 (12칸)
			[7,0,'P',3,2], [7,1,'I',1], [7,2,'I',1], [7,3,'I',1], [7,4,'I',1], [7,5,'I',1], [7,6,'I',1], [7,7,'I',1], [7,8,'I',1], [7,9,'I',1], [7,10,'I',1], [7,11,'E',1]
		];

		// 패턴 B
		const patternB = [
			// 구간 1: 시작 -> 포털1 (6칸)
			[0,11,'S',1], [0,10,'I',1], [0,9,'I',1], [0,8,'I',1], [0,7,'L',1], [1,7,'P',2,0],
			// 구간 2: 포털1 -> 포털2 (7칸)
			[4,11,'P',1,0], [4,10,'I',1], [4,9,'I',1], [4,8,'I',1], [4,7,'I',1], [4,6,'L',0], [3,6,'P',0,1],
			// 구간 3: 포털2 -> 포털3 (6칸)
			[1,0,'P',3,1], [1,1,'I',1], [1,2,'I',1], [1,3,'I',1], [1,4,'I',1], [1,5,'P',1,2],
			// 구간 4: 포털3 -> 종료 (14칸)
			[5,0,'P',0,2], [6,0,'I',0], [7,0,'L',0], [7,1,'I',1], [7,2,'I',1], [7,3,'I',1], [7,4,'I',1], [7,5,'I',1], [7,6,'I',1], [7,7,'I',1], [7,8,'I',1], [7,9,'I',1], [7,10,'I',1], [7,11,'E',1]
		];

        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const fullpathCoords = selectedPattern.map(p => p[0] + ',' + p[1]);

        const grid = ref([]);
        const themeColor = '#FF4500'; 
        const shapes = [1, 2, 3]; 

        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = i + ',' + j;
                let pathNode = selectedPattern.find(p => (p[0] + ',' + p[1]) === coord);
                let type, rotation, movable, extra, ansRot;

                if (pathNode) {
                    type = pathNode[2];
                    ansRot = pathNode[3]; 
                    extra = pathNode[4] !== undefined ? pathNode[4] : '';
                    movable = (type === 'P' ? 0 : 1);
                    rotation = movable ? (ansRot + Math.floor(Math.random() * 3) + 1) % 4 : ansRot;
                } else {
                    let r = Math.random();
                    type = r < 0.3 ? 'D' : (r < 0.6 ? 'I' : 'L');
                    ansRot = Math.floor(Math.random() * 4);
                    rotation = ansRot;
                    movable = (type !== 'D' ? 1 : 0);
                    extra = '';
                }
                row.push([type, rotation, movable, '', extra, ansRot]);
            }
            grid.value.push(row);
        }

        return {
            grid, shapes, themeColor,
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            getColour: (tile, r, c) => (tile[0] === 'S' || tile[0] === 'E' || (showAnswer && fullpathCoords.includes(r + ',' + c))) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && fullpathCoords.includes(r + ',' + c),
            checkWinStatus: () => false 
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <div v-for="(row, rowIndex) in grid" :key="rowIndex">
            <div style="display: inline-block" v-for="(tile, colIndex) in row" :key="colIndex">
                <div :class="['tile', getMovableClass(tile[2])]" 
                     :style="{ 
                        transform: isCorrectPath(rowIndex, colIndex) ? 'rotate('+tile[5]*90+'deg)' : 'rotate('+tile[1]*90+'deg)',
                        outline: isCorrectPath(rowIndex, colIndex) ? '3px solid #FF3300' : 'none'
                     }" @click="rotate(tile, rowIndex, colIndex)">
                    <div :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0])"></div>
                    <div v-if="tile[0] == 'L'" :style="{ backgroundColor: getColour(tile, rowIndex, colIndex) || '#d4af37' }" :class="getNodeClass(tile[0],true)"></div>
                    <div :class="tile[0] === 'P' ? 'bigcircle-node' : 'circle-node'" 
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




