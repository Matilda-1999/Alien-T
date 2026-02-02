//0203-11

import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000'; // 빨간색 전류

        // [최종 확정 타일 로직 - 시각적 모양과 100% 일치]
        // 직선(I): 0:↕(세로), 1:↔(가로)
        // L자(L): 0:┘(위+오), 1:└(오+아), 2:┌(아+왼), 3:┐(왼+위)
        // 포털(P)/시작(S)/종료(E): 전선이 향하는 방향 (0:하, 1:좌, 2:상, 3:우)

        // 패턴 A: 시작(0,0) -> 종료(7,11) [모든 구간 L자 3개 이상 우회]
        const patternA = [
            // 구간 1: 시작(0,0) -> 포털0(2,3) [L자 4개]
            [0,0,'S',3], [0,1,'L',1], [1,1,'L',3], [1,2,'I',1], [0,2,'L',1], [0,3,'L',2], [1,3,'I',0], [2,3,'P',2,0],
            // 구간 2: 포털0(3,8) -> 포털1(6,10) [L자 4개]
            [3,8,'P',0,0], [4,8,'L',0], [4,9,'L',2], [5,9,'L',0], [5,10,'L',2], [6,10,'P',2,1],
            // 구간 3: 포털1(4,2) -> 포털2(6,5) [L자 4개]
            [4,2,'P',3,1], [4,3,'L',1], [5,3,'L',3], [5,4,'L',1], [6,4,'L',3], [6,5,'P',1,2],
            // 구간 4: 포털2(7,0) -> 종료(7,11) [L자 5개]
            [7,0,'P',3,2], [7,1,'L',0], [6,1,'L',2], [6,2,'L',0], [5,2,'L',2], [5,3,'L',0], [4,3,'L',2], [4,4,'I',1], [4,11,'I',0], [5,11,'I',0], [6,11,'I',0], [7,11,'E',2]
        ];

        // 패턴 B: 시작(0,0) -> 종료(4,11) [모든 구간 L자 3개 이상 우회]
        const patternB = [
            // 구간 1: 시작(0,0) -> 포털0(3,2) [L자 3개]
            [0,0,'S',3], [0,1,'L',1], [1,1,'I',0], [2,1,'L',0], [2,2,'L',2], [3,2,'P',2,0],
            // 구간 2: 포털0(4,11) -> 포털1(3,8) [L자 3개]
            [4,11,'P',1,0], [4,10,'L',3], [3,10,'I',1], [3,9,'L',2], [4,9,'I',1], [4,8,'L',3], [3,8,'P',0,1],
            // 구간 3: 포털1(1,0) -> 포털2(4,1) [L자 4개]
            [1,0,'P',3,1], [1,1,'L',1], [2,1,'L',0], [2,2,'L',2], [3,2,'I',1], [3,1,'L',2], [4,1,'P',2,2],
            // 구간 4: 포털2(1,5) -> 종료(4,11) [L자 6개]
            [1,5,'P',0,2], [2,5,'I',0], [3,5,'L',1], [3,6,'I',1], [3,7,'L',1], [4,7,'L',2], [4,6,'L',0], [5,6,'I',1], [6,6,'L',0], [6,7,'I',1], [6,11,'L',3], [5,11,'I',0], [4,11,'E',0]
        ];

        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const grid = ref([]);
        const redStartSet = ref(new Set()); // 시작점에서 뻗어나오는 전류
        const redEndSet = ref(new Set());   // 끝점에서 거꾸로 뻗어오는 전류

        // 그리드 초기화
        for (let i = 0; i < gridheight; i++) {
            let row = [];
            for (let j = 0; j < gridwidth; j++) {
                let coord = `${i},${j}`;
                let pathNode = selectedPattern.find(p => `${p[0]},${p[1]}` === coord);
                let type, rotation, movable, extra, ansRot;

                if (pathNode) {
                    type = pathNode[2]; ansRot = pathNode[3]; 
                    extra = pathNode[4] !== undefined ? pathNode[4] : '';
                    movable = (type === 'P' ? 0 : 1);
                    rotation = movable ? (ansRot + Math.floor(Math.random() * 3) + 1) % 4 : ansRot;
                } else {
                    type = Math.random() < 0.3 ? 'D' : (Math.random() < 0.6 ? 'I' : 'L');
                    ansRot = Math.floor(Math.random() * 4);
                    rotation = ansRot; movable = (type !== 'D' ? 1 : 0);
                    extra = '';
                }
                row.push([type, rotation, movable, '', extra, ansRot]);
            }
            grid.value.push(row);
        }

        // [핵심] L자 타일의 열린 방향을 시각적 기준(┘, └, ┌, ┐)과 완벽히 동기화
        const getOpenings = (r, c) => {
            const tile = grid.value[r][c];
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            // 0:┘(상,우=2,3), 1:└(우,하=3,0), 2:┌(하,좌=0,1), 3:┐(좌,상=1,2)
            if (tile[0] === 'L') return [(rot + 2) % 4, (rot + 3) % 4]; 
            return [];
        };

        const updatePower = () => {
            const runFloodFill = (startCoord) => {
                const visited = new Set();
                const queue = [startCoord];
                while (queue.length > 0) {
                    const curr = queue.shift();
                    if (visited.has(curr)) continue;
                    visited.add(curr);
                    const [r, c] = curr.split(',').map(Number);
                    const tile = grid.value[r][c];
                    const currentOpenings = getOpenings(r, c);

                    if (tile[0] === 'P') {
                        const other = selectedPattern.find(p => p[2] === 'P' && p[4] === tile[4] && `${p[0]},${p[1]}` !== curr);
                        if (other) queue.push(`${other[0]},${other[1]}`);
                    }

                    currentOpenings.forEach(dir => {
                        let nr = r, nc = c;
                        if (dir === 0) nr++; else if (dir === 1) nc--; else if (dir === 2) nr--; else if (dir === 3) nc++;
                        if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth) {
                            if (getOpenings(nr, nc).includes((dir + 2) % 4)) queue.push(`${nr},${nc}`);
                        }
                    });
                }
                return visited;
            };

            const sNode = selectedPattern.find(p => p[2] === 'S');
            const eNode = selectedPattern.find(p => p[2] === 'E');
            redStartSet.value = runFloodFill(`${sNode[0]},${sNode[1]}`);
            redEndSet.value = runFloodFill(`${eNode[0]},${eNode[1]}`);
        };

        watch(grid, updatePower, { deep: true, immediate: true });

        const isGameWon = computed(() => {
            const eNode = selectedPattern.find(p => p[2] === 'E');
            return redStartSet.value.has(`${eNode[0]},${eNode[1]}`);
        });

        return {
            grid, shapes: [1, 2, 3], themeColor, isGameWon, redStartSet, redEndSet,
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            // 시작점/끝점과 연결된 모든 경로를 빨갛게 표시
            getColour: (r, c) => (showAnswer || redStartSet.value.has(`${r},${c}`) || redEndSet.value.has(`${r},${c}`)) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && selectedPattern.some(p => p[0] === r && p[1] === c)
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 class="grandiflora-one-regular mb-4" :style="{ opacity: isGameWon ? 1 : 0, color: themeColor, transition: 'opacity 0.5s' }">
            무대 장치 가동: 전력망이 완벽히 복구되었습니다!
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
