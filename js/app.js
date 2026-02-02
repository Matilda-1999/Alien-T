//0203-3

import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 

        // [핵심 보정] L자 타일 정답 회전(ansRot) 매핑:
        // 0: ┘ (위+오른쪽), 1: └ (오른쪽+아래), 2: ┌ (아래+왼쪽), 3: ┐ (왼쪽+위)
        
        // 패턴 A
        const patternA = [
            [0,0,'S',3], [0,1,'I',1], [0,2,'P',1,0], 
            [1,4,'P',0,0], [2,4,'I',0], [3,4,'L',1], [3,5,'P',1,1], 
            [5,2,'P',2,1], [4,2,'L',2], [4,1,'I',1], [4,0,'L',1], [5,0,'P',2,2], 
            [7,8,'P',3,2], [7,9,'I',1], [7,10,'L',3], [6,10,'I',0], [5,10,'L',1], [5,11,'E',1] 
        ];

        // 패턴 B
        const patternB = [
            [0,0,'S',0], [1,0,'I',0], [2,0,'L',1], [2,1,'P',1,0], 
            [0,5,'P',0,0], [1,5,'L',3], [1,6,'I',1], [1,7,'P',1,1], 
            [4,9,'P',3,1], [4,10,'L',2], [5,10,'I',0], [6,10,'P',2,2], 
            [7,3,'P',2,2], [6,3,'L',1], [6,4,'I',1], [6,11,'E',1] 
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
