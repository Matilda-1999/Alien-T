import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

export default {
    setup() {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const showAnswer = params.get('topsecret') === 'true';
        
        const gridwidth = 12; 
        const gridheight = 8; 
        const themeColor = '#FF0000';

        // L자(L): 0:┘(위오), 1:└(오아), 2:┌(아왼), 3:┐(왼위)
		// 직선(I): 0:↕(세로), 1:↔(가로)
		// 포털(P): 연결구가 향하는 방향 0:하, 1:좌, 2:상, 3:우
		
		// 패턴 A
		const patternA = [
		    // 구간 1: 시작(0,0) -> 포털0(1,2) [8칸, L자 3개]
		    [0,0,'S',3], [0,1,'I',1], [1,1,'L',0], [1,2,'I',1], [0,2,'L',1], [0,3,'L',2], [1,3,'I',0], [2,3,'P',2,0],
		    // 구간 2: 포털0(2,3) -> 포털1(5,5) [9칸, L자 3개]
		    [2,5,'P',0,0], [3,5,'L',2], [3,4,'L',0], [4,4,'I',0], [5,4,'L',0], [5,5,'P',1,1],
		    // 구간 3: 포털1(5,5) -> 포털2(2,8) [7칸, L자 3개]
		    [6,2,'P',3,1], [6,3,'L',3], [5,3,'L',1], [5,4,'L',2], [4,4,'I',1], [4,5,'P',1,2],
		    // 구간 4: 포털2(2,8) -> 종료(7,11) [10칸, L자 4개]
		    [1,8,'P',0,2], [2,8,'L',0], [2,9,'L',2], [3,9,'L',0], [3,10,'L',2], [4,10,'I',0], [5,10,'I',0], [6,10,'I',0], [7,10,'I',1], [7,11,'E',1]
		];
		
		// 패턴 B
		const patternB = [
		    // 구간 1: 시작(0,11) -> 포털0(3,8) [7칸, L자 3개]
		    [0,11,'S',1], [0,10,'L',1], [1,10,'L',3], [1,9,'L',1], [2,9,'I',0], [3,9,'I',1], [3,8,'P',3,0],
		    // 구간 2: 포털0(3,8) -> 포털1(6,3) [10칸, L자 4개]
		    [5,11,'P',1,0], [5,10,'L',0], [4,10,'L',2], [4,9,'L',0], [3,9,'L',2], [3,8,'I',1], [3,7,'I',1], [3,6,'I',1], [3,5,'I',1], [3,4,'P',3,1],
		    // 구간 3: 포털1(6,3) -> 포털2(0,2) [8칸, L자 3개]
		    [1,0,'P',0,1], [2,0,'L',3], [2,1,'L',1], [1,1,'L',0], [1,2,'I',1], [1,3,'I',1], [1,4,'I',1], [1,5,'P',1,2],
		    // 구간 4: 포털2(0,2) -> 종료(7,11) [15칸, L자 5개]
		    [5,0,'P',0,2], [6,0,'L',0], [6,1,'L',2], [7,1,'L',0], [7,2,'I',1], [7,3,'I',1], [7,4,'L',3], [6,4,'L',1], [6,5,'I',1], [6,6,'I',1], [6,7,'I',1], [6,8,'I',1], [6,9,'I',1], [6,10,'I',1], [6,11,'E',2]
		];

        const selectedPattern = Math.random() < 0.5 ? patternA : patternB;
        const grid = ref([]);
        const poweredTiles = ref(new Set()); 

        // 그리드 생성
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

        // 타일의 열린 입구 방향 계산 (0:하, 1:좌, 2:상, 3:우)
        const getOpenings = (r, c) => {
            const tile = grid.value[r][c];
            const rot = tile[1];
            if (tile[0] === 'S' || tile[0] === 'P' || tile[0] === 'E') return [rot];
            if (tile[0] === 'I') return [rot, (rot + 2) % 4];
            if (tile[0] === 'L') return [rot, (rot + 1) % 4];
            return [];
        };

        // 전류 전파 로직 (시작점과 끝점 모두에서 전파)
        const updatePower = () => {
            const newPowered = new Set();
            const startNode = selectedPattern.find(p => p[2] === 'S');
            const endNode = selectedPattern.find(p => p[2] === 'E');
            
            // 시작점과 끝점을 큐에 모두 삽입 (양방향 전파)
            const queue = [
                startNode[0] + ',' + startNode[1],
                endNode[0] + ',' + endNode[1]
            ];
            
            while (queue.length > 0) {
                const curr = queue.shift();
                if (newPowered.has(curr)) continue;
                newPowered.add(curr);

                const [r, c] = curr.split(',').map(Number);
                const tile = grid.value[r][c];
                const currentOpenings = getOpenings(r, c);

                // 포털 전도 로직
                if (tile[0] === 'P') {
                    const myId = tile[4];
                    const otherPortal = selectedPattern.find(p => p[2] === 'P' && p[4] === myId && (p[0] + ',' + p[1]) !== curr);
                    if (otherPortal) queue.push(otherPortal[0] + ',' + otherPortal[1]);
                }

                // 인접 타일 연결 검사
                currentOpenings.forEach(dir => {
                    let nr = r, nc = c;
                    if (dir === 0) nr++; else if (dir === 1) nc--; else if (dir === 2) nr--; else if (dir === 3) nc++;
                    
                    if (nr >= 0 && nr < gridheight && nc >= 0 && nc < gridwidth) {
                        const targetOpenings = getOpenings(nr, nc);
                        if (targetOpenings.includes((dir + 2) % 4)) {
                            queue.push(nr + ',' + nc);
                        }
                    }
                });
            }
            poweredTiles.value = newPowered;
        };

        watch(grid, updatePower, { deep: true, immediate: true });

        // 승리 조건: 시작점 전파와 끝점 전파가 만나는지 확인 (여기서는 단순히 경로상의 모든 타일 연결 여부로 판정)
        const isGameWon = computed(() => {
            const startCoord = selectedPattern.find(p => p[2] === 'S');
            const endCoord = selectedPattern.find(p => p[2] === 'E');
            return poweredTiles.value.has(startCoord[0] + ',' + startCoord[1]) && 
                   poweredTiles.value.has(endCoord[0] + ',' + endCoord[1]) &&
                   // 시작점과 끝점이 동일한 Set 내에서 연결되었는지 확인 (현재 Flood Fill 구조상 당연히 포함됨)
                   selectedPattern.every(p => poweredTiles.value.has(p[0] + ',' + p[1]));
        });

        return {
            grid, shapes: [1, 2, 3], themeColor, isGameWon, poweredTiles,
            getNodeClass: (t, alt = false) => {
                const m = { "I": "i-node", "L": alt ? "lh-node" : "lv-node", "S": "start-node", "E": "end-node", "P": "portal-node", "D": "deadend-node" };
                return m[t] || "";
            },
            getMovableClass: (a) => a == 0 ? "tile-immovable" : "tile-movable",
            // 빨간색 불이 들어오는 조건 (정답 모드거나 전파 범위 내에 있거나)
            getColour: (r, c) => (showAnswer || poweredTiles.value.has(r + ',' + c)) ? themeColor : '',
            rotate: (t, r, c) => { if (t[2]) grid.value[r][c][1] = (grid.value[r][c][1] + 1) % 4; },
            isCorrectPath: (r, c) => showAnswer && selectedPattern.some(p => p[0] === r && p[1] === c)
        };
    },
    template: `
    <div class="d-flex flex-column align-items-center">
        <h2 class="grandiflora-one-regular mb-4" :style="{ opacity: isGameWon ? 1 : 0, color: themeColor, transition: 'opacity 0.5s' }">
            전류가 완벽하게 연결되었습니다! 무대 장치 가동.
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
                    
                    <div v-if="tile[0] == 'P'" class="portalsymbol active" 
                         :style="{ color: getColour(rowIndex, colIndex) ? '#1a1c16' : '#1a1c16', transform: 'rotate(' + (isCorrectPath(rowIndex, colIndex) ? tile[5]*-90 : tile[1]*-90) + 'deg)' }">
                        {{tile[4] + 1}}
                    </div>
                </div>
            </div>
            <br />
        </div>
    </div>`
}
