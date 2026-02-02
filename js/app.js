//0203-5

import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 

        // [사용자 정의 L자 기준] 0: ┘(위+오), 1: └(오+아), 2: ┌(아+왼), 3: ┐(왼+위)
        // [직선 I 기준] 0: 세로(↑↓), 1: 가로(←→)
        // [포털 P 기준] 0: 아래, 1: 왼쪽, 2: 위, 3: 오른쪽 (연결구가 향하는 방향)
        
        // 패턴 A:
        const patternA = [
            [0,0,'S',3], [0,1,'I',1], [0,2,'P',1,0],                             // 시작 -> 포털0(좌)
            [2,5,'P',3,0], [2,6,'L',2], [3,6,'I',0], [4,6,'L',0], [4,7,'P',1,1], // 포털0출구(우) -> 포털1입구(좌)
            [6,3,'P',2,1], [5,3,'L',1], [5,4,'I',1], [5,5,'L',3], [4,5,'P',0,2], // 포털1출구(상) -> 포털2입구(하)
            [1,9,'P',2,2], [2,9,'I',0], [3,9,'L',1], [3,10,'I',1], [3,11,'E',1]  // 포털2출구(상) -> 도착(3,11)
        ];

        // 패턴 B:
        const patternB = [
            [0,0,'S',0], [1,0,'I',0], [2,0,'L',0], [2,1,'P',1,0],                // 시작 -> 포털0(좌)
            [0,5,'P',0,0], [1,5,'L',3], [1,4,'I',1], [1,3,'L',1], [2,3,'P',2,1], // 포털0출구(하) -> 포털1입구(상)
            [5,8,'P',3,1], [5,9,'L',2], [6,9,'I',0], [7,9,'L',0], [7,10,'P',1,2],// 포털1출구(우) -> 포털2입구(좌)
            [3,10,'P',0,2], [4,10,'I',0], [5,10,'L',3], [5,11,'E',1]             // 포털2출구(하) -> 도착(5,11)
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



